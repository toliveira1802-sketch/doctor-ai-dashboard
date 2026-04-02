"""Kimi — Gestor de CRM Inteligente. Puxa, enriquece e prioriza leads do Kommo."""

import json

from agents.base import BaseAgent
from services.kommo_scraper import kommo_scraper
from services.llm_router import llm_router


class KimiAgent(BaseAgent):
    """Kimi — CRM brain that pulls leads from Kommo, enriches, classifies, and prioritizes."""

    def __init__(self):
        super().__init__("kimi.yaml")

    async def process(self, input_data: dict) -> dict:
        """Route to the appropriate action."""
        action = input_data.get("action", "sync")

        if action == "sync":
            return await self.sync_leads(limit=input_data.get("limit", 50), enrich=input_data.get("enrich", False))
        elif action == "prioritize":
            return await self.prioritize_leads(input_data.get("limit", 30))
        elif action == "enrich":
            return await self.enrich_lead(input_data.get("lead_id"))
        elif action == "briefing":
            return await self.generate_briefing_for_anna()
        elif action == "health":
            return await self.funnel_health()
        else:
            return {"error": f"Unknown action: {action}"}

    async def sync_leads(self, limit: int = 50, enrich: bool = False) -> dict:
        """Scrape from Kommo + save to Supabase. limit controls how many leads, enrich=False skips contact API calls."""
        result = await kommo_scraper.scrape_and_map()

        # Save to Supabase
        from services.supabase_client import get_supabase
        sb = get_supabase()

        # Respect limit — take first N leads (already has all segments calculated)
        leads_to_save = result["leads"][:limit] if limit else result["leads"]

        saved = 0
        enriched = 0
        for lead in leads_to_save:
            try:
                # Enrich high-priority leads with contact details (only if enrich=True)
                contact_data = {}
                if enrich and lead["classification"] in ("new", "vacuum", "active") and lead.get("contact_id"):
                    try:
                        contact = await kommo_scraper.get_contact(lead["contact_id"])
                        if contact:
                            contact_data = self._extract_contact_info(contact)
                            enriched += 1
                    except Exception:
                        pass

                # Detect hot leads via heuristics
                flags = list(lead["flags"])
                if self._is_hot_lead(lead):
                    flags.append("QUENTE")
                if lead["classification"] in ("new", "vacuum") and lead["days_since_update"] <= 3:
                    flags.append("FOLLOW_UP")

                sb.table("crm_leads").upsert({
                    "external_client_id": str(lead["kommo_lead_id"]),
                    "client_name": lead["name"],
                    "classification": lead["classification"],
                    "score": lead["score"],
                    "channel": "kommo",
                    "source": lead["pipeline"],
                    "reasoning": ", ".join(flags) if flags else lead["status"],
                    "metadata": {
                        "pipeline": lead["pipeline"],
                        "status": lead["status"],
                        "kommo_lead_id": lead["kommo_lead_id"],
                        "contact_id": lead["contact_id"],
                        "custom_fields": lead["custom_fields"],
                        "days_since_update": lead["days_since_update"],
                        "days_since_creation": lead["days_since_creation"],
                        "flags": flags,
                        "contact": contact_data,
                        "score": lead["score"],
                    },
                }, on_conflict="external_client_id").execute()
                saved += 1
            except Exception:
                pass

        return {
            "status": "ok",
            "agent": "kimi",
            "total_scraped": result["total_leads"],
            "saved": saved,
            "enriched": enriched,
            "segments": result["segments"],
            "by_pipeline": result["by_pipeline"],
            "action_needed": result["action_needed"],
            "vacuum_sample": result["vacuum_sample"][:10],
            "stale_sample": result["stale_sample"][:10],
            "new_sample": result["new_sample"][:10],
            "scraped_at": result["scraped_at"],
        }

    async def prioritize_leads(self, limit: int = 30) -> dict:
        """Get prioritized lead queue — sorted by urgency and conversion potential."""
        from services.supabase_client import get_supabase
        sb = get_supabase()

        # Pull actionable leads (not won/lost)
        data = sb.table("crm_leads").select("*").not_.in_(
            "classification", ["won", "lost"]
        ).order("score", desc=False).limit(200).execute()
        leads = data.data or []

        # Score and sort by priority
        prioritized = []
        for lead in leads:
            meta = lead.get("metadata", {})
            flags = meta.get("flags", [])
            days = meta.get("days_since_update", 999)
            cls = lead.get("classification", "unknown")

            # Priority score (lower = more urgent)
            priority = 50
            if cls == "new" and days <= 1:
                priority = 1  # Brand new — act NOW
            elif cls == "new":
                priority = 5  # New but not today
            elif "QUENTE" in flags:
                priority = 3  # Hot lead
            elif cls == "vacuum" and days <= 14:
                priority = 10  # Recoverable vacuum
            elif cls == "vacuum":
                priority = 20  # Older vacuum
            elif cls == "stale" and days <= 45:
                priority = 25  # Recently stale
            elif cls == "stale":
                priority = 35  # Long stale
            elif cls == "active":
                priority = 40  # Keep momentum

            prioritized.append({
                "id": lead.get("id"),
                "external_id": lead.get("external_client_id"),
                "name": lead.get("client_name", "?"),
                "classification": cls,
                "score": lead.get("score"),
                "priority": priority,
                "days_since_update": days,
                "pipeline": meta.get("pipeline", "?"),
                "status": meta.get("status", "?"),
                "flags": flags,
                "contact": meta.get("contact", {}),
                "recommended_action": self._recommend_action(cls, flags, days),
            })

        prioritized.sort(key=lambda x: x["priority"])
        queue = prioritized[:limit]

        return {
            "status": "ok",
            "agent": "kimi",
            "total_actionable": len(prioritized),
            "queue_size": len(queue),
            "queue": queue,
            "summary": {
                "urgent": len([l for l in queue if l["priority"] <= 5]),
                "hot": len([l for l in queue if l["priority"] <= 10]),
                "recoverable": len([l for l in queue if 10 < l["priority"] <= 25]),
                "maintenance": len([l for l in queue if l["priority"] > 25]),
            },
        }

    async def enrich_lead(self, lead_id: int | str | None) -> dict:
        """Enrich a specific lead with contact details and notes from Kommo."""
        if not lead_id:
            return {"error": "lead_id required"}

        from services.supabase_client import get_supabase
        sb = get_supabase()

        # Get lead from Supabase
        data = sb.table("crm_leads").select("*").eq(
            "external_client_id", str(lead_id)
        ).limit(1).execute()

        if not data.data:
            return {"error": f"Lead {lead_id} not found"}

        lead = data.data[0]
        meta = lead.get("metadata", {})
        kommo_id = int(meta.get("kommo_lead_id", lead_id))

        # Pull fresh data from Kommo
        contact_data = {}
        notes = []
        if meta.get("contact_id"):
            try:
                contact = await kommo_scraper.get_contact(meta["contact_id"])
                contact_data = self._extract_contact_info(contact)
            except Exception:
                pass

        try:
            raw_notes = await kommo_scraper.get_lead_notes(kommo_id)
            notes = [
                {
                    "type": n.get("note_type", "unknown"),
                    "text": n.get("params", {}).get("text", ""),
                    "created_at": n.get("created_at"),
                }
                for n in raw_notes[:20]
                if n.get("params", {}).get("text")
            ]
        except Exception:
            pass

        # Update Supabase with enriched data
        enriched_meta = {**meta, "contact": contact_data, "notes": notes, "enriched": True}
        sb.table("crm_leads").update({"metadata": enriched_meta}).eq(
            "external_client_id", str(lead_id)
        ).execute()

        return {
            "status": "ok",
            "agent": "kimi",
            "lead": {
                "id": lead.get("id"),
                "name": lead.get("client_name"),
                "classification": lead.get("classification"),
                "contact": contact_data,
                "notes": notes,
                "flags": meta.get("flags", []),
            },
        }

    async def generate_briefing_for_anna(self) -> dict:
        """Generate a prioritized lead briefing for Anna to work."""
        queue_result = await self.prioritize_leads(limit=15)
        queue = queue_result.get("queue", [])

        if not queue:
            return {"status": "ok", "agent": "kimi", "briefing": "Nenhum lead prioritario no momento.", "leads": []}

        # Build briefing with LLM
        lead_lines = []
        for i, lead in enumerate(queue[:15], 1):
            contact = lead.get("contact", {})
            phone = contact.get("phone", "sem telefone")
            lead_lines.append(
                f"{i}. {lead['name']} | {lead['classification']} | "
                f"Pipeline: {lead['pipeline']} | Status: {lead['status']} | "
                f"Dias parado: {lead['days_since_update']} | "
                f"Flags: {', '.join(lead['flags']) or 'nenhuma'} | "
                f"Tel: {phone} | Acao: {lead['recommended_action']}"
            )

        prompt = f"""Voce e Kimi, gestor de CRM da Doctor Auto Prime.
Monte um briefing CURTO e DIRETO para Anna trabalhar esses {len(queue)} leads priorizados.

LEADS (ja ordenados por prioridade):
{chr(10).join(lead_lines)}

Formato do briefing:
1. RESUMO RAPIDO (1-2 frases do cenario geral)
2. TOP 5 URGENTES (nome + acao especifica + por que e urgente)
3. BLOCO DE REATIVACAO (leads em vacuo/stale agrupados por tipo de abordagem)
4. PROXIMOS PASSOS (o que Anna deve fazer AGORA)

Seja direto, pratico, sem enrolacao. Foco em conversao."""

        try:
            briefing_text = await llm_router.chat(
                provider=self.llm_provider,
                model=self.llm_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1500,
            )
        except Exception as e:
            briefing_text = f"Erro ao gerar briefing: {e}"

        return {
            "status": "ok",
            "agent": "kimi",
            "briefing": briefing_text,
            "leads": queue[:15],
            "summary": queue_result.get("summary", {}),
        }

    async def funnel_health(self) -> dict:
        """Generate a funnel health report with metrics and alerts."""
        from services.supabase_client import get_supabase
        sb = get_supabase()

        data = sb.table("crm_leads").select("classification, score, source, metadata, created_at").execute()
        leads = data.data or []

        if not leads:
            return {"status": "ok", "agent": "kimi", "health": "empty", "message": "Nenhum lead no CRM"}

        # Metrics
        total = len(leads)
        segments = {}
        by_pipeline = {}
        total_score = 0
        alerts = []

        for l in leads:
            cls = l.get("classification", "unknown")
            segments[cls] = segments.get(cls, 0) + 1
            total_score += l.get("score", 0)

            pipeline = l.get("source", "unknown")
            if pipeline not in by_pipeline:
                by_pipeline[pipeline] = {"total": 0}
            by_pipeline[pipeline]["total"] += 1
            by_pipeline[pipeline][cls] = by_pipeline[pipeline].get(cls, 0) + 1

        avg_score = round(total_score / max(total, 1), 1)

        # Alerts
        vacuum_count = segments.get("vacuum", 0)
        stale_count = segments.get("stale", 0)
        new_count = segments.get("new", 0)
        won_count = segments.get("won", 0)
        lost_count = segments.get("lost", 0)

        vacuum_pct = round(vacuum_count / max(total, 1) * 100, 1)
        stale_pct = round(stale_count / max(total, 1) * 100, 1)
        conversion_rate = round(won_count / max(won_count + lost_count, 1) * 100, 1)

        if vacuum_pct > 20:
            alerts.append({"level": "critical", "message": f"{vacuum_pct}% dos leads em vacuo — reativacao urgente"})
        elif vacuum_pct > 10:
            alerts.append({"level": "warning", "message": f"{vacuum_pct}% dos leads em vacuo"})

        if stale_pct > 15:
            alerts.append({"level": "critical", "message": f"{stale_pct}% dos leads abandonados — campanha de recuperacao necessaria"})

        if new_count > 0:
            alerts.append({"level": "info", "message": f"{new_count} leads novos aguardando primeiro contato"})

        if conversion_rate < 20 and (won_count + lost_count) > 10:
            alerts.append({"level": "warning", "message": f"Taxa de conversao em {conversion_rate}% — abaixo do ideal"})

        return {
            "status": "ok",
            "agent": "kimi",
            "total_leads": total,
            "avg_score": avg_score,
            "segments": segments,
            "by_pipeline": by_pipeline,
            "conversion_rate": conversion_rate,
            "alerts": alerts,
            "health": "critical" if any(a["level"] == "critical" for a in alerts) else
                      "warning" if any(a["level"] == "warning" for a in alerts) else "healthy",
        }

    # --- Helpers ---

    def _extract_contact_info(self, contact: dict) -> dict:
        """Extract useful contact info from Kommo contact response."""
        if not contact:
            return {}

        custom_fields = contact.get("custom_fields_values") or []
        phone = ""
        email = ""
        for cf in custom_fields:
            code = cf.get("field_code", "")
            values = cf.get("values", [])
            if code == "PHONE" and values:
                phone = values[0].get("value", "")
            elif code == "EMAIL" and values:
                email = values[0].get("value", "")

        return {
            "name": contact.get("name", ""),
            "phone": phone,
            "email": email,
            "contact_id": contact.get("id"),
        }

    def _is_hot_lead(self, lead: dict) -> bool:
        """Detect if a lead is hot based on heuristics."""
        price = lead.get("price", 0) or 0
        days_update = lead.get("days_since_update", 999)
        days_creation = lead.get("days_since_creation", 999)
        cls = lead.get("classification", "")

        # High value + recent activity
        if price > 500000 and days_update <= 3:  # > R$5k (Kommo stores in cents)
            return True
        # New and active within 24h
        if cls == "new" and days_update <= 1:
            return True
        # Active with recent creation (fast mover)
        if cls == "active" and days_creation <= 5 and days_update <= 2:
            return True
        return False

    def _recommend_action(self, classification: str, flags: list, days: int) -> str:
        """Generate a recommended action based on lead state."""
        if classification == "new" and days <= 1:
            return "PRIMEIRO CONTATO IMEDIATO — lead quente, janela curta"
        elif classification == "new":
            return "Primeiro contato — lead novo, nao deixar esfriar"
        elif "QUENTE" in flags:
            return "Follow-up prioritario — lead com alto potencial"
        elif classification == "vacuum" and days <= 14:
            return "Reativacao rapida — perguntar se ainda tem interesse"
        elif classification == "vacuum":
            return "Reativacao com oferta — precisa de gancho novo"
        elif classification == "stale" and days <= 45:
            return "Campanha de recuperacao — mensagem de valor"
        elif classification == "stale":
            return "Ultimo contato — tentar recuperar ou arquivar"
        elif classification == "active":
            return "Manter momentum — follow-up de rotina"
        return "Avaliar manualmente"
