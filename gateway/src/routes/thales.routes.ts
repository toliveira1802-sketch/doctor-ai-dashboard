import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// POST /api/thales/sync - Sync vault to RAG
router.post("/sync", async (req, res) => {
  try {
    const result = await callPython("/agent/thales/sync", "POST", req.body || {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/thales/status - Vault sync status
router.get("/status", async (_req, res) => {
  try {
    const result = await callPython("/agent/thales/status", "GET");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/thales/search - Search vault content
router.post("/search", async (req, res) => {
  try {
    const result = await callPython("/agent/thales/search", "POST", req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/thales/chat - Chat with Thales
router.post("/chat", async (req, res) => {
  try {
    const result = await callPython("/agent/thales/chat", "POST", req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
