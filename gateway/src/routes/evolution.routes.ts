import { Router, Request, Response } from "express";
import { callPython } from "../services/pythonBridge.js";
import * as whatsappService from "../services/whatsapp.service.js";

const router = Router();

const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || "pitoco-loco";
const ANNA_INSTANCE = "anna-sales";

// --- Instance Management ---

// POST /api/evolution/create-instance — Create WhatsApp instance
router.post("/create-instance", async (_req: Request, res: Response) => {
  try {
    const data = await whatsappService.createInstance(INSTANCE_NAME);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evolution/qrcode — Get QR code to connect
router.get("/qrcode", async (_req: Request, res: Response) => {
  try {
    const data = await whatsappService.getQRCode(INSTANCE_NAME);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evolution/status — Connection status
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const data = await whatsappService.getInstanceStatus(INSTANCE_NAME);
    res.json(data);
  } catch (error: any) {
    res.json({ instance: INSTANCE_NAME, state: "offline", error: error.message });
  }
});

// POST /api/evolution/send — Send message via WhatsApp
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) {
      res.status(400).json({ error: "number and message required" });
      return;
    }
    const data = await whatsappService.sendTextMessage(INSTANCE_NAME, number, message);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Anna Instance Management ---

// POST /api/evolution/anna/create-instance
router.post("/anna/create-instance", async (_req: Request, res: Response) => {
  try {
    const data = await whatsappService.createInstance(ANNA_INSTANCE);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evolution/anna/qrcode
router.get("/anna/qrcode", async (_req: Request, res: Response) => {
  try {
    const data = await whatsappService.getQRCode(ANNA_INSTANCE);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evolution/anna/status
router.get("/anna/status", async (_req: Request, res: Response) => {
  try {
    const data = await whatsappService.getInstanceStatus(ANNA_INSTANCE);
    res.json(data);
  } catch (error: any) {
    res.json({ instance: ANNA_INSTANCE, state: "offline", error: error.message });
  }
});

// --- Webhook (receives messages from WhatsApp) ---

router.post("/webhook", async (req: Request, res: Response) => {
  const payload = req.body;
  const event = payload.event;
  const instanceName = payload.instance || "";

  try {
    // QR code / connection events — just acknowledge
    if (event === "qrcode.updated" || event === "connection.update") {
      console.log(`[Evolution/${instanceName}] ${event}: ${payload.data?.state || "updated"}`);
      res.json({ status: "ok", event });
      return;
    }

    // New message
    if (event === "messages.upsert") {
      const data = payload.data;
      // Handle payload variations (Evolution API v2 can wrap Baileys message)
      const msg = data.messages ? data.messages[0] : data;
      
      if (!msg || msg.key?.fromMe) {
        res.json({ status: "ok", action: "skipped" });
        return;
      }

      const messageText = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || 
                          msg.message?.imageMessage?.caption || 
                          "";

      if (!messageText) {
        res.json({ status: "ok", action: "skipped", reason: "no_text" });
        return;
      }

      const remoteJid = msg.key?.remoteJid || "";
      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const pushName = msg.pushName || "WhatsApp User";

      // Route by instance: anna-sales → Anna agent, pitoco-loco → Pitoco Loco
      const isAnna = instanceName === ANNA_INSTANCE;
      const agentEndpoint = isAnna ? "/agent/ana/chat" : "/agent/thales/chat";
      const agentBody = isAnna
        ? { message: messageText, external_client_id: phone, client_name: pushName, client_phone: phone, channel: "whatsapp_evolution" }
        : { message: messageText, history: [] };
      const replyInstance = isAnna ? ANNA_INSTANCE : (instanceName || INSTANCE_NAME);

      console.log(`[Evolution/${replyInstance}] ${pushName} (${phone}): ${messageText.substring(0, 50)}...`);

      const result = await callPython(agentEndpoint, "POST", agentBody);
      const replyText = result.message || ""; 

      if (replyText) {
        // Send reply back
        try {
          await whatsappService.sendTextMessage(replyInstance, phone, replyText);
          console.log(`[Evolution/${replyInstance}] Reply sent to ${phone}`);
        } catch (sendErr: any) {
          console.error(`[Evolution/${replyInstance}] Send failed: ${sendErr.message}`);
        }
      }

      await whatsappService.logWebhookToSupabase(
        isAnna ? "evolution_anna" : "evolution_pitoco",
        { phone, pushName, message: messageText, instance: instanceName },
        { reply: replyText.substring(0, 500), classification: result.classification }
      );

      res.json({ status: "ok", instance: replyInstance, from: phone, reply_sent: !!replyText });
      return;
    }

    res.json({ status: "ok", event: event || "unknown" });
  } catch (error: any) {
    console.error(`[Evolution] Webhook error for instance ${instanceName}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
