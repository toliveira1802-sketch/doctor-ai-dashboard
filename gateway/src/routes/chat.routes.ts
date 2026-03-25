import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// POST /api/chat/message - Send message to Ana
router.post("/message", async (req, res) => {
  try {
    const result = await callPython("/agent/ana/chat", "POST", req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chat/conversations/:id - Get conversation history
router.get("/conversations/:id", async (req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", req.params.id)
      .order("created_at");

    if (error) throw error;
    res.json({ messages: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
