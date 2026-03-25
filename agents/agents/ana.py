from agents.base import BaseAgent
from rag.retriever import RAGRetriever
from services.classifier import classify_lead


class AnaAgent(BaseAgent):
    """Ana - Client-facing support AI for Doctor Auto Prime."""

    def __init__(self, retriever: RAGRetriever):
        super().__init__("ana.yaml")
        self.retriever = retriever

    async def process(self, input_data: dict) -> dict:
        """Process a client message and generate a response with RAG context."""
        message = input_data["message"]
        history = input_data.get("history", [])

        # 1. Retrieve relevant context from Operational RAG
        results = self.retriever.retrieve_from_operational(message, n_results=5)
        context_parts = []
        for r in results:
            context_parts.append(
                f"[{r.collection}] (relevancia: {r.score:.0%})\n{r.document}"
            )
        context = "\n\n---\n\n".join(context_parts) if context_parts else None

        # 2. Build messages for LLM
        messages = []
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})

        # 3. Get response from LLM with RAG context
        response = await self.chat(messages, context=context)

        # 4. Classify lead after enough conversation (3+ messages)
        all_messages = history + [
            {"role": "user", "content": message},
            {"role": "assistant", "content": response},
        ]
        classification = None
        if len(all_messages) >= 3:
            try:
                classification = await classify_lead(all_messages)
            except Exception:
                classification = None

        return {
            "message": response,
            "agent": self.name.lower(),
            "rag_sources": [
                {
                    "collection": r.collection,
                    "score": round(r.score, 3),
                    "preview": r.document[:120],
                }
                for r in results
            ],
            "classification": {
                "label": classification.classification,
                "score": classification.score,
                "reasoning": classification.reasoning,
                "extracted_info": classification.extracted_info.model_dump(),
            }
            if classification
            else None,
        }
