import { useState, useEffect } from 'react'
import { sofiaStatus, searchRAG } from '../lib/api'

export default function RAGManager() {
  const [collections, setCollections] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sofiaStatus().then((data) => setCollections(data?.rag?.collections || []))
  }, [])

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await searchRAG(query)
      setResults(data)
    } catch (e) {
      setResults({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const studyDocs = collections.filter((c) => c.rag === 'study').reduce((a, c) => a + c.count, 0)
  const opsDocs = collections.filter((c) => c.rag === 'operational').reduce((a, c) => a + c.count, 0)

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">RAG Manager</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-3xl font-bold">{studyDocs + opsDocs}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500">RAG Estudo</p>
          <p className="text-3xl font-bold text-yellow-500">{studyDocs}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border-l-4 border-brand-500">
          <p className="text-xs text-gray-500">RAG Operacional</p>
          <p className="text-3xl font-bold text-brand-500">{opsDocs}</p>
        </div>
      </div>

      {/* Collections */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 mb-8">
        <h3 className="p-4 font-semibold border-b border-gray-800">Collections</h3>
        <div className="divide-y divide-gray-800/50">
          {collections.map((c) => (
            <div key={c.name} className="flex items-center justify-between p-4">
              <div>
                <p className="font-mono text-sm">{c.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  c.rag === 'study' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-brand-500/10 text-brand-500'
                }`}>{c.rag}</span>
              </div>
              <p className="text-2xl font-bold">{c.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <h3 className="font-semibold mb-4">Buscar no RAG de Estudo</h3>
        <div className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Ex: problemas Honda Civic 2020..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={search}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>
        {results?.results && (
          <div className="space-y-3">
            {results.results.map((r, i) => (
              <div key={i} className="bg-gray-800 rounded p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-xs text-gray-500">{r.collection}</span>
                  <span className="text-xs text-yellow-500">{(r.score * 100).toFixed(0)}% match</span>
                </div>
                <p className="text-gray-300">{r.document}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
