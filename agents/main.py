from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from rag.chroma_client import ChromaManager
from services.scheduler import init_scheduler
from api.routes import chat, orchestrate, insights, ingest, rag, health, thales as thales_route


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

    # Start scheduled jobs
    init_scheduler(chroma)

    yield
    # Shutdown
    from services.scheduler import scheduler
    scheduler.shutdown(wait=False)
    print("Shutting down agents...")


app = FastAPI(
    title="Doctor Auto AI Agents",
    version="0.1.0",
    description="Multi-agent RAG system for Doctor Auto Prime",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, tags=["Health"])
app.include_router(chat.router, prefix="/agent/ana", tags=["Ana"])
app.include_router(orchestrate.router, prefix="/agent/sofia", tags=["Sofia"])
app.include_router(insights.router, prefix="/agent/insights", tags=["Insights"])
app.include_router(ingest.router, prefix="/rag", tags=["Ingestion"])
app.include_router(rag.router, prefix="/rag", tags=["RAG"])
app.include_router(thales_route.router, tags=["Thales"])
