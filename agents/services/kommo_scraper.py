"""Kommo CRM Scraper — pulls all leads, contacts, and conversations for analysis."""

import time
from datetime import datetime, timezone

import httpx

from config.settings import settings


class KommoScraper:
    """Scrapes Kommo CRM via API v4."""

    def __init__(self):
        self.domain = (settings.kommo_domain or "").replace("https://", "").replace("http://", "").strip("/")
        self.token = settings.kommo_token or ""
        self.base_url = f"https://{self.domain}/api/v4"
        self.headers = {"Authorization": f"Bearer {self.token}"}

    async def _get(self, path: str, params: dict = None) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self.base_url}{path}", headers=self.headers, params=params)
            if resp.status_code == 204:
                return {"_embedded": {}}
            resp.raise_for_status()
            return resp.json()

    async def get_all_leads(self, limit: int = 250) -> list[dict]:
        """Pull ALL leads from Kommo, paginated."""
        all_leads = []
        page = 1
        while True:
            data = await self._get("/leads", {"limit": limit, "page": page, "with": "contacts"})
            leads = data.get("_embedded", {}).get("leads", [])
            if not leads:
                break
            all_leads.extend(leads)
            if not data.get("_links", {}).get("next"):
                break
            page += 1
            time.sleep(0.3)  # Rate limit
        return all_leads

    async def get_contact(self, contact_id: int) -> dict:
        """Get contact details."""
        try:
            data = await self._get(f"/contacts/{contact_id}", {"with": "leads"})
            return data
        except Exception:
            return {}

    async def get_lead_notes(self, lead_id: int) -> list[dict]:
        """Get notes/messages for a lead."""
        try:
            data = await self._get(f"/leads/{lead_id}/notes")
            return data.get("_embedded", {}).get("notes", [])
        except Exception:
            return []

    async def get_pipelines(self) -> list[dict]:
        """Get all pipelines and statuses."""
        data = await self._get("/leads/pipelines")
        return data.get("_embedded", {}).get("pipelines", [])

    def map_lead(self, lead: dict, pipelines_map: dict, now: datetime) -> dict:
        """Map a Kommo lead to our CRM format with computed fields."""
        lead_id = lead.get("id")
        pipeline_id = lead.get("pipeline_id")
        status_id = lead.get("status_id")
        created_ts = lead.get("created_at", 0)
        updated_ts = lead.get("updated_at", 0)

        created_at = datetime.fromtimestamp(created_ts, tz=timezone.utc) if created_ts else now
        updated_at = datetime.fromtimestamp(updated_ts, tz=timezone.utc) if updated_ts else now

        days_since_update = (now - updated_at).days
        days_since_creation = (now - created_at).days

        # Get pipeline/status names
        pipeline_info = pipelines_map.get(pipeline_id, {})
        pipeline_name = pipeline_info.get("name", "unknown")
        status_name = pipeline_info.get("statuses", {}).get(status_id, "unknown")

        # Extract contact info
        contacts = lead.get("_embedded", {}).get("contacts", [])
        main_contact_id = None
        for c in contacts:
            if c.get("is_main"):
                main_contact_id = c.get("id")
                break
        if not main_contact_id and contacts:
            main_contact_id = contacts[0].get("id")

        # Extract custom fields
        custom_fields = {}
        for cf in (lead.get("custom_fields_values") or []):
            field_name = cf.get("field_name", cf.get("field_code", ""))
            values = cf.get("values", [])
            if values:
                custom_fields[field_name] = values[0].get("value", "")

        # Auto-classify by rules (no LLM needed)
        is_closed_won = status_id == 142
        is_closed_lost = status_id == 143
        is_vacuum = days_since_update > 7 and not is_closed_won and not is_closed_lost
        is_stale = days_since_update > 30 and not is_closed_won and not is_closed_lost
        is_recent = days_since_creation < 3

        # Classification heuristic
        if is_closed_won:
            classification = "won"
            score = 100
        elif is_closed_lost:
            classification = "lost"
            score = 0
        elif is_stale:
            classification = "stale"
            score = 10
        elif is_vacuum:
            classification = "vacuum"
            score = 30
        elif is_recent:
            classification = "new"
            score = 50
        else:
            classification = "active"
            score = 60

        # Flags for action
        flags = []
        if is_vacuum:
            flags.append("VACUO")
        if is_stale:
            flags.append("ABANDONADO")
        if is_recent and not is_closed_won:
            flags.append("NOVO")
        if days_since_update <= 1 and not is_closed_won:
            flags.append("ATIVO_HOJE")

        return {
            "kommo_lead_id": lead_id,
            "name": lead.get("name", ""),
            "price": lead.get("price", 0),
            "pipeline": pipeline_name,
            "pipeline_id": pipeline_id,
            "status": status_name,
            "status_id": status_id,
            "contact_id": main_contact_id,
            "custom_fields": custom_fields,
            "classification": classification,
            "score": score,
            "flags": flags,
            "days_since_update": days_since_update,
            "days_since_creation": days_since_creation,
            "is_vacuum": is_vacuum,
            "is_stale": is_stale,
            "created_at": created_at.isoformat(),
            "updated_at": updated_at.isoformat(),
        }

    async def scrape_and_map(self) -> dict:
        """Full scrape: pull all leads, map, segment, and generate stats."""
        now = datetime.now(timezone.utc)

        # Get pipelines for name mapping
        pipelines_raw = await self.get_pipelines()
        pipelines_map = {}
        for p in pipelines_raw:
            statuses = {}
            for s in p.get("_embedded", {}).get("statuses", []):
                statuses[s["id"]] = s["name"]
            pipelines_map[p["id"]] = {"name": p["name"], "statuses": statuses}

        # Pull all leads
        raw_leads = await self.get_all_leads()

        # Map all leads
        mapped = [self.map_lead(lead, pipelines_map, now) for lead in raw_leads]

        # Segments
        segments = {
            "vacuum": [l for l in mapped if l["is_vacuum"] and not l["is_stale"]],
            "stale": [l for l in mapped if l["is_stale"]],
            "new": [l for l in mapped if l["classification"] == "new"],
            "active": [l for l in mapped if l["classification"] == "active"],
            "won": [l for l in mapped if l["classification"] == "won"],
            "lost": [l for l in mapped if l["classification"] == "lost"],
        }

        # Stats by pipeline
        by_pipeline = {}
        for l in mapped:
            p = l["pipeline"]
            if p not in by_pipeline:
                by_pipeline[p] = {"total": 0, "vacuum": 0, "stale": 0, "won": 0, "lost": 0, "active": 0}
            by_pipeline[p]["total"] += 1
            by_pipeline[p][l["classification"]] = by_pipeline[p].get(l["classification"], 0) + 1

        return {
            "total_leads": len(mapped),
            "segments": {k: len(v) for k, v in segments.items()},
            "by_pipeline": by_pipeline,
            "action_needed": {
                "vacuum_leads": len(segments["vacuum"]),
                "stale_leads": len(segments["stale"]),
                "new_leads": len(segments["new"]),
            },
            "leads": mapped,
            "vacuum_sample": segments["vacuum"][:20],
            "stale_sample": segments["stale"][:20],
            "new_sample": segments["new"][:20],
            "scraped_at": now.isoformat(),
        }


kommo_scraper = KommoScraper()
