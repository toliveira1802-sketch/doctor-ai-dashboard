import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

// POST /api/insights/analyze - Generate client insights
router.post("/analyze", async (req, res) => {
  try {
    const result = await callPython(
      "/agent/insights/analyze",
      "POST",
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
