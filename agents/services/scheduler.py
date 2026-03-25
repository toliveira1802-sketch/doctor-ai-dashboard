"""Scheduled jobs for automated RAG maintenance and research."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()
_chroma = None


def init_scheduler(chroma):
    """Initialize scheduler with ChromaDB reference."""
    global _chroma
    _chroma = chroma

    # Review Study RAG every 2 hours and promote content
    scheduler.add_job(
        job_review_study_rag,
        IntervalTrigger(hours=2),
        id="review_study_rag",
        name="Review Study RAG for promotion",
        replace_existing=True,
    )

    # Research automotive news daily at 06:00
    scheduler.add_job(
        job_research_news,
        IntervalTrigger(hours=24),
        id="research_news",
        name="Research automotive news via Perplexity",
        replace_existing=True,
    )

    scheduler.start()
    print("Scheduler started with 2 jobs")


async def job_review_study_rag():
    """Sofia reviews Study RAG and promotes content to Operational."""
    if not _chroma:
        return

    from rag.retriever import RAGRetriever
    from agents.sofia import SofiaAgent

    retriever = RAGRetriever(_chroma)
    sofia = SofiaAgent(retriever, _chroma)

    result = await sofia.process({"action": "review_study_rag"})
    print(f"[Scheduler] Study RAG review: {result.get('total_promoted', 0)} promoted")


async def job_research_news():
    """Use Perplexity to research latest automotive news."""
    if not _chroma:
        return

    from ingestion.pipeline import IngestionPipeline

    pipeline = IngestionPipeline(_chroma)

    queries = [
        "Ultimas noticias setor automotivo Brasil recalls 2026",
        "Novidades manutencao automotiva diagnostico eletronico",
    ]

    for query in queries:
        try:
            result = await pipeline.ingest_from_perplexity(
                query=query,
                target_collection="study_industry_news",
                model="sonar",
                search_recency="week",
            )
            print(f"[Scheduler] News research: {result.get('chunk_count', 0)} chunks from '{query[:50]}'")
        except Exception as e:
            print(f"[Scheduler] News research failed: {e}")
