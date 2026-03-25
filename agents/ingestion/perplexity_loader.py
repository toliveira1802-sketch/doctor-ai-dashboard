import httpx

from config.settings import settings


class PerplexityLoader:
    """Use Perplexity API for deep research to feed the Study RAG."""

    BASE_URL = "https://api.perplexity.ai"

    def __init__(self):
        self._api_key: str | None = None

    @property
    def api_key(self) -> str:
        if self._api_key is None:
            self._api_key = settings.perplexity_api_key
        return self._api_key

    async def research(
        self,
        query: str,
        model: str = "sonar-pro",
        language: str = "pt-BR",
        search_recency: str | None = None,
    ) -> dict:
        """Execute a deep research query via Perplexity.

        Args:
            query: The research question.
            model: 'sonar' (fast), 'sonar-pro' (deep), 'sonar-reasoning-pro' (complex).
            language: Response language.
            search_recency: Filter results by time - 'day', 'week', 'month', 'year'.

        Returns dict with 'content', 'citations', and 'raw_response'.
        """
        messages = [
            {
                "role": "system",
                "content": (
                    f"Voce e um pesquisador especializado no setor automotivo brasileiro. "
                    f"Responda sempre em {language} com informacoes detalhadas e tecnicas. "
                    f"Inclua dados especificos, numeros e fontes quando possivel."
                ),
            },
            {"role": "user", "content": query},
        ]

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 4096,
            "return_citations": True,
            "return_related_questions": True,
        }

        if search_recency:
            payload["search_recency_filter"] = search_recency

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        citations = data.get("citations", [])
        related = data.get("related_questions", [])

        return {
            "content": content,
            "citations": citations,
            "related_questions": related,
            "model": model,
            "query": query,
        }

    async def research_automotive_news(self) -> dict:
        """Pre-built query: latest automotive industry news in Brazil."""
        return await self.research(
            query=(
                "Quais as ultimas novidades do setor automotivo brasileiro? "
                "Inclua: novos modelos, recalls, tendencias de mercado, "
                "tecnologias de diagnostico e manutencao."
            ),
            model="sonar-pro",
            search_recency="week",
        )

    async def research_vehicle_issue(self, brand: str, model: str, year: int, symptom: str) -> dict:
        """Pre-built query: research a specific vehicle problem."""
        return await self.research(
            query=(
                f"Quais as causas e solucoes para o seguinte problema em {brand} {model} {year}: "
                f"{symptom}. Inclua: diagnostico, pecas envolvidas, custo estimado de reparo, "
                f"se ha recalls relacionados, e boletins tecnicos."
            ),
            model="sonar-pro",
        )

    async def research_car_manual(self, brand: str, model: str, year: int, topic: str = "") -> dict:
        """Pre-built query: search for car manual/technical info."""
        query = f"Manual tecnico {brand} {model} {year}"
        if topic:
            query += f" - {topic}"
        query += ". Especificacoes tecnicas, intervalos de manutencao, fluidos recomendados."

        return await self.research(query=query, model="sonar-pro")

    async def research_market_pricing(self, service_type: str, region: str = "Brasil") -> dict:
        """Pre-built query: market pricing for automotive services."""
        return await self.research(
            query=(
                f"Qual o preco medio de mercado para {service_type} em oficinas "
                f"automotivas no {region}? Inclua faixa de preco, fatores que "
                f"influenciam o valor e comparativo entre marcas."
            ),
            model="sonar",
            search_recency="month",
        )


perplexity_loader = PerplexityLoader()
