from agents.base import BaseAgent
from rag.retriever import RAGRetriever


class AnaAgent(BaseAgent):
    """Ana - Client-facing support AI."""

    def __init__(self, retriever: RAGRetriever):
        super().__init__("ana.yaml")
        self.retriever = retriever

    async def process(self, input_data: dict) -> dict:
        """Process a client message and generate a response."""
        message = input_data["message"]
        history = input_data.get("history", [])

        # Retrieve relevant context from Operational RAG
        results = self.retriever.retrieve_from_operational(message, n_results=3)
        context = "\n\n".join(
            f"[{r.collection}] (score: {r.score:.2f})\n{r.document}"
            for r in results
        )

        # Build messages for LLM
        messages = []
        for msg in history[-10:]:  # Last 10 messages for context window
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})

        # Get response from LLM
        response = await self.chat(messages, context=context if results else None)

        return {
            "message": response,
            "agent": self.name.lower(),
            "rag_sources": [
                {
                    "collection": r.collection,
                    "score": r.score,
                    "preview": r.document[:100],
                }
                for r in results
            ],
        }
