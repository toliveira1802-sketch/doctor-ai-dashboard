"""API routes for Thales — Second Brain agent."""

from fastapi import APIRouter

from agents.thales import ThalesAgent

router = APIRouter(prefix="/agent/thales", tags=["thales"])

# Will be initialized in main.py lifespan
thales_agent: ThalesAgent | None = None


def init_thales(agent: ThalesAgent):
    global thales_agent
    thales_agent = agent


@router.post("/sync")
async def sync_vault(body: dict = {}):
    """Sync Obsidian vault to RAG (incremental by default)."""
    if not thales_agent:
        return {"error": "Thales agent not initialized"}

    force = body.get("force", False)
    return await thales_agent.process({"action": "sync", "force": force})


@router.get("/status")
async def vault_status():
    """Get vault sync status."""
    if not thales_agent:
        return {"error": "Thales agent not initialized"}

    return await thales_agent.process({"action": "status"})


@router.post("/search")
async def search_vault(body: dict):
    """Search vault content in RAG."""
    if not thales_agent:
        return {"error": "Thales agent not initialized"}

    return await thales_agent.process({"action": "search", "query": body.get("query", "")})


@router.post("/chat")
async def chat_with_thales(body: dict):
    """Chat with Thales using Second Brain context."""
    if not thales_agent:
        return {"error": "Thales agent not initialized"}

    return await thales_agent.process({
        "action": "chat",
        "message": body.get("message", ""),
        "history": body.get("history", []),
    })
