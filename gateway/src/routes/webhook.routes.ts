import { Router, Request, Response } from "express";
import { callPython } from "../services/pythonBridge.js";
import { appendToDaily } from "../services/dailyNote.js";

const router = Router();

// --- Helpers ---

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

// --- Kommo Webhook (WhatsApp, Instagram, Facebook, Telegram, TikTok) ---

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

    // Forward to Anna (Sales Orchestrator)
    const result = await callPython("/agent/ana/chat", "POST", {
      message: messageText,
      external_client_id: clientId,
      client_name: clientName,
      client_phone: clientPhone,
      channel: "whatsapp",
      metadata: {
        kommo_lead_id: leadId,
        event_type: eventType,
      },
    });

    const duration = Date.now() - startTime;
    const replyText = result.message || "";

    // RETURN PATH: Send Anna's reply back to WhatsApp via Kommo Talk API
    let replySent = false;
    if (replyText && clientId) {
      try {
        await sendKommoMessage(clientId, replyText);
        replySent = true;
        console.log(`[webhook/kommo] Reply sent to ${clientName || clientId} (${duration}ms)`);
      } catch (e: any) {
        console.error(`[webhook/kommo] Failed to send reply:`, e.message);
      }
    }

    // If Anna classified the lead, update Kommo lead fields
    if (result.classification && leadId) {
      try {
        await updateKommoLead(leadId, {
          classification: result.classification,
          vehicle_info: result.classification?.extracted_info || result.extracted_data || {},
        });
      } catch (e: any) {
        console.error(`[webhook/kommo] Failed to update Kommo lead:`, e.message);
      }
    }

    // Log sales_ops if present (learning notes, microtasks)
    if (result.sales_ops) {
      try {
        await logWebhook("anna_sales_ops", "ok", {
          lead_id: leadId,
          client_id: clientId,
          stage: result.sales_ops.stage,
        }, result.sales_ops, null);
      } catch {
        // Silent
      }
    }

    await logWebhook("kommo", "ok", { messageText, clientId, leadId }, {
      reply: replyText.substring(0, 200),
      reply_sent: replySent,
      classification: result.classification?.label,
      duration_ms: duration,
    }, null);

    // Auto-log to Obsidian daily note
    const classLabel = result.classification?.label ? ` [${result.classification.label}]` : "";
    const dailyEntry = `**Ana** — ${clientName || clientId}: "${messageText.substring(0, 60)}"${classLabel} (${duration}ms)`;
    appendToDaily(dailyEntry, "Leads & Conversas");

    res.json({
      status: "ok",
      reply_sent: replySent,
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

// --- Kommo API: Send Message Back ---

async function sendKommoMessage(chatId: string, text: string) {
  const token = process.env.KOMMO_TOKEN;
  const domain = process.env.KOMMO_DOMAIN;
  if (!token || !domain) {
    throw new Error("KOMMO_TOKEN or KOMMO_DOMAIN not configured");
  }

  // Kommo Talk API — send message to existing chat
  // Uses the Chats API to post a message back to the conversation
  const resp = await fetch(`https://${domain}/api/v4/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      type: "text",
    }),
  });

  if (!resp.ok) {
    // Fallback: try via notes API on the lead
    const noteResp = await fetch(`https://${domain}/api/v4/contacts/${chatId}/notes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          note_type: "common",
          params: {
            text: `[Anna IA] ${text}`,
          },
        },
      ]),
    });
    if (!noteResp.ok) {
      const errText = await noteResp.text();
      throw new Error(`Kommo send failed: ${noteResp.status} ${errText}`);
    }
  }
}

// --- Kommo API: Update Lead ---

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
      kommo: { endpoint: "/api/webhook/kommo", method: "POST", auth: !!process.env.KOMMO_TOKEN },
    },
  });
});

export default router;
