from agents.base import BaseAgent
from agents.agent_bus import AgentMessage, agent_bus
from rag.retriever import RAGRetriever
from rag.chroma_client import ChromaManager
from rag.embeddings import embedding_service
from services.supabase_client import log_sofia_action


class SofiaAgent(BaseAgent):
    """Sofia - Orchestrator AI that manages flows between RAGs, agents and the system."""

    def __init__(self, retriever: RAGRetriever, chroma: ChromaManager | None = None):
        super().__init__("sofia.yaml")
        self.retriever = retriever
        self.chroma = chroma

    async def process(self, input_data: dict) -> dict:
        """Process an orchestration command."""
        action = input_data.get("action", "chat")

        handlers = {
            "chat": self._handle_chat,
            "promote_content": self._handle_promote,
            "review_study_rag": self._handle_review,
            "status": self._handle_status,
            "search_study": self._handle_search_study,
            "feed_ana": self._handle_feed_ana,
        }

        handler = handlers.get(action, self._handle_chat)
        result = await handler(input_data)

        # Log all actions to Supabase
        await log_sofia_action({
            "action_type": action,
            "source_agent": input_data.get("source", "dashboard"),
            "target_agent": input_data.get("target", "sofia"),
            "input_data": {"action": action, "message": input_data.get("message", "")},
            "output_data": result,
            "reasoning": result.get("reasoning", result.get("message", "")),
        })

        return result

    async def _handle_chat(self, data: dict) -> dict:
        """Direct chat with Sofia via dashboard."""
        message = data.get("message", "")
        history = data.get("history", [])

        # Search both RAGs for context
        study_results = self.retriever.retrieve_from_study(message, n_results=3)
        ops_results = self.retriever.retrieve_from_operational(message, n_results=3)

        context_parts = []
        for r in study_results:
            context_parts.append(f"[ESTUDO - {r.collection}] {r.document}")
        for r in ops_results:
            context_parts.append(f"[OPERACIONAL - {r.collection}] {r.document}")
        context = "\n\n---\n\n".join(context_parts) if context_parts else None

        messages = [{"role": m["role"], "content": m["content"]} for m in history[-10:]]
        messages.append({"role": "user", "content": message})

        response = await self.chat(messages, context=context)

        return {
            "message": response,
            "agent": "sofia",
            "study_sources": len(study_results),
            "ops_sources": len(ops_results),
        }

    async def _handle_promote(self, data: dict) -> dict:
        """Promote specific content from Study RAG to Operational RAG."""
        if not self.chroma:
            return {"error": "ChromaDB not available", "status": "failed"}

        source_collection = data.get("source_collection", "study_car_manuals")
        target_collection = data.get("target_collection", "ops_client_support")
        query = data.get("query", "")
        n_results = data.get("n_results", 5)

        if not query:
            return {"error": "Query required for content promotion", "status": "failed"}

        # Find relevant content in Study RAG
        results = self.retriever.retrieve(query, [source_collection], n_results)

        if not results:
            return {
                "status": "no_content",
                "message": "Nenhum conteudo relevante encontrado no RAG de Estudo.",
                "reasoning": f"Busca por '{query}' em {source_collection} retornou 0 resultados.",
            }

        # Use Sofia to evaluate and filter
        docs_text = "\n\n".join(
            f"[Score: {r.score:.2f}] {r.document}" for r in results
        )
        eval_messages = [
            {
                "role": "user",
                "content": (
                    f"Avalie os seguintes documentos do RAG de Estudo e decida quais "
                    f"sao uteis para o atendimento ao cliente (RAG Operacional).\n\n"
                    f"Documentos:\n{docs_text}\n\n"
                    f"Responda com os indices (0-based) dos documentos aprovados, "
                    f"separados por virgula. Se nenhum for util, responda 'NENHUM'."
                ),
            }
        ]

        eval_response = await self.chat(eval_messages)

        # Parse approved indices
        approved_indices = []
        if "NENHUM" not in eval_response.upper():
            for part in eval_response.replace(" ", "").split(","):
                try:
                    idx = int(part.strip())
                    if 0 <= idx < len(results):
                        approved_indices.append(idx)
                except ValueError:
                    continue

        if not approved_indices:
            return {
                "status": "none_approved",
                "message": "Sofia avaliou e nenhum documento foi aprovado para promocao.",
                "reasoning": eval_response,
                "evaluated": len(results),
            }

        # Promote approved documents
        promoted = []
        for idx in approved_indices:
            r = results[idx]
            embedding = embedding_service.embed_text(r.document)
            import uuid
            doc_id = f"promoted_{uuid.uuid4().hex[:8]}"

            self.chroma.add_documents(
                collection_name=target_collection,
                documents=[r.document],
                embeddings=[embedding],
                metadatas=[{
                    **r.metadata,
                    "promoted_from": source_collection,
                    "approved_by_sofia": True,
                    "promotion_score": r.score,
                }],
                ids=[doc_id],
            )
            promoted.append({
                "id": doc_id,
                "preview": r.document[:100],
                "score": r.score,
            })

        return {
            "status": "completed",
            "promoted": len(promoted),
            "evaluated": len(results),
            "target_collection": target_collection,
            "documents": promoted,
            "reasoning": eval_response,
        }

    async def _handle_review(self, data: dict) -> dict:
        """Review Study RAG for content worth promoting to Operational."""
        if not self.chroma:
            return {"error": "ChromaDB not available"}

        queries = [
            "problemas comuns veiculos diagnostico",
            "precos servicos automotivos",
            "procedimentos manutencao oficina",
            "recalls boletins tecnicos",
        ]

        total_promoted = 0
        review_results = []

        for query in queries:
            result = await self._handle_promote({
                "query": query,
                "source_collection": "study_car_manuals",
                "target_collection": "ops_client_support",
                "n_results": 3,
            })
            promoted = result.get("promoted", 0)
            total_promoted += promoted
            review_results.append({
                "query": query,
                "promoted": promoted,
                "status": result.get("status", "unknown"),
            })

        return {
            "status": "review_completed",
            "total_promoted": total_promoted,
            "reviews": review_results,
            "message": f"Revisao completa. {total_promoted} documentos promovidos ao RAG Operacional.",
        }

    async def _handle_status(self, data: dict = None) -> dict:
        """Return full system status."""
        collections = self.chroma.list_collections_info() if self.chroma else []
        bus_log = agent_bus.get_log(10)

        study_total = sum(c["count"] for c in collections if c["rag"] == "study")
        ops_total = sum(c["count"] for c in collections if c["rag"] == "operational")

        return {
            "status": "operational",
            "agents": {
                "ana": "active",
                "sofia": "active",
                "insights": "active",
            },
            "rag": {
                "study_total": study_total,
                "operational_total": ops_total,
                "collections": collections,
            },
            "recent_bus_messages": bus_log,
        }

    async def _handle_search_study(self, data: dict) -> dict:
        """Search Study RAG and return results (for dashboard)."""
        query = data.get("query", "")
        if not query:
            return {"error": "Query required"}

        results = self.retriever.retrieve_from_study(query, n_results=5)
        return {
            "query": query,
            "results": [
                {
                    "document": r.document[:300],
                    "collection": r.collection,
                    "score": round(r.score, 3),
                }
                for r in results
            ],
            "total": len(results),
        }

    async def _handle_feed_ana(self, data: dict) -> dict:
        """Feed specific content to Ana's operational RAG."""
        content = data.get("content", "")
        title = data.get("title", "Manual feed from Sofia")
        collection = data.get("collection", "ops_client_support")

        if not content or not self.chroma:
            return {"error": "Content and ChromaDB required"}

        embedding = embedding_service.embed_text(content)
        import uuid
        doc_id = f"sofia_feed_{uuid.uuid4().hex[:8]}"

        self.chroma.add_documents(
            collection_name=collection,
            documents=[content],
            embeddings=[embedding],
            metadatas=[{"source": "sofia_feed", "title": title, "approved_by_sofia": True}],
            ids=[doc_id],
        )

        return {
            "status": "completed",
            "document_id": doc_id,
            "collection": collection,
            "message": f"Conteudo adicionado ao RAG Operacional ({collection}).",
        }
