import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const config = {
  port: parseInt(process.env.GATEWAY_PORT || "3001"),
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL || "http://localhost:8006",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",
  // Webhooks
  comeWebhookSecret: process.env.COME_WEBHOOK_SECRET || "",
  kommoToken: process.env.KOMMO_TOKEN || "",
  kommoDomain: process.env.KOMMO_DOMAIN || "",
  // Monitoring
  logLevel: process.env.LOG_LEVEL || "info",
};
