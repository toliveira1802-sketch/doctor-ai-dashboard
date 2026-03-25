from fastapi import APIRouter, Request
from pydantic import BaseModel

from agents.insights import InsightsAgent
from rag.retriever import RAGRetriever

router = APIRouter()


class InsightRequest(BaseModel):
    client_context: str = ""
    conversation_summary: str = ""


@router.post("/analyze")
async def generate_insights(request: Request, body: InsightRequest):
    """Generate real-time insights for a client."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    insights_agent = InsightsAgent(retriever)

    result = await insights_agent.process({
        "client_context": body.client_context,
        "conversation_summary": body.conversation_summary,
    })

    return result
