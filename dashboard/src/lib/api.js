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

// Ingest
export const ingestPerplexity = (query, collection = 'study_industry_news') =>
  request('/sofia/command', 'POST', {
    action: 'chat',
    message: `Pesquise via Perplexity: ${query}`,
  });

// Dashboard metrics
export const getDashboardMetrics = () => request('/dashboard/metrics');
