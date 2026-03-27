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

// GET /api/dashboard/activity - Real activity stream from webhook_logs + ai_conversations
router.get("/activity", async (req, res) => {
  try {
    const { supabase } = await import("../services/supabase.js");
    const limit = parseInt(req.query.limit as string) || 20;

    // Fetch recent webhook logs and conversations in parallel
    const [webhookRes, conversationRes] = await Promise.all([
      supabase
        .from("webhook_logs")
        .select("id, source, status, payload, result, error_msg, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("ai_conversations")
        .select("id, agent_name, status, classification, channel, summary, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit),
    ]);

    const activities: Array<{
      id: string;
      time: string;
      agent: string;
      msg: string;
      type: string;
      color: string;
      source: string;
    }> = [];

    const AGENT_COLORS: Record<string, string> = {
      ana: "#ec4899",
      sofia: "#a855f7",
      sophia: "#f59e0b",
      simone: "#06b6d4",
      insights: "#3b82f6",
      thales: "#00ffff",
      system: "#6b7280",
    };

    // Parse webhook logs into activity entries
    for (const log of webhookRes.data || []) {
      const time = new Date(log.created_at);
      const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      let agent = "system";
      let msg = "";

      if (log.source === "kommo") {
        agent = "ana";
        const reply = log.result?.reply || "";
        const clientId = log.payload?.clientId || "";
        const classification = log.result?.classification || "";
        if (classification) {
          msg = `Lead classificado: ${clientId} → ${String(classification).toUpperCase()}`;
        } else if (reply) {
          msg = `Resposta enviada: "${String(reply).substring(0, 60)}${reply.length > 60 ? "..." : ""}"`;
        } else if (log.status === "skipped") {
          msg = `Webhook recebido (sem mensagem)`;
        } else {
          msg = `Webhook Kommo processado — ${log.status}`;
        }
      } else if (log.source === "anna_sales_ops") {
        agent = "ana";
        const stage = log.payload?.stage || "";
        msg = `Sales ops: ${stage || "ação registrada"}`;
      } else if (log.source === "evolution") {
        agent = "thales";
        msg = `WhatsApp: ${log.status === "ok" ? "mensagem processada" : log.error_msg || log.status}`;
      } else {
        msg = `${log.source}: ${log.status}${log.error_msg ? ` — ${log.error_msg.substring(0, 50)}` : ""}`;
      }

      activities.push({
        id: `wh_${log.id}`,
        time: timeStr,
        agent,
        msg,
        type: log.status === "error" ? "error" : "webhook",
        color: AGENT_COLORS[agent] || AGENT_COLORS.system,
        source: log.source,
      });
    }

    // Parse conversations into activity entries
    for (const conv of conversationRes.data || []) {
      const time = new Date(conv.updated_at || conv.created_at);
      const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const agent = conv.agent_name || "sofia";
      const classification = conv.classification ? ` [${conv.classification}]` : "";
      const channel = conv.channel ? ` via ${conv.channel}` : "";
      const msg = conv.summary
        ? `${conv.summary.substring(0, 80)}${classification}`
        : `Conversa ${conv.status || "ativa"}${channel}${classification}`;

      activities.push({
        id: `conv_${conv.id}`,
        time: timeStr,
        agent,
        msg,
        type: "conversation",
        color: AGENT_COLORS[agent] || AGENT_COLORS.system,
        source: "conversation",
      });
    }

    // Sort by time (most recent first) and limit
    activities.sort((a, b) => {
      // Since we have formatted times, use original data ordering
      return 0; // Already ordered from DB
    });

    res.json({ activities: activities.slice(0, limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
