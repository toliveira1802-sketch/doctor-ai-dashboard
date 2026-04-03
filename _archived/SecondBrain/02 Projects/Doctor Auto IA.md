# Doctor Auto IA — Sistema Multi-Agente

**Status:** Ativo (rodando local)
**Objetivo:** Sistema de IA completo para a oficina — vendas, atendimento, analise, conhecimento, CRM.
**Parent:** [[DAP TECH]]
**Repo:** `doctor-ai-dashboard`
**Tags:** #projeto #ia #doctor-auto

---

## O que e

Sistema multi-agente com RAG que opera a inteligencia da oficina Doctor Auto Prime.
Cada agente tem um papel claro. Nenhum faz tudo.

---

## Agentes

| Agente | Funcao | Endpoint | Status |
|--------|--------|----------|--------|
| **Ana** | Vendedora consultiva WhatsApp | `/agent/ana/chat` | Ativo |
| **Sofia** | Orquestradora de fluxos e agentes | `/agent/sofia/orchestrate` | Ativo |
| **Insights** | Analise de clientes, patterns, blog | `/agent/insights/analyze` | Ativo |

---

## Infraestrutura

| Container | Porta | Funcao |
|-----------|-------|--------|
| python-agents | 8000 | FastAPI — todos os agentes + RAG |
| gateway | 3001 | Node.js — roteamento, webhooks |
| chromadb | 8100 | Vector DB — embeddings |
| rag-service | 8001 | Servico RAG dedicado |
| evolution | 8080 | WhatsApp API (dual instance) |
| evolution-db | 5432 | PostgreSQL do Evolution |

---

## RAG Collections

**Study (aprendizado):**
- `study_car_manuals` — Manuais tecnicos
- `study_industry_news` — Noticias do setor
- `study_diagnostic_kb` — Base de diagnostico
- `study_business_insights` — Estrategia e negocios

**Operational (operacao):**
- `ops_client_support` — Atendimento ao cliente
- `ops_service_procedures` — Procedimentos da oficina
- `ops_pricing_guidelines` — Precificacao

---

## Fluxo Principal

```
Cliente manda msg no WhatsApp
  → Evolution API recebe webhook
  → Gateway roteia por instancia
  → ana-sales → Ana agent (classificacao + resposta)
  → pitoco-loco → Thales agent (conhecimento)
  → Resposta enviada de volta pelo Evolution
```

---

## Integracoes

- **Kommo CRM** — Scrape 5k+ leads, classificacao, campanhas
- **Supabase** — Persistencia, document registry
- **Evolution API** — WhatsApp dual instance (Anna Sales + Pitoco Loco)
- **Perplexity** — Pesquisa automatica para RAG

---

## Proximo Passo

- Fluxo WhatsApp end-to-end testado
- Ana respondendo com contexto real do RAG operacional
- Remover Thales deste repo (vai pro Thales OS)

## Bloqueio Atual

- Thales misturado neste projeto (precisa ser separado)
- RAG com pouco conteudo real nas collections

## Entrega da Semana

- [ ] Testar webhook WhatsApp → Ana → resposta real
- [ ] Alimentar RAG operacional com conteudo real da oficina
- [ ] Documentar API completa dos agentes
