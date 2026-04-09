import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";
import { validate } from "../middleware/validate.js";
import { ingestURLSchema, ingestTextSchema, ingestPerplexitySchema } from "../schemas/index.js";

const router = Router();

const PYTHON_URL = process.env.PYTHON_SERVICE_URL ?? "http://127.0.0.1:8006";

// POST /api/ingest/file - Upload file (proxy multipart to Python)
router.post("/file", async (req, res) => {
  try {
    // Forward raw request to Python as multipart
    const contentType = req.headers["content-type"] || "";
    const resp = await fetch(`${PYTHON_URL}/rag/ingest`, {
      method: "POST",
      headers: { "content-type": contentType },
      body: req.body,
      // @ts-ignore - duplex needed for streaming
      duplex: "half",
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.status(resp.status).json({ error: text });
      return;
    }

    const data = await resp.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ingest/url - Ingest from URL
router.post("/url", validate(ingestURLSchema), async (req, res) => {
  try {
    const result = await callPython("/rag/ingest-url", "POST", req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ingest/text - Ingest raw text
router.post("/text", validate(ingestTextSchema), async (req, res) => {
  try {
    const { title, text, target_rag, target_collection } = req.body;

    // Create a form-like payload for the Python endpoint
    const formData = new FormData();
    const blob = new Blob([text], { type: "text/plain" });
    formData.append("file", blob, `${title || "text"}.txt`);
    formData.append("title", title || "Texto sem título");
    formData.append("source_type", "text");
    formData.append("target_rag", target_rag || "study");
    formData.append("target_collection", target_collection || "study_car_manuals");

    const resp = await fetch(`${PYTHON_URL}/rag/ingest`, {
      method: "POST",
      body: formData,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Python ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ingest/perplexity - Research via Perplexity
router.post("/perplexity", validate(ingestPerplexitySchema), async (req, res) => {
  try {
    const result = await callPython("/rag/ingest-perplexity", "POST", req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ingest/collections - List RAG collections
router.get("/collections", async (_req, res) => {
  try {
    const result = await callPython("/rag/collections", "GET");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ingest/history - Get ingestion history from Supabase
router.get("/history", async (_req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");
    const { data, error } = await supabase
      .from("rag_documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
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
