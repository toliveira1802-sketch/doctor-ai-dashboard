import uuid

from fastapi import APIRouter, Request

from agents.ana import AnaAgent
from models.conversation import ChatRequest, ChatResponse
from rag.retriever import RAGRetriever
from services.supabase_client import (
    save_conversation,
    save_message,
    get_conversation_messages,
)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def ana_chat(request: Request, body: ChatRequest):
    """Process a client message through Ana."""
    chroma = request.app.state.chroma
    retriever = RAGRetriever(chroma)
    ana = AnaAgent(retriever)

    # Get or create conversation
    conversation_id = body.conversation_id or str(uuid.uuid4())

    # Load history from Supabase
    history = []
    if body.conversation_id:
        messages = await get_conversation_messages(conversation_id)
        history = [{"role": m["role"], "content": m["content"]} for m in messages]

    # Process through Ana
    result = await ana.process({
        "message": body.message,
        "history": history,
    })

    # Save conversation
    await save_conversation({
        "id": conversation_id,
        "external_client_id": body.external_client_id,
        "channel": body.channel,
        "status": "active",
        "assigned_agent": "ana",
        "metadata": body.metadata,
    })

    # Save user message
    await save_message({
        "conversation_id": conversation_id,
        "role": "user",
        "content": body.message,
    })

    # Save assistant response
    await save_message({
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": result["message"],
        "agent": "ana",
        "rag_sources": result.get("rag_sources", []),
    })

    return ChatResponse(
        conversation_id=conversation_id,
        message=result["message"],
        rag_sources=result.get("rag_sources", []),
        agent="ana",
    )
