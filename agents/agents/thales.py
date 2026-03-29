"""Pitoco Loco — Braco Direito Estrategico. Syncs Obsidian vault to RAG and answers as Thales' strategic partner."""

import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path

from agents.base import BaseAgent
from ingestion.chunker import chunk_text
from rag.chroma_client import ChromaManager
from rag.embeddings import embedding_service
from rag.retriever import RAGRetriever
from services.supabase_client import save_document_registry


# Mapping: vault folder prefix → target RAG collection
FOLDER_MAP = {
    "00": "ops_daily_notes",            # Daily notes (auto-generated)
    "01": "study_business_insights",    # Strategy, business
    "02": "study_business_insights",    # Projects
    "03": "study_car_manuals",          # Technical knowledge
    "04": "study_industry_news",        # Market, news
    "05": "study_diagnostic_kb",        # Diagnostics
    "06": "ops_service_procedures",     # Procedures
    "07": "ops_client_support",         # Client-facing
    "08": "ops_pricing_guidelines",     # Pricing
    "99": "study_business_insights",    # System / Identity → business context
}

DEFAULT_COLLECTION = "study_business_insights"


def _md5(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def _resolve_collection(rel_path: str) -> str:
    """Map a vault-relative path to a RAG collection based on folder prefix."""
    parts = Path(rel_path).parts
    if parts:
        prefix = parts[0][:2]
        if prefix in FOLDER_MAP:
            return FOLDER_MAP[prefix]
    return DEFAULT_COLLECTION


def _is_syncable(path: Path) -> bool:
    """Check if a file should be synced (markdown only, skip templates)."""
    if not path.suffix == ".md":
        return False
    rel = str(path)
    if "Templates" in rel:
        return False
    return True


class ThalesAgent(BaseAgent):
    """Pitoco Loco — Braco Direito Estrategico + Second Brain sync."""

    def __init__(self, chroma: ChromaManager, retriever: RAGRetriever, vault_path: str | None = None):
        super().__init__("thales.yaml")
        self.chroma = chroma
        self.retriever = retriever
        self.vault_path = Path(vault_path or os.getenv("SECONDBRAIN_PATH", "/app/SecondBrain"))
        self._hash_cache: dict[str, str] = {}  # path -> md5 hash of content

    def scan_vault(self) -> list[dict]:
        """Scan vault and return list of files with metadata."""
        if not self.vault_path.exists():
            return []

        files = []
        for md_file in self.vault_path.rglob("*.md"):
            if not _is_syncable(md_file):
                continue

            rel_path = str(md_file.relative_to(self.vault_path))
            stat = md_file.stat()
            content = md_file.read_text(encoding="utf-8", errors="ignore")

            files.append({
                "path": rel_path,
                "abs_path": str(md_file),
                "title": md_file.stem,
                "folder": str(Path(rel_path).parent),
                "collection": _resolve_collection(rel_path),
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                "content_hash": _md5(content),
                "content": content,
                "word_count": len(content.split()),
            })

        return files

    async def sync(self, force: bool = False) -> dict:
        """Incremental sync: only ingest new or changed files."""
        files = self.scan_vault()
        if not files:
            return {"status": "empty", "message": "Vault not found or empty", "synced": 0, "skipped": 0}

        synced = 0
        skipped = 0
        errors = []

        for f in files:
            cached_hash = self._hash_cache.get(f["path"])

            # Skip unchanged files (unless force)
            if not force and cached_hash == f["content_hash"]:
                skipped += 1
                continue

            # Skip very short notes
            if f["word_count"] < 10:
                skipped += 1
                continue

            try:
                await self._ingest_note(f)
                self._hash_cache[f["path"]] = f["content_hash"]
                synced += 1
            except Exception as e:
                errors.append({"path": f["path"], "error": str(e)})

        return {
            "status": "ok",
            "vault_path": str(self.vault_path),
            "total_files": len(files),
            "synced": synced,
            "skipped": skipped,
            "errors": errors,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def _ingest_note(self, file_info: dict):
        """Ingest a single vault note into the appropriate RAG collection."""
        content = file_info["content"]
        title = file_info["title"]
        collection = file_info["collection"]
        doc_id = f"vault_{_md5(file_info['path'])}"

        # Remove existing chunks for this doc (re-ingest)
        try:
            col = self.chroma.get_collection(collection)
            existing = col.get(where={"doc_id": doc_id})
            if existing and existing["ids"]:
                col.delete(ids=existing["ids"])
        except Exception:
            pass

        chunks = chunk_text(content)
        if not chunks:
            return

        embeddings = embedding_service.embed_batch(chunks)

        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "doc_id": doc_id,
                "chunk_index": i,
                "title": title,
                "source_type": "obsidian",
                "vault_path": file_info["path"],
                "folder": file_info["folder"],
            }
            for i in range(len(chunks))
        ]

        self.chroma.add_documents(
            collection_name=collection,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )

        await save_document_registry({
            "id": doc_id,
            "title": f"[Vault] {title}",
            "source_type": "obsidian",
            "source_url": f"obsidian://{file_info['path']}",
            "source_rag": "study" if collection.startswith("study_") else "operational",
            "collection_name": collection,
            "chunk_count": len(chunks),
            "status": "completed",
            "metadata": {
                "vault_path": file_info["path"],
                "folder": file_info["folder"],
                "content_hash": file_info["content_hash"],
            },
            "ingested_at": datetime.now(timezone.utc).isoformat(),
        })

    async def process(self, input_data: dict) -> dict:
        """Handle Thales actions: chat, sync, status, search."""
        action = input_data.get("action", "chat")

        if action == "sync":
            force = input_data.get("force", False)
            return await self.sync(force=force)

        elif action == "status":
            files = self.scan_vault()
            synced_count = len(self._hash_cache)
            return {
                "agent": self.name,
                "vault_path": str(self.vault_path),
                "vault_exists": self.vault_path.exists(),
                "total_files": len(files),
                "synced_files": synced_count,
                "pending": len(files) - synced_count,
                "folders": list(set(f["folder"] for f in files)),
                "collections_used": list(set(f["collection"] for f in files)),
            }

        elif action == "search":
            query = input_data.get("query", "")
            results = self.retriever.retrieve_from_study(query, n_results=8)
            # Filter to vault-only results
            vault_results = [r for r in results if r.metadata.get("source_type") == "obsidian"]
            return {
                "query": query,
                "results": [
                    {
                        "document": r.document,
                        "score": round(r.score, 3),
                        "collection": r.collection,
                        "title": r.metadata.get("title", ""),
                        "vault_path": r.metadata.get("vault_path", ""),
                    }
                    for r in vault_results
                ],
                "total": len(vault_results),
            }

        elif action == "chat":
            message = input_data.get("message", "")
            history = input_data.get("history", [])

            # Search both RAGs for context, prioritize vault content
            from rag.chroma_client import ALL_COLLECTIONS
            results = self.retriever.retrieve(message, collections=ALL_COLLECTIONS, n_results=8)
            context_parts = []
            for r in results:
                source = r.metadata.get("vault_path", r.collection)
                context_parts.append(f"[{source}] (score: {r.score:.0%})\n{r.document}")

            context = "\n\n---\n\n".join(context_parts) if context_parts else None

            messages = []
            for msg in history[-10:]:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": message})

            response = await self.chat(messages, context=context)

            return {
                "message": response,
                "agent": self.name,
                "rag_sources": [
                    {
                        "collection": r.collection,
                        "score": round(r.score, 3),
                        "title": r.metadata.get("title", ""),
                        "vault_path": r.metadata.get("vault_path", ""),
                    }
                    for r in results[:5]
                ],
            }

        return {"error": f"Unknown action: {action}"}
