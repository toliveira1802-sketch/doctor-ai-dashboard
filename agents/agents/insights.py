import json

from agents.base import BaseAgent
from rag.retriever import RAGRetriever
from services.supabase_client import get_supabase


class InsightsAgent(BaseAgent):
    """Insights AI - Real-time analysis connecting Study RAG to Ana."""

    def __init__(self, retriever: RAGRetriever):
        super().__init__("insights.yaml")
        self.retriever = retriever

    async def process(self, input_data: dict) -> dict:
        action = input_data.get("action", "analyze_client")

        handlers = {
            "analyze_client": self._analyze_client,
            "analyze_vehicle": self._analyze_vehicle,
            "detect_patterns": self._detect_patterns,
            "upsell_opportunities": self._upsell_opportunities,
        }

        handler = handlers.get(action, self._analyze_client)
        return await handler(input_data)

    async def _analyze_client(self, data: dict) -> dict:
        """Analyze a client in real-time during Ana's conversation."""
        client_context = data.get("client_context", "")
        conversation_summary = data.get("conversation_summary", "")
        vehicle_info = data.get("vehicle_info", {})

        # Build rich query from all available context
        query_parts = []
        if vehicle_info:
            brand = vehicle_info.get("brand", "")
            model = vehicle_info.get("model", "")
            year = vehicle_info.get("year", "")
            if brand or model:
                query_parts.append(f"{brand} {model} {year} problemas comuns manutencao")
        if conversation_summary:
            query_parts.append(conversation_summary)
        if client_context:
            query_parts.append(client_context)

        query = " ".join(query_parts) or "atendimento cliente oficina automotiva"

        # Search Study RAG for deep knowledge
        study_results = self.retriever.retrieve_from_study(query, n_results=5)
        # Also check Operational for service history patterns
        ops_results = self.retriever.retrieve_from_operational(query, n_results=3)

        context_parts = []
        for r in study_results:
            context_parts.append(f"[ESTUDO - {r.collection}] {r.document}")
        for r in ops_results:
            context_parts.append(f"[OPERACIONAL - {r.collection}] {r.document}")
        context = "\n\n".join(context_parts) if context_parts else None

        prompt = (
            f"Analise este cliente e gere insights acionaveis para a atendente Ana:\n\n"
            f"Contexto do cliente: {client_context}\n"
            f"Resumo da conversa: {conversation_summary}\n"
            f"Veiculo: {json.dumps(vehicle_info, ensure_ascii=False)}\n\n"
            f"Gere:\n"
            f"1. ALERTA: Riscos ou problemas graves que Ana deve saber\n"
            f"2. OPORTUNIDADE: Servicos adicionais que o cliente pode precisar\n"
            f"3. CONHECIMENTO: Informacoes tecnicas sobre o veiculo que ajudam no atendimento\n"
            f"4. ABORDAGEM: Sugestao de como Ana deve conduzir a conversa\n\n"
            f"Responda em formato estruturado e conciso."
        )

        messages = [{"role": "user", "content": prompt}]
        response = await self.chat(messages, context=context)

        return {
            "insights": response,
            "agent": "insights",
            "sources_study": len(study_results),
            "sources_ops": len(ops_results),
            "vehicle_analyzed": bool(vehicle_info),
        }

    async def _analyze_vehicle(self, data: dict) -> dict:
        """Deep analysis of a specific vehicle model."""
        brand = data.get("brand", "")
        model = data.get("model", "")
        year = data.get("year", "")

        query = f"{brand} {model} {year} problemas recalls manutencao diagnostico"
        results = self.retriever.retrieve_from_study(query, n_results=8)

        context = "\n\n".join(f"[{r.collection}] {r.document}" for r in results)

        prompt = (
            f"Faca uma analise completa do {brand} {model} {year}:\n\n"
            f"1. PROBLEMAS CONHECIDOS: Falhas e recalls\n"
            f"2. MANUTENCAO PREVENTIVA: O que verificar neste modelo/ano\n"
            f"3. PONTOS DE ATENCAO: Pecas que costumam falhar\n"
            f"4. CUSTO ESTIMADO: Faixa de preco para manutencoes comuns\n"
            f"5. DICA PARA ATENDIMENTO: Como abordar o dono deste veiculo"
        )

        messages = [{"role": "user", "content": prompt}]
        response = await self.chat(messages, context=context if results else None)

        return {
            "analysis": response,
            "agent": "insights",
            "vehicle": {"brand": brand, "model": model, "year": year},
            "sources_used": len(results),
        }

    async def _detect_patterns(self, data: dict) -> dict:
        """Detect patterns across recent conversations and leads."""
        sb = get_supabase()

        # Get recent leads
        leads_result = sb.table("crm_leads").select(
            "vehicle_info, problem_description, classification, score"
        ).order("created_at", desc=True).limit(50).execute()

        leads = leads_result.data or []
        if not leads:
            return {
                "patterns": "Sem dados suficientes para detectar padroes.",
                "agent": "insights",
                "leads_analyzed": 0,
            }

        # Build summary for analysis
        leads_summary = []
        for lead in leads:
            vehicle = lead.get("vehicle_info", {})
            leads_summary.append(
                f"- {vehicle.get('brand', '?')} {vehicle.get('model', '?')} "
                f"{vehicle.get('year', '?')}: {lead.get('problem_description', 'N/A')} "
                f"[{lead.get('classification', 'cold')} - score {lead.get('score', 0)}]"
            )

        prompt = (
            f"Analise estes {len(leads)} leads recentes e identifique padroes:\n\n"
            f"{chr(10).join(leads_summary)}\n\n"
            f"Identifique:\n"
            f"1. PROBLEMAS RECORRENTES: Quais falhas aparecem mais?\n"
            f"2. VEICULOS FREQUENTES: Quais marcas/modelos mais atendemos?\n"
            f"3. SAZONALIDADE: Algum padrao temporal?\n"
            f"4. OPORTUNIDADES: Servicos que podemos promover\n"
            f"5. ALERTAS: Tendencias preocupantes"
        )

        messages = [{"role": "user", "content": prompt}]
        response = await self.chat(messages)

        return {
            "patterns": response,
            "agent": "insights",
            "leads_analyzed": len(leads),
        }

    async def _upsell_opportunities(self, data: dict) -> dict:
        """Identify upsell/cross-sell opportunities for a client."""
        conversation_id = data.get("conversation_id", "")
        vehicle_info = data.get("vehicle_info", {})

        brand = vehicle_info.get("brand", "")
        model = vehicle_info.get("model", "")
        year = vehicle_info.get("year", "")

        # Search for related services
        query = f"{brand} {model} {year} manutencao preventiva servicos recomendados"
        results = self.retriever.retrieve_from_operational(query, n_results=5)

        context = "\n\n".join(f"[{r.collection}] {r.document}" for r in results)

        prompt = (
            f"O cliente tem um {brand} {model} {year}.\n"
            f"Com base nos servicos que oferecemos, sugira oportunidades de "
            f"cross-sell e upsell que a Ana pode oferecer naturalmente:\n\n"
            f"Regras:\n"
            f"- Seja sutil, nao agressivo\n"
            f"- Foque em seguranca e prevencao\n"
            f"- Sugira pacotes quando possivel\n"
            f"- Inclua faixa de preco"
        )

        messages = [{"role": "user", "content": prompt}]
        response = await self.chat(messages, context=context if results else None)

        return {
            "opportunities": response,
            "agent": "insights",
            "vehicle": {"brand": brand, "model": model, "year": year},
        }
