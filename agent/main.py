"""
MeetingHub Transcription Agent
Joins LiveKit rooms, transcribes speech via Faster-Whisper,
translates via LibreTranslate, publishes captions via data channel,
and buffers transcripts in Redis for report generation.
"""

import asyncio
import json
import logging
import os

from livekit import agents, rtc
from livekit.agents import JobContext, JobProcess, WorkerOptions, cli

from transcriber import RealtimeTranscriber
from translator import LibreTranslator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("meetinghub-agent")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
LIBRETRANSLATE_URL = os.getenv("LIBRETRANSLATE_URL", "http://localhost:5555")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")


def prewarm(proc: JobProcess):
    """Preload Silero VAD and Whisper model so first transcription is fast."""
    from livekit.plugins.silero import VAD

    proc.userdata["vad"] = VAD.load()
    proc.userdata["transcriber"] = RealtimeTranscriber(
        model_size=WHISPER_MODEL, device=WHISPER_DEVICE
    )
    logger.info("Prewarmed VAD and Whisper model (%s on %s)", WHISPER_MODEL, WHISPER_DEVICE)


async def entrypoint(ctx: JobContext):
    """Main agent entrypoint — called once per room."""
    logger.info("Agent joining room %s", ctx.room.name)

    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)

    vad = ctx.proc.userdata["vad"]
    transcriber: RealtimeTranscriber = ctx.proc.userdata["transcriber"]
    translator = LibreTranslator(LIBRETRANSLATE_URL)

    # Track which languages participants have requested
    requested_languages: dict[str, set[str]] = {}  # participant_identity -> set of lang codes

    # Redis client for buffering transcripts
    import redis.asyncio as aioredis

    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    room_key = f"transcript:{ctx.room.name}"

    # Listen for language preference messages from participants via data channel
    @ctx.room.on("data_received")
    def on_data_received(data: rtc.DataPacket):
        try:
            msg = json.loads(data.data.decode("utf-8"))
            if msg.get("type") == "set_caption_language":
                identity = data.participant.identity if data.participant else None
                if identity and msg.get("language"):
                    if identity not in requested_languages:
                        requested_languages[identity] = set()
                    requested_languages[identity].add(msg["language"])
                    logger.info(
                        "Participant %s requested captions in %s",
                        identity,
                        msg["language"],
                    )
        except Exception:
            pass

    async def process_track(participant: rtc.RemoteParticipant, track: rtc.Track):
        """Process a single audio track — VAD → transcribe → translate → publish."""
        audio_stream = rtc.AudioStream(track)
        vad_stream = vad.stream()

        # Collect audio frames and feed to VAD
        async def feed_vad():
            async for frame_event in audio_stream:
                vad_stream.push_frame(frame_event.frame)
            vad_stream.end_input()

        feed_task = asyncio.create_task(feed_vad())

        try:
            async for event in vad_stream:
                if event.type == agents.vad.VADEventType.SPEAKING_END:
                    # We have a complete speech segment — transcribe it
                    frames = event.frames
                    if not frames:
                        continue

                    text, lang = await transcriber.transcribe(frames)
                    if not text or not text.strip():
                        continue

                    speaker_name = participant.name or participant.identity
                    logger.info("[%s] (%s): %s", speaker_name, lang, text)

                    # Gather all unique requested languages across participants
                    all_requested = set()
                    for langs in requested_languages.values():
                        all_requested.update(langs)
                    # Remove the source language
                    to_translate = all_requested - {lang}

                    translations: dict[str, str] = {}
                    if to_translate:
                        translations = await translator.translate_batch(
                            text, lang, list(to_translate)
                        )

                    # Build caption message
                    caption_msg = {
                        "type": "caption",
                        "speakerId": participant.identity,
                        "speakerName": speaker_name,
                        "original": {"text": text, "language": lang},
                        "translations": translations,
                        "timestamp": asyncio.get_event_loop().time(),
                    }

                    # Publish to room via data channel
                    payload = json.dumps(caption_msg).encode("utf-8")
                    await ctx.room.local_participant.publish_data(
                        payload, reliable=False
                    )

                    # Buffer in Redis for later report generation
                    redis_entry = json.dumps(
                        {
                            "speaker": speaker_name,
                            "speakerId": participant.identity,
                            "text": text,
                            "language": lang,
                            "timestamp": caption_msg["timestamp"],
                        }
                    )
                    await redis_client.rpush(room_key, redis_entry)
                    # Set 24h TTL on the key (refresh on each push)
                    await redis_client.expire(room_key, 86400)

        except Exception as e:
            logger.error("Error processing track for %s: %s", participant.identity, e)
        finally:
            feed_task.cancel()
            await audio_stream.aclose()

    # Track active processing tasks per participant
    active_tasks: dict[str, asyncio.Task] = {}

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant,
    ):
        if track.kind != rtc.TrackKind.KIND_AUDIO:
            return
        # Skip other agents
        if participant.identity.startswith("agent-"):
            return

        task_key = f"{participant.identity}:{track.sid}"
        if task_key in active_tasks:
            return

        logger.info("Subscribed to audio from %s", participant.identity)
        task = asyncio.create_task(process_track(participant, track))
        active_tasks[task_key] = task

        def on_done(t: asyncio.Task):
            active_tasks.pop(task_key, None)

        task.add_done_callback(on_done)

    @ctx.room.on("track_unsubscribed")
    def on_track_unsubscribed(
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant,
    ):
        task_key = f"{participant.identity}:{track.sid}"
        task = active_tasks.pop(task_key, None)
        if task:
            task.cancel()
            logger.info("Unsubscribed from audio of %s", participant.identity)

    logger.info("Agent ready in room %s, waiting for participants", ctx.room.name)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="agent-transcription",
        )
    )
