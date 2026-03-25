import { useState, useRef, useEffect } from 'react'
import { sofiaChat, sofiaPromote } from '../lib/api'

export default function SofiaChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const result = await sofiaChat(input, history)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.message, sources: result.study_sources },
      ])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'error', content: e.message }])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { label: 'Status do Sistema', msg: 'Qual o status atual do sistema?' },
    { label: 'Revisar RAG Estudo', msg: 'Revise o RAG de Estudo e promova conteudo relevante para o Operacional.' },
    { label: 'Metricas', msg: 'Me de um resumo das metricas: quantos docs em cada RAG, agentes ativos.' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">Sofia - Orquestradora</h2>
        <p className="text-xs text-gray-500">Chat direto com a IA orquestradora do sistema</p>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 p-3 border-b border-gray-800/50">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => { setInput(a.msg); }}
            className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 transition"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-20">
            <p className="text-4xl mb-4">S</p>
            <p>Converse com a Sofia para gerenciar o sistema.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : m.role === 'error'
                  ? 'bg-red-900/30 text-red-400 border border-red-800'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {m.content}
              {m.sources > 0 && (
                <p className="text-xs text-gray-500 mt-2">{m.sources} fontes do RAG</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-500">
              Sofia pensando...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Fale com a Sofia..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={send}
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
