import { callPython } from "./pythonBridge.js";

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://evolution:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "pitoco-loco-key";

const evoHeaders = () => ({
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY,
});

export async function createInstance(instanceName: string) {
  const resp = await fetch(`${EVOLUTION_URL}/instance/create`, {
    method: "POST",
    headers: evoHeaders(),
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
    }),
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to create instance ${instanceName}: ${err}`);
  }
  
  const data = await resp.json();
  
  // Automatically set webhook after creation
  try {
    await setWebhook(instanceName);
  } catch (webhookErr: any) {
    console.warn(`[WhatsAppService] Failed to set webhook for ${instanceName}: ${webhookErr.message}`);
  }
  
  return data;
}

export async function setWebhook(instanceName: string) {
  const gatewayUrl = process.env.WEBHOOK_GLOBAL_URL || "http://gateway:3001/api/evolution/webhook";
  
  const resp = await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
    method: "POST",
    headers: evoHeaders(),
    body: JSON.stringify({
      enabled: true,
      url: gatewayUrl,
      webhook_by_events: true,
      events: [
        "MESSAGES_UPSERT",
        "QRCODE_UPDATED",
        "CONNECTION_UPDATE",
        "MESSAGES_UPDATE",
        "SEND_MESSAGE"
      ]
    }),
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to set webhook for ${instanceName}: ${err}`);
  }
  
  return await resp.json();
}

export async function getInstanceStatus(instanceName: string) {
  const resp = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
    headers: evoHeaders(),
  });
  const data = await resp.json();
  return { instance: instanceName, ...data };
}

export async function getQRCode(instanceName: string) {
  const resp = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
    headers: evoHeaders(),
  });
  return await resp.json();
}

export async function sendTextMessage(instanceName: string, number: string, text: string) {
  const resp = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: evoHeaders(),
    body: JSON.stringify({
      number,
      text,
      linkPreview: false
    }),
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to send message via ${instanceName}: ${err}`);
  }
  
  return await resp.json();
}

export async function logWebhookToSupabase(source: string, payload: any, result: any) {
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
  } catch (err: any) {
    console.error(`[WhatsAppService] Supabase log failed: ${err.message}`);
  }
}
