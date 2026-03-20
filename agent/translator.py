"""
LibreTranslate client for translating captions to multiple languages.
"""

import asyncio
import logging
from typing import Dict, List

import httpx

logger = logging.getLogger("meetinghub-agent.translator")


class LibreTranslator:
    """Translates text using a self-hosted LibreTranslate instance."""

    def __init__(self, base_url: str = "http://localhost:5555"):
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=10.0)

    async def translate(
        self, text: str, source_lang: str, target_lang: str
    ) -> str:
        """Translate text from source to target language."""
        try:
            response = await self.client.post(
                f"{self.base_url}/translate",
                json={
                    "q": text,
                    "source": source_lang,
                    "target": target_lang,
                    "format": "text",
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("translatedText", text)
        except Exception as e:
            logger.warning(
                "Translation failed (%s -> %s): %s", source_lang, target_lang, e
            )
            return text

    async def translate_batch(
        self, text: str, source_lang: str, target_langs: List[str]
    ) -> Dict[str, str]:
        """
        Translate text to multiple target languages in parallel.
        Returns a dict of {lang_code: translated_text}.
        """
        if not target_langs:
            return {}

        tasks = {
            lang: self.translate(text, source_lang, lang) for lang in target_langs
        }

        results: Dict[str, str] = {}
        gathered = await asyncio.gather(
            *[tasks[lang] for lang in target_langs], return_exceptions=True
        )

        for lang, result in zip(target_langs, gathered):
            if isinstance(result, Exception):
                logger.warning("Translation to %s failed: %s", lang, result)
                results[lang] = text  # fallback to original
            else:
                results[lang] = result

        return results

    async def close(self):
        await self.client.aclose()
