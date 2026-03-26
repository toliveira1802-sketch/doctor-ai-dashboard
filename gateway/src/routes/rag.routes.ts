import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// POST /api/rag/query - Search RAG collections
router.post("/query", async (req, res) => {
  try {
    const result = await callPython("/rag/query", "POST", req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rag/collections - List collections with stats
router.get("/collections", async (req, res) => {
  try {
    const result = await callPython("/rag/collections", "GET");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
