import { useState } from 'react'

const cronJobs = [
  {
    id: 'vigilante',
    name: 'Vigilante',
    description: 'Monitora leads sem resposta. Alerta para leads parados (5min) e criticos (15min).',
    schedule: '*/5 * * * *',
    status: 'active',
    lastRun: '2026-03-25 12:30:00',
    nextRun: '2026-03-25 12:35:00',
    metrics: { total_verificados: 45, leads_parados: 3, leads_criticos: 0 },
    logs: [
      { time: '12:30', status: 'ok', message: '45 verificados, 3 parados, 0 criticos' },
      { time: '12:25', status: 'ok', message: '42 verificados, 1 parado, 0 criticos' },
      { time: '12:20', status: 'ok', message: '40 verificados, 0 parados, 0 criticos' },
      { time: '12:15', status: 'warn', message: '38 verificados, 5 parados, 2 criticos — alerta enviado' },
    ],
  },
  {
    id: 'reativador',
    name: 'Reativador',
    description: 'Reativa leads inativos ha 24h+. Gera mensagens personalizadas via Claude Haiku.',
    schedule: '0 8 * * *',
    status: 'active',
    lastRun: '2026-03-25 08:00:00',
    nextRun: '2026-03-26 08:00:00',
    metrics: { total_inativos: 18, reativados: 12, war_room: 2 },
    logs: [
      { time: '08:00', status: 'ok', message: '18 inativos, 12 reativados, 2 war_room' },
      { time: 'ontem 08:00', status: 'ok', message: '15 inativos, 10 reativados, 1 war_room' },
    ],
  },
]

const skills = [
  { id: 'extract_vehicle', name: 'Extrair Dados Veiculo', agent: 'Ana', trigger: 'mensagem com placa/marca/modelo', status: 'active' },
  { id: 'classify_lead', name: 'Classificar Lead', agent: 'Ana', trigger: 'apos 3+ mensagens', status: 'active' },
  { id: 'promote_content', name: 'Promover Conteudo RAG', agent: 'Sofia', trigger: 'comando manual ou score > 0.85', status: 'active' },
  { id: 'analyze_vehicle', name: 'Analisar Veiculo', agent: 'Insights', trigger: 'request /insights/analyze', status: 'active' },
  { id: 'generate_blog', name: 'Gerar Blog Post', agent: 'Insights', trigger: 'request via Sofia', status: 'active' },
  { id: 'reactivate_lead', name: 'Reativar Lead', agent: 'Sophia', trigger: 'cron reativador', status: 'active' },
  { id: 'monitor_response', name: 'Monitorar Resposta', agent: 'Simone', trigger: 'cron vigilante', status: 'active' },
  { id: 'cost_alert', name: 'Alerta de Custo', agent: 'Simone', trigger: 'gasto diario > R$50', status: 'draft' },
]

export default function Agents() {
  const [selectedCron, setSelectedCron] = useState(cronJobs[0].id)
  const [tab, setTab] = useState('crons')

  const cron = cronJobs.find(c => c.id === selectedCron)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
        <p className="text-sm text-gray-500 mt-1">Cron jobs e skills dos agentes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit">
        {['crons', 'skills'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'crons' ? 'Cron Jobs' : 'Skills'}
          </button>
        ))}
      </div>

      {tab === 'crons' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cron List */}
          <div className="space-y-3">
            {cronJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedCron(job.id)}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  selectedCron === job.id
                    ? 'border-brand-500/30 bg-brand-500/5'
                    : 'border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{job.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    job.status === 'active' ? 'bg-brand-500/10 text-brand-500' : 'bg-gray-700 text-gray-400'
                  }`}>{job.status}</span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">{job.schedule}</p>
              </button>
            ))}
          </div>

          {/* Cron Detail */}
          {cron && (
            <div className="lg:col-span-2 space-y-4">
              {/* Info */}
              <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
                <h3 className="text-lg font-bold mb-1">{cron.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{cron.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500">Schedule</p>
                    <p className="text-sm font-mono mt-1">{cron.schedule}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500">Ultima execucao</p>
                    <p className="text-sm font-mono mt-1">{cron.lastRun?.split(' ')[1]}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500">Proxima</p>
                    <p className="text-sm font-mono mt-1">{cron.nextRun?.split(' ')[1]}</p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Metricas (ultima execucao)</h4>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(cron.metrics).map(([key, val]) => (
                    <div key={key} className="text-center p-3 bg-gray-800/30 rounded-lg">
                      <p className="text-2xl font-bold">{val}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{key.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs */}
              <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Logs recentes</h4>
                <div className="space-y-2">
                  {cron.logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800/30 last:border-0">
                      <span className="text-[10px] text-gray-600 font-mono w-20 shrink-0">{log.time}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        log.status === 'ok' ? 'bg-brand-500/10 text-brand-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>{log.status}</span>
                      <span className="text-xs text-gray-400">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Skills Tab */
        <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/50 text-[10px] text-gray-600 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Skill</th>
                <th className="text-left px-5 py-3">Agente</th>
                <th className="text-left px-5 py-3">Trigger</th>
                <th className="text-right px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium text-sm">{skill.name}</p>
                    <p className="text-[10px] text-gray-600 font-mono">{skill.id}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{skill.agent}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{skill.trigger}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      skill.status === 'active' ? 'bg-brand-500/10 text-brand-500' : 'bg-gray-700 text-gray-400'
                    }`}>{skill.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
