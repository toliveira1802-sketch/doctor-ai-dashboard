import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// POST /api/kommo-sync/scrape - Full scrape of Kommo CRM
router.post("/scrape", async (_req, res) => {
  try {
    const result = await callPython("/kommo/scrape", "POST", {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/kommo-sync/segments - Current segments
router.get("/segments", async (_req, res) => {
  try {
    const result = await callPython("/kommo/segments", "GET");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/kommo-sync/analyze-vacuum - Anna analyzes vacuum leads
router.post("/analyze-vacuum", async (_req, res) => {
  try {
    const result = await callPython("/kommo/analyze-vacuum", "POST", {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/kommo-sync/generate-campaigns - Generate marketing campaigns
router.post("/generate-campaigns", async (_req, res) => {
  try {
    const result = await callPython("/kommo/generate-campaigns", "POST", {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
