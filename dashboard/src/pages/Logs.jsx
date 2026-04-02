import { useState, useEffect } from 'react'
import { getWebhookLogs, getSystemHealth } from '../lib/api'

function HealthDot({ status }) {
  const colors = {
    healthy: '#22c55e',
    online: '#22c55e',
    degraded: '#f59e0b',
    unhealthy: '#ef4444',
    unreachable: '#ef4444',
    offline: '#6b7280',
    not_configured: '#4b5563',
    error: '#ef4444',
  }
  const color = colors[status] || '#6b7280'
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
      />
      <span className="text-[10px] font-mono uppercase" style={{ color }}>{status || 'unknown'}</span>
    </div>
  )
}

function LogBadge({ status }) {
  const styles = {
    success: { bg: '#22c55e15', color: '#22c55e', text: 'OK' },
    error: { bg: '#ef444415', color: '#ef4444', text: 'ERR' },
    processed: { bg: '#22c55e15', color: '#22c55e', text: 'OK' },
    failed: { bg: '#ef444415', color: '#ef4444', text: 'FAIL' },
  }
  const s = styles[status] || styles.success
  return (
    <span className="text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase" style={{ background: s.bg, color: s.color }}>
      {s.text}
    </span>
  )
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      getWebhookLogs(100).catch(() => ({ logs: [] })),
      getSystemHealth().catch(() => null),
    ]).then(([logsData, healthData]) => {
      setLogs(logsData.logs || [])
      setHealth(healthData)
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.source === filter)
  const sources = [...new Set(logs.map(l => l.source).filter(Boolean))]

  return (
    <div className="min-h-screen neural-grid p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-wider" style={{ color: '#00ffff' }}>
            SYSTEM LOGS
          </h1>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">
            Webhooks, Health Checks & Event Stream
          </p>
        </div>
        <button
          onClick={loadData}
          className="rounded-lg px-4 py-2 text-[10px] font-mono uppercase tracking-wider transition-all hover:bg-white/[0.03]"
          style={{ border: '1px solid rgba(0,255,255,0.15)', color: '#00ffff80' }}
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Health Status Cards */}
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
          {health ? (
            <>
              <div className="glass-card rounded-lg p-4" style={{ borderTop: '2px solid rgba(0,255,255,0.2)' }}>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#00ffff60' }}>Gateway</p>
                <HealthDot status={health.status} />
                <p className="text-[9px] font-mono text-gray-600 mt-1">
                  uptime: {health.uptime_s ? `${Math.floor(health.uptime_s / 3600)}h ${Math.floor((health.uptime_s % 3600) / 60)}m` : '?'}
                </p>
              </div>
              <div className="glass-card rounded-lg p-4" style={{ borderTop: '2px solid rgba(168,85,247,0.2)' }}>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#a855f760' }}>Python Agents</p>
                <HealthDot status={health.checks?.python?.status} />
                {health.checks?.python?.response_ms && (
                  <p className="text-[9px] font-mono text-gray-600 mt-1">{health.checks.python.response_ms}ms</p>
                )}
              </div>
              <div className="glass-card rounded-lg p-4" style={{ borderTop: '2px solid rgba(34,197,94,0.2)' }}>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#22c55e60' }}>Supabase</p>
                <HealthDot status={health.checks?.supabase?.status} />
                {health.checks?.supabase?.response_ms && (
                  <p className="text-[9px] font-mono text-gray-600 mt-1">{health.checks.supabase.response_ms}ms</p>
                )}
              </div>
              <div className="glass-card rounded-lg p-4" style={{ borderTop: '2px solid rgba(245,158,11,0.2)' }}>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#f59e0b60' }}>OpenClaw</p>
                <HealthDot status={health.checks?.openclaw?.status} />
                <div className="flex gap-3 mt-1">
                  {health.checks?.webhooks?.kommo?.configured && (
                    <span className="text-[8px] font-mono text-gray-600">Kommo: ON</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-4 glass-card rounded-lg p-4 text-center">
              <p className="text-[10px] font-mono text-gray-500">Carregando health checks...</p>
            </div>
          )}
        </div>

        {/* Log List */}
        <div className="col-span-12 lg:col-span-9 space-y-3">
          {/* Filters */}
          <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <button
              onClick={() => setFilter('all')}
              className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all"
              style={filter === 'all' ? {
                background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.25)', color: '#00ffff',
              } : {
                background: 'rgba(0,20,40,0.4)', border: '1px solid rgba(0,255,255,0.06)', color: '#6b7280',
              }}
            >
              Todos ({logs.length})
            </button>
            {sources.map(src => (
              <button
                key={src}
                onClick={() => setFilter(src)}
                className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all"
                style={filter === src ? {
                  background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.25)', color: '#00ffff',
                } : {
                  background: 'rgba(0,20,40,0.4)', border: '1px solid rgba(0,255,255,0.06)', color: '#6b7280',
                }}
              >
                {src} ({logs.filter(l => l.source === src).length})
              </button>
            ))}
          </div>

          {/* Logs */}
          <div className="glass-card rounded-lg overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {loading ? (
              <div className="p-8 text-center">
                <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-mono text-gray-500">Nenhum log encontrado</p>
                <p className="text-[10px] font-mono text-gray-600 mt-1">Logs aparecem quando webhooks sao recebidos</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03] max-h-[600px] overflow-y-auto">
                {filtered.map((log, i) => (
                  <div key={log.id || i}>
                    <div
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all hover:bg-white/[0.02]"
                    >
                      <LogBadge status={log.status} />
                      <span className="text-[10px] font-mono font-semibold w-16 shrink-0" style={{ color: '#f59e0b' }}>
                        {log.source || 'system'}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 flex-1 truncate">
                        {log.error || log.result?.message || log.payload?.message || 'Event processed'}
                      </span>
                      {log.duration_ms != null && (
                        <span className="text-[9px] font-mono text-gray-600 shrink-0">{log.duration_ms}ms</span>
                      )}
                      <span className="text-[9px] font-mono text-gray-600 shrink-0 w-20 text-right">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                      <span className="text-[10px] text-gray-600">{expanded === i ? '\u25B4' : '\u25BE'}</span>
                    </div>
                    {expanded === i && (
                      <div className="px-4 pb-3 animate-fade-in-up">
                        <pre className="text-[10px] font-mono text-gray-500 p-3 rounded-lg overflow-auto max-h-48" style={{ background: 'rgba(0,0,0,0.3)' }}>
                          {JSON.stringify({ payload: log.payload, result: log.result, error: log.error }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Summary */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Resumo
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-mono text-gray-600 mb-0.5">Total de Eventos</p>
                <p className="text-lg font-mono font-bold" style={{ color: '#00ffff' }}>{logs.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-gray-600 mb-0.5">Com Erro</p>
                <p className="text-lg font-mono font-bold" style={{ color: '#ef4444' }}>
                  {logs.filter(l => l.status === 'error' || l.status === 'failed').length}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-gray-600 mb-0.5">Por Fonte</p>
                <div className="space-y-1 mt-1">
                  {sources.map(src => (
                    <div key={src} className="flex justify-between">
                      <span className="text-[10px] font-mono text-gray-500">{src}</span>
                      <span className="text-[10px] font-mono" style={{ color: '#00ffff' }}>
                        {logs.filter(l => l.source === src).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Integracoes
            </p>
            <div className="space-y-2">
              {[
                { name: 'Kommo', desc: 'WhatsApp + Instagram + FB + Telegram', configured: health?.checks?.webhooks?.kommo?.configured },
                { name: 'OpenClaw', desc: 'Agent system', configured: health?.checks?.openclaw?.status !== 'offline' },
              ].map(int => (
                <div key={int.name} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-[10px] font-mono text-gray-300">{int.name}</p>
                    <p className="text-[9px] font-mono text-gray-600">{int.desc}</p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: int.configured ? '#22c55e' : '#4b5563' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
