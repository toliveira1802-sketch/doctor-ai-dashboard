"""Orchestrates the full ingestion pipeline: source -> extract -> chunk -> embed -> store."""

import asyncio
import uuid
from datetime import datetime, timezone

from ingestion.chunker import chunk_text
from rag.chroma_client import ChromaManager
from rag.embeddings import embedding_service
from services.supabase_client import save_document_registry

# Global lock to serialize ChromaDB writes and prevent concurrent ingestion collisions
_ingest_lock = asyncio.Lock()


class IngestionPipeline:
    """Unified pipeline that ingests any content type into the RAG."""

    def __init__(self, chroma: ChromaManager):
        self.chroma = chroma

    async def ingest_text(
        self,
        text: str,
        title: str,
        source_type: str,
        target_collection: str,
        target_rag: str = "study",
        metadata: dict | None = None,
        source_url: str | None = None,
    ) -> dict:
        """Ingest pre-extracted text into a RAG collection (serialized via lock)."""
        doc_id = str(uuid.uuid4())
        meta = metadata or {}

        chunks = chunk_text(text)
        if not chunks:
            return {"document_id": doc_id, "status": "empty", "chunk_count": 0}

        embeddings = embedding_service.embed_batch(chunks)

        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                **meta,
                "doc_id": doc_id,
                "chunk_index": i,
                "title": title,
                "source_type": source_type,
            }
            for i in range(len(chunks))
        ]

        async with _ingest_lock:
            self.chroma.add_documents(
                collection_name=target_collection,
                documents=chunks,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids,
            )

            await save_document_registry({
                "id": doc_id,
                "title": title,
                "source_type": source_type,
                "source_url": source_url,
                "source_rag": target_rag,
                "collection_name": target_collection,
                "chunk_count": len(chunks),
                "status": "completed",
                "metadata": meta,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            })

        return {
            "document_id": doc_id,
            "title": title,
            "chunk_count": len(chunks),
            "collection": target_collection,
            "status": "completed",
        }

    async def ingest_from_perplexity(
        self,
        query: str,
        target_collection: str = "study_industry_news",
        model: str = "sonar-pro",
        search_recency: str | None = None,
    ) -> dict:
        """Research via Perplexity and ingest results into Study RAG."""
        from ingestion.perplexity_loader import perplexity_loader

        result = await perplexity_loader.research(
            query=query, model=model, search_recency=search_recency
        )

        return await self.ingest_text(
            text=result["content"],
            title=f"Perplexity: {query[:80]}",
            source_type="perplexity",
            target_collection=target_collection,
            target_rag="study",
            metadata={
                "query": query,
                "citations": result.get("citations", []),
                "model": model,
            },
        )

    async def ingest_from_url(
        self,
        url: str,
        title: str | None = None,
        target_collection: str = "study_industry_news",
    ) -> dict:
        """Scrape a URL and ingest into Study RAG."""
        from ingestion.web_scraper import web_scraper

        result = await web_scraper.scrape(url)

        return await self.ingest_text(
            text=result["text"],
            title=title or result.get("title", url),
            source_type="web",
            target_collection=target_collection,
            target_rag="study",
            metadata={"url": url},
            source_url=url,
        )

    async def ingest_from_kimi(
        self,
        file_path: str,
        title: str,
        task: str = "break_into_chunks",
        target_collection: str = "study_car_manuals",
    ) -> dict:
        """Process a long document with Kimi and ingest into Study RAG."""
        from ingestion.kimi_loader import kimi_loader

        result = await kimi_loader.process_document(file_path, task=task)

        # If Kimi broke into chunks, ingest each separately
        if result["sections"]:
            total_chunks = 0
            doc_ids = []
            for i, section in enumerate(result["sections"]):
                r = await self.ingest_text(
                    text=section,
                    title=f"{title} - Secao {i + 1}",
                    source_type="kimi",
                    target_collection=target_collection,
                    target_rag="study",
                    metadata={"section_index": i, "task": task, "parent_title": title},
                )
                total_chunks += r["chunk_count"]
                doc_ids.append(r["document_id"])
            return {
                "document_ids": doc_ids,
                "title": title,
                "sections": len(result["sections"]),
                "total_chunks": total_chunks,
                "collection": target_collection,
                "status": "completed",
            }

        # Otherwise ingest the full content
        return await self.ingest_text(
            text=result["content"],
            title=title,
            source_type="kimi",
            target_collection=target_collection,
            target_rag="study",
            metadata={"task": task},
        )
