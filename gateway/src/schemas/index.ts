import { z } from "zod";

// Chat (Ana)
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  conversation_id: z.string().nullable().optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

// Sofia commands
export const sofiaCommandSchema = z.object({
  action: z.enum(["chat", "promote_content", "review_study_rag", "status", "search_study", "feed_ana"]),
  message: z.string().max(5000).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
  query: z.string().max(2000).optional(),
  source_collection: z.string().max(100).optional(),
  target_collection: z.string().max(100).optional(),
  content: z.string().max(50000).optional(),
  title: z.string().max(500).optional(),
  n_results: z.number().int().min(1).max(50).optional(),
  payload: z.record(z.unknown()).optional(),
});

// Insights
export const insightsAnalyzeSchema = z.object({
  action: z.enum(["analyze_client", "analyze_vehicle", "detect_patterns", "upsell_opportunities"]),
  client_context: z.string().max(5000).optional(),
  conversation_summary: z.string().max(5000).optional(),
  vehicle_info: z.object({
    brand: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    year: z.string().max(10).optional(),
  }).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.string().max(10).optional(),
  conversation_id: z.string().max(200).optional(),
});

// Blog
export const blogGenerateSchema = z.object({
  topic: z.string().min(1).max(1000),
  style: z.string().max(100).optional(),
});

// Ingest URL
export const ingestURLSchema = z.object({
  url: z.string().url().max(2000),
  title: z.string().max(500).optional(),
  target_collection: z.string().max(100).optional(),
});

// Ingest Text
export const ingestTextSchema = z.object({
  title: z.string().min(1).max(500),
  text: z.string().min(1).max(500000),
  target_rag: z.string().max(100).optional(),
  target_collection: z.string().max(100).optional(),
});

// Ingest Perplexity
export const ingestPerplexitySchema = z.object({
  query: z.string().min(1).max(2000),
  target_collection: z.string().max(100).optional(),
  model: z.string().max(50).optional(),
});

// RAG Query
export const ragQuerySchema = z.object({
  query: z.string().min(1).max(2000),
  collections: z.array(z.string().max(100)).nullable().optional(),
  n_results: z.number().int().min(1).max(50).optional(),
});

// Obsidian note write
export const obsidianWriteSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(500000),
  frontmatter: z.record(z.string()).optional(),
});

// Obsidian daily append
export const obsidianAppendSchema = z.object({
  entry: z.string().min(1).max(5000),
  date: z.string().max(20).optional(),
  section: z.string().max(200).optional(),
});

// Thales
export const thalesChatSchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

export const thalesSyncSchema = z.object({
  force: z.boolean().optional(),
});

export const thalesSearchSchema = z.object({
  query: z.string().min(1).max(2000),
});
