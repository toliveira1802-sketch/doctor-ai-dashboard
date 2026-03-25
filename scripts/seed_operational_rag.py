"""Seed the Operational RAG with initial automotive content for Doctor Auto Prime."""

import sys
sys.path.insert(0, "../agents")
sys.path.insert(0, "agents")

from rag.chroma_client import ChromaManager
from rag.embeddings import embedding_service

# ============================================================
# ops_client_support - Conteúdo para atendimento ao cliente
# ============================================================
CLIENT_SUPPORT = [
    # Apresentação da empresa
    "A Doctor Auto Prime é uma rede de oficinas automotivas multimarcas especializada em diagnóstico eletrônico, mecânica geral, elétrica automotiva e manutenção preventiva. Atendemos veículos nacionais e importados com equipamentos de última geração. Nossas unidades: Doctor Auto Prime (matriz), Doctor Auto Bosch (especializada Bosch Car Service) e Garage 347.",
    "Nosso horário de funcionamento é de segunda a sexta das 8h às 18h e sábados das 8h às 13h. Trabalhamos com agendamento prévio para garantir atendimento rápido, mas também aceitamos emergências. O tempo médio de espera para diagnóstico é de 30 minutos.",
    "Oferecemos garantia de 90 dias em peças e serviços realizados. Para retíficas e serviços de motor, a garantia é de 6 meses ou 10.000 km, o que vier primeiro. Trabalhamos com peças originais e de primeira linha.",

    # Serviços oferecidos
    "Realizamos troca de óleo e filtros com óleo sintético, semissintético ou mineral, conforme especificação do fabricante. Preço médio: R$ 150 a R$ 400 dependendo do tipo de óleo e veículo. Tempo estimado: 30 a 45 minutos.",
    "Serviço de alinhamento e balanceamento computadorizado com equipamento 3D de última geração. Preço: R$ 120 a R$ 180. Recomendado a cada 10.000 km ou quando perceber o volante puxando para um lado.",
    "Diagnóstico eletrônico completo com scanner automotivo multimarcas. Leitura e limpeza de códigos de falha, teste de sensores e atuadores. Preço: R$ 80 a R$ 150. Tempo: 30 a 60 minutos.",
    "Serviço de freios: troca de pastilhas, discos, fluido de freio e regulagem. Pastilhas dianteiras: R$ 150 a R$ 350. Discos: R$ 200 a R$ 600 o par. Sempre verificamos espessura dos discos antes de recomendar troca.",
    "Manutenção de ar condicionado automotivo: limpeza do sistema, recarga de gás, troca de filtro de cabine e verificação de vazamentos. Preço médio: R$ 200 a R$ 450. Recomendamos higienização a cada 6 meses.",
    "Serviço de suspensão: troca de amortecedores, molas, pivôs, bieletas e buchas. Amortecedores dianteiros (par): R$ 400 a R$ 1.200 dependendo do veículo. Sempre trocamos em pares para manter o equilíbrio.",
    "Troca de correia dentada e kit de distribuição. Serviço crítico que deve ser feito conforme manual do fabricante (geralmente entre 40.000 e 60.000 km). Preço: R$ 500 a R$ 1.500. Risco de dano ao motor se não trocar no prazo.",
    "Serviço de embreagem: troca do kit de embreagem (platô, disco e rolamento). Preço médio: R$ 800 a R$ 2.000. Sinais de problema: pedal pesado, patinação em subida, dificuldade para engatar marchas.",
    "Serviço de injeção eletrônica: limpeza de bicos injetores, teste de pressão de combustível, verificação de sonda lambda e catalisador. Preço: R$ 150 a R$ 400. Recomendado a cada 30.000 km.",
    "Diagnóstico e reparo de sistema elétrico: alternador, motor de partida, bateria, chicote elétrico, módulos eletrônicos. Temos equipamento para teste de carga de bateria e alternador na hora.",

    # Formas de pagamento e conveniência
    "Aceitamos todas as formas de pagamento: dinheiro, PIX, cartão de débito, crédito (em até 12x sem juros para serviços acima de R$ 500). Também trabalhamos com financiamento próprio para serviços acima de R$ 2.000.",
    "Oferecemos serviço de leva e traz gratuito em um raio de 10 km da oficina para serviços acima de R$ 300. Também temos carro reserva disponível mediante consulta para serviços que demoram mais de 1 dia.",
    "Enviamos orçamento detalhado por WhatsApp com fotos das peças que precisam ser trocadas. O cliente aprova antes de iniciarmos qualquer serviço. Transparência total.",

    # FAQ
    "Meu carro está fazendo barulho na suspensão. O que pode ser? Pode ser amortecedor vencido, pivô desgastado, bieleta da barra estabilizadora, bucha ressecada ou batente do amortecedor. Recomendamos agendar uma avaliação gratuita para identificar a causa exata.",
    "Quando devo trocar o óleo do meu carro? Para óleo sintético: a cada 10.000 km ou 12 meses. Semissintético: 7.500 km ou 6 meses. Mineral: 5.000 km ou 6 meses. Sempre o que vier primeiro.",
    "Meu carro está com a luz do motor acesa no painel. É grave? A luz de check engine indica que o sistema de gerenciamento do motor detectou uma falha. Pode ser desde algo simples como tampa do tanque mal fechada até problemas mais sérios. Recomendamos diagnóstico eletrônico o quanto antes para evitar danos maiores.",
    "Como sei se preciso trocar as pastilhas de freio? Sinais: ruído metálico ao frear, pedal de freio mais longo, carro puxando para um lado ao frear, vibração no pedal. Pastilhas devem ser trocadas quando atingem 3mm de espessura.",
    "Meu ar condicionado não está gelando. O que pode ser? Causas comuns: gás insuficiente (vazamento), filtro de cabine entupido, compressor com defeito, correia do compressor patinando. Uma avaliação rápida identifica o problema.",
]

# ============================================================
# ops_service_procedures - Procedimentos operacionais
# ============================================================
SERVICE_PROCEDURES = [
    "Procedimento de recepção do veículo: 1) Registrar dados do cliente e veículo no sistema. 2) Ouvir relato do problema. 3) Realizar inspeção visual externa e interna. 4) Fotografar o painel e quilometragem. 5) Verificar itens de valor no veículo. 6) Emitir ordem de serviço.",
    "Procedimento de diagnóstico eletrônico: 1) Conectar scanner OBD2 na porta de diagnóstico. 2) Ler códigos de falha armazenados e pendentes. 3) Verificar dados em tempo real dos sensores. 4) Testar atuadores individualmente. 5) Limpar códigos e fazer test drive. 6) Documentar resultados com prints do scanner.",
    "Procedimento de troca de óleo: 1) Elevar o veículo no elevador. 2) Posicionar recipiente de coleta. 3) Remover bujão de drenagem. 4) Aguardar escoamento completo. 5) Trocar filtro de óleo. 6) Recolocar bujão com torque especificado. 7) Abastecer com óleo na quantidade e especificação corretas. 8) Verificar nível e checar vazamentos.",
    "Procedimento de alinhamento: 1) Verificar pressão dos pneus (calibrar conforme fabricante). 2) Inspecionar componentes de suspensão e direção. 3) Posicionar veículo na rampa de alinhamento. 4) Instalar sensores/targets nas rodas. 5) Medir e ajustar camber, caster e convergência. 6) Imprimir relatório antes/depois.",
    "Procedimento de troca de pastilhas de freio: 1) Elevar veículo e remover roda. 2) Medir espessura do disco (mínima conforme fabricante). 3) Remover pinça e suporte. 4) Remover pastilhas antigas. 5) Recuar pistão da pinça. 6) Instalar pastilhas novas com anti-ruído. 7) Remontar e torquear. 8) Bombear pedal antes de sair.",
    "Procedimento de higienização do ar condicionado: 1) Ligar o ar na temperatura mínima por 5 minutos. 2) Desligar o compressor (manter ventilação). 3) Aplicar produto bactericida na entrada de ar (caixa de ar). 4) Trocar filtro de cabine. 5) Verificar dreno do evaporador. 6) Testar temperatura de saída (deve estar entre 3°C e 8°C acima da temperatura externa).",
    "Procedimento de verificação de bateria: 1) Inspecionar terminais (oxidação, aperto). 2) Medir tensão em repouso (deve ser 12.4V a 12.7V). 3) Teste de carga com equipamento específico (CCA). 4) Verificar corrente de fuga (máximo 50mA). 5) Testar alternador (13.5V a 14.5V com motor ligado). 6) Registrar resultado.",
    "Checklist de entrega do veículo: 1) Verificar se todos os serviços da OS foram realizados. 2) Limpar o veículo internamente. 3) Resetar indicador de manutenção no painel. 4) Colar adesivo de próxima troca de óleo. 5) Preparar nota fiscal e garantia. 6) Explicar ao cliente o que foi feito. 7) Orientar sobre próximas manutenções.",
]

# ============================================================
# ops_pricing_guidelines - Diretrizes de preço
# ============================================================
PRICING_GUIDELINES = [
    "Tabela de mão de obra hora/homem: Mecânica geral R$ 120/h. Elétrica R$ 150/h. Injeção eletrônica R$ 150/h. Ar condicionado R$ 130/h. Câmbio automático R$ 180/h. Retífica de motor R$ 160/h. Funilaria básica R$ 100/h.",
    "Política de desconto: Clientes recorrentes (3+ visitas): 10% na mão de obra. Frotas (5+ veículos): 15% geral. Serviços acima de R$ 2.000: negociável até 10%. Revisão completa (combo): 20% no pacote. Nunca dar desconto em peças originais.",
    "Margem de peças: Peças originais: markup de 30-40%. Peças de primeira linha: markup de 40-60%. Peças paralelas: markup de 50-70%. Filtros e consumíveis: markup de 60-80%. Sempre oferecer opção original e alternativa de qualidade.",
    "Pacote de revisão básica (ideal para preventiva): Troca de óleo e filtro + alinhamento e balanceamento + verificação de freios + diagnóstico eletrônico + verificação de correia e mangueiras. Preço pacote: R$ 350 a R$ 550. Desconto de 20% vs serviços individuais.",
    "Pacote de revisão completa: Tudo da revisão básica + troca de filtro de ar + troca de filtro de cabine + limpeza de bicos injetores + higienização do ar condicionado + verificação de bateria. Preço pacote: R$ 650 a R$ 950.",
    "Urgências e emergências: Acréscimo de 30% para serviços sem agendamento que precisam ser feitos no mesmo dia. Guincho parceiro: R$ 150 (até 20km), R$ 8/km adicional. Disponível 24h via WhatsApp.",
    "Orçamento: Sempre apresentar 2 opções ao cliente quando possível - opção com peça original e opção com peça de qualidade equivalente. Detalhar cada item separadamente (peça + mão de obra). Validade do orçamento: 7 dias.",
]


def seed():
    """Seed all operational RAG collections."""
    print("Inicializando ChromaDB...")
    chroma = ChromaManager()
    chroma.initialize_collections()

    print("\nGerando embeddings para ops_client_support...")
    embeddings_support = embedding_service.embed_batch(CLIENT_SUPPORT)
    chroma.add_documents(
        collection_name="ops_client_support",
        documents=CLIENT_SUPPORT,
        embeddings=embeddings_support,
        metadatas=[
            {"topic": "atendimento", "source": "seed", "language": "pt-BR"}
            for _ in CLIENT_SUPPORT
        ],
        ids=[f"support_{i}" for i in range(len(CLIENT_SUPPORT))],
    )
    print(f"  {len(CLIENT_SUPPORT)} documentos adicionados a ops_client_support")

    print("\nGerando embeddings para ops_service_procedures...")
    embeddings_procedures = embedding_service.embed_batch(SERVICE_PROCEDURES)
    chroma.add_documents(
        collection_name="ops_service_procedures",
        documents=SERVICE_PROCEDURES,
        embeddings=embeddings_procedures,
        metadatas=[
            {"topic": "procedimento", "source": "seed", "language": "pt-BR"}
            for _ in SERVICE_PROCEDURES
        ],
        ids=[f"procedure_{i}" for i in range(len(SERVICE_PROCEDURES))],
    )
    print(f"  {len(SERVICE_PROCEDURES)} documentos adicionados a ops_service_procedures")

    print("\nGerando embeddings para ops_pricing_guidelines...")
    embeddings_pricing = embedding_service.embed_batch(PRICING_GUIDELINES)
    chroma.add_documents(
        collection_name="ops_pricing_guidelines",
        documents=PRICING_GUIDELINES,
        embeddings=embeddings_pricing,
        metadatas=[
            {"topic": "preco", "source": "seed", "language": "pt-BR"}
            for _ in PRICING_GUIDELINES
        ],
        ids=[f"pricing_{i}" for i in range(len(PRICING_GUIDELINES))],
    )
    print(f"  {len(PRICING_GUIDELINES)} documentos adicionados a ops_pricing_guidelines")

    print("\n✓ Seed completo!")
    print(f"  Total: {len(CLIENT_SUPPORT) + len(SERVICE_PROCEDURES) + len(PRICING_GUIDELINES)} documentos")

    # Verify
    for name in ["ops_client_support", "ops_service_procedures", "ops_pricing_guidelines"]:
        col = chroma.get_collection(name)
        print(f"  {name}: {col.count()} docs")


if __name__ == "__main__":
    seed()
