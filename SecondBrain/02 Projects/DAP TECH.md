# DAP TECH — Vertical de Tecnologia

**Status:** Ativo
**Objetivo:** Toda a infraestrutura de IA, automacao, dados e plataforma digital da DAP 4.0.
**Parent:** [[DAP 4.0]]
**Tags:** #projeto #tech #dap-tech

---

## Escopo

DAP TECH e a vertical que constroi e mantem toda a inteligencia digital do ecossistema.
Nao e suporte. E o motor.

---

## Projetos dentro da DAP TECH

| Projeto | Descricao | Status | Stack |
|---------|-----------|--------|-------|
| [[Doctor Auto IA]] | Sistema multi-agente da oficina (Ana, Sofia, Insights) | Ativo | Python, FastAPI, ChromaDB, Node.js |
| [[Thales OS]] | Sistema operacional pessoal do Thales (agente executivo) | A criar | Independente |
| [[DAP4.0 Holding Site]] | Site premium da holding | Em dev | React, TypeScript, Vite |
| Kommo Integration | CRM sync, scraper, campanhas | Ativo | Python, Kommo API |
| WhatsApp Automation | Evolution API, dual instance | Ativo | Node.js, Evolution API |

---

## Arquitetura Geral

```
Thales OS (independente — sistema mae)
  |
  +-- Second Brain (Obsidian vault)
  |
  +-- DAP 4.0 Holding
        |
        +-- Doctor Auto IA
        |     +-- Ana (vendas WhatsApp)
        |     +-- Sofia (orquestradora)
        |     +-- Insights (analise + blog)
        |     +-- RAG (study + operational)
        |     +-- Kommo (CRM)
        |     +-- Evolution (WhatsApp)
        |
        +-- Holding Site (React)
        +-- Futuras verticais
```

---

## Principios Tech

1. **Simplicidade primeiro** — so complexifica quando tiver dor real
2. **Agentes com proposito claro** — cada agente faz uma coisa bem
3. **RAG organizado** — nao e deposito, e biblioteca curada
4. **Dados sao ativos** — tudo que entra precisa ser util
5. **Separacao de dominios** — Thales OS != Doctor Auto, cada um com seu escopo

---

## Proximo Passo

- Separar Thales OS em repo/servico independente
- Doctor Auto IA: fechar fluxo WhatsApp → Ana → resposta
- RAG: curar collections, remover lixo

## Bloqueio Atual

- Thales ainda preso dentro do docker-compose do Doctor Auto
- Precisa definir como Thales OS vai se comunicar com os projetos

## Entrega da Semana

- [ ] Doctor Auto IA rodando local com fluxo completo
- [ ] Plano de separacao do Thales OS documentado
- [ ] Arquitetura de comunicacao entre Thales OS e projetos
