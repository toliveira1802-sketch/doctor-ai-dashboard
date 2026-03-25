"""Load existing CRM data from Supabase into the RAG for context enrichment."""

from services.supabase_client import get_supabase


class CRMLoader:
    """Extract data from Supabase CRM tables and prepare for RAG ingestion."""

    async def load_service_orders(self, limit: int = 100) -> list[dict]:
        """Load recent service orders and format as text documents."""
        sb = get_supabase()
        result = sb.table("ordens_servico").select("*").order(
            "created_at", desc=True
        ).limit(limit).execute()

        documents = []
        for order in result.data or []:
            text_parts = [
                f"Ordem de Servico #{order.get('id', 'N/A')}",
                f"Status: {order.get('status', 'N/A')}",
            ]
            if order.get("descricao"):
                text_parts.append(f"Descricao: {order['descricao']}")
            if order.get("diagnostico"):
                text_parts.append(f"Diagnostico: {order['diagnostico']}")
            if order.get("valor_total"):
                text_parts.append(f"Valor total: R$ {order['valor_total']}")
            if order.get("observacoes"):
                text_parts.append(f"Observacoes: {order['observacoes']}")

            documents.append({
                "text": "\n".join(text_parts),
                "metadata": {
                    "source": "crm",
                    "table": "ordens_servico",
                    "order_id": str(order.get("id", "")),
                    "status": order.get("status", ""),
                },
            })

        return documents

    async def load_vehicles(self, limit: int = 200) -> list[dict]:
        """Load vehicle data and format for RAG context."""
        sb = get_supabase()
        result = sb.table("veiculos").select("*").limit(limit).execute()

        documents = []
        for v in result.data or []:
            text = (
                f"Veiculo: {v.get('marca', '')} {v.get('modelo', '')} "
                f"{v.get('ano', '')} - Placa: {v.get('placa', 'N/A')}"
            )
            if v.get("observacoes"):
                text += f"\nObservacoes: {v['observacoes']}"

            documents.append({
                "text": text,
                "metadata": {
                    "source": "crm",
                    "table": "veiculos",
                    "brand": v.get("marca", ""),
                    "model": v.get("modelo", ""),
                },
            })

        return documents

    async def load_clients(self, limit: int = 200) -> list[dict]:
        """Load client data for context (anonymized for RAG)."""
        sb = get_supabase()
        result = sb.table("clientes").select(
            "id, nome, cidade, bairro, created_at"
        ).limit(limit).execute()

        documents = []
        for c in result.data or []:
            text = f"Cliente: {c.get('nome', 'N/A')}"
            if c.get("cidade"):
                text += f" - {c['cidade']}"
            if c.get("bairro"):
                text += f", {c['bairro']}"

            documents.append({
                "text": text,
                "metadata": {
                    "source": "crm",
                    "table": "clientes",
                    "client_id": str(c.get("id", "")),
                },
            })

        return documents


crm_loader = CRMLoader()
