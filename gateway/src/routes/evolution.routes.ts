import { Router, Request, Response } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://evolution:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "pitoco-loco-key";
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || "pitoco-loco";

const evoHeaders = () => ({
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY,
});

// --- Instance Management ---

// POST /api/evolution/create-instance — Create WhatsApp instance
router.post("/create-instance", async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: evoHeaders(),
      body: JSON.stringify({
        instanceName: INSTANCE_NAME,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      }),
    });
    const data = await resp.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evolution/qrcode — Get QR code to connect
router.get("/qrcode", async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(
      `${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`,
      { headers: evoHeaders() }
    );
    const data = await resp.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evolution/status — Connection status
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(
      `${EVOLUTION_URL}/instance/connectionState/${INSTANCE_NAME}`,
      { headers: evoHeaders() }
    );
    const data = await resp.json();
    res.json({ instance: INSTANCE_NAME, ...data });
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

    const resp = await fetch(
      `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`,
      {
        method: "POST",
        headers: evoHeaders(),
        body: JSON.stringify({
          number,
          text: message,
        }),
      }
    );
    const data = await resp.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Webhook (receives messages from WhatsApp) ---

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const event = payload.event;

    // QR code updated — just acknowledge
    if (event === "qrcode.updated") {
      console.log("[Evolution] QR code updated");
      res.json({ status: "ok", event });
      return;
    }

    // Connection update
    if (event === "connection.update") {
      console.log(`[Evolution] Connection: ${payload.data?.state || "unknown"}`);
      res.json({ status: "ok", event });
      return;
    }

    // New message received
    if (event === "messages.upsert") {
      const msg = payload.data;
      if (!msg) {
        res.json({ status: "ok", action: "skipped", reason: "no_data" });
        return;
      }

      // Skip outgoing messages (fromMe)
      if (msg.key?.fromMe) {
        res.json({ status: "ok", action: "skipped", reason: "from_me" });
        return;
      }

      const messageText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";

      if (!messageText) {
        res.json({ status: "ok", action: "skipped", reason: "no_text" });
        return;
      }

      const remoteJid = msg.key?.remoteJid || "";
      // Extract phone number from JID (5511999999999@s.whatsapp.net)
      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const pushName = msg.pushName || "";

      console.log(`[Evolution] Message from ${pushName} (${phone}): ${messageText.substring(0, 50)}...`);

      // Send to Pitoco Loco
      const result = await callPython("/agent/thales/chat", "POST", {
        message: messageText,
        history: [],
      });

      const replyText = result.message || result.error || "Nao consegui processar.";

      // Send reply back via Evolution
      try {
        await fetch(
          `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`,
          {
            method: "POST",
            headers: evoHeaders(),
            body: JSON.stringify({
              number: phone,
              text: replyText,
            }),
          }
        );
      } catch (sendErr: any) {
        console.error(`[Evolution] Failed to send reply: ${sendErr.message}`);
      }

      // Log to Supabase
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey) {
          await fetch(`${supabaseUrl}/rest/v1/webhook_logs`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              source: "evolution_pitoco",
              status: "ok",
              payload: { phone, pushName, message: messageText },
              result: { reply: replyText.substring(0, 500) },
              created_at: new Date().toISOString(),
            }),
          });
        }
      } catch {
        // Silent log failure
      }

      res.json({
        status: "ok",
        from: phone,
        reply_sent: true,
      });
      return;
    }

    // Unknown event
    res.json({ status: "ok", event: event || "unknown" });
  } catch (error: any) {
    console.error(`[Evolution] Webhook error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
