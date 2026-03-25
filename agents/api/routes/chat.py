import uuid

from fastapi import APIRouter, Request

from agents.ana import AnaAgent
from models.conversation import ChatRequest, ChatResponse
from rag.retriever import RAGRetriever
from services.supabase_client import (
    save_conversation,
    save_message,
    save_lead,
    get_conversation_messages,
)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def ana_chat(request: Request, body: ChatRequest):
    """Process a client message through Ana with RAG context and lead classification."""
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

    classification = result.get("classification")

    # Save conversation
    conv_data = {
        "id": conversation_id,
        "external_client_id": body.external_client_id,
        "channel": body.channel,
        "status": "active",
        "assigned_agent": "ana",
        "metadata": body.metadata,
    }
    if classification:
        conv_data["classification"] = classification["label"]
    await save_conversation(conv_data)

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
        "llm_provider": "openai",
        "llm_model": "gpt-4o-mini",
        "rag_sources": result.get("rag_sources", []),
    })

    # Save lead classification if available
    if classification and classification.get("extracted_info"):
        info = classification["extracted_info"]
        await save_lead({
            "conversation_id": conversation_id,
            "client_name": info.get("name"),
            "phone": info.get("phone"),
            "email": info.get("email"),
            "vehicle_info": info.get("vehicle", {}),
            "problem_description": info.get("problem_description"),
            "classification": classification["label"],
            "score": classification["score"],
            "source": body.channel,
        })

    return ChatResponse(
        conversation_id=conversation_id,
        message=result["message"],
        classification=classification["label"] if classification else None,
        rag_sources=result.get("rag_sources", []),
        agent="ana",
    )
