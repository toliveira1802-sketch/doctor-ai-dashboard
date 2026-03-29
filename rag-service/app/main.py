from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import chromadb
import httpx
import os

app = FastAPI(title="RAG Service - Thales OS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Config ---
CHROMA_HOST = os.getenv("CHROMA_HOST", "chromadb")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
CHROMA_URL = f"http://{CHROMA_HOST}:{CHROMA_PORT}"
PERSONA_PATH = Path(__file__).parent / "persona.md"

# --- ChromaDB client ---
chroma = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)


# --- Models ---
class IngestRequest(BaseModel):
    collection: str = "thales_knowledge"
    documents: list[str]
    metadatas: list[dict] | None = None
    ids: list[str] | None = None


class QueryRequest(BaseModel):
    collection: str = "thales_knowledge"
    query: str
    n_results: int = 5


# --- Endpoints ---
@app.get("/health")
def health():
    try:
        chroma.heartbeat()
        return {"status": "ok", "chroma": "connected"}
    except Exception as e:
        return {"status": "degraded", "chroma": str(e)}


@app.get("/persona")
def get_persona():
    """Retorna o system prompt / persona do Thales OS."""
    if PERSONA_PATH.exists():
        return {"persona": PERSONA_PATH.read_text(encoding="utf-8")}
    raise HTTPException(status_code=404, detail="Persona file not found")


@app.get("/collections")
async def list_collections():
    """Lista todas as collections do ChromaDB via HTTP (bypasses SDK version mismatch)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{CHROMA_URL}/api/v1/collections")
        resp.raise_for_status()
        cols = resp.json()
    results = []
    for c in cols:
        name = c.get("name", c.get("id", "unknown"))
        # Get count per collection
        try:
            async with httpx.AsyncClient() as client:
                count_resp = await client.get(f"{CHROMA_URL}/api/v1/collections/{c['id']}/count")
                count = count_resp.json() if count_resp.status_code == 200 else 0
        except Exception:
            count = 0
        results.append({"name": name, "id": c.get("id"), "count": count})
    return {"collections": results}


@app.post("/ingest")
def ingest(req: IngestRequest):
    """Ingere documentos em uma collection."""
    col = chroma.get_or_create_collection(req.collection)
    ids = req.ids or [f"doc_{i}_{col.count()}" for i in range(len(req.documents))]
    metadatas = req.metadatas or [{}] * len(req.documents)

    col.add(documents=req.documents, metadatas=metadatas, ids=ids)
    return {"ingested": len(req.documents), "collection": req.collection, "total": col.count()}


@app.post("/query")
def query(req: QueryRequest):
    """Busca semântica na collection."""
    try:
        col = chroma.get_collection(req.collection)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Collection '{req.collection}' not found")

    results = col.query(query_texts=[req.query], n_results=req.n_results)
    return {
        "query": req.query,
        "results": [
            {
                "id": results["ids"][0][i],
                "document": results["documents"][0][i],
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                "distance": results["distances"][0][i] if results["distances"] else None,
            }
            for i in range(len(results["ids"][0]))
        ],
    }


@app.delete("/collections/{name}")
def delete_collection(name: str):
    """Deleta uma collection."""
    try:
        chroma.delete_collection(name)
        return {"deleted": name}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
