import json

from services.llm_router import llm_router
from models.client_profile import ClassificationResult, ClientProfile, VehicleInfo


CLASSIFICATION_PROMPT = """Voce e um classificador de leads para uma oficina automotiva (Doctor Auto Prime).

Analise a conversa abaixo e extraia:

1. **Classificacao**: hot, warm ou cold
   - HOT (>70): Cliente com problema urgente, veiculo parado, precisa de reparo imediato, ja mencionou orcamento
   - WARM (40-70): Cliente interessado, fazendo perguntas, comparando precos, agendando revisao
   - COLD (<40): Apenas curiosidade, pergunta generica, sem urgencia, sem veiculo definido

2. **Score**: 0-100 baseado na urgencia e intencao de compra

3. **Dados do cliente** extraidos da conversa:
   - nome, telefone, email (se mencionados)
   - marca, modelo, ano, placa do veiculo (se mencionados)
   - descricao do problema

Responda APENAS com JSON valido neste formato:
{
  "classification": "hot|warm|cold",
  "score": 0-100,
  "reasoning": "explicacao curta",
  "extracted_info": {
    "name": "nome ou null",
    "phone": "telefone ou null",
    "email": "email ou null",
    "vehicle": {"brand": "marca ou null", "model": "modelo ou null", "year": "ano ou null", "plate": "placa ou null"},
    "problem_description": "descricao ou null"
  }
}"""


async def classify_lead(messages: list[dict]) -> ClassificationResult:
    """Classify a client lead based on conversation history."""
    conversation_text = "\n".join(
        f"{'Cliente' if m['role'] == 'user' else 'Ana'}: {m['content']}"
        for m in messages
    )

    response = await llm_router.chat(
        provider="openai",
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Conversa:\n{conversation_text}"}],
        system_prompt=CLASSIFICATION_PROMPT,
        temperature=0.1,
        max_tokens=512,
    )

    try:
        # Clean response - remove markdown fences if present
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
        data = json.loads(clean)
    except (json.JSONDecodeError, IndexError):
        return ClassificationResult(
            classification="cold",
            score=20.0,
            reasoning="Erro ao classificar - classificado como cold por seguranca",
            extracted_info=ClientProfile(),
        )

    vehicle_data = data.get("extracted_info", {}).get("vehicle", {})
    vehicle = VehicleInfo(
        brand=vehicle_data.get("brand"),
        model=vehicle_data.get("model"),
        year=vehicle_data.get("year"),
        plate=vehicle_data.get("plate"),
    )

    extracted = data.get("extracted_info", {})
    profile = ClientProfile(
        name=extracted.get("name"),
        phone=extracted.get("phone"),
        email=extracted.get("email"),
        vehicle=vehicle,
        problem_description=extracted.get("problem_description"),
        classification=data.get("classification", "cold"),
        score=float(data.get("score", 20)),
    )

    return ClassificationResult(
        classification=data.get("classification", "cold"),
        score=float(data.get("score", 20)),
        reasoning=data.get("reasoning", ""),
        extracted_info=profile,
    )
