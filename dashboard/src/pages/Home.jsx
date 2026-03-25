import { useState, useEffect } from 'react'
import { sofiaStatus } from '../lib/api'

function StatCard({ title, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'border-brand-500 bg-brand-500/5',
    blue: 'border-blue-500 bg-blue-500/5',
    yellow: 'border-yellow-500 bg-yellow-500/5',
    red: 'border-red-500 bg-red-500/5',
    purple: 'border-purple-500 bg-purple-500/5',
  }
  return (
    <div className={`rounded-lg border-l-4 p-4 ${colors[color]} bg-gray-900`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function Home() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    sofiaStatus()
      .then(setStatus)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-500">Carregando...</div>
  if (error) return <div className="p-8 text-red-400">Erro: {error}</div>

  const { agents, rag } = status || {}
  const collections = rag?.collections || []
  const studyTotal = rag?.study_total || 0
  const opsTotal = rag?.operational_total || 0

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Agent Status */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Ana (Suporte)"
          value={agents?.ana || 'offline'}
          sub="GPT-4o-mini"
          color="brand"
        />
        <StatCard
          title="Sofia (Orquestradora)"
          value={agents?.sofia || 'offline'}
          sub="Claude Sonnet"
          color="purple"
        />
        <StatCard
          title="Insights"
          value={agents?.insights || 'offline'}
          sub="GPT-4o"
          color="blue"
        />
      </div>

      {/* RAG Stats */}
      <h3 className="text-lg font-semibold mb-4">RAG Collections</h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard title="RAG de Estudo" value={studyTotal} sub="documentos" color="yellow" />
        <StatCard title="RAG Operacional" value={opsTotal} sub="documentos" color="brand" />
      </div>

      {/* Collections Detail */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
              <th className="text-left p-3">Collection</th>
              <th className="text-left p-3">RAG</th>
              <th className="text-right p-3">Docs</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-3 font-mono text-xs">{c.name}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      c.rag === 'study'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-brand-500/10 text-brand-500'
                    }`}
                  >
                    {c.rag}
                  </span>
                </td>
                <td className="p-3 text-right font-mono">{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
