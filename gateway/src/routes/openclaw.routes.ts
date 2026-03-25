import { Router } from "express";

const router = Router();

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://127.0.0.1:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || "";

// POST /api/openclaw/chat - Send message to OpenClaw agent
router.post("/chat", async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (!OPENCLAW_TOKEN) {
      res.status(500).json({ error: "OPENCLAW_TOKEN not configured" });
      return;
    }

    const resp = await fetch(`${OPENCLAW_URL}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({
        message,
        session_id: session_id || "dashboard-hub",
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenClaw ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    res.json({
      message: data.response || data.message || data.text || JSON.stringify(data),
      session_id: data.session_id || session_id || "dashboard-hub",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/openclaw/status - Check OpenClaw health
router.get("/status", async (_req, res) => {
  try {
    const resp = await fetch(`${OPENCLAW_URL}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });

    if (resp.ok) {
      res.json({ status: "online", url: OPENCLAW_URL });
    } else {
      res.json({ status: "unhealthy", code: resp.status });
    }
  } catch {
    res.json({ status: "offline" });
  }
});

// POST /api/openclaw/command - Send slash commands to OpenClaw
router.post("/command", async (req, res) => {
  try {
    const { command } = req.body;

    const resp = await fetch(`${OPENCLAW_URL}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({
        message: command,
        session_id: "dashboard-admin",
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenClaw ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
