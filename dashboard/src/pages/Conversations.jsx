import { useState } from 'react'
import { anaChat } from '../lib/api'

export default function Conversations() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [convId, setConvId] = useState(null)
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim() || loading) return
    setMessages((prev) => [...prev, { role: 'user', content: input }])
    const msg = input
    setInput('')
    setLoading(true)

    try {
      const result = await anaChat(msg, convId)
      setConvId(result.conversation_id)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.message,
          classification: result.classification,
          sources: result.rag_sources?.length || 0,
        },
      ])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'error', content: e.message }])
    } finally {
      setLoading(false)
    }
  }

  const classColors = {
    hot: 'bg-red-500/20 text-red-400',
    warm: 'bg-yellow-500/20 text-yellow-400',
    cold: 'bg-blue-500/20 text-blue-400',
  }

  const newConversation = () => {
    setMessages([])
    setConvId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Ana - Teste de Conversa</h2>
          <p className="text-xs text-gray-500">
            {convId ? `Conversa: ${convId.slice(0, 8)}...` : 'Nova conversa'}
          </p>
        </div>
        <button
          onClick={newConversation}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition"
        >
          Nova conversa
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-20">
            <p className="text-4xl mb-4">A</p>
            <p>Simule uma conversa como cliente para testar a Ana.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : m.role === 'error'
                  ? 'bg-red-900/30 text-red-400'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {m.content}
              <div className="flex gap-2 mt-2">
                {m.classification && (
                  <span className={`text-xs px-2 py-0.5 rounded ${classColors[m.classification]}`}>
                    {m.classification}
                  </span>
                )}
                {m.sources > 0 && (
                  <span className="text-xs text-gray-500">{m.sources} fontes RAG</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-500 w-fit">
            Ana respondendo...
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Fale como um cliente..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={send}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
