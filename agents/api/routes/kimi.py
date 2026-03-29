"""API routes for Kimi — CRM Lead Manager."""

from fastapi import APIRouter, Request

router = APIRouter(prefix="/kimi", tags=["Kimi"])

_kimi = None


def init_kimi(agent):
    global _kimi
    _kimi = agent


@router.post("/sync")
async def sync_leads(limit: int = 50, enrich: bool = False):
    """Scrape Kommo CRM — pull and classify leads. limit=50 by default, enrich=False skips contact API calls."""
    result = await _kimi.sync_leads(limit=limit, enrich=enrich)
    return result


@router.get("/queue")
async def get_queue(limit: int = 30):
    """Get prioritized lead queue for sales team."""
    result = await _kimi.prioritize_leads(limit=limit)
    return result


@router.post("/enrich/{lead_id}")
async def enrich_lead(lead_id: str):
    """Enrich a specific lead with contact details and notes from Kommo."""
    result = await _kimi.enrich_lead(lead_id)
    return result


@router.get("/briefing")
async def get_briefing():
    """Generate a prioritized lead briefing for Anna."""
    result = await _kimi.generate_briefing_for_anna()
    return result


@router.get("/health")
async def funnel_health():
    """Funnel health report with metrics, segments, and alerts."""
    result = await _kimi.funnel_health()
    return result
