import { useState } from 'react'

const models = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'Anthropic' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
]

const availableTools = [
  { id: 'rag_search', label: 'RAG Search', desc: 'Busca semantica no ChromaDB' },
  { id: 'kommo_read', label: 'Kommo Read', desc: 'Leitura de leads e dados CRM' },
  { id: 'kommo_write', label: 'Kommo Write', desc: 'Escrita de dados no CRM' },
  { id: 'whatsapp_send', label: 'WhatsApp Send', desc: 'Envio de mensagens WhatsApp' },
  { id: 'supabase_query', label: 'Supabase Query', desc: 'Consulta ao banco de dados' },
  { id: 'supabase_write', label: 'Supabase Write', desc: 'Escrita no banco de dados' },
  { id: 'web_search', label: 'Web Search', desc: 'Busca na web via Perplexity' },
  { id: 'slack_notify', label: 'Slack Notify', desc: 'Envio de notificacoes Slack' },
]

const colorOptions = [
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { id: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { id: 'brand', label: 'Green', class: 'bg-brand-500' },
  { id: 'red', label: 'Red', class: 'bg-red-500' },
]

export default function AgentBuilder() {
  const [agent, setAgent] = useState({
    name: '',
    role: '',
    emoji: '',
    model: 'claude-sonnet-4-20250514',
    color: 'amber',
    systemPrompt: '',
    tools: [],
    temperature: 0.7,
    maxTokens: 1000,
  })
  const [saved, setSaved] = useState(false)

  const update = (key, value) => setAgent(prev => ({ ...prev, [key]: value }))

  const toggleTool = (toolId) => {
    setAgent(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId],
    }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const selectedColor = colorOptions.find(c => c.id === agent.color)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Agent Builder</h2>
        <p className="text-sm text-gray-500 mt-1">Crie e configure novos agentes de IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Identity */}
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Identidade</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Nome</label>
                <input
                  value={agent.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Ex: Carlos"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Emoji</label>
                <input
                  value={agent.emoji}
                  onChange={(e) => update('emoji', e.target.value)}
                  placeholder="Ex: 🤖"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Role</label>
              <input
                value={agent.role}
                onChange={(e) => update('role', e.target.value)}
                placeholder="Ex: Consultor Tecnico"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
              />
            </div>
            <div className="mt-4">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Cor</label>
              <div className="flex gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => update('color', c.id)}
                    className={`w-8 h-8 rounded-lg ${c.class} transition ${
                      agent.color === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'opacity-50 hover:opacity-75'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Model */}
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Modelo</h3>
            <div className="grid grid-cols-1 gap-2">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => update('model', m.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition ${
                    agent.model === m.id
                      ? 'border-brand-500/30 bg-brand-500/5'
                      : 'border-gray-800/50 bg-gray-800/30 hover:bg-gray-800/50'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-[10px] text-gray-500">{m.provider}</p>
                  </div>
                  {agent.model === m.id && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Temperature: {agent.temperature}</label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={agent.temperature}
                  onChange={(e) => update('temperature', parseFloat(e.target.value))}
                  className="w-full mt-2 accent-brand-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Max Tokens</label>
                <input
                  type="number"
                  value={agent.maxTokens}
                  onChange={(e) => update('maxTokens', parseInt(e.target.value))}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">System Prompt</h3>
            <textarea
              value={agent.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              rows={8}
              placeholder="Defina a personalidade e comportamento do agente..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 resize-y focus:outline-none focus:border-gray-600"
            />
          </div>

          {/* Tools */}
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">
              Tools ({agent.tools.length} selecionadas)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {availableTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={`text-left p-3 rounded-lg border transition ${
                    agent.tools.includes(tool.id)
                      ? 'border-brand-500/30 bg-brand-500/5'
                      : 'border-gray-800/50 bg-gray-800/30 hover:bg-gray-800/50'
                  }`}
                >
                  <p className="text-xs font-medium">{tool.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{tool.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 sticky top-8">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Preview</h3>
            <div className="text-center py-6">
              <span className="text-5xl">{agent.emoji || '🤖'}</span>
              <h4 className="text-lg font-bold mt-3">{agent.name || 'Novo Agente'}</h4>
              <p className="text-xs text-gray-500">{agent.role || 'Sem role definida'}</p>
              <div className={`w-12 h-1 rounded-full mx-auto mt-3 ${selectedColor?.class || 'bg-gray-600'}`} />
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Modelo</span>
                <span className="text-gray-300 font-mono text-[10px]">{agent.model.split('-').slice(0, 2).join(' ')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Temperature</span>
                <span className="text-gray-300">{agent.temperature}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Max Tokens</span>
                <span className="text-gray-300">{agent.maxTokens}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tools</span>
                <span className="text-gray-300">{agent.tools.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Prompt</span>
                <span className="text-gray-300">{agent.systemPrompt.length} chars</span>
              </div>
            </div>
            <button
              onClick={handleSave}
              className={`w-full mt-6 py-2.5 rounded-lg text-sm font-medium transition ${
                saved
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {saved ? 'Salvo!' : 'Criar Agente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
