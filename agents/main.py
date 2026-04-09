from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from api.deps import verify_api_key
from api.middleware import RequestIDMiddleware
from config.settings import settings
from rag.chroma_client import ChromaManager
from services.scheduler import init_scheduler
from api.routes import chat, orchestrate, insights, ingest, rag, health, thales as thales_route, kommo_sync, kimi as kimi_route


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize ChromaDB collections
    chroma = ChromaManager()
    chroma.initialize_collections()
    app.state.chroma = chroma
    print("ChromaDB collections initialized")

    # Initialize Thales (Second Brain)
    from rag.retriever import RAGRetriever
    from agents.thales import ThalesAgent
    retriever = RAGRetriever(chroma)
    thales = ThalesAgent(chroma=chroma, retriever=retriever)
    thales_route.init_thales(thales)
    app.state.thales = thales
    print("Thales (Second Brain) initialized")

    # Initialize Kimi (CRM Manager)
    from agents.kimi import KimiAgent
    kimi = KimiAgent()
    kimi_route.init_kimi(kimi)
    app.state.kimi = kimi
    print("Kimi (CRM Manager) initialized")

    # Start scheduled jobs
    init_scheduler(chroma)

    yield
    # Shutdown
    from services.scheduler import scheduler
    scheduler.shutdown(wait=False)
    print("Shutting down agents...")


limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="Doctor Auto AI Agents",
    version="0.1.0",
    description="Multi-agent RAG system for Doctor Auto Prime",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_middleware(RequestIDMiddleware)


@app.exception_handler(RateLimitExceeded)
async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )

_raw_origins = settings.allowed_origins.strip()
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else []

if not _allowed_origins:
    import warnings
    warnings.warn(
        "ALLOWED_ORIGINS not set — CORS will reject all cross-origin requests. "
        "Set ALLOWED_ORIGINS in .env (comma-separated).",
        stacklevel=1,
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
)

# Routes — health is public, everything else requires API key
app.include_router(health.router, tags=["Health"])

_auth = [Depends(verify_api_key)]
app.include_router(chat.router, prefix="/agent/ana", tags=["Ana"], dependencies=_auth)
app.include_router(orchestrate.router, prefix="/agent/sofia", tags=["Sofia"], dependencies=_auth)
app.include_router(insights.router, prefix="/agent/insights", tags=["Insights"], dependencies=_auth)
app.include_router(ingest.router, prefix="/rag", tags=["Ingestion"], dependencies=_auth)
app.include_router(rag.router, prefix="/rag", tags=["RAG"], dependencies=_auth)
app.include_router(thales_route.router, tags=["Thales"], dependencies=_auth)
app.include_router(kommo_sync.router, tags=["Kommo"], dependencies=_auth)
app.include_router(kimi_route.router, tags=["Kimi"], dependencies=_auth)
