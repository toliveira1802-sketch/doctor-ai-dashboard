import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// POST /api/ingest/url - Ingest from URL
router.post("/url", async (req, res) => {
  try {
    const result = await callPython("/rag/ingest-url", "POST", req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ingest/status/:id - Check ingestion status
router.get("/status/:id", async (req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");
    const { data, error } = await supabase
      .from("rag_documents")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
