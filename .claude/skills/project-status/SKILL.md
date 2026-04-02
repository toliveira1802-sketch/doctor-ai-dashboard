 ---
name: project-status-pro
description: Analisa profundamente o repositório e gera um report técnico e estratégico do Dashboard Doctor Auto.
user_invocable: true
---

# Skill: Analista de Status de Engenharia

Você atua como um Lead Engineer. Seu objetivo é analisar o estado real do projeto "Dashboard Oficina Doctor Auto" cruzando dados de versionamento, código-fonte e infraestrutura.

## Passo 1: Coleta e Inspeção
1. **Atividade**: Execute `git status`, `git log --oneline -15` e `git diff --stat HEAD~5..HEAD`. Identifique quem está mais ativo e quais módulos sofreram mais churn.
2. **Saúde das Dependências**: Leia `package.json`. Identifique bibliotecas críticas e verifique se há scripts customizados de deploy ou teste.
3. **Persistência**: Analise `drizzle/schema.ts`. Liste as entidades e identifique relações complexas (ex: many-to-many entre Clientes e Peças).
4. **Funcionalidades (Mapeamento Real)**: 
   - Liste `client/src/pages/` e cruze com `server/routes/`. 
   - **Regra de Validação**: Se houver rota sem página ou página sem rota, marque como "Inconsistente".
5. **Dívida Técnica**: Faça um `grep` ou busca por termos como `TODO`, `FIXME`, `DEPRECATED` ou `console.log` esquecidos em `client/src/` e `server/src/`.

## Passo 2: Formato do Relatório (Markdown)

# 🛠 Status Report: Dashboard Doctor Auto
**Data:** [data atual] | **Branch:** [branch atual] | **Build Status:** [baseado no git]

## 📊 Resumo de Engenharia
[Descreva se o projeto está em fase de expansão, refatoração ou estabilização baseando-se no volume de commits e diffs recentes.]

## 🚀 Readiness das Squads (Mapeamento de Funcionalidades)
| Módulo | Implementação | Integração (API) | Status |
| :--- | :--- | :--- | :--- |
| **Kanban / Oficina** | [Front-end %] | [Back-end %] | [ok/parcial/pendente] |
| **Agenda de Performance** | [Front-end %] | [Back-end %] | [ok/parcial/pendente] |
| **Robô Financeiro** | [Front-end %] | [Back-end %] | [ok/parcial/pendente] |
| **Integrações (CRM/Telegram)** | N/A | [Status Conexão] | [ok/parcial/pendente] |

## 🗄 Estrutura de Dados & Backend
- **Schema Drizzle**: [Listar tabelas principais e sua integridade]
- **Migrações Pendentes**: [Verificar se há divergência entre schema e pasta migrations]
- **Endpoints Ativos**: [Listar principais serviços em `server/services/`]

## ⚠️ Débito Técnico e Riscos
- **Alertas de Código**: [Ex: "Encontrados 5 TODOs na lógica de retorno de cliente"]
- **Gargalos**: [Ex: "Dependência X está na versão 1.0, pode causar conflito com Y"]

## 🛠 Atividade do Git (Últimos Sprints)
```text
[Inserir o log resumido aqui]