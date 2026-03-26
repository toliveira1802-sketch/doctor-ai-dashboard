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
        active: conversations.data?.filter((c: any) => c.status === "active")
          .length,
      },
      leads: {
        total: leads.count || 0,
        hot: leads.data?.filter((l: any) => l.classification === "hot").length,
        warm: leads.data?.filter((l: any) => l.classification === "warm").length,
        cold: leads.data?.filter((l: any) => l.classification === "cold").length,
      },
      rag: collections,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/leads - List leads
router.get("/leads", async (req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");
    const limit = parseInt(req.query.limit as string) || 50;

    const { data, error, count } = await supabase
      .from("crm_leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ leads: data || [], total: count || 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/leads/:id - Lead details
router.get("/leads/:id", async (req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");

    const [lead, messages] = await Promise.all([
      supabase.from("crm_leads").select("*").eq("id", req.params.id).single(),
      supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", req.params.id)
        .order("created_at", { ascending: true }),
    ]);

    if (lead.error) throw lead.error;
    res.json({ lead: lead.data, messages: messages.data || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/lead-stats - Lead classification stats
router.get("/lead-stats", async (req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");

    const { data, error } = await supabase
      .from("crm_leads")
      .select("classification, score, channel, created_at");

    if (error) throw error;

    const leads = data || [];
    const now = new Date();
    const today = leads.filter(
      (l: any) =>
        new Date(l.created_at).toDateString() === now.toDateString()
    );
    const thisWeek = leads.filter(
      (l: any) =>
        now.getTime() - new Date(l.created_at).getTime() < 7 * 86400000
    );

    res.json({
      total: leads.length,
      today: today.length,
      this_week: thisWeek.length,
      by_classification: {
        hot: leads.filter((l: any) => l.classification === "hot").length,
        warm: leads.filter((l: any) => l.classification === "warm").length,
        cold: leads.filter((l: any) => l.classification === "cold").length,
      },
      by_channel: {
        come_app: leads.filter((l: any) => l.channel === "come_app").length,
        whatsapp: leads.filter((l: any) => l.channel === "whatsapp").length,
        dashboard: leads.filter((l: any) => l.channel === "dashboard").length,
      },
      avg_score: leads.length
        ? Math.round(
            leads.reduce((sum: number, l: any) => sum + (l.score || 0), 0) /
              leads.length
          )
        : 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/logs - Webhook logs
router.get("/logs", async (req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");
    const limit = parseInt(req.query.limit as string) || 50;

    const { data, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
