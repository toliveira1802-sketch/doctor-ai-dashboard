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

    # Thales: sync Obsidian vault every 30 minutes
    scheduler.add_job(
        job_thales_sync,
        IntervalTrigger(minutes=30),
        id="thales_vault_sync",
        name="Thales: sync Obsidian vault to RAG",
        replace_existing=True,
    )

    # Kommo: full scrape and sync daily at 06:00
    scheduler.add_job(
        job_kommo_sync,
        IntervalTrigger(hours=24),
        id="kommo_daily_sync",
        name="Kommo: scrape and sync all leads",
        replace_existing=True,
    )

    scheduler.start()
    print("Scheduler started with 4 jobs")


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


async def job_thales_sync():
    """Thales: incremental sync of Obsidian vault to RAG."""
    if not _chroma:
        return

    from rag.retriever import RAGRetriever
    from agents.thales import ThalesAgent

    retriever = RAGRetriever(_chroma)
    thales = ThalesAgent(chroma=_chroma, retriever=retriever)

    try:
        result = await thales.sync(force=False)
        synced = result.get("synced", 0)
        if synced > 0:
            print(f"[Scheduler] Thales vault sync: {synced} files synced")
    except Exception as e:
        print(f"[Scheduler] Thales vault sync failed: {e}")


async def job_kommo_sync():
    """Kimi: daily full scrape, enrich, and sync of all leads."""
    try:
        from agents.kimi import KimiAgent

        kimi = KimiAgent()
        result = await kimi.sync_leads()

        total = result.get("total_scraped", 0)
        saved = result.get("saved", 0)
        enriched = result.get("enriched", 0)
        vacuum = result.get("action_needed", {}).get("vacuum_leads", 0)
        stale = result.get("action_needed", {}).get("stale_leads", 0)
        print(f"[Scheduler] Kimi sync: {total} leads scraped, {saved} saved, {enriched} enriched, {vacuum} vacuum, {stale} stale")
    except Exception as e:
        print(f"[Scheduler] Kimi sync failed: {e}")
