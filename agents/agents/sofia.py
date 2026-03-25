from agents.base import BaseAgent
from rag.retriever import RAGRetriever


class SofiaAgent(BaseAgent):
    """Sofia - Orchestrator AI."""

    def __init__(self, retriever: RAGRetriever):
        super().__init__("sofia.yaml")
        self.retriever = retriever

    async def process(self, input_data: dict) -> dict:
        """Process an orchestration command."""
        action = input_data.get("action", "chat")
        message = input_data.get("message", "")

        if action == "chat":
            return await self._handle_chat(message, input_data.get("history", []))
        elif action == "promote_content":
            return await self._handle_promote(input_data)
        elif action == "status":
            return await self._handle_status()
        else:
            return {"error": f"Unknown action: {action}"}

    async def _handle_chat(self, message: str, history: list[dict]) -> dict:
        """Handle direct chat with Sofia via dashboard."""
        results = self.retriever.retrieve_from_study(message, n_results=3)
        context = "\n\n".join(
            f"[{r.collection}] (score: {r.score:.2f})\n{r.document}"
            for r in results
        )

        messages = [{"role": m["role"], "content": m["content"]} for m in history[-10:]]
        messages.append({"role": "user", "content": message})

        response = await self.chat(messages, context=context if results else None)

        return {
            "message": response,
            "agent": self.name.lower(),
            "rag_sources": [
                {"collection": r.collection, "score": r.score}
                for r in results
            ],
        }

    async def _handle_promote(self, data: dict) -> dict:
        """Promote content from Study RAG to Operational RAG."""
        # Will be fully implemented in Phase 4
        return {
            "action": "promote_content",
            "status": "not_implemented",
            "message": "Content promotion will be available in Phase 4",
        }

    async def _handle_status(self) -> dict:
        """Return system status."""
        return {
            "action": "status",
            "agents": {
                "ana": "active",
                "sofia": "active",
                "insights": "pending",
            },
            "message": "System operational",
        }
