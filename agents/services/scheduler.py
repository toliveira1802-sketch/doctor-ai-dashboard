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
    """Kommo: daily full scrape and sync of all leads."""
    try:
        from services.kommo_scraper import kommo_scraper
        from services.supabase_client import get_supabase

        result = await kommo_scraper.scrape_and_map()
        sb = get_supabase()

        saved = 0
        for lead in result["leads"]:
            try:
                sb.table("crm_leads").upsert({
                    "external_client_id": str(lead["kommo_lead_id"]),
                    "client_name": lead["name"],
                    "classification": lead["classification"],
                    "score": lead["score"],
                    "channel": "kommo",
                    "source": lead["pipeline"],
                    "reasoning": ", ".join(lead["flags"]) if lead["flags"] else lead["status"],
                    "metadata": {
                        "pipeline": lead["pipeline"],
                        "status": lead["status"],
                        "kommo_lead_id": lead["kommo_lead_id"],
                        "days_since_update": lead["days_since_update"],
                        "flags": lead["flags"],
                    },
                }, on_conflict="external_client_id").execute()
                saved += 1
            except Exception:
                pass

        total = result["total_leads"]
        vacuum = result["action_needed"]["vacuum_leads"]
        stale = result["action_needed"]["stale_leads"]
        print(f"[Scheduler] Kommo sync: {total} leads scraped, {saved} saved, {vacuum} vacuum, {stale} stale")
    except Exception as e:
        print(f"[Scheduler] Kommo sync failed: {e}")
