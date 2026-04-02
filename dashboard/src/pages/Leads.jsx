import { useState, useEffect } from 'react'
import { getLeads, getLeadStats } from '../lib/api'

const CLASS_STYLES = {
  hot: { bg: '#ef444420', color: '#ef4444', border: '#ef444440', label: 'HOT' },
  warm: { bg: '#f59e0b20', color: '#f59e0b', border: '#f59e0b40', label: 'WARM' },
  cold: { bg: '#3b82f620', color: '#3b82f6', border: '#3b82f640', label: 'COLD' },
}

function StatCard({ label, value, color, sub }) {
  return (
    <div
      className="glass-card rounded-lg p-4 animate-fade-in-up"
      style={{ borderTop: `2px solid ${color}40` }}
    >
      <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: `${color}80` }}>
        {label}
      </p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] font-mono text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function ClassBadge({ classification }) {
  const s = CLASS_STYLES[classification] || CLASS_STYLES.cold
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

function ScoreBar({ score }) {
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#3b82f6'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 6px ${color}40` }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([
      getLeads(100).catch(() => ({ leads: [] })),
      getLeadStats().catch(() => null),
    ]).then(([leadsData, statsData]) => {
      setLeads(leadsData.leads || [])
      setStats(statsData)
      setLoading(false)
    })
  }, [])

  const filtered = filter === 'all' ? leads : leads.filter(l => l.classification === filter)

  return (
    <div className="min-h-screen neural-grid p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-lg font-bold font-mono tracking-wider" style={{ color: '#00ffff' }}>
          CRM LEADS
        </h1>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">
          Pipeline de Vendas — Classificados por IA
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Leads" value={stats?.total || 0} color="#00ffff" sub={`${stats?.today || 0} hoje`} />
        <StatCard label="Hot" value={stats?.by_classification?.hot || 0} color="#ef4444" sub="Urgente" />
        <StatCard label="Warm" value={stats?.by_classification?.warm || 0} color="#f59e0b" sub="Interessado" />
        <StatCard label="Cold" value={stats?.by_classification?.cold || 0} color="#3b82f6" sub="Generico" />
        <StatCard label="Score Medio" value={stats?.avg_score || 0} color="#a855f7" sub="0-100" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Lead List */}
        <div className="col-span-12 lg:col-span-8 space-y-3">
          {/* Filters */}
          <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {['all', 'hot', 'warm', 'cold'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                style={filter === f ? {
                  background: f === 'all' ? 'rgba(0,255,255,0.1)' : `${CLASS_STYLES[f]?.bg || 'rgba(0,255,255,0.1)'}`,
                  border: `1px solid ${f === 'all' ? 'rgba(0,255,255,0.3)' : CLASS_STYLES[f]?.border || 'rgba(0,255,255,0.3)'}`,
                  color: f === 'all' ? '#00ffff' : CLASS_STYLES[f]?.color || '#00ffff',
                } : {
                  background: 'rgba(0,20,40,0.4)',
                  border: '1px solid rgba(0,255,255,0.06)',
                  color: '#6b7280',
                }}
              >
                {f === 'all' ? 'Todos' : f.toUpperCase()} {f !== 'all' && `(${leads.filter(l => l.classification === f).length})`}
              </button>
            ))}
          </div>

          {/* Lead Table */}
          <div className="glass-card rounded-lg overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {loading ? (
              <div className="p-8 text-center">
                <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block" />
                <p className="text-[10px] font-mono text-gray-500 mt-2">Carregando leads...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-mono text-gray-500">Nenhum lead encontrado</p>
                <p className="text-[10px] font-mono text-gray-600 mt-1">Os leads aparecem quando clientes interagem com a Ana</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {filtered.map((lead, i) => (
                  <div
                    key={lead.id || i}
                    onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.02]"
                    style={selected?.id === lead.id ? { background: 'rgba(0,255,255,0.03)', borderLeft: '2px solid #00ffff40' } : {}}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-gray-200 truncate">
                          {lead.client_name || lead.external_client_id || `Lead #${lead.id?.slice(0, 8)}`}
                        </span>
                        <ClassBadge classification={lead.classification} />
                      </div>
                      <div className="flex items-center gap-3">
                        {lead.vehicle_brand && (
                          <span className="text-[10px] font-mono text-gray-500">
                            {lead.vehicle_brand} {lead.vehicle_model} {lead.vehicle_year}
                          </span>
                        )}
                        {lead.channel && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,255,0.05)', color: '#00ffff80' }}>
                            {lead.channel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-32">
                      <ScoreBar score={lead.score || 0} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono text-gray-500">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : ''}
                      </p>
                      <p className="text-[9px] font-mono text-gray-600">
                        {lead.created_at ? new Date(lead.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Lead Detail */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {selected ? (
            <div className="glass-card rounded-lg p-4 animate-fade-in-up sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#00ffff60' }}>
                  Detalhes do Lead
                </p>
                <ClassBadge classification={selected.classification} />
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Nome', value: selected.client_name },
                  { label: 'Telefone', value: selected.client_phone },
                  { label: 'Email', value: selected.client_email },
                  { label: 'Veiculo', value: [selected.vehicle_brand, selected.vehicle_model, selected.vehicle_year].filter(Boolean).join(' ') },
                  { label: 'Placa', value: selected.vehicle_plate },
                  { label: 'Canal', value: selected.channel },
                  { label: 'Problema', value: selected.problem_description },
                  { label: 'Raciocinio IA', value: selected.reasoning },
                ].filter(f => f.value).map(f => (
                  <div key={f.label}>
                    <p className="text-[9px] font-mono uppercase tracking-widest mb-0.5" style={{ color: '#00ffff40' }}>{f.label}</p>
                    <p className="text-xs font-mono text-gray-300">{f.value}</p>
                  </div>
                ))}

                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#00ffff40' }}>Score</p>
                  <ScoreBar score={selected.score || 0} />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-lg p-6 text-center animate-fade-in-up">
              <div className="text-3xl mb-3" style={{ color: '#00ffff20' }}>&#9776;</div>
              <p className="text-xs font-mono text-gray-500">Selecione um lead para ver detalhes</p>
            </div>
          )}

          {/* Channel breakdown */}
          {stats && (
            <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
                Por Canal
              </p>
              <div className="space-y-2">
                {[
                  { label: 'WhatsApp', count: stats.by_channel?.whatsapp || 0, color: '#25D366' },
                  { label: 'Instagram', count: stats.by_channel?.instagram || 0, color: '#E1306C' },
                  { label: 'Facebook', count: stats.by_channel?.facebook || 0, color: '#1877F2' },
                  { label: 'Dashboard', count: stats.by_channel?.dashboard || 0, color: '#00ffff' },
                ].map(ch => (
                  <div key={ch.label} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: ch.color }} />
                      <span className="text-[10px] font-mono text-gray-400">{ch.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: ch.color }}>{ch.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
