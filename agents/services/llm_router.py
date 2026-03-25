from openai import OpenAI
from anthropic import Anthropic

from config.settings import settings


class LLMRouter:
    """Routes LLM calls to the appropriate provider."""

    def __init__(self):
        self._openai: OpenAI | None = None
        self._anthropic: Anthropic | None = None

    @property
    def openai(self) -> OpenAI:
        if self._openai is None:
            self._openai = OpenAI(api_key=settings.openai_api_key)
        return self._openai

    @property
    def anthropic(self) -> Anthropic:
        if self._anthropic is None:
            self._anthropic = Anthropic(api_key=settings.anthropic_api_key)
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

        response = self.openai.chat.completions.create(
            model=model,
            messages=all_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content

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

        response = self.anthropic.messages.create(**kwargs)
        return response.content[0].text


# Singleton
llm_router = LLMRouter()
