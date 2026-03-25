-- Phase 7: Production tables

-- Webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,           -- 'come', 'kommo'
  status TEXT NOT NULL,           -- 'ok', 'error', 'rejected', 'skipped', 'unauthorized'
  payload JSONB DEFAULT '{}',
  result JSONB,
  error_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);

-- System health snapshots (for monitoring dashboard)
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,          -- 'gateway', 'python-agents', 'chromadb'
  status TEXT NOT NULL,           -- 'healthy', 'degraded', 'down'
  response_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_system_health_service ON system_health(service);
CREATE INDEX idx_system_health_checked ON system_health(checked_at DESC);

-- Cron execution logs (for Agents page)
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_name TEXT NOT NULL,        -- 'vigilante', 'reativador'
  status TEXT NOT NULL,           -- 'ok', 'warn', 'error'
  leads_processados INTEGER DEFAULT 0,
  acoes_tomadas JSONB DEFAULT '{}',
  resultado JSONB DEFAULT '{}',
  error_msg TEXT,
  duration_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cron_logs_name ON cron_logs(cron_name);
CREATE INDEX idx_cron_logs_executed ON cron_logs(executed_at DESC);
