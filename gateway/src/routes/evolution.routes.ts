import { Router, Request, Response } from "express";
import { callPython } from "../services/pythonBridge.js";

const router = Router();

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://evolution:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "pitoco-loco-key";
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || "pitoco-loco";
const ANNA_INSTANCE = "anna-sales";

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

// --- Anna Instance Management ---

// POST /api/evolution/anna/create-instance
router.post("/anna/create-instance", async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: evoHeaders(),
      body: JSON.stringify({
        instanceName: ANNA_INSTANCE,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      }),
    });
    res.json(await resp.json());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evolution/anna/qrcode
router.get("/anna/qrcode", async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(`${EVOLUTION_URL}/instance/connect/${ANNA_INSTANCE}`, { headers: evoHeaders() });
    res.json(await resp.json());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evolution/anna/status
router.get("/anna/status", async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(`${EVOLUTION_URL}/instance/connectionState/${ANNA_INSTANCE}`, { headers: evoHeaders() });
    res.json({ instance: ANNA_INSTANCE, ...(await resp.json()) });
  } catch (error: any) {
    res.json({ instance: ANNA_INSTANCE, state: "offline", error: error.message });
  }
});

// --- Webhook (receives messages from WhatsApp) ---

async function logToSupabase(source: string, payload: any, result: any) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return;
    await fetch(`${supabaseUrl}/rest/v1/webhook_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        source,
        status: "ok",
        payload,
        result,
        created_at: new Date().toISOString(),
      }),
    });
  } catch { /* silent */ }
}

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const event = payload.event;
    const instanceName = payload.instance || "";

    // QR code / connection events — just acknowledge
    if (event === "qrcode.updated" || event === "connection.update") {
      console.log(`[Evolution/${instanceName}] ${event}: ${payload.data?.state || "updated"}`);
      res.json({ status: "ok", event });
      return;
    }

    // New message
    if (event === "messages.upsert") {
      const msg = payload.data;
      if (!msg || msg.key?.fromMe) {
        res.json({ status: "ok", action: "skipped" });
        return;
      }

      const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
      if (!messageText) {
        res.json({ status: "ok", action: "skipped", reason: "no_text" });
        return;
      }

      const remoteJid = msg.key?.remoteJid || "";
      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const pushName = msg.pushName || "";

      // Route by instance: anna-sales → Anna agent, pitoco-loco → Pitoco Loco
      const isAnna = instanceName === ANNA_INSTANCE;
      const agentEndpoint = isAnna ? "/agent/ana/chat" : "/agent/thales/chat";
      const agentBody = isAnna
        ? { message: messageText, external_client_id: phone, client_name: pushName, client_phone: phone, channel: "whatsapp_evolution" }
        : { message: messageText, history: [] };
      const replyInstance = isAnna ? ANNA_INSTANCE : INSTANCE_NAME;

      console.log(`[Evolution/${replyInstance}] ${pushName} (${phone}): ${messageText.substring(0, 50)}...`);

      const result = await callPython(agentEndpoint, "POST", agentBody);
      const replyText = result.message || "Nao consegui processar.";

      // Send reply back
      try {
        await fetch(`${EVOLUTION_URL}/message/sendText/${replyInstance}`, {
          method: "POST",
          headers: evoHeaders(),
          body: JSON.stringify({ number: phone, text: replyText }),
        });
      } catch (sendErr: any) {
        console.error(`[Evolution/${replyInstance}] Send failed: ${sendErr.message}`);
      }

      await logToSupabase(
        isAnna ? "evolution_anna" : "evolution_pitoco",
        { phone, pushName, message: messageText },
        { reply: replyText.substring(0, 500), classification: result.classification }
      );

      res.json({ status: "ok", instance: replyInstance, from: phone, reply_sent: true });
      return;
    }

    res.json({ status: "ok", event: event || "unknown" });
  } catch (error: any) {
    console.error(`[Evolution] Webhook error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
