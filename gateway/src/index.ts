import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";

import chatRoutes from "./routes/chat.routes.js";
import sofiaRoutes from "./routes/sofia.routes.js";
import insightsRoutes from "./routes/insights.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    const pythonHealth = await fetch(
      `${config.pythonServiceUrl}/health`
    ).then((r) => r.json());
    res.json({
      status: "healthy",
      service: "doctor-auto-gateway",
      python: pythonHealth,
    });
  } catch {
    res.json({
      status: "degraded",
      service: "doctor-auto-gateway",
      python: { status: "unreachable" },
    });
  }
});

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/sofia", sofiaRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webhook", webhookRoutes);

// Start
app.listen(config.port, () => {
  console.log(`Gateway running on port ${config.port}`);
  console.log(`Python service: ${config.pythonServiceUrl}`);
});
