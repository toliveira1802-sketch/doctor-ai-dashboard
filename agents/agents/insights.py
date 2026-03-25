from agents.base import BaseAgent
from rag.retriever import RAGRetriever


class InsightsAgent(BaseAgent):
    """Insights AI - Real-time analysis connecting Study RAG to Ana."""

    def __init__(self, retriever: RAGRetriever):
        super().__init__("insights.yaml")
        self.retriever = retriever

    async def process(self, input_data: dict) -> dict:
        """Generate insights for a client interaction."""
        # Will be fully implemented in Phase 5
        client_context = input_data.get("client_context", "")
        conversation_summary = input_data.get("conversation_summary", "")

        query = f"Cliente: {client_context}\nResumo da conversa: {conversation_summary}"
        results = self.retriever.retrieve_from_study(query, n_results=5)

        context = "\n\n".join(
            f"[{r.collection}] {r.document}" for r in results
        )

        messages = [
            {
                "role": "user",
                "content": f"Analise este cliente e gere insights acionaveis:\n\n{query}",
            }
        ]

        response = await self.chat(messages, context=context if results else None)

        return {
            "insights": response,
            "agent": self.name.lower(),
            "sources_used": len(results),
        }
