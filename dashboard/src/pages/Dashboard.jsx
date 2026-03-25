import { useState, useEffect } from 'react'
import { sofiaStatus, getDashboardMetrics } from '../lib/api'

function KPI({ label, value, delta, color = 'brand', sub }) {
  const colors = {
    brand: 'from-brand-500/20 to-brand-500/5 border-brand-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
  }
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colors[color]} p-5`}>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      <div className="flex items-end gap-2 mt-2">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {delta && (
          <span className={`text-xs font-medium mb-1 ${delta > 0 ? 'text-brand-500' : 'text-red-400'}`}>
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function AgentBadge({ name, model, status, color }) {
  const dotColor = status === 'online' ? 'bg-brand-500' : 'bg-red-500'
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-xs font-bold text-white`}>
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-[10px] text-gray-500">{model}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColor} ${status === 'online' ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] text-gray-500 uppercase">{status}</span>
      </div>
    </div>
  )
}

function CronStatus({ name, schedule, lastRun, status }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-800/50">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-[10px] text-gray-500 font-mono">{schedule}</p>
      </div>
      <div className="text-right">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          status === 'ok' ? 'bg-brand-500/10 text-brand-500' : 'bg-red-500/10 text-red-400'
        }`}>{status}</span>
        {lastRun && <p className="text-[10px] text-gray-600 mt-1">{lastRun}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sofiaStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [])

  const agents = status?.agents || {}
  const rag = status?.rag || {}
  const collections = rag.collections || []
  const studyTotal = rag.study_total || 0
  const opsTotal = rag.operational_total || 0

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Visao geral do sistema Doctor Auto AI</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-600 border-t-brand-500 rounded-full animate-spin" />
          Carregando metricas...
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPI label="Agentes Ativos" value={Object.values(agents).filter(v => v === 'online').length} sub={`de ${Object.keys(agents).length} agentes`} color="brand" />
            <KPI label="RAG Estudo" value={studyTotal} sub="documentos indexados" color="amber" />
            <KPI label="RAG Operacional" value={opsTotal} sub="documentos indexados" color="purple" />
            <KPI label="Collections" value={collections.length} sub="ChromaDB" color="blue" />
          </div>

          {/* Grid: Agents + Crons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Agents */}
            <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Agentes IA</h3>
              <div className="space-y-2">
                <AgentBadge name="Ana" model="GPT-4o-mini" status={agents.ana || 'offline'} color="bg-pink-600" />
                <AgentBadge name="Sofia" model="Claude Sonnet" status={agents.sofia || 'offline'} color="bg-purple-600" />
                <AgentBadge name="Sophia" model="Claude Sonnet" status="online" color="bg-amber-600" />
                <AgentBadge name="Simone" model="Claude Haiku" status="online" color="bg-cyan-600" />
                <AgentBadge name="Insights" model="GPT-4o" status={agents.insights || 'offline'} color="bg-blue-600" />
              </div>
            </div>

            {/* Crons */}
            <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Cron Jobs</h3>
              <div className="space-y-2">
                <CronStatus name="Vigilante" schedule="*/5 * * * *" lastRun="ha 2 min" status="ok" />
                <CronStatus name="Reativador" schedule="0 8 * * *" lastRun="hoje 08:00" status="ok" />
              </div>
              <div className="mt-4 p-3 rounded-lg bg-gray-800/30 border border-gray-800/50">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Ultima atividade</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400"><span className="text-brand-500">Vigilante:</span> 3 leads parados, 0 criticos</p>
                  <p className="text-xs text-gray-400"><span className="text-amber-500">Reativador:</span> 12 leads reativados, 2 war_room</p>
                </div>
              </div>
            </div>
          </div>

          {/* RAG Collections Table */}
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800/50">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">RAG Collections</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800/50 text-gray-600 text-[10px] uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Collection</th>
                  <th className="text-left px-5 py-3">Tipo</th>
                  <th className="text-right px-5 py-3">Docs</th>
                  <th className="text-right px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr key={c.name} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition">
                    <td className="px-5 py-3 font-mono text-xs">{c.name}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        c.rag === 'study'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-purple-500/10 text-purple-500'
                      }`}>{c.rag}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs">{c.count}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />
                    </td>
                  </tr>
                ))}
                {collections.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-600 text-xs">
                      Nenhuma collection encontrada — backend offline
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
