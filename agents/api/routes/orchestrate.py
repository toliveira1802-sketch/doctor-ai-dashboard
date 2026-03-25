from fastapi import APIRouter, Request
from pydantic import BaseModel

from agents.sofia import SofiaAgent
from rag.retriever import RAGRetriever

router = APIRouter()


class SofiaRequest(BaseModel):
    action: str = "chat"
    message: str = ""
    history: list[dict] = []
    payload: dict = {}


@router.post("/orchestrate")
async def sofia_orchestrate(request: Request, body: SofiaRequest):
    """Send a command to Sofia orchestrator."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    sofia = SofiaAgent(retriever, chroma)

    result = await sofia.process({
        "action": body.action,
        "message": body.message,
        "history": body.history,
        **body.payload,
    })

    return result


@router.get("/status")
async def sofia_status(request: Request):
    """Get full system status from Sofia."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    sofia = SofiaAgent(retriever, chroma)
    return await sofia.process({"action": "status"})
