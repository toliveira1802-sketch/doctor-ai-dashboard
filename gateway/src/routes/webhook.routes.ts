import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// POST /api/webhook/come - Receive client from Come App
router.post("/come", async (req, res) => {
  try {
    const { client_id, message, channel, metadata } = req.body;

    // Forward to Ana via Python service
    const result = await callPython("/agent/ana/chat", "POST", {
      message,
      external_client_id: client_id,
      channel: channel || "come_app",
      metadata: metadata || {},
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
