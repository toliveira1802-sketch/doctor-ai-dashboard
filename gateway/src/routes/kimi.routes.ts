import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// POST /api/kimi/sync - Full Kommo scrape via Kimi agent
router.post("/sync", async (_req, res) => {
  try {
    const result = await callPython("/kimi/sync", "POST", {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/kimi/queue - Prioritized lead queue
router.get("/queue", async (req, res) => {
  try {
    const limit = req.query.limit || 30;
    const result = await callPython(`/kimi/queue?limit=${limit}`, "GET");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/kimi/enrich/:leadId - Enrich a specific lead
router.post("/enrich/:leadId", async (req, res) => {
  try {
    const result = await callPython(`/kimi/enrich/${req.params.leadId}`, "POST", {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/kimi/briefing - Lead briefing for Anna
router.get("/briefing", async (_req, res) => {
  try {
    const result = await callPython("/kimi/briefing", "GET");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/kimi/health - Funnel health report
router.get("/health", async (_req, res) => {
  try {
    const result = await callPython("/kimi/health", "GET");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
