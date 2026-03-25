import { useState } from 'react'

const defaultAgents = [
  {
    id: 'sophia',
    name: 'Sophia',
    emoji: '👑',
    role: 'Orquestradora',
    model: 'claude-sonnet-4-20250514',
    color: 'amber',
    status: 'online',
    description: 'Centro de comando estrategico. Coordena todos os agentes, toma decisoes e distribui tarefas.',
    prompt: `Voce e Sophia, a orquestradora central do sistema Doctor Auto Prime.
Sua funcao e coordenar agentes, analisar metricas e tomar decisoes estrategicas.
Fale de forma direta, profissional e estrategica. Sempre em portugues-BR.
Voce tem acesso ao status de todos os agentes, RAGs e metricas do sistema.`,
  },
  {
    id: 'simone',
    name: 'Simone',
    emoji: '🧠',
    role: 'Inteligencia do Sistema',
    model: 'claude-haiku-4-5-20251001',
    color: 'cyan',
    status: 'online',
    description: 'Monitora qualidade, custos e performance. Gera relatorios e alertas proativos.',
    prompt: `Voce e Simone, a inteligencia do sistema Doctor Auto Prime.
Monitore qualidade de respostas, custos de API, tempo de resposta e metricas.
Gere alertas proativos quando algo sair do padrao. Seja analitica e precisa.`,
  },
  {
    id: 'ana',
    name: 'Ana',
    emoji: '💬',
    role: 'Atendimento ao Cliente',
    model: 'gpt-4o-mini',
    color: 'pink',
    status: 'online',
    description: 'Agente de atendimento ao cliente via WhatsApp. Empatica, classifica leads e extrai dados.',
    prompt: `Voce e Ana, agente de atendimento da Doctor Auto Prime.
Atenda clientes com empatia e profissionalismo. Extraia dados do veiculo (marca, modelo, placa, ano, sintoma).
Classifique leads como hot/warm/cold. Use o RAG operacional para respostas precisas.`,
  },
  {
    id: 'sofia',
    name: 'Sofia',
    emoji: '🔮',
    role: 'Orquestradora RAG',
    model: 'claude-sonnet-4-20250514',
    color: 'purple',
    status: 'online',
    description: 'Gerencia RAGs, promove conteudo entre collections e orquestra agentes do sistema multi-agente.',
    prompt: `Voce e Sofia, orquestradora do sistema multi-agente Doctor Auto AI.
Gerencie RAGs de Estudo e Operacional. Promova conteudo validado do Estudo para Operacional.
Coordene Ana e Insights. Responda perguntas sobre status do sistema.`,
  },
  {
    id: 'insights',
    name: 'Insights',
    emoji: '📊',
    role: 'Analise e Conteudo',
    model: 'gpt-4o',
    color: 'blue',
    status: 'online',
    description: 'Analisa veiculos, detecta padroes e gera conteudo para blog automotivo.',
    prompt: `Voce e o agente de Insights da Doctor Auto Prime.
Analise veiculos, detecte padroes de manutencao e gere conteudo especializado.
Use dados do RAG de Estudo para fundamentar analises.`,
  },
]

const colorMap = {
  amber: { bg: 'bg-amber-500', border: 'border-amber-500/30', glow: 'shadow-amber-500/10', text: 'text-amber-500', bgLight: 'bg-amber-500/10' },
  cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/10', text: 'text-cyan-500', bgLight: 'bg-cyan-500/10' },
  pink: { bg: 'bg-pink-500', border: 'border-pink-500/30', glow: 'shadow-pink-500/10', text: 'text-pink-500', bgLight: 'bg-pink-500/10' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500/30', glow: 'shadow-purple-500/10', text: 'text-purple-500', bgLight: 'bg-purple-500/10' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-500/30', glow: 'shadow-blue-500/10', text: 'text-blue-500', bgLight: 'bg-blue-500/10' },
}

export default function IAAgents() {
  const [agents, setAgents] = useState(defaultAgents)
  const [editing, setEditing] = useState(null)
  const [editPrompt, setEditPrompt] = useState('')

  const startEdit = (agent) => {
    setEditing(agent.id)
    setEditPrompt(agent.prompt)
  }

  const savePrompt = (agentId) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, prompt: editPrompt } : a))
    setEditing(null)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">IA Agents</h2>
        <p className="text-sm text-gray-500 mt-1">Gerencie seus agentes de inteligencia artificial</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {agents.map((agent) => {
          const c = colorMap[agent.color]
          const isEditing = editing === agent.id

          return (
            <div key={agent.id} className={`rounded-xl border ${c.border} bg-gray-900/50 overflow-hidden shadow-lg ${c.glow}`}>
              {/* Header */}
              <div className="p-5 border-b border-gray-800/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{agent.emoji}</span>
                    <div>
                      <h3 className="text-lg font-bold">{agent.name}</h3>
                      <p className={`text-xs ${c.text} font-medium`}>{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-brand-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] text-gray-500 uppercase">{agent.status}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">{agent.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.bgLight} ${c.text} font-medium`}>{agent.model}</span>
                </div>
              </div>

              {/* Prompt */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">System Prompt</p>
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(agent)}
                      className="text-[10px] px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition"
                    >
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => savePrompt(agent.id)}
                        className={`text-[10px] px-2 py-1 ${c.bg} rounded text-white font-medium transition`}
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-[10px] px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    rows={6}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono resize-y focus:outline-none focus:border-gray-600"
                  />
                ) : (
                  <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap bg-gray-800/50 rounded-lg p-3 max-h-32 overflow-auto">
                    {agent.prompt}
                  </pre>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
