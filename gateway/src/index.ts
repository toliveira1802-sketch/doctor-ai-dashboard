import express from "express";
import cors from "cors";

import chatRoutes from "./routes/chat.routes.js";
import sofiaRoutes from "./routes/sofia.routes.js";
import insightsRoutes from "./routes/insights.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import ragRoutes from "./routes/rag.routes.js";
import thalesRoutes from "./routes/thales.routes.js";
import evolutionRoutes from "./routes/evolution.routes.js";
import obsidianRoutes from "./routes/obsidian.routes.js";
import kommoSyncRoutes from "./routes/kommo-sync.routes.js";
import kimiRoutes from "./routes/kimi.routes.js";

const app = express();
const PORT = parseInt(process.env.GATEWAY_PORT || "3001");
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

// Middleware
app.use(cors());

// Raw body for file upload proxy (must be before json parser)
app.use("/api/ingest/file", express.raw({ type: "multipart/form-data", limit: "50mb" }));

app.use(express.json({ limit: "10mb" }));

// Health check (expanded)
app.get("/api/health", async (_req, res) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {};

  // Check Python agents
  try {
    const t0 = Date.now();
    const resp = await fetch(`${PYTHON_URL}/health`, { signal: AbortSignal.timeout(5000) });
    checks.python = { ...(await resp.json()), response_ms: Date.now() - t0 };
  } catch {
    checks.python = { status: "unreachable" };
  }

  // Check Supabase
  try {
    const t0 = Date.now();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const resp = await fetch(`${supabaseUrl}/rest/v1/ai_agent_config?select=agent_name&limit=1`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(5000),
      });
      checks.supabase = { status: resp.ok ? "healthy" : "error", response_ms: Date.now() - t0 };
    } else {
      checks.supabase = { status: "not_configured" };
    }
  } catch {
    checks.supabase = { status: "unreachable" };
  }

  // Webhooks status
  checks.webhooks = {
    kommo: { configured: !!process.env.KOMMO_TOKEN && !!process.env.KOMMO_DOMAIN },
  };

  const overallStatus =
    checks.python?.status === "unreachable" ? "degraded" :
    checks.supabase?.status === "unreachable" ? "degraded" : "healthy";

  res.json({
    status: overallStatus,
    service: "doctor-auto-gateway",
    version: "0.2.0",
    environment: process.env.NODE_ENV || "development",
    uptime_s: Math.floor(process.uptime()),
    response_ms: Date.now() - startTime,
    checks,
  });
});

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/sofia", sofiaRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/thales", thalesRoutes);
app.use("/api/evolution", evolutionRoutes);
app.use("/api/obsidian", obsidianRoutes);
app.use("/api/kommo-sync", kommoSyncRoutes);
app.use("/api/kimi", kimiRoutes);

// Start
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  console.log(`Python service: ${PYTHON_URL}`);
});
