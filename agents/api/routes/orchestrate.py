from fastapi import APIRouter, Request
from pydantic import BaseModel

from agents.sofia import SofiaAgent
from rag.retriever import RAGRetriever
from services.supabase_client import log_sofia_action

router = APIRouter()


class SofiaRequest(BaseModel):
    action: str = "chat"  # 'chat', 'promote_content', 'status'
    message: str = ""
    history: list[dict] = []
    payload: dict = {}


@router.post("/orchestrate")
async def sofia_orchestrate(request: Request, body: SofiaRequest):
    """Send a command to Sofia."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    sofia = SofiaAgent(retriever)

    result = await sofia.process({
        "action": body.action,
        "message": body.message,
        "history": body.history,
        **body.payload,
    })

    # Log action
    await log_sofia_action({
        "action_type": body.action,
        "source_agent": "dashboard",
        "target_agent": "sofia",
        "input_data": {"message": body.message, "action": body.action},
        "output_data": result,
        "reasoning": result.get("message", ""),
    })

    return result
