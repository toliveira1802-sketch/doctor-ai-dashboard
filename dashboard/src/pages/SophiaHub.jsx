import { useState, useRef, useEffect } from 'react'

const hubAgents = [
  {
    id: 'sophia',
    name: 'Sophia',
    icon: 'S',
    role: 'Orquestradora',
    color: '#f59e0b',
    endpoint: '/api/sofia/command',
    buildBody: (msg) => ({ action: 'chat', message: msg }),
    parseResponse: (data) => data.message || data.error || 'Sem resposta',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    icon: '🦞',
    role: 'WhatsApp Admin',
    color: '#ef4444',
    endpoint: '/api/openclaw/chat',
    buildBody: (msg, sessionId) => ({ message: msg, session_id: sessionId }),
    parseResponse: (data) => data.message || data.response || 'Sem resposta',
  },
  {
    id: 'ana',
    name: 'Ana',
    icon: 'A',
    role: 'Atendimento & Leads',
    color: '#ec4899',
    endpoint: '/api/chat/message',
    buildBody: (msg) => ({ message: msg }),
    parseResponse: (data) => data.response || data.message || 'Sem resposta',
  },
  {
    id: 'simone',
    name: 'Simone',
    icon: 'SI',
    role: 'Inteligência & Custos',
    color: '#06b6d4',
    endpoint: '/api/sofia/command',
    buildBody: (msg) => ({ action: 'chat', message: `[Simone] ${msg}` }),
    parseResponse: (data) => data.message || data.error || 'Sem resposta',
  },
  {
    id: 'insights',
    name: 'Insights',
    icon: 'IN',
    role: 'Análise & Padrões',
    color: '#3b82f6',
    endpoint: '/api/insights/analyze',
    buildBody: (msg) => ({ action: 'analyze_vehicle', brand: msg, model: '', year: '' }),
    parseResponse: (data) => data.analysis || data.message || JSON.stringify(data),
  },
]

const quickActions = {
  sophia: [
    { label: 'Status do sistema', msg: 'Qual o status atual do sistema?' },
    { label: 'Relatório diário', msg: 'Gere um relatório do dia.' },
    { label: 'Próximas ações', msg: 'Quais as próximas ações estratégicas?' },
  ],
  openclaw: [
    { label: '/status', msg: '/status' },
    { label: 'Listar sessões', msg: 'Liste todas as sessões ativas' },
    { label: 'WhatsApp status', msg: 'Qual o status do canal WhatsApp?' },
  ],
  ana: [
    { label: 'Simular atendimento', msg: 'Olá, meu Honda Civic 2020 está com barulho na suspensão.' },
    { label: 'Leads pendentes', msg: 'Quantos leads estão pendentes?' },
  ],
  simone: [
    { label: 'Custos do dia', msg: 'Quanto gastamos com API hoje?' },
    { label: 'Performance', msg: 'Como está a performance dos agentes?' },
  ],
  insights: [
    { label: 'Tendências', msg: 'Quais as tendências do mercado automotivo?' },
    { label: 'Padrões', msg: 'Detecte padrões nos leads recentes.' },
  ],
}

export default function SophiaHub() {
  const [activeAgent, setActiveAgent] = useState('sophia')
  const [histories, setHistories] = useState(
    Object.fromEntries(hubAgents.map(a => [a.id, []]))
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [openclawStatus, setOpenclawStatus] = useState(null)
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

  // Check OpenClaw status on mount
  useEffect(() => {
    fetch('/api/openclaw/status')
      .then(r => r.json())
      .then(setOpenclawStatus)
      .catch(() => setOpenclawStatus({ status: 'offline' }))
  }, [])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = {
      role: 'user',
      content: input,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setHistories((prev) => ({ ...prev, [activeAgent]: [...prev[activeAgent], userMsg] }))
    const msg = input
    setInput('')
    setLoading(true)

    try {
      const body = agent.buildBody(msg, `hub-${activeAgent}`)
      const res = await fetch(agent.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)

      const assistantMsg = {
        role: 'assistant',
        content: agent.parseResponse(data),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }
      setHistories((prev) => ({ ...prev, [activeAgent]: [...prev[activeAgent], assistantMsg] }))
    } catch (e) {
      setHistories((prev) => ({
        ...prev,
        [activeAgent]: [...prev[activeAgent], {
          role: 'error',
          content: `Erro: ${e.message}`,
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
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #030812 0%, #0a0f1a 50%, #030812 100%)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(0,255,255,0.08)', background: 'rgba(0,10,20,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-mono"
              style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}40`, color: agent.color }}
            >
              {agent.icon}
            </div>
            <div>
              <h2 className="text-base font-bold font-mono" style={{ color: agent.color }}>{agent.name}</h2>
              <p className="text-[10px] font-mono" style={{ color: '#00ffff50' }}>{agent.role} — Neural Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearHistory}
              className="text-[10px] px-3 py-1.5 rounded font-mono transition"
              style={{ border: '1px solid rgba(0,255,255,0.1)', color: '#00ffff60' }}
            >
              CLEAR
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e60' }} />
              <span className="text-[9px] font-mono" style={{ color: '#22c55e80' }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Agent Tabs */}
        <div className="flex px-5 gap-1 pb-2 overflow-x-auto">
          {hubAgents.map((a) => {
            const isOC = a.id === 'openclaw'
            const ocOnline = openclawStatus?.status === 'online'
            return (
              <button
                key={a.id}
                onClick={() => setActiveAgent(a.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap"
                style={activeAgent === a.id ? {
                  background: `${a.color}15`,
                  border: `1px solid ${a.color}40`,
                  color: a.color,
                  boxShadow: `0 0 10px ${a.color}10`,
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#6b7280',
                }}
              >
                <span className="text-xs">{a.icon}</span>
                <span>{a.name}</span>
                {isOC && (
                  <span className={`w-1.5 h-1.5 rounded-full ${ocOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                )}
                {histories[a.id]?.length > 0 && (
                  <span
                    className="w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-mono"
                    style={{ background: `${a.color}20`, color: a.color }}
                  >
                    {histories[a.id].length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-5 space-y-3 neural-grid">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold font-mono mb-4 animate-glow-breathe"
              style={{ background: `${agent.color}10`, border: `1px solid ${agent.color}20`, color: agent.color }}
            >
              {agent.icon}
            </div>
            <p className="text-sm font-mono" style={{ color: '#00ffff60' }}>
              Converse com <span style={{ color: agent.color }}>{agent.name}</span>
            </p>
            <p className="text-[10px] font-mono mt-1 text-gray-600">{agent.role}</p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-6 max-w-lg justify-center">
              {(quickActions[activeAgent] || []).map((qa, i) => (
                <button
                  key={i}
                  onClick={() => setInput(qa.msg)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all"
                  style={{
                    border: '1px solid rgba(0,255,255,0.1)',
                    background: 'rgba(0,255,255,0.03)',
                    color: '#00ffff70',
                  }}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div
              className="max-w-[80%] rounded-lg px-4 py-3"
              style={
                m.role === 'user'
                  ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
                  : m.role === 'error'
                  ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '2px solid #ef4444' }
                  : { background: `${agent.color}08`, borderLeft: `2px solid ${agent.color}40` }
              }
            >
              {m.role === 'assistant' && (
                <p className="text-[10px] font-mono font-bold mb-1" style={{ color: agent.color }}>{agent.name}</p>
              )}
              <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed" style={{ color: m.role === 'error' ? '#ef4444' : '#e5e7eb' }}>
                {m.content}
              </p>
              <p className="text-[9px] font-mono mt-1.5 text-right" style={{ color: '#ffffff20' }}>{m.time}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="rounded-lg px-4 py-3" style={{ background: `${agent.color}08`, borderLeft: `2px solid ${agent.color}30` }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agent.color, animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <span className="text-[10px] font-mono" style={{ color: `${agent.color}80` }}>{agent.name} processando...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(0,255,255,0.08)', background: 'rgba(0,10,20,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="flex gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Fale com ${agent.name}...`}
            rows={1}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-mono resize-none focus:outline-none"
            style={{
              background: 'rgba(0,255,255,0.03)',
              border: '1px solid rgba(0,255,255,0.1)',
              color: '#e5e7eb',
              maxHeight: '120px',
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider disabled:opacity-20 transition-all"
            style={{
              background: `${agent.color}20`,
              border: `1px solid ${agent.color}40`,
              color: agent.color,
            }}
          >
            SEND
          </button>
        </div>
        <p className="text-center text-[9px] font-mono mt-2" style={{ color: '#00ffff20' }}>
          Enter → enviar · Shift+Enter → nova linha
        </p>
      </div>
    </div>
  )
}
