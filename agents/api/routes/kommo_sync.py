"""API routes for Kommo CRM scraping and analysis."""

from fastapi import APIRouter

router = APIRouter(prefix="/kommo", tags=["kommo"])


@router.post("/scrape")
async def scrape_kommo():
    """Full scrape of Kommo CRM — pull all leads, classify, segment."""
    from services.kommo_scraper import kommo_scraper
    result = await kommo_scraper.scrape_and_map()

    # Save mapped leads to Supabase
    from services.supabase_client import get_supabase
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
                    "contact_id": lead["contact_id"],
                    "custom_fields": lead["custom_fields"],
                    "days_since_update": lead["days_since_update"],
                    "flags": lead["flags"],
                },
            }, on_conflict="external_client_id").execute()
            saved += 1
        except Exception:
            pass

    return {
        "status": "ok",
        "total_scraped": result["total_leads"],
        "saved_to_crm": saved,
        "segments": result["segments"],
        "by_pipeline": result["by_pipeline"],
        "action_needed": result["action_needed"],
        "vacuum_sample": result["vacuum_sample"][:10],
        "stale_sample": result["stale_sample"][:10],
        "scraped_at": result["scraped_at"],
    }


@router.get("/segments")
async def get_segments():
    """Get current lead segments from CRM."""
    from services.supabase_client import get_supabase
    sb = get_supabase()

    data = sb.table("crm_leads").select("classification, score, source, reasoning, metadata, created_at").execute()
    leads = data.data or []

    segments = {}
    by_pipeline = {}
    for l in leads:
        cls = l.get("classification", "unknown")
        segments[cls] = segments.get(cls, 0) + 1

        pipeline = l.get("source", "unknown")
        if pipeline not in by_pipeline:
            by_pipeline[pipeline] = {"total": 0}
        by_pipeline[pipeline]["total"] += 1
        by_pipeline[pipeline][cls] = by_pipeline[pipeline].get(cls, 0) + 1

    return {
        "total": len(leads),
        "segments": segments,
        "by_pipeline": by_pipeline,
    }


@router.post("/analyze-vacuum")
async def analyze_vacuum():
    """Use Anna to analyze vacuum leads and generate action plans."""
    from services.supabase_client import get_supabase
    from services.llm_router import llm_router
    sb = get_supabase()

    # Get vacuum + stale leads
    data = sb.table("crm_leads").select("*").in_("classification", ["vacuum", "stale"]).limit(50).execute()
    leads = data.data or []

    if not leads:
        return {"status": "ok", "message": "No vacuum leads found", "actions": []}

    # Build summary for Anna
    lead_summaries = []
    for l in leads:
        meta = l.get("metadata", {})
        lead_summaries.append(
            f"- {l.get('client_name','?')} | Pipeline: {meta.get('pipeline','?')} | "
            f"Status: {meta.get('status','?')} | Dias sem contato: {meta.get('days_since_update','?')} | "
            f"Flags: {', '.join(meta.get('flags',[])) or 'nenhuma'}"
        )

    prompt = f"""Voce e Anna, especialista em vendas consultivas da Doctor Auto Prime.
Analise esses {len(leads)} leads em VACUO ou ABANDONADOS e crie um plano de acao.

LEADS:
{chr(10).join(lead_summaries)}

Para cada grupo, defina:
1. ACAO RECOMENDADA (reativacao, follow-up, descarte, campanha especifica)
2. MENSAGEM SUGERIDA (texto WhatsApp curto e humanizado)
3. PRIORIDADE (alta, media, baixa)
4. TIMING (imediato, esta semana, proximo mes)

Agrupe por tipo de acao. Seja direto e pratico. Foco em conversao.
Responda em JSON valido com a estrutura:
{{"actions": [{{"group": "nome", "count": N, "action": "tipo", "priority": "alta|media|baixa", "timing": "quando", "message_template": "texto whatsapp", "reasoning": "por que"}}]}}"""

    try:
        raw = await llm_router.chat(
            provider="openai",
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2048,
        )
        import json
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        actions = json.loads(cleaned)
    except Exception as e:
        actions = {"error": str(e), "raw": raw[:500] if 'raw' in dir() else ""}

    return {
        "status": "ok",
        "total_analyzed": len(leads),
        "actions": actions,
    }


@router.post("/generate-campaigns")
async def generate_campaigns():
    """Generate marketing campaign ideas from lead segments."""
    from services.supabase_client import get_supabase
    from services.llm_router import llm_router
    sb = get_supabase()

    # Get segment stats
    data = sb.table("crm_leads").select("classification, source, score, metadata").execute()
    leads = data.data or []

    segments = {}
    for l in leads:
        cls = l.get("classification", "unknown")
        pipeline = l.get("source", "unknown")
        key = f"{pipeline}_{cls}"
        if key not in segments:
            segments[key] = {"pipeline": pipeline, "classification": cls, "count": 0, "avg_score": 0, "total_score": 0}
        segments[key]["count"] += 1
        segments[key]["total_score"] += l.get("score", 0)

    for s in segments.values():
        s["avg_score"] = round(s["total_score"] / max(s["count"], 1))
        del s["total_score"]

    segment_summary = "\n".join(
        f"- {s['pipeline']} | {s['classification']} | {s['count']} leads | score medio: {s['avg_score']}"
        for s in sorted(segments.values(), key=lambda x: x["count"], reverse=True)
    )

    prompt = f"""Voce e Anna, especialista em vendas consultivas da Doctor Auto Prime (oficina automotiva premium).
Analise esses segmentos de leads e crie 5 campanhas de marketing PRATICAS para comecar amanha.

SEGMENTOS:
{segment_summary}

Total: {len(leads)} leads

Para cada campanha, defina:
1. NOME da campanha
2. SEGMENTO ALVO (qual pipeline + classificacao)
3. CANAL (WhatsApp, Instagram, Email)
4. MENSAGEM (texto pronto pra usar)
5. TIMING (quando disparar)
6. META (resultado esperado)
7. PRIORIDADE (1-5, sendo 1 mais urgente)

Foco em: reativacao de vacuos, conversao de novos, reaquecimento de stale.
Seja pratico — textos prontos pra copiar e disparar.
Responda em JSON: {{"campaigns": [...]}}"""

    try:
        raw = await llm_router.chat(
            provider="openai",
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=3000,
        )
        import json
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        campaigns = json.loads(cleaned)
    except Exception as e:
        campaigns = {"error": str(e)}

    return {
        "status": "ok",
        "total_leads": len(leads),
        "segments_analyzed": len(segments),
        "campaigns": campaigns,
    }
