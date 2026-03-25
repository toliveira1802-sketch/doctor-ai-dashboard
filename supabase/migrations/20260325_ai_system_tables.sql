-- =====================================================
-- Doctor Auto AI System - Database Schema
-- Migration: 20260325 - Initial AI tables
-- =====================================================

-- 1. AI Conversations (Ana's chat history)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  external_client_id TEXT,
  channel TEXT NOT NULL DEFAULT 'come_app',
  status TEXT NOT NULL DEFAULT 'active',
  classification TEXT,
  assigned_agent TEXT DEFAULT 'ana',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_status ON public.ai_conversations(status);
CREATE INDEX idx_ai_conversations_classification ON public.ai_conversations(classification);
CREATE INDEX idx_ai_conversations_external_client ON public.ai_conversations(external_client_id);

-- 2. AI Messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  agent TEXT,
  tokens_used INTEGER DEFAULT 0,
  llm_provider TEXT,
  llm_model TEXT,
  rag_sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON public.ai_messages(created_at);

-- 3. AI Agent Config
CREATE TABLE IF NOT EXISTS public.ai_agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  llm_provider TEXT NOT NULL DEFAULT 'openai',
  llm_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  rag_collections TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed agent configurations
INSERT INTO public.ai_agent_config (agent_name, display_name, llm_provider, llm_model, temperature, max_tokens, rag_collections, system_prompt)
VALUES
  ('ana', 'Ana - Suporte ao Cliente', 'openai', 'gpt-4o-mini', 0.7, 1024,
   ARRAY['ops_client_support', 'ops_service_procedures', 'ops_pricing_guidelines'],
   'Voce e Ana, assistente virtual da Doctor Auto Prime.'),
  ('sofia', 'Sofia - Orquestradora', 'anthropic', 'claude-sonnet-4-20250514', 0.3, 2048,
   ARRAY['study_car_manuals', 'study_industry_news', 'study_diagnostic_kb', 'study_business_insights', 'ops_client_support', 'ops_service_procedures', 'ops_pricing_guidelines'],
   'Voce e Sofia, a inteligencia orquestradora do sistema Doctor Auto Prime.'),
  ('insights', 'IA de Insights', 'openai', 'gpt-4o', 0.4, 1536,
   ARRAY['study_car_manuals', 'study_industry_news', 'study_diagnostic_kb', 'study_business_insights'],
   'Voce e a IA de Insights do sistema Doctor Auto Prime.')
ON CONFLICT (agent_name) DO NOTHING;

-- 4. RAG Document Registry
CREATE TABLE IF NOT EXISTS public.rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  source_rag TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  file_path TEXT,
  metadata JSONB DEFAULT '{}',
  ingested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rag_documents_rag ON public.rag_documents(source_rag);
CREATE INDEX idx_rag_documents_status ON public.rag_documents(status);
CREATE INDEX idx_rag_documents_collection ON public.rag_documents(collection_name);

-- 5. Sofia Orchestration Log
CREATE TABLE IF NOT EXISTS public.sofia_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  source_agent TEXT,
  target_agent TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sofia_actions_type ON public.sofia_actions(action_type);
CREATE INDEX idx_sofia_actions_created ON public.sofia_actions(created_at);

-- 6. CRM Leads
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id),
  client_name TEXT,
  phone TEXT,
  email TEXT,
  vehicle_info JSONB DEFAULT '{}',
  problem_description TEXT,
  classification TEXT NOT NULL DEFAULT 'cold',
  score DECIMAL(5,2) DEFAULT 0,
  source TEXT DEFAULT 'come_app',
  funnel_stage TEXT DEFAULT 'lead_novo',
  assigned_to UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_leads_classification ON public.crm_leads(classification);
CREATE INDEX idx_crm_leads_funnel ON public.crm_leads(funnel_stage);
CREATE INDEX idx_crm_leads_score ON public.crm_leads(score DESC);

-- 7. AI API Keys (encrypted)
CREATE TABLE IF NOT EXISTS public.ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  last_tested_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sofia_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;

-- Service role policies (for Python backend with service_role key)
CREATE POLICY "Service role full access" ON public.ai_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.ai_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.ai_agent_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.rag_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.sofia_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.crm_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.ai_api_keys FOR ALL USING (true) WITH CHECK (true);
