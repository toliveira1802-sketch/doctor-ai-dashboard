"""Anna — Especialista em Vendas Consultivas. Humanized WhatsApp sales orchestrator."""

import json
import logging

from agents.base import BaseAgent
from rag.retriever import RAGRetriever
from services.classifier import classify_lead
from services.llm_router import llm_router


class AnaAgent(BaseAgent):
    """Anna — Sales orchestrator with adaptive learning, microtasks, and cross-agent cooperation."""

    def __init__(self, retriever: RAGRetriever):
        super().__init__("ana.yaml")
        self.retriever = retriever

    async def process(self, input_data: dict) -> dict:
        """Process a client message and generate a sales-oriented response with RAG context."""
        message = input_data["message"]
        history = input_data.get("history", [])
        channel = input_data.get("channel", "dashboard")

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
            except (ValueError, KeyError, RuntimeError) as e:
                import logging
                logging.getLogger(__name__).warning("Lead classification failed: %s", e)
                classification = None

        # 5. Extract sales ops (learning note + microtask) after 2+ messages
        ops = None
        if len(all_messages) >= 2:
            try:
                ops = await self._extract_sales_ops(all_messages, classification)
            except (ValueError, KeyError, RuntimeError) as e:
                import logging
                logging.getLogger(__name__).warning("Sales ops extraction failed: %s", e)
                ops = None

        result = {
            "message": response,
            "agent": "anna",
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

        if ops:
            result["sales_ops"] = ops

        return result

    async def _extract_sales_ops(
        self, messages: list[dict], classification=None
    ) -> dict | None:
        """Extract learning notes and microtasks from conversation."""
        conversation_text = "\n".join(
            f"{m['role']}: {m['content']}" for m in messages[-6:]
        )

        stage = "unknown"
        if classification:
            label = classification.classification
            if label == "hot":
                stage = "qualified"
            elif label == "warm":
                stage = "warm"
            else:
                stage = "cold"

        prompt = f"""Analise esta conversa de vendas e extraia operacoes internas.
Responda APENAS em JSON valido, sem markdown.

Conversa:
{conversation_text}

Estagio atual: {stage}

Retorne este JSON:
{{
  "stage": "{stage}",
  "main_signal": "o sinal comercial mais importante",
  "next_move": "melhor proxima acao",
  "learning_note": {{
    "signal_observed": "o que aconteceu",
    "probable_meaning": "interpretacao comercial",
    "confidence": "baixa|media|alta",
    "suggested_adjustment": "o que Anna deveria tentar"
  }} ou null se nao houver aprendizado relevante,
  "microtask": {{
    "title": "nome curto da acao",
    "owner": "anna|marketing|crm",
    "trigger": "imediato|data|evento|recorrente",
    "reason": "por que isso deve acontecer",
    "success_condition": "o que feito significa"
  }} ou null se nao houver tarefa relevante
}}"""

        try:
            raw = await llm_router.chat(
                provider="openai",
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=512,
            )
            # Clean response
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                cleaned = cleaned.rsplit("```", 1)[0]
            return json.loads(cleaned)
        except (ValueError, KeyError, RuntimeError, json.JSONDecodeError) as e:
            logging.getLogger(__name__).warning("Sales ops JSON parse failed: %s", e)
            return None
