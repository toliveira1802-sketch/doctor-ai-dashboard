from fastapi import APIRouter, Request
from pydantic import BaseModel

from agents.insights import InsightsAgent
from rag.retriever import RAGRetriever
from services.blog_generator import blog_generator

router = APIRouter()


class InsightRequest(BaseModel):
    action: str = "analyze_client"
    client_context: str = ""
    conversation_summary: str = ""
    conversation_id: str = ""
    vehicle_info: dict = {}
    brand: str = ""
    model: str = ""
    year: str = ""


class BlogRequest(BaseModel):
    topic: str
    style: str = "informativo"


@router.post("/analyze")
async def generate_insights(request: Request, body: InsightRequest):
    """Generate real-time insights for a client."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    insights_agent = InsightsAgent(retriever)

    data = {
        "action": body.action,
        "client_context": body.client_context,
        "conversation_summary": body.conversation_summary,
        "conversation_id": body.conversation_id,
        "vehicle_info": body.vehicle_info or {
            "brand": body.brand,
            "model": body.model,
            "year": body.year,
        },
        "brand": body.brand,
        "model": body.model,
        "year": body.year,
    }

    return await insights_agent.process(data)


@router.post("/patterns")
async def detect_patterns(request: Request):
    """Detect patterns across recent leads."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    insights_agent = InsightsAgent(retriever)
    return await insights_agent.process({"action": "detect_patterns"})


@router.post("/blog/generate")
async def generate_blog_post(request: Request, body: BlogRequest):
    """Generate a blog post from Study RAG content."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    return await blog_generator.generate_post(body.topic, retriever, body.style)


@router.post("/blog/auto")
async def auto_generate_blog(request: Request):
    """Auto-generate a blog post from latest news."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    return await blog_generator.generate_from_news(retriever)
