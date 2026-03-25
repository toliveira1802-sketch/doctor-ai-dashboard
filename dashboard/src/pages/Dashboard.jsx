import { useState, useEffect } from 'react'
import { sofiaStatus } from '../lib/api'

const AGENTS = [
  { id: 'ana', name: 'Ana', role: 'Atendimento & Leads', model: 'GPT-4o-mini', color: '#ec4899', angle: 0 },
  { id: 'sofia', name: 'Sofia', role: 'Orquestradora', model: 'Claude Sonnet', color: '#a855f7', angle: 72 },
  { id: 'sophia', name: 'Sophia', role: 'Hub Multi-Agente', model: 'Claude Sonnet', color: '#f59e0b', angle: 144 },
  { id: 'simone', name: 'Simone', role: 'Blog & Conteúdo', model: 'Claude Haiku', color: '#06b6d4', angle: 216 },
  { id: 'insights', name: 'Insights', role: 'Análise & Padrões', model: 'GPT-4o', color: '#3b82f6', angle: 288 },
]

/* ========== Neural Brain SVG ========== */
function NeuralBrain({ agents, agentStatus }) {
  const cx = 200, cy = 200, r = 120
  // Neural nodes inside the brain
  const nodes = [
    { x: 200, y: 160, delay: 0 },
    { x: 170, y: 190, delay: 0.3 },
    { x: 230, y: 190, delay: 0.6 },
    { x: 185, y: 220, delay: 0.9 },
    { x: 215, y: 220, delay: 1.2 },
    { x: 200, y: 200, delay: 0.5 },
    { x: 160, y: 170, delay: 1.5 },
    { x: 240, y: 170, delay: 1.8 },
    { x: 200, y: 240, delay: 0.7 },
    { x: 175, y: 155, delay: 1.1 },
    { x: 225, y: 155, delay: 1.4 },
    { x: 150, y: 200, delay: 0.2 },
    { x: 250, y: 200, delay: 0.8 },
  ]

  // Neural connections between nodes
  const connections = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5],
    [5, 0], [6, 1], [7, 2], [8, 3], [8, 4], [9, 0],
    [10, 0], [9, 6], [10, 7], [11, 1], [11, 6], [12, 2],
    [12, 7], [5, 8],
  ]

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <radialGradient id="brain-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,255,255,0.12)" />
          <stop offset="70%" stopColor="rgba(0,255,255,0.03)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-strong">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r="180" fill="url(#brain-glow)" />

      {/* Outer scanning ring */}
      <g className="animate-scan-sweep" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r + 50} fill="none" stroke="rgba(0,255,255,0.06)" strokeWidth="1" strokeDasharray="8 12" />
        <line x1={cx} y1={cy - r - 50} x2={cx} y2={cy - r - 35} stroke="rgba(0,255,255,0.4)" strokeWidth="2" />
      </g>

      {/* Pulse rings */}
      <circle cx={cx} cy={cy} r={r + 30} fill="none" stroke="rgba(0,255,255,0.08)" strokeWidth="0.5" className="animate-pulse-ring" />
      <circle cx={cx} cy={cy} r={r + 15} fill="none" stroke="rgba(0,255,255,0.12)" strokeWidth="0.5" className="animate-pulse-ring-reverse" />

      {/* Brain outline */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(0,255,255,0.02)" stroke="rgba(0,255,255,0.15)" strokeWidth="1" filter="url(#glow)" />

      {/* Neural connections */}
      {connections.map(([a, b], i) => (
        <line
          key={`conn-${i}`}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(0,255,255,0.12)"
          strokeWidth="0.8"
        />
      ))}

      {/* Animated data flow on connections */}
      {connections.map(([a, b], i) => (
        <line
          key={`flow-${i}`}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(0,255,255,0.5)"
          strokeWidth="1.5"
          strokeDasharray="3 17"
          className="animate-neural-signal"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: `${2 + (i % 3)}s` }}
        />
      ))}

      {/* Neural nodes */}
      {nodes.map((n, i) => (
        <g key={`node-${i}`}>
          <circle
            cx={n.x} cy={n.y} r="6"
            fill="rgba(0,255,255,0.08)"
            stroke="rgba(0,255,255,0.4)"
            strokeWidth="0.8"
            className="animate-node-pulse"
            style={{ animationDelay: `${n.delay}s` }}
            filter="url(#glow)"
          />
          <circle
            cx={n.x} cy={n.y} r="2"
            fill="rgba(0,255,255,0.9)"
            className="animate-node-pulse"
            style={{ animationDelay: `${n.delay}s` }}
          />
        </g>
      ))}

      {/* Center core */}
      <circle cx={cx} cy={cy} r="8" fill="rgba(0,255,255,0.15)" stroke="rgba(0,255,255,0.6)" strokeWidth="1.5" filter="url(#glow-strong)" className="animate-glow-breathe" style={{ color: '#00ffff' }} />
      <circle cx={cx} cy={cy} r="3" fill="#00ffff" className="animate-node-pulse" />

      {/* Agent nodes orbiting */}
      {agents.map((agent, i) => {
        const angle = (agent.angle * Math.PI) / 180
        const orbitR = r + 45
        const ax = cx + Math.cos(angle) * orbitR
        const ay = cy + Math.sin(angle) * orbitR
        const isOnline = agentStatus[agent.id] === 'online'

        return (
          <g key={agent.id}>
            {/* Connection line to center */}
            <line
              x1={cx} y1={cy} x2={ax} y2={ay}
              stroke={`${agent.color}30`}
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
            <line
              x1={cx} y1={cy} x2={ax} y2={ay}
              stroke={`${agent.color}80`}
              strokeWidth="1"
              strokeDasharray="2 18"
              className="animate-neural-signal"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
            {/* Agent node */}
            <circle
              cx={ax} cy={ay} r="18"
              fill={`${agent.color}15`}
              stroke={isOnline ? `${agent.color}90` : `${agent.color}30`}
              strokeWidth="1.5"
              filter="url(#glow)"
            />
            <circle
              cx={ax} cy={ay} r="10"
              fill={`${agent.color}30`}
              stroke={`${agent.color}60`}
              strokeWidth="0.5"
            />
            <text
              x={ax} y={ay + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="7"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {agent.name[0]}
            </text>
            {/* Status dot */}
            <circle
              cx={ax + 12} cy={ay - 12} r="3"
              fill={isOnline ? '#22c55e' : '#ef4444'}
              className={isOnline ? 'animate-node-pulse' : ''}
              style={{ animationDelay: `${i * 0.3}s` }}
            />
            {/* Agent label */}
            <text
              x={ax} y={ay + 28}
              textAnchor="middle"
              fill={`${agent.color}`}
              fontSize="7"
              fontWeight="600"
              fontFamily="monospace"
              opacity="0.8"
            >
              {agent.name}
            </text>
          </g>
        )
      })}

      {/* Center label */}
      <text x={cx} y={cy + r + 80} textAnchor="middle" fill="rgba(0,255,255,0.5)" fontSize="8" fontFamily="monospace" letterSpacing="3" className="animate-hud-flicker">
        NEURAL CORE ACTIVE
      </text>
    </svg>
  )
}

/* ========== HUD KPI Card ========== */
function HudKPI({ label, value, sub, color = '#00ffff', delay = 0 }) {
  return (
    <div
      className="glass-card rounded-lg p-4 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, borderLeft: `2px solid ${color}40` }}
    >
      <p className="text-[10px] uppercase tracking-widest font-mono" style={{ color: `${color}80` }}>{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-2xl font-bold font-mono animate-hud-flicker" style={{ color }}>{value}</span>
      </div>
      {sub && <p className="text-[10px] text-gray-500 font-mono mt-1">{sub}</p>}
    </div>
  )
}

/* ========== System Status Bar ========== */
function SystemBar({ label, value, max, color = '#00ffff' }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-gray-500 font-mono w-20 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}40, ${color})` }}
        />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{pct}%</span>
    </div>
  )
}

/* ========== Agent Detail Row ========== */
function AgentRow({ agent, status }) {
  const isOnline = status === 'online'
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition group">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-white"
        style={{ background: `${agent.color}25`, border: `1px solid ${agent.color}40` }}
      >
        {agent.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium font-mono">{agent.name}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${agent.color}15`, color: agent.color }}>
            {agent.model}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 font-mono">{agent.role}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'animate-pulse' : ''}`} style={{ background: isOnline ? '#22c55e' : '#ef4444' }} />
        <span className="text-[10px] font-mono uppercase" style={{ color: isOnline ? '#22c55e' : '#ef4444' }}>{status}</span>
      </div>
    </div>
  )
}

/* ========== Activity Log ========== */
function ActivityLog() {
  const logs = [
    { time: '14:32', agent: 'Ana', msg: 'Lead classificado: João Silva → HOT', color: '#ec4899' },
    { time: '14:28', agent: 'Sofia', msg: 'Content promoted: 5 docs → operational', color: '#a855f7' },
    { time: '14:15', agent: 'Insights', msg: 'Padrão detectado: Hilux 2024 +23% buscas', color: '#3b82f6' },
    { time: '13:50', agent: 'Simone', msg: 'Blog gerado: "Tendências Automotivas Q1"', color: '#06b6d4' },
    { time: '13:30', agent: 'Sophia', msg: 'Multi-agent task concluída: análise mercado', color: '#f59e0b' },
  ]

  return (
    <div className="space-y-1">
      {logs.map((log, i) => (
        <div
          key={i}
          className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition animate-log-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <span className="text-[10px] text-gray-600 font-mono w-10 mt-0.5">{log.time}</span>
          <span className="text-[10px] font-bold font-mono w-14" style={{ color: log.color }}>{log.agent}</span>
          <span className="text-xs text-gray-400 font-mono">{log.msg}</span>
        </div>
      ))}
    </div>
  )
}

/* ========== Main Dashboard ========== */
export default function Dashboard() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    sofiaStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const agentData = status?.agents || {}
  const rag = status?.rag || {}
  const collections = rag.collections || []
  const studyTotal = rag.study_total || 0
  const opsTotal = rag.operational_total || 0
  const agentStatus = {
    ana: agentData.ana || 'offline',
    sofia: agentData.sofia || 'offline',
    sophia: 'online',
    simone: 'online',
    insights: agentData.insights || 'offline',
  }

  const totalOnline = Object.values(agentStatus).filter(v => v === 'online').length

  return (
    <div className="min-h-screen neural-grid p-6 max-w-[1600px] mx-auto">
      {/* Top HUD Bar */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-wider" style={{ color: '#00ffff' }}>
            DOCTOR AUTO AI
          </h1>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">Neural Command Center v2.0</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-mono uppercase">System Online</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono" style={{ color: '#00ffff80' }}>
              {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[10px] text-gray-600 font-mono">
              {time.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-16 h-16 border border-cyan-500/30 rounded-full animate-spin" style={{ borderTopColor: '#00ffff' }} />
          <p className="text-sm font-mono animate-hud-flicker" style={{ color: '#00ffff60' }}>Inicializando neural core...</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          {/* Left Panel — KPIs */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <HudKPI label="Agentes Online" value={`${totalOnline}/${AGENTS.length}`} sub="neural nodes active" color="#22c55e" delay={0} />
            <HudKPI label="RAG Estudo" value={studyTotal} sub="documentos indexados" color="#f59e0b" delay={100} />
            <HudKPI label="RAG Operacional" value={opsTotal} sub="documentos indexados" color="#a855f7" delay={200} />
            <HudKPI label="Collections" value={collections.length} sub="ChromaDB clusters" color="#06b6d4" delay={300} />

            {/* System bars */}
            <div className="glass-card rounded-lg p-4 space-y-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">System Resources</p>
              <SystemBar label="Neural" value={totalOnline} max={AGENTS.length} color="#00ffff" />
              <SystemBar label="RAG" value={studyTotal + opsTotal} max={Math.max(studyTotal + opsTotal, 100)} color="#a855f7" />
              <SystemBar label="Memory" value={collections.length} max={10} color="#f59e0b" />
            </div>
          </div>

          {/* Center — Neural Brain */}
          <div className="col-span-12 lg:col-span-6 flex items-center justify-center">
            <div className="w-full max-w-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <NeuralBrain agents={AGENTS} agentStatus={agentStatus} />
            </div>
          </div>

          {/* Right Panel — Agents */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">Neural Agents</p>
              <div className="space-y-1">
                {AGENTS.map(agent => (
                  <AgentRow key={agent.id} agent={agent} status={agentStatus[agent.id]} />
                ))}
              </div>
            </div>

            {/* Collections mini */}
            <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">RAG Collections</p>
              <div className="space-y-2">
                {collections.length > 0 ? collections.map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400 truncate">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono" style={{ color: c.rag === 'study' ? '#f59e0b' : '#a855f7' }}>{c.count}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] text-gray-600 font-mono">Aguardando seed...</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom — Activity Log */}
          <div className="col-span-12 glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Activity Stream</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[10px] text-gray-600 font-mono">LIVE</span>
              </div>
            </div>
            <ActivityLog />
          </div>
        </div>
      )}
    </div>
  )
}
