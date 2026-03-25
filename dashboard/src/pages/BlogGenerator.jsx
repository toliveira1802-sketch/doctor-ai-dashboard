import { useState } from 'react'

export default function BlogGenerator() {
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('informativo')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/insights/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_client', client_context: topic }),
      })
      // Use the blog endpoint directly through the gateway proxy
      const blogRes = await fetch('/api/sofia/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          message: `Gere um artigo completo para o blog da Doctor Auto Prime sobre: ${topic}. Estilo: ${style}. Inclua titulo, tags SEO e conteudo completo em markdown.`,
        }),
      })
      const data = await blogRes.json()
      setResult({ content: data.message, title: topic, style })
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const topicSuggestions = [
    '5 sinais de que a suspensao do seu carro precisa de atencao',
    'Quando trocar o oleo do carro: guia completo',
    'Ar condicionado automotivo: manutencao preventiva',
    'Como escolher uma oficina mecanica de confianca',
    'Recalls automotivos: o que voce precisa saber',
  ]

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Blog Generator</h2>

      {/* Suggestions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {topicSuggestions.map((t) => (
          <button key={t} onClick={() => setTopic(t)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition text-left">
            {t}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tema do artigo..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm mb-3 focus:outline-none focus:border-pink-500" />
        <div className="flex gap-3 items-center">
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm">
            <option value="informativo">Informativo</option>
            <option value="noticioso">Noticioso</option>
            <option value="tutorial">Tutorial</option>
            <option value="opinativo">Opinativo</option>
          </select>
          <button onClick={generate} disabled={loading || !topic.trim()}
            className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition">
            {loading ? 'Gerando artigo...' : 'Gerar Artigo'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result?.content && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
            <h3 className="font-bold text-lg">{result.title}</h3>
            <button onClick={() => navigator.clipboard.writeText(result.content)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs transition">
              Copiar
            </button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-gray-300">
            {result.content}
          </div>
        </div>
      )}
    </div>
  )
}
