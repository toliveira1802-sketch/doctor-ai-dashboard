import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";
import { validate } from "../middleware/validate.js";
import { thalesChatSchema, thalesSyncSchema, thalesSearchSchema } from "../schemas/index.js";

const router = Router();

// POST /api/thales/chat
router.post("/chat", validate(thalesChatSchema), async (req, res) => {
  try {
    const result = await callPython("/thales/process", "POST", {
      action: "chat",
      ...req.body,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/thales/sync
router.post("/sync", validate(thalesSyncSchema), async (req, res) => {
  try {
    const result = await callPython("/thales/process", "POST", {
      action: "sync",
      ...req.body,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/thales/status
router.get("/status", async (_req, res) => {
  try {
    const result = await callPython("/thales/process", "POST", {
      action: "status",
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/thales/search
router.post("/search", validate(thalesSearchSchema), async (req, res) => {
  try {
    const result = await callPython("/thales/process", "POST", {
      action: "search",
      ...req.body,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
