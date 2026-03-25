import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// GET /api/dashboard/metrics - System metrics
router.get("/metrics", async (req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");

    const [conversations, leads, collections] = await Promise.all([
      supabase
        .from("ai_conversations")
        .select("id, status, classification", { count: "exact" }),
      supabase.from("crm_leads").select("id, classification, score", {
        count: "exact",
      }),
      callPython("/rag/collections", "GET"),
    ]);

    res.json({
      conversations: {
        total: conversations.count || 0,
        active: conversations.data?.filter((c) => c.status === "active")
          .length,
      },
      leads: {
        total: leads.count || 0,
        hot: leads.data?.filter((l) => l.classification === "hot").length,
        warm: leads.data?.filter((l) => l.classification === "warm").length,
        cold: leads.data?.filter((l) => l.classification === "cold").length,
      },
      rag: collections,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
