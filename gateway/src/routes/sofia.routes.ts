import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";
import { validate } from "../middleware/validate.js";
import { sofiaCommandSchema } from "../schemas/index.js";

const router = Router();

// POST /api/sofia/command - Send command to Sofia
router.post("/command", validate(sofiaCommandSchema), async (req, res) => {
  try {
    const result = await callPython(
      "/agent/sofia/orchestrate",
      "POST",
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sofia/status - Get system status
router.get("/status", async (req, res) => {
  try {
    const result = await callPython("/agent/sofia/orchestrate", "POST", {
      action: "status",
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
