from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Check health of all services."""
    chroma = request.app.state.chroma
    collections = chroma.list_collections_info()

    return {
        "status": "healthy",
        "service": "doctor-auto-agents",
        "version": "0.1.0",
        "chromadb": {
            "status": "connected",
            "collections": collections,
        },
        "agents": {
            "ana": "ready",
            "sofia": "ready",
            "insights": "ready",
        },
    }
