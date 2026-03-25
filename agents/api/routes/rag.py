from fastapi import APIRouter, Request
from pydantic import BaseModel

from rag.retriever import RAGRetriever

router = APIRouter()


class RAGQueryRequest(BaseModel):
    query: str
    collections: list[str] | None = None  # None = search all
    n_results: int = 5


@router.post("/query")
async def query_rag(request: Request, body: RAGQueryRequest):
    """Query the RAG system directly."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)

    if body.collections:
        results = retriever.retrieve(body.query, body.collections, body.n_results)
    else:
        # Search both RAGs
        study = retriever.retrieve_from_study(body.query, body.n_results)
        operational = retriever.retrieve_from_operational(body.query, body.n_results)
        results = sorted(
            study + operational, key=lambda r: r.score, reverse=True
        )[: body.n_results]

    return {
        "query": body.query,
        "results": [
            {
                "document": r.document,
                "metadata": r.metadata,
                "score": r.score,
                "collection": r.collection,
            }
            for r in results
        ],
        "total": len(results),
    }


@router.get("/collections")
async def list_collections(request: Request):
    """List all RAG collections with stats."""
    chroma = request.app.state.chroma
    return {"collections": chroma.list_collections_info()}
