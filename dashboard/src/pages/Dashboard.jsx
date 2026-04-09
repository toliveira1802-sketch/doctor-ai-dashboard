import { useState, useEffect } from 'react'
import { sofiaStatus, getActivityStream, getWebhookLogs, getSystemHealth } from '../lib/api'
import Logs from './Logs'

const AGENTS = [
  { id: 'ana', name: 'Ana', role: 'Atendimento & Leads', model: 'GPT-4o-mini', color: '#ec4899', angle: 0 },
  { id: 'sofia', name: 'Sofia', role: 'Orquestradora', model: 'Claude Sonnet', color: '#a855f7', angle: 72 },
  { id: 'sophia', name: 'Sophia', role: 'Hub Multi-Agente', model: 'Claude Sonnet', color: '#f59e0b', angle: 144 },
  { id: 'simone', name: 'Simone', role: 'Blog & Conteúdo', model: 'Claude Haiku', color: '#06b6d4', angle: 216 },
  { id: 'insights', name: 'Insights', role: 'Análise & Padrões', model: 'GPT-4o', color: '#3b82f6', angle: 288 },
]

/* ========== Central Node Network SVG ========== */
function CentralNetwork({ agents, agentStatus }) {
  const cx = 200, cy = 200, r = 120
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
  const connections = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5],
    [5, 0], [6, 1], [7, 2], [8, 3], [8, 4], [9, 0],
    [10, 0], [9, 6], [10, 7], [11, 1], [11, 6], [12, 2],
    [12, 7], [5, 8],
  ]

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-md">
      <defs>
        <radialGradient id="brain-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.06)" />
          <stop offset="70%" stopColor="rgba(99,102,241,0.01)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-strong">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r="180" fill="url(#brain-glow)" />

      {/* Outer elegant ring */}
      <g className="animate-spin-slow" style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: '40s' }}>
        <circle cx={cx} cy={cy} r={r + 50} fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" strokeDasharray="4 16" />
      </g>

      {/* Pulse rings */}
      <circle cx={cx} cy={cy} r={r + 30} fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="0.5" className="animate-ping" style={{animationDuration: '4s'}} />
      <circle cx={cx} cy={cy} r={r + 15} fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="0.5" />

      {/* Brain outline */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.6)" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />

      {/* Neural connections */}
      {connections.map(([a, b], i) => (
        <line
          key={`conn-${i}`}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(99,102,241,0.25)"
          strokeWidth="1"
        />
      ))}

      {/* Animated data flow */}
      {connections.map(([a, b], i) => (
        <line
          key={`flow-${i}`}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(99,102,241,0.7)"
          strokeWidth="1.5"
          strokeDasharray="3 17"
          className="animate-pulse"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: `${2 + (i % 3)}s` }}
        />
      ))}

      {/* Neural nodes */}
      {nodes.map((n, i) => (
        <g key={`node-${i}`}>
          <circle
            cx={n.x} cy={n.y} r="4"
            fill="#ffffff"
            stroke="rgba(99,102,241,0.6)"
            strokeWidth="1"
          />
          <circle cx={n.x} cy={n.y} r="1.5" fill="#a855f7" />
        </g>
      ))}

      {/* Center core */}
      <circle cx={cx} cy={cy} r="12" fill="#ffffff" stroke="rgba(99,102,241,0.6)" strokeWidth="2" filter="url(#glow-strong)" className="animate-pulse" />
      <circle cx={cx} cy={cy} r="4" fill="#6366f1" />

      {/* Agents orbiting */}
      {agents.map((agent, i) => {
        const angle = (agent.angle * Math.PI) / 180
        const orbitR = r + 45
        const ax = cx + Math.cos(angle) * orbitR
        const ay = cy + Math.sin(angle) * orbitR
        const isOnline = agentStatus[agent.id] === 'online'

        return (
          <g key={agent.id}>
            <line x1={cx} y1={cy} x2={ax} y2={ay} stroke={`${agent.color}40`} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={ax} cy={ay} r="20" fill="#ffffff" stroke={isOnline ? `${agent.color}80` : `${agent.color}30`} strokeWidth="1.5" filter="url(#glow)" />
            <text x={ax} y={ay + 1} textAnchor="middle" dominantBaseline="middle" fill="#334155" fontSize="8" fontWeight="600" className="select-none">{agent.name[0]}</text>
            <circle cx={ax + 14} cy={ay - 14} r="3" fill={isOnline ? '#10b981' : '#f43f5e'} />
            <text x={ax} y={ay + 34} textAnchor="middle" fill="#475569" fontSize="8" fontWeight="600" className="select-none">{agent.name}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ========== HUD KPI Card ========== */
function HudKPI({ label, value, sub }) {
  return (
    <div className="glass-card rounded-xl p-5 hover:-translate-y-0.5 transition-transform duration-200">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
        {sub && <span className="text-[11px] font-medium text-slate-400 mt-1">{sub}</span>}
      </div>
    </div>
  )
}

/* ========== System Status Bar ========== */
function SystemBar({ label, value, max, color = '#6366f1' }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-slate-500 w-24 uppercase">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-8 text-right">{pct}%</span>
    </div>
  )
}

/* ========== Agent Detail Row ========== */
function AgentRow({ agent, status }) {
  const isOnline = status === 'online'
  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-slate-50 transition group border border-transparent hover:border-slate-100">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm" style={{ backgroundColor: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}30` }}>
        {agent.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{agent.name}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${agent.color}10`, color: agent.color }}>
            {agent.model}
          </span>
        </div>
        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{agent.role}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <span className="text-[10px] uppercase font-bold" style={{ color: isOnline ? '#10b981' : '#f43f5e' }}>{status}</span>
      </div>
    </div>
  )
}

/* ========== Activity Log ========== */
function ActivityLog() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = () => {
      getActivityStream(15)
        .then(data => setActivities(data.activities || []))
        .catch(() => setActivities([]))
        .finally(() => setLoading(false))
    }
    fetchActivities()
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center">
        <span className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500">Carregando atividades...</span>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500 font-semibold">Nenhuma atividade registrada</p>
        <p className="text-xs text-slate-400 mt-1">As ações dos agentes aparecerão aqui.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 mt-3">
      {activities.map((log, i) => (
        <div key={log.id || i} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition text-sm">
          <span className="text-[11px] font-mono text-slate-400 w-12">{log.time}</span>
          <span className="text-[11px] uppercase font-bold w-16" style={{ color: log.color }}>{log.agent}</span>
          <span className="text-slate-700 font-medium flex-1 truncate">{log.msg}</span>
          {log.type === 'error' && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold shrink-0">ERRO</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    let cancelled = false
    Promise.all([sofiaStatus().catch(() => null)])
      .then(([s]) => {
        if (!cancelled) setStatus(s)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
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
  const agentStatus = { ana: agentData.ana || 'offline', sofia: agentData.sofia || 'offline', sophia: 'online', simone: 'online', insights: agentData.insights || 'offline' }
  const totalOnline = Object.values(agentStatus).filter(v => v === 'online').length

  return (
    <div className="min-h-screen relative p-6 max-w-[1600px] mx-auto pt-8 neural-grid text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System {activeTab === 'overview' ? 'Overview' : 'Logs'}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {activeTab === 'overview' 
                ? 'Monitor real-time agent activities and RAG collections' 
                : 'Webhooks, Health Checks & Event Stream'}
            </p>
          </div>
          
          <div className="flex gap-1 p-1 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'overview'
                  ? 'bg-white shadow-sm text-indigo-600 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'logs'
                  ? 'bg-white shadow-sm text-indigo-600 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              System Logs
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              {time.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : activeTab === 'overview' ? (
        <div className="grid grid-cols-12 gap-6">
          {/* ... (rest of overview grid) ... */}
          {/* Left Column KPIs */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 animate-fade-in-up">
            <HudKPI label="Agents Online" value={`${totalOnline}/${AGENTS.length}`} sub="Active intelligence nodes" />
            <HudKPI label="Study RAG" value={studyTotal} sub="Indexed resources" />
            <HudKPI label="Ops RAG" value={opsTotal} sub="Operational rules" />
            <HudKPI label="Collections" value={collections.length} sub="ChromaDB clusters" />

            <div className="glass-card rounded-xl p-5 mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Resources</p>
              <div className="space-y-4">
                <SystemBar label="Compute" value={totalOnline} max={AGENTS.length} color="#6366f1" />
                <SystemBar label="Memory" value={studyTotal + opsTotal} max={Math.max(studyTotal + opsTotal, 100)} color="#a855f7" />
                <SystemBar label="Storage" value={collections.length} max={10} color="#10b981" />
              </div>
            </div>
          </div>

          {/* Center Visualization */}
          <div className="col-span-12 lg:col-span-6 flex items-center justify-center py-10 lg:py-0">
            <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CentralNetwork agents={AGENTS} agentStatus={agentStatus} />
            </div>
          </div>

          {/* Right Column Agents */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agents</p>
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold">Active</div>
              </div>
              <div className="space-y-2">
                {AGENTS.map(agent => <AgentRow key={agent.id} agent={agent} status={agentStatus[agent.id]} />)}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">RAG Namespaces</p>
              <div className="space-y-3">
                {collections.length > 0 ? collections.map(c => (
                  <div key={c.name} className="flex items-center justify-between group cursor-default">
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition truncate pr-4">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{c.count}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${c.rag === 'study' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                    </div>
                  </div>
                )) : (
                  <p className="text-[11px] text-slate-400 italic font-medium">No namespaces found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Feed */}
          <div className="col-span-12 glass-card rounded-xl p-5 mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Feed</p>
              <button 
                onClick={() => setActiveTab('logs')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition"
              >
                View Full Logs →
              </button>
            </div>
            <ActivityLog />
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <Logs />
        </div>
      )}
    </div>
  )
}
