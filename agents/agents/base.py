from abc import ABC, abstractmethod
from pathlib import Path

import yaml

from services.llm_router import llm_router


class BaseAgent(ABC):
    """Base class for all AI agents."""

    def __init__(self, config_path: str):
        config_file = Path(__file__).parent.parent / "config" / "prompts" / config_path
        with open(config_file) as f:
            self.config = yaml.safe_load(f)

        self.name = self.config["name"]
        self.display_name = self.config["display_name"]
        self.system_prompt = self.config["system_prompt"]
        self.llm_provider = self.config["llm_provider"]
        self.llm_model = self.config["llm_model"]
        self.temperature = self.config.get("temperature", 0.7)
        self.max_tokens = self.config.get("max_tokens", 1024)
        self.rag_collections = self.config.get("rag_collections", [])

    async def chat(
        self,
        messages: list[dict],
        context: str | None = None,
    ) -> str:
        """Send messages to the LLM with optional RAG context."""
        system = self.system_prompt
        if context:
            system += f"\n\n## Contexto relevante do RAG:\n{context}"

        return await llm_router.chat(
            provider=self.llm_provider,
            model=self.llm_model,
            messages=messages,
            system_prompt=system,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

    @abstractmethod
    async def process(self, input_data: dict) -> dict:
        """Process input and return a response. Implemented by each agent."""
        ...
