const API = '/api';

async function request(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

// Sofia
export const sofiaChat = (message, history = []) =>
  request('/sofia/command', 'POST', { action: 'chat', message, history });
export const sofiaStatus = () => request('/sofia/status');
export const sofiaPromote = (query, source, target) =>
  request('/sofia/command', 'POST', {
    action: 'promote_content',
    payload: { query, source_collection: source, target_collection: target, n_results: 5 },
  });

// Ana
export const anaChat = (message, conversationId = null) =>
  request('/chat/message', 'POST', { message, conversation_id: conversationId });
export const getConversation = (id) => request(`/chat/conversations/${id}`);

// Insights
export const analyzeVehicle = (brand, model, year) =>
  request('/insights/analyze', 'POST', { action: 'analyze_vehicle', brand, model, year });
export const detectPatterns = () => request('/insights/analyze', 'POST', { action: 'detect_patterns' });

// Blog
export const generateBlog = (topic, style = 'informativo') =>
  request('/insights/blog/generate', 'POST', { topic, style });
export const generateBlogAuto = () =>
  request('/insights/blog/auto', 'POST', {});

// RAG
export const getCollections = () => request('/sofia/command', 'POST', { action: 'status' });
export const searchRAG = (query, collections = null) =>
  request('/rag/query', 'POST', { query, collections, n_results: 10 });
export const getRagCollections = () => request('/rag/collections');

// Dashboard metrics
export const getDashboardMetrics = () => request('/dashboard/metrics');

// Leads / CRM
export const getLeads = (limit = 50) => request(`/dashboard/leads?limit=${limit}`);
export const getLeadDetails = (id) => request(`/dashboard/leads/${id}`);
export const getLeadStats = () => request('/dashboard/lead-stats');

// Logs / Webhooks
export const getWebhookLogs = (limit = 50) => request(`/dashboard/logs?limit=${limit}`);
export const getSystemHealth = () => request('/health');

// Thales / Second Brain
export const thalesSync = (force = false) => request('/thales/sync', 'POST', { force });
export const thalesStatus = () => request('/thales/status');
export const thalesSearch = (query) => request('/thales/search', 'POST', { query });
export const thalesChat = (message, history = []) => request('/thales/chat', 'POST', { message, history });

// Evolution API / WhatsApp
export const evoCreateInstance = () => request('/evolution/create-instance', 'POST', {});
export const evoGetQR = () => request('/evolution/qrcode');
export const evoStatus = () => request('/evolution/status');
export const evoSendMessage = (number, message) => request('/evolution/send', 'POST', { number, message });

// Ingestion
export const ingestFile = async (file, title, targetRag, targetCollection) => {
  const form = new FormData();
  form.append('file', file);
  form.append('title', title);
  form.append('source_type', 'auto');
  form.append('target_rag', targetRag);
  form.append('target_collection', targetCollection);
  const res = await fetch(`${API}/ingest/file`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
};

export const ingestURL = (url, title, targetCollection) =>
  request('/ingest/url', 'POST', { url, title, target_collection: targetCollection });

export const ingestText = (title, text, targetRag, targetCollection) =>
  request('/ingest/text', 'POST', { title, text, target_rag: targetRag, target_collection: targetCollection });

export const ingestPerplexity = (query, targetCollection, model = 'sonar-pro') =>
  request('/ingest/perplexity', 'POST', { query, target_collection: targetCollection, model });

export const getIngestCollections = () => request('/ingest/collections', 'GET');
export const getIngestHistory = () => request('/ingest/history', 'GET');
