"""
Faster-Whisper based real-time transcriber.
Converts raw audio frames to text with language detection.
"""

import asyncio
import io
import logging
import struct
from typing import Tuple

import numpy as np
from faster_whisper import WhisperModel
from livekit import rtc

logger = logging.getLogger("meetinghub-agent.transcriber")


class RealtimeTranscriber:
    """Wraps Faster-Whisper for speech-to-text on audio frames."""

    def __init__(self, model_size: str = "base", device: str = "cpu"):
        self.model = WhisperModel(model_size, device=device, compute_type="int8")
        logger.info("Whisper model loaded: %s on %s", model_size, device)

    async def transcribe(
        self, frames: list[rtc.AudioFrame]
    ) -> Tuple[str, str]:
        """
        Transcribe a list of audio frames.
        Returns (text, detected_language_code).
        """
        # Merge frames into a single numpy array
        audio_data = self._frames_to_numpy(frames)

        if audio_data is None or len(audio_data) == 0:
            return "", "en"

        # Run whisper in a thread to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        text, lang = await loop.run_in_executor(None, self._run_whisper, audio_data)
        return text, lang

    def _frames_to_numpy(self, frames: list[rtc.AudioFrame]) -> np.ndarray | None:
        """Convert LiveKit AudioFrames to a float32 numpy array at 16kHz mono."""
        if not frames:
            return None

        all_samples = []
        for frame in frames:
            # frame.data is bytes of int16 PCM
            data = bytes(frame.data)
            n_samples = len(data) // 2
            samples = struct.unpack(f"<{n_samples}h", data)
            all_samples.extend(samples)

        if not all_samples:
            return None

        # Convert int16 to float32 [-1.0, 1.0]
        audio = np.array(all_samples, dtype=np.float32) / 32768.0

        # Resample to 16kHz if needed (LiveKit default is 48kHz)
        sample_rate = frames[0].sample_rate if hasattr(frames[0], "sample_rate") else 48000
        if sample_rate != 16000:
            # Simple decimation — for 48kHz -> 16kHz, take every 3rd sample
            ratio = sample_rate / 16000
            indices = np.arange(0, len(audio), ratio).astype(int)
            indices = indices[indices < len(audio)]
            audio = audio[indices]

        return audio

    def _run_whisper(self, audio: np.ndarray) -> Tuple[str, str]:
        """Run Faster-Whisper inference (blocking, runs in executor)."""
        segments, info = self.model.transcribe(
            audio,
            beam_size=3,
            best_of=3,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        text_parts = []
        for segment in segments:
            text_parts.append(segment.text.strip())

        full_text = " ".join(text_parts)
        detected_lang = info.language if info.language else "en"

        return full_text, detected_lang
