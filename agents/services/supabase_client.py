from supabase import create_client, Client

from config.settings import settings

_client: Client | None = None


def get_supabase() -> Client:
    """Get or create Supabase client singleton."""
    global _client
    if _client is None:
        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key or settings.supabase_anon_key,
        )
    return _client


async def save_conversation(conversation_data: dict) -> dict:
    """Save or update a conversation in Supabase."""
    sb = get_supabase()
    result = sb.table("ai_conversations").upsert(conversation_data).execute()
    return result.data[0] if result.data else {}


async def save_message(message_data: dict) -> dict:
    """Save a message to Supabase."""
    sb = get_supabase()
    result = sb.table("ai_messages").insert(message_data).execute()
    return result.data[0] if result.data else {}


async def save_lead(lead_data: dict) -> dict:
    """Save or update a lead in the CRM."""
    sb = get_supabase()
    result = sb.table("crm_leads").upsert(lead_data).execute()
    return result.data[0] if result.data else {}


async def log_sofia_action(action_data: dict) -> dict:
    """Log a Sofia orchestration action."""
    sb = get_supabase()
    result = sb.table("sofia_actions").insert(action_data).execute()
    return result.data[0] if result.data else {}


async def save_document_registry(doc_data: dict) -> dict:
    """Register a document in the RAG document registry."""
    sb = get_supabase()
    result = sb.table("rag_documents").upsert(doc_data).execute()
    return result.data[0] if result.data else {}


async def get_conversation_messages(conversation_id: str) -> list[dict]:
    """Get all messages for a conversation."""
    sb = get_supabase()
    result = (
        sb.table("ai_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    return result.data or []
