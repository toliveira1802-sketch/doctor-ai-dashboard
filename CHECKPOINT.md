# CHECKPOINT — Doctor Auto AI (25/03/2026)

## Status Geral
Todas as 7 fases completas. Sistema deployado na VPS Hostinger.

---

## VPS Producao
- **IP:** 76.13.170.42 (KVM 8 — 32GB RAM, 8 cores, 400GB)
- **SSH:** `ssh root@76.13.170.42` (chave ed25519 configurada do PC local)
- **Containers rodando:** Caddy (:80/:443), Gateway (:3001), Python Agents (:8000), ChromaDB
- **Dashboard:** http://76.13.170.42
- **Health:** http://76.13.170.42/api/health
- **Repo na VPS:** `/opt/doctor-auto-ai`
- **Env:** `/opt/doctor-auto-ai/.env.production` (todas as keys preenchidas)

---

## GitHub
- **Repo:** https://github.com/toliveira1802-sketch/doctor-ai-dashboard
- **Branch:** master
- **Ultimo commit:** `8a1a336` — Phase 6.5 + 7

---

## O que funciona
- Dashboard v2 com 6 paginas (KPIs, IA Agents, Sophia Hub, Agents, Agent Builder, Skill Builder)
- Gateway Node.js com health check expandido
- FastAPI com 3 agentes prontos (Ana, Sofia, Insights)
- ChromaDB com 7 collections criadas (vazias)
- Webhooks Come App + Kommo/WhatsApp implementados
- Caddy servindo SPA + reverse proxy /api/*
- Caddyfile configurado para HTTP (sem dominio ainda)

---

## O que falta (proximo passo)
1. **Pagina de Ingestao no Dashboard** — upload PDF/URL/texto para alimentar RAG
2. **Reinstalar OpenClaw na VPS** — admin via WhatsApp do sistema
3. **Adicionar outros agentes ao OpenClaw** — usuario vai informar quais
4. **Corrigir Supabase** — aparece "unreachable" no health (provavelmente RLS)
5. **Seed dos RAGs** — alimentar ChromaDB com dados reais
6. **Configurar dominio** — ai.doctorautoprime.com apontar DNS e ativar HTTPS
7. **Configurar webhooks** — preencher KOMMO_TOKEN/DOMAIN e COME_WEBHOOK_SECRET

---

## Decisoes tecnicas
- **Nao usou LangChain** — llm_router.py com SDKs diretas (OpenAI, Anthropic)
- **Sophia Hub original** usava LangGraph (main.py) — integrado ao dashboard como chat
- **ChromaDB healthcheck** removido do docker-compose.prod (container minimal sem curl/wget/python)
- **Caddy** configurado em HTTP puro (:80) ate ter dominio
- **OpenClaw** ja roda na VPS (container openclaw porta 18789) mas precisa reinstalar

---

## Miro
- Board: https://miro.com/app/board/uXjVGtbNAC4=/
- Diagrama novo: "4. Arquitetura Completa - Doctor Auto AI v2"

---

## Notion
- Pagina principal: Sistema RAG Multi-Agente (todas fases marcadas)
- Sub-paginas: Dashboard v2, Sophia Hub, API Reference, Agentes & Skills, Deploy e Producao, CHECKPOINT

---

## Arquivos importantes
| Arquivo | Funcao |
|---------|--------|
| `docker-compose.prod.yml` | Producao (Caddy + Gateway + Python + ChromaDB) |
| `Caddyfile` | Reverse proxy config |
| `scripts/deploy.sh` | Comandos: first-run, update, restart, status, logs |
| `.env.production` | Template com todas as variaveis |
| `supabase/migrations/20260325_phase7_production.sql` | webhook_logs, system_health, cron_logs |

---

## Credenciais e acessos
- **Hostinger API:** Bearer KhESYDS4aPpyd9JC5hw0L3WjfQuIOg6VfdPL3mer73a09cf4
- **VPS IDs:** 1303948 (KVM 8, 76.13.170.42) e 1398122 (KVM 1, 195.35.42.41)
- **Supabase:** acuufrgoyjwzlyhopaus.supabase.co
- **OpenClaw gateway:** porta 18789, token 07a734db3eca9ef7dafd75e1bcb21e670fd1c772a6d2cbaf
