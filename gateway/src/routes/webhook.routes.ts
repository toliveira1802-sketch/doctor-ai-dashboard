import { Router, Request, Response } from "express";
import { callPython } from "../services/pythonBridge.js";
import crypto from "crypto";

const router = Router();

// --- Helpers ---

function verifySignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

async function logWebhook(
  source: string,
  status: string,
  payload: Record<string, unknown>,
  result: Record<string, unknown> | null,
  error: string | null
) {
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
        status,
        payload,
        result,
        error_msg: error,
        created_at: new Date().toISOString(),
      }),
    });
  } catch {
    console.error(`[webhook-log] Failed to log ${source} webhook`);
  }
}

// --- Come App Webhook ---

router.post("/come", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { client_id, message, channel, metadata, phone, name } = req.body;

    // Validate required fields
    if (!message && !client_id) {
      await logWebhook("come", "rejected", req.body, null, "Missing required fields");
      res.status(400).json({ error: "message or client_id is required" });
      return;
    }

    // Verify signature if secret is configured
    const secret = process.env.COME_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers["x-come-signature"] as string;
      const rawBody = JSON.stringify(req.body);
      if (!verifySignature(rawBody, signature, secret)) {
        await logWebhook("come", "unauthorized", req.body, null, "Invalid signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    }

    // Forward to Ana via Python service
    const result = await callPython("/agent/ana/chat", "POST", {
      message: message || "",
      external_client_id: client_id,
      client_name: name,
      client_phone: phone,
      channel: channel || "come_app",
      metadata: metadata || {},
    });

    const duration = Date.now() - startTime;
    await logWebhook("come", "ok", req.body, { ...result, duration_ms: duration }, null);

    res.json({
      status: "ok",
      ...result,
      duration_ms: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await logWebhook("come", "error", req.body, null, error.message);
    console.error(`[webhook/come] Error (${duration}ms):`, error.message);
    res.status(500).json({ error: error.message, duration_ms: duration });
  }
});

// --- Kommo/WhatsApp Webhook ---

router.post("/kommo", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const payload = req.body;

    // Kommo sends different event types
    const eventType =
      payload.message?.[0]?.type ||
      payload.unsorted?.[0]?.category ||
      "unknown";

    // Extract message data from Kommo format
    let messageText = "";
    let clientId = "";
    let clientName = "";
    let clientPhone = "";
    let leadId = "";

    if (payload.message && payload.message.length > 0) {
      const msg = payload.message[0];
      messageText = msg.text || msg.message?.text || "";
      clientId = String(msg.contact_id || msg.chat_id || "");
      leadId = String(msg.element_id || msg.entity_id || "");
    }

    // Try to extract contact info
    if (payload.contacts?.update?.[0]) {
      const contact = payload.contacts.update[0];
      clientName = contact.name || "";
      const phoneField = contact.custom_fields?.find(
        (f: any) => f.code === "PHONE"
      );
      clientPhone = phoneField?.values?.[0]?.value || "";
    }

    if (!messageText) {
      // Might be a status update, not a message — acknowledge silently
      await logWebhook("kommo", "skipped", payload, null, "No message text");
      res.json({ status: "ok", action: "skipped", reason: "no_message" });
      return;
    }

    // Forward to Ana
    const result = await callPython("/agent/ana/chat", "POST", {
      message: messageText,
      external_client_id: clientId,
      client_name: clientName,
      client_phone: clientPhone,
      channel: "whatsapp",
      metadata: {
        kommo_lead_id: leadId,
        event_type: eventType,
        raw_event: payload,
      },
    });

    const duration = Date.now() - startTime;

    // If Ana classified the lead, update Kommo
    if (result.classification && leadId) {
      try {
        await updateKommoLead(leadId, {
          classification: result.classification,
          vehicle_info: result.extracted_data || {},
        });
      } catch (e: any) {
        console.error(`[webhook/kommo] Failed to update Kommo lead:`, e.message);
      }
    }

    await logWebhook("kommo", "ok", { messageText, clientId, leadId }, { ...result, duration_ms: duration }, null);

    res.json({
      status: "ok",
      ...result,
      duration_ms: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await logWebhook("kommo", "error", req.body, null, error.message);
    console.error(`[webhook/kommo] Error (${duration}ms):`, error.message);
    res.status(500).json({ error: error.message, duration_ms: duration });
  }
});

// --- Kommo API Helper ---

async function updateKommoLead(
  leadId: string,
  data: { classification?: string; vehicle_info?: Record<string, unknown> }
) {
  const token = process.env.KOMMO_TOKEN;
  const domain = process.env.KOMMO_DOMAIN;
  if (!token || !domain) return;

  // Kommo custom field IDs (from sophia-hub)
  const FIELD_IDS = {
    name: 966001,
    plate: 966003,
    brand: 966005,
    model: 966007,
  };

  const customFields: Array<{ field_id: number; values: Array<{ value: string }> }> = [];

  if (data.vehicle_info) {
    const info = data.vehicle_info as Record<string, string>;
    if (info.brand)
      customFields.push({ field_id: FIELD_IDS.brand, values: [{ value: info.brand }] });
    if (info.model)
      customFields.push({ field_id: FIELD_IDS.model, values: [{ value: info.model }] });
    if (info.plate)
      customFields.push({ field_id: FIELD_IDS.plate, values: [{ value: info.plate }] });
  }

  if (customFields.length === 0) return;

  await fetch(`https://${domain}/api/v4/leads/${leadId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ custom_fields_values: customFields }),
  });
}

// --- Webhook Status ---

router.get("/status", async (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    webhooks: {
      come: { endpoint: "/api/webhook/come", method: "POST", auth: !!process.env.COME_WEBHOOK_SECRET },
      kommo: { endpoint: "/api/webhook/kommo", method: "POST", auth: !!process.env.KOMMO_TOKEN },
    },
  });
});

export default router;
