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
export const generateBlog = (topic, style = 'informativo') =>
  request('/insights/analyze', 'POST', { topic, style });

// RAG
export const getCollections = () => request('/sofia/command', 'POST', { action: 'status' });
export const searchRAG = (query, collections = null) =>
  request('/sofia/command', 'POST', { action: 'search_study', payload: { query } });

// Dashboard metrics
export const getDashboardMetrics = () => request('/dashboard/metrics');

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
