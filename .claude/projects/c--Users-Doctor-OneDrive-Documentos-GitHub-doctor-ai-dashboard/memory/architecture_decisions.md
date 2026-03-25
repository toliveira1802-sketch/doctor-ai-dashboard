---
name: Architecture decisions
description: Key technical decisions — no LangChain, direct SDKs, ChromaDB setup, Caddy config
type: project
---

- **No LangChain** — uses llm_router.py with direct SDKs (OpenAI, Anthropic, Google, DeepSeek)
- **Sophia Hub** originally used LangGraph (main.py) — integrated into dashboard as chat
- **ChromaDB healthcheck** removed from docker-compose.prod (minimal container without curl/wget/python)
- **Caddy** configured for HTTP (:80) until domain is set up
- **GitHub repo:** toliveira1802-sketch/doctor-ai-dashboard, branch: master

**Why:** Simpler architecture, fewer dependencies, more control over LLM routing.
**How to apply:** Don't introduce LangChain. Keep using direct SDK calls through llm_router.
