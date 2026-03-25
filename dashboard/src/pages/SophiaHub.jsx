import { useState, useRef, useEffect } from 'react'

const hubAgents = [
  {
    id: 'sophia',
    name: 'Sophia',
    emoji: '👑',
    role: 'Orquestradora',
    color: '#c8a96e',
    systemPrompt: `Voce e Sophia, a orquestradora central do Doctor Auto Prime.
Coordene agentes, analise metricas, tome decisoes estrategicas.
Tom direto, profissional. Sempre em portugues-BR.`,
  },
  {
    id: 'simone',
    name: 'Simone',
    emoji: '🧠',
    role: 'Inteligencia',
    color: '#6eb5c8',
    systemPrompt: `Voce e Simone, inteligencia do sistema Doctor Auto Prime.
Monitore qualidade, custos, performance. Gere alertas e relatorios.`,
  },
  {
    id: 'ana',
    name: 'Ana',
    emoji: '💬',
    role: 'Atendimento',
    color: '#c86e9a',
    systemPrompt: `Voce e Ana, agente de atendimento da Doctor Auto Prime.
Atenda com empatia. Extraia dados do veiculo. Classifique leads.`,
  },
]

export default function SophiaHub() {
  const [activeAgent, setActiveAgent] = useState('sophia')
  const [histories, setHistories] = useState({ sophia: [], simone: [], ana: [] })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef(null)
  const inputRef = useRef(null)

  const agent = hubAgents.find((a) => a.id === activeAgent)
  const messages = histories[activeAgent] || []

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [activeAgent])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    setHistories((prev) => ({ ...prev, [activeAgent]: [...prev[activeAgent], userMsg] }))
    const msg = input
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/sofia/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', message: msg }),
      })
      const data = await res.json()
      const assistantMsg = {
        role: 'assistant',
        content: data.message || data.error || 'Sem resposta',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }
      setHistories((prev) => ({ ...prev, [activeAgent]: [...prev[activeAgent], assistantMsg] }))
    } catch (e) {
      setHistories((prev) => ({
        ...prev,
        [activeAgent]: [...prev[activeAgent], {
          role: 'error',
          content: `Erro de conexao: ${e.message}`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }],
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clearHistory = () => {
    setHistories((prev) => ({ ...prev, [activeAgent]: [] }))
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">{agent.emoji}</span>
            <div>
              <h2 className="text-base font-bold" style={{ color: agent.color }}>{agent.name}</h2>
              <p className="text-[10px] text-gray-500">{agent.role} — Sophia Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="text-[10px] px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition"
            >
              Limpar
            </button>
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          </div>
        </div>

        {/* Agent Tabs */}
        <div className="flex px-5 gap-1 pb-2">
          {hubAgents.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAgent(a.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeAgent === a.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <span>{a.emoji}</span>
              <span>{a.name}</span>
              {histories[a.id]?.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-gray-700 text-[9px] flex items-center justify-center">
                  {histories[a.id].length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-5 space-y-4" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(200,169,110,0.02) 0%, transparent 70%)' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <span className="text-6xl mb-4 opacity-20">{agent.emoji}</span>
            <p className="text-sm">Converse com <span style={{ color: agent.color }}>{agent.name}</span></p>
            <p className="text-[10px] text-gray-700 mt-1">{agent.role}</p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-6 max-w-md justify-center">
              {activeAgent === 'sophia' && (
                <>
                  <QuickBtn label="Status do sistema" onClick={() => setInput('Qual o status atual do sistema?')} />
                  <QuickBtn label="Relatorio diario" onClick={() => setInput('Gere um relatorio do dia.')} />
                  <QuickBtn label="Proximas acoes" onClick={() => setInput('Quais as proximas acoes estrategicas?')} />
                </>
              )}
              {activeAgent === 'simone' && (
                <>
                  <QuickBtn label="Custos do dia" onClick={() => setInput('Quanto gastamos com API hoje?')} />
                  <QuickBtn label="Performance" onClick={() => setInput('Como esta a performance dos agentes?')} />
                  <QuickBtn label="Alertas" onClick={() => setInput('Tem algum alerta ativo?')} />
                </>
              )}
              {activeAgent === 'ana' && (
                <>
                  <QuickBtn label="Simular atendimento" onClick={() => setInput('Ola, meu carro Honda Civic 2020 esta com barulho na suspensao.')} />
                  <QuickBtn label="Leads pendentes" onClick={() => setInput('Quantos leads estao pendentes?')} />
                  <QuickBtn label="Campanhas ativas" onClick={() => setInput('Quais campanhas estao rodando?')} />
                </>
              )}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              m.role === 'user'
                ? 'bg-gray-800 text-gray-200'
                : m.role === 'error'
                ? 'bg-red-900/20 border border-red-800/50 text-red-400'
                : 'text-gray-200'
            }`}
              style={m.role === 'assistant' ? { background: `${agent.color}15`, borderLeft: `2px solid ${agent.color}40` } : {}}
            >
              {m.role === 'assistant' && (
                <p className="text-[10px] font-medium mb-1" style={{ color: agent.color }}>{agent.name}</p>
              )}
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              <p className="text-[9px] text-gray-600 mt-1 text-right">{m.time}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-3" style={{ background: `${agent.color}10` }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agent.color, animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agent.color, animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agent.color, animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">{agent.name} pensando...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800/50 bg-gray-900/50 backdrop-blur p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Fale com ${agent.name}...`}
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-gray-600"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-30 transition"
            style={{ background: agent.color, color: '#1a1a1a' }}
          >
            Enviar
          </button>
        </div>
        <p className="text-center text-[9px] text-gray-700 mt-2">
          Enter para enviar — Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}

function QuickBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-800 rounded-lg text-[11px] text-gray-500 hover:text-gray-300 transition"
    >
      {label}
    </button>
  )
}
