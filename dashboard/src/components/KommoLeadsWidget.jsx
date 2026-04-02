import { useState, useEffect } from 'react'
import { kimiSync, kimiHealth } from '../lib/api'

const CLS_CONFIG = {
  won:    { label: 'Ganho',      color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  lost:   { label: 'Perdido',    color: '#ef4444', bg: 'bg-rose-500/10',    text: 'text-rose-400' },
  active: { label: 'Ativo',      color: '#3b82f6', bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  new:    { label: 'Novo',       color: '#f59e0b', bg: 'bg-amber-500/10',   text: 'text-amber-400' },
  vacuum: { label: 'Vacuo',      color: '#f97316', bg: 'bg-orange-500/10',  text: 'text-orange-400' },
  stale:  { label: 'Abandonado', color: '#6b7280', bg: 'bg-slate-500/10',   text: 'text-slate-400' },
}

function Badge({ classification }) {
  const cfg = CLS_CONFIG[classification] || { label: classification, bg: 'bg-slate-500/10', text: 'text-slate-400' }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function ScoreBar({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : score >= 20 ? '#f97316' : '#ef4444'
  return (
    <div className="flex items-center gap-2 w-24">
      <div className="flex-1 h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-400 w-6 text-right">{score}</span>
    </div>
  )
}

function FlagPill({ flag }) {
  const colors = {
    VACUO: 'text-orange-400 bg-orange-500/10',
    ABANDONADO: 'text-red-400 bg-red-500/10',
    NOVO: 'text-amber-400 bg-amber-500/10',
    ATIVO_HOJE: 'text-emerald-400 bg-emerald-500/10',
    QUENTE: 'text-rose-400 bg-rose-500/10',
    FOLLOW_UP: 'text-blue-400 bg-blue-500/10',
  }
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${colors[flag] || 'text-slate-400 bg-slate-500/10'}`}>
      {flag}
    </span>
  )
}

function SegmentBar({ segments, total }) {
  const order = ['won', 'active', 'new', 'vacuum', 'stale', 'lost']
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-slate-800/50">
      {order.map(key => {
        const count = segments[key] || 0
        if (!count) return null
        const pct = (count / Math.max(total, 1)) * 100
        return (
          <div
            key={key}
            className="h-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: CLS_CONFIG[key]?.color || '#6b7280' }}
            title={`${CLS_CONFIG[key]?.label}: ${count}`}
          />
        )
      })}
    </div>
  )
}

export default function KommoLeadsWidget() {
  const [leads, setLeads] = useState([])
  const [segments, setSegments] = useState({})
  const [total, setTotal] = useState(0)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')

  // Load health on mount
  useEffect(() => {
    kimiHealth()
      .then(data => {
        setHealth(data)
        setSegments(data.segments || {})
        setTotal(data.total_leads || 0)
      })
      .catch(() => {})
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const result = await kimiSync()
      setLeads(result.vacuum_sample?.concat(result.stale_sample || [], result.new_sample || []) || [])
      setSegments(result.segments || {})
      setTotal(result.total_scraped || 0)
      // Refresh health after sync
      kimiHealth().then(setHealth).catch(() => {})
    } catch (e) {
      setError(e.message)
    } finally {
      setSyncing(false)
    }
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.classification === filter)
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return a.score - b.score
    if (sortBy === 'days') return b.days_since_update - a.days_since_update
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    return 0
  })

  const alerts = health?.alerts || []

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Kommo Leads</h3>
            <p className="text-[10px] text-slate-500">Kimi CRM Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase ${
              health.health === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' :
              health.health === 'warning' ? 'bg-amber-500/10 text-amber-400' :
              'bg-rose-500/10 text-rose-400'
            }`}>
              {health.health}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-semibold hover:bg-indigo-500/20 transition disabled:opacity-50"
          >
            {syncing ? 'Puxando...' : 'Sync 50 leads'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-1 mb-4">
          {alerts.map((a, i) => (
            <div key={i} className={`text-[11px] px-3 py-1.5 rounded-lg font-medium ${
              a.level === 'critical' ? 'bg-rose-500/10 text-rose-400' :
              a.level === 'warning' ? 'bg-amber-500/10 text-amber-400' :
              'bg-blue-500/10 text-blue-400'
            }`}>
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Segment Bar + Stats */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 font-medium">{total} leads no funil</span>
            <div className="flex gap-3">
              {Object.entries(segments).map(([key, count]) => (
                <button
                  key={key}
                  onClick={() => setFilter(filter === key ? 'all' : key)}
                  className={`flex items-center gap-1 text-[10px] font-medium transition ${
                    filter === key ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ color: CLS_CONFIG[key]?.color || '#94a3b8' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CLS_CONFIG[key]?.color || '#94a3b8' }} />
                  {count}
                </button>
              ))}
            </div>
          </div>
          <SegmentBar segments={segments} total={total} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-[11px] px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      {sorted.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Lead</th>
                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Pipeline</th>
                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Status</th>
                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4 cursor-pointer hover:text-slate-300" onClick={() => setSortBy('score')}>
                  Score {sortBy === 'score' && '↑'}
                </th>
                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4 cursor-pointer hover:text-slate-300" onClick={() => setSortBy('days')}>
                  Dias {sortBy === 'days' && '↓'}
                </th>
                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2">Flags</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((lead, i) => (
                <tr key={lead.kommo_lead_id || i} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200 truncate max-w-[160px]">{lead.name || '—'}</span>
                      <Badge classification={lead.classification} />
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-[11px] text-slate-400">{lead.pipeline || '—'}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-[11px] text-slate-400">{lead.status || '—'}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <ScoreBar score={lead.score || 0} />
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-[11px] font-medium ${
                      lead.days_since_update > 30 ? 'text-rose-400' :
                      lead.days_since_update > 7 ? 'text-orange-400' :
                      lead.days_since_update <= 1 ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {lead.days_since_update}d
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {(lead.flags || []).map(f => <FlagPill key={f} flag={f} />)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !syncing && (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400 font-medium">Nenhum lead carregado</p>
          <p className="text-xs text-slate-500 mt-1">Clique em "Sync 50 leads" para puxar do Kommo</p>
        </div>
      )}

      {syncing && (
        <div className="flex items-center gap-2 py-6 justify-center">
          <span className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Puxando leads do Kommo...</span>
        </div>
      )}
    </div>
  )
}
