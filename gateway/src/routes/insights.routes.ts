import { Router } from "express";
import { callPython } from "../services/pythonBridge.js";
import { validate } from "../middleware/validate.js";
import { insightsAnalyzeSchema, blogGenerateSchema } from "../schemas/index.js";

const router = Router();

// POST /api/insights/analyze - Generate client insights
router.post("/analyze", validate(insightsAnalyzeSchema), async (req, res) => {
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

// POST /api/insights/patterns - Detect lead patterns
router.post("/patterns", async (req, res) => {
  try {
    const result = await callPython("/agent/insights/patterns", "POST", req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/insights/blog/generate - Generate blog post
router.post("/blog/generate", validate(blogGenerateSchema), async (req, res) => {
  try {
    const result = await callPython(
      "/agent/insights/blog/generate",
      "POST",
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/insights/blog/auto - Auto-generate from latest news
router.post("/blog/auto", async (req, res) => {
  try {
    const result = await callPython("/agent/insights/blog/auto", "POST", {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
