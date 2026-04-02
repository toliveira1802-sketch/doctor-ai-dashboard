import { useState, useEffect } from 'react'
import { searchRAG, getRagCollections } from '../lib/api'

const COLLECTION_COLORS = {
  study_car_manuals: '#f59e0b',
  study_industry_news: '#22c55e',
  study_diagnostic_kb: '#ef4444',
  study_business_insights: '#a855f7',
  ops_client_support: '#3b82f6',
  ops_service_procedures: '#ec4899',
  ops_pricing_guidelines: '#06b6d4',
}

export default function RagExplorer() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [collections, setCollections] = useState([])
  const [selectedCols, setSelectedCols] = useState([])
  const [nResults, setNResults] = useState(10)

  useEffect(() => {
    getRagCollections()
      .then(data => {
        const cols = data.collections || data || []
        setCollections(Array.isArray(cols) ? cols : [])
      })
      .catch(() => {})
  }, [])

  const toggleCollection = (name) => {
    setSelectedCols(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setResults(null)
    try {
      const cols = selectedCols.length > 0 ? selectedCols : null
      const data = await searchRAG(query, cols)
      setResults(data)
    } catch (err) {
      setResults({ error: err.message })
    }
    setSearching(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const inputStyle = {
    background: 'rgba(0,255,255,0.03)',
    border: '1px solid rgba(0,255,255,0.1)',
    color: '#e5e7eb',
  }

  return (
    <div className="min-h-screen neural-grid p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-lg font-bold font-mono tracking-wider" style={{ color: '#00ffff' }}>
          RAG EXPLORER
        </h1>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">
          Busca Vetorial — Explore o Knowledge Base
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left - Search & Results */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* Search Bar */}
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar no Knowledge Base... Ex: problemas freio ABS Hilux"
                className="flex-1 rounded-lg px-4 py-3 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                style={inputStyle}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="rounded-lg px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all"
                style={{
                  background: searching ? 'rgba(0,255,255,0.05)' : 'rgba(0,255,255,0.1)',
                  border: '1px solid rgba(0,255,255,0.25)',
                  color: '#00ffff',
                }}
              >
                {searching ? (
                  <span className="w-4 h-4 border border-cyan-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : 'Buscar'}
              </button>
            </div>

            {/* Collection filters */}
            <div className="flex flex-wrap gap-2 mt-3">
              {collections.map(col => {
                const name = col.name || col
                const color = COLLECTION_COLORS[name] || '#00ffff'
                const active = selectedCols.includes(name)
                return (
                  <button
                    key={name}
                    onClick={() => toggleCollection(name)}
                    className="rounded-lg px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider transition-all"
                    style={active ? {
                      background: `${color}20`,
                      border: `1px solid ${color}50`,
                      color: color,
                    } : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#6b7280',
                    }}
                  >
                    {name.replace('study_', '').replace('ops_', '')} {col.count != null ? `(${col.count})` : ''}
                  </button>
                )
              })}
              {selectedCols.length > 0 && (
                <button
                  onClick={() => setSelectedCols([])}
                  className="text-[9px] font-mono text-gray-500 hover:text-gray-300 transition px-2"
                >
                  limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {results?.error && (
            <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ borderLeft: '2px solid #ef444440' }}>
              <p className="text-[10px] font-mono text-red-400">{results.error}</p>
            </div>
          )}

          {searching && (
            <div className="glass-card rounded-lg p-8 text-center animate-fade-in-up">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-mono" style={{ color: '#00ffff80' }}>Buscando embeddings...</p>
            </div>
          )}

          {results && !results.error && (
            <div className="space-y-3 animate-fade-in-up">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-mono text-gray-500">
                  {results.total || results.results?.length || 0} resultados para "{results.query || query}"
                </p>
              </div>

              {(results.results || []).map((r, i) => {
                const color = COLLECTION_COLORS[r.collection] || '#00ffff'
                const score = r.score != null ? r.score : r.distance != null ? (1 - r.distance) : null
                return (
                  <div
                    key={i}
                    className="glass-card rounded-lg p-4 transition-all hover:bg-white/[0.02]"
                    style={{ borderLeft: `2px solid ${color}40` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                          style={{ background: `${color}15`, color: color, border: `1px solid ${color}30` }}
                        >
                          {(r.collection || '').replace('study_', '').replace('ops_', '')}
                        </span>
                        {r.metadata?.title && (
                          <span className="text-[10px] font-mono text-gray-400">{r.metadata.title}</span>
                        )}
                      </div>
                      {score != null && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.round(score * 100)}%`, background: color }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold" style={{ color }}>
                            {(score * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-300 leading-relaxed">
                      {r.document || r.content || r.text || ''}
                    </p>
                    {r.metadata && (
                      <div className="flex gap-3 mt-2">
                        {r.metadata.source_type && (
                          <span className="text-[9px] font-mono text-gray-600">tipo: {r.metadata.source_type}</span>
                        )}
                        {r.metadata.chunk_index != null && (
                          <span className="text-[9px] font-mono text-gray-600">chunk #{r.metadata.chunk_index}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!results && !searching && (
            <div className="glass-card rounded-lg p-12 text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="text-4xl mb-4" style={{ color: '#00ffff15' }}>&#128270;</div>
              <p className="text-sm font-mono text-gray-500">Busque no Knowledge Base</p>
              <p className="text-[10px] font-mono text-gray-600 mt-1">
                Busca semantica via embeddings — resultados por similaridade
              </p>
            </div>
          )}
        </div>

        {/* Right - Collections Info */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Collections
            </p>
            <div className="space-y-2">
              {collections.length > 0 ? collections.map(col => {
                const name = col.name || col
                const color = COLLECTION_COLORS[name] || '#00ffff'
                const isStudy = name.startsWith('study_')
                return (
                  <div key={name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition">
                    <div>
                      <p className="text-[11px] font-mono" style={{ color: color }}>
                        {name.replace('study_', '').replace('ops_', '')}
                      </p>
                      <p className="text-[9px] font-mono" style={{ color: isStudy ? '#f59e0b60' : '#a855f760' }}>
                        {isStudy ? 'Study RAG' : 'Operational RAG'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold" style={{ color: '#00ffff' }}>{col.count ?? '?'}</p>
                      <p className="text-[9px] font-mono text-gray-600">docs</p>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-[10px] font-mono text-gray-600">Carregando...</p>
              )}
            </div>
          </div>

          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Como Funciona
            </p>
            <div className="space-y-2">
              {[
                { step: '01', text: 'Sua query e convertida em embedding (vetor 1536d)' },
                { step: '02', text: 'ChromaDB busca por similaridade coseno' },
                { step: '03', text: 'Resultados rankeados por relevancia semantica' },
                { step: '04', text: 'Ana e Sofia usam esses resultados como contexto' },
              ].map(s => (
                <div key={s.step} className="flex gap-2">
                  <span className="text-[9px] font-mono font-bold shrink-0 w-5" style={{ color: '#00ffff40' }}>{s.step}</span>
                  <p className="text-[10px] font-mono text-gray-500">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
