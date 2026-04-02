import { useState } from 'react'

const defaultAgents = [
  {
    id: 'sophia',
    name: 'Sophia',
    emoji: '👑',
    role: 'Orquestradora',
    model: 'claude-sonnet-4',
    color: 'amber',
    status: 'online',
    description: 'Centro de comando estratégico. Coordena todos os agentes, toma decisões e distribui tarefas.',
    prompt: `Você é Sophia, a orquestradora central do sistema Doctor Auto Prime.
Sua função é coordenar agentes, analisar métricas e tomar decisões estratégicas.
Fale de forma direta, profissional e estratégica. Sempre em português-BR.
Você tem acesso ao status de todos os agentes, RAGs e métricas do sistema.`,
  },
  {
    id: 'simone',
    name: 'Simone',
    emoji: '🧠',
    role: 'Inteligência do Sistema',
    model: 'claude-haiku-3.5',
    color: 'cyan',
    status: 'online',
    description: 'Monitora qualidade, custos e performance. Gera relatórios e alertas proativos.',
    prompt: `Você é Simone, a inteligência do sistema Doctor Auto Prime.
Monitore qualidade de respostas, custos de API, tempo de resposta e métricas.
Gere alertas proativos quando algo sair do padrão. Seja analítica e precisa.`,
  },
  {
    id: 'ana',
    name: 'Ana',
    emoji: '💬',
    role: 'Atendimento ao Cliente',
    model: 'gpt-4o-mini',
    color: 'pink',
    status: 'online',
    description: 'Agente de atendimento ao cliente via WhatsApp. Empática, classifica leads e extrai dados.',
    prompt: `Você é Ana, agente de atendimento da Doctor Auto Prime.
Atenda clientes com empatia e profissionalismo. Extraia dados do veículo (marca, modelo, placa, ano, sintoma).
Classifique leads como hot/warm/cold. Use o RAG operacional para respostas precisas.`,
  },
  {
    id: 'sofia',
    name: 'Sofia',
    emoji: '🔮',
    role: 'Orquestradora RAG',
    model: 'claude-sonnet-4',
    color: 'purple',
    status: 'online',
    description: 'Gerencia RAGs, promove conteúdo entre collections e orquestra agentes do sistema.',
    prompt: `Você é Sofia, orquestradora do sistema multi-agente Doctor Auto AI.
Gerencie RAGs de Estudo e Operacional. Promova conteúdo validado do Estudo para Operacional.
Coordene Ana e Insights. Responda perguntas sobre status do sistema.`,
  },
  {
    id: 'insights',
    name: 'Insights',
    emoji: '📊',
    role: 'Análise e Conteúdo',
    model: 'gpt-4o',
    color: 'blue',
    status: 'online',
    description: 'Analisa veículos, detecta padrões e gera conteúdo para blog automotivo.',
    prompt: `Você é o agente de Insights da Doctor Auto Prime.
Analise veículos, detecte padrões de manutenção e gere conteúdo especializado.
Use dados do RAG de Estudo para fundamentar análises.`,
  },
]

const colorMap = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bgBtn: 'bg-amber-500' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', bgBtn: 'bg-cyan-500' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', bgBtn: 'bg-pink-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', bgBtn: 'bg-purple-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bgBtn: 'bg-blue-500' },
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
    <div className="p-8 max-w-7xl mx-auto text-slate-800">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">IA Agents</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Gerencie os parâmetros e prompts dos seus agentes de inteligência artificial</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const c = colorMap[agent.color]
          const isEditing = editing === agent.id

          return (
            <div key={agent.id} className={`rounded-xl border ${c.border} bg-white shadow-sm hover:shadow-md transition-shadow`}>
              {/* Header */}
              <div className={`p-5 border-b ${c.border} ${c.bg} rounded-t-xl`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{agent.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{agent.name}</h3>
                      <p className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                    <div className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[10px] text-slate-600 font-bold uppercase">{agent.status}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-medium mt-4 leading-relaxed">{agent.description}</p>
                <div className="mt-4 flex">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full bg-white border ${c.border} ${c.text} shadow-sm`}>
                    {agent.model}
                  </span>
                </div>
              </div>

              {/* Prompt */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">System Prompt</p>
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(agent)}
                      className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition"
                    >
                      Editar Prompt
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => savePrompt(agent.id)}
                        className={`text-[11px] font-bold px-4 py-1.5 ${c.bgBtn} hover:opacity-90 rounded-lg text-white shadow-sm transition`}
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-[11px] font-bold px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 transition"
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
                    className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl p-4 text-sm text-slate-700 font-mono resize-y outline-none transition"
                  />
                ) : (
                  <pre className="text-sm text-slate-600 font-mono leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-40 overflow-auto">
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
