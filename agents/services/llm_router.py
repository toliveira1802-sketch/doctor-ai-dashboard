import logging
import time

from openai import OpenAI, APITimeoutError, APIConnectionError, RateLimitError
from anthropic import Anthropic
from anthropic import APITimeoutError as AnthropicTimeout
from anthropic import APIConnectionError as AnthropicConnectionError
from anthropic import RateLimitError as AnthropicRateLimit

from config.settings import settings

logger = logging.getLogger(__name__)

LLM_TIMEOUT = 30  # seconds
MAX_RETRIES = 3
RETRY_BACKOFF = [1, 2, 4]  # seconds between retries

_OPENAI_RETRYABLE = (APITimeoutError, APIConnectionError, RateLimitError)
_ANTHROPIC_RETRYABLE = (AnthropicTimeout, AnthropicConnectionError, AnthropicRateLimit)


class LLMRouter:
    """Routes LLM calls to the appropriate provider with timeout and retry."""

    def __init__(self):
        self._openai: OpenAI | None = None
        self._anthropic: Anthropic | None = None

    @property
    def openai(self) -> OpenAI:
        if self._openai is None:
            self._openai = OpenAI(
                api_key=settings.openai_api_key,
                timeout=LLM_TIMEOUT,
            )
        return self._openai

    @property
    def anthropic(self) -> Anthropic:
        if self._anthropic is None:
            self._anthropic = Anthropic(
                api_key=settings.anthropic_api_key,
                timeout=LLM_TIMEOUT,
            )
        return self._anthropic

    async def chat(
        self,
        provider: str,
        model: str,
        messages: list[dict],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """Send a chat completion request to the specified provider."""

        if provider == "openai":
            return await self._openai_chat(
                model, messages, system_prompt, temperature, max_tokens
            )
        elif provider == "anthropic":
            return await self._anthropic_chat(
                model, messages, system_prompt, temperature, max_tokens
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")

    async def _openai_chat(
        self,
        model: str,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> str:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                response = self.openai.chat.completions.create(
                    model=model,
                    messages=all_messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                if not response.choices:
                    raise ValueError(f"OpenAI returned empty choices for model {model}")
                content = response.choices[0].message.content
                if content is None:
                    raise ValueError(f"OpenAI returned null content for model {model}")
                return content
            except _OPENAI_RETRYABLE as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    wait = RETRY_BACKOFF[attempt]
                    logger.warning("OpenAI %s (attempt %d/%d), retrying in %ds", type(e).__name__, attempt + 1, MAX_RETRIES, wait)
                    time.sleep(wait)

        raise RuntimeError(f"OpenAI call failed after {MAX_RETRIES} retries: {last_error}") from last_error

    async def _anthropic_chat(
        self,
        model: str,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> str:
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if system_prompt:
            kwargs["system"] = system_prompt

        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                response = self.anthropic.messages.create(**kwargs)
                if not response.content:
                    raise ValueError(f"Anthropic returned empty content for model {model}")
                return response.content[0].text
            except _ANTHROPIC_RETRYABLE as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    wait = RETRY_BACKOFF[attempt]
                    logger.warning("Anthropic %s (attempt %d/%d), retrying in %ds", type(e).__name__, attempt + 1, MAX_RETRIES, wait)
                    time.sleep(wait)

        raise RuntimeError(f"Anthropic call failed after {MAX_RETRIES} retries: {last_error}") from last_error


# Singleton
llm_router = LLMRouter()
