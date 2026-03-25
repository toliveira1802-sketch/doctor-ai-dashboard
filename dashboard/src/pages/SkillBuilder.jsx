import { useState } from 'react'

const existingSkills = [
  { id: 'extract_vehicle', name: 'Extrair Dados Veiculo', agent: 'Ana', trigger: 'auto', template: 'Extraia marca, modelo, placa, ano e sintoma da mensagem do cliente.', status: 'active' },
  { id: 'classify_lead', name: 'Classificar Lead', agent: 'Ana', trigger: 'auto', template: 'Classifique este lead como hot, warm ou cold baseado no contexto da conversa.', status: 'active' },
  { id: 'promote_content', name: 'Promover Conteudo', agent: 'Sofia', trigger: 'manual', template: 'Busque no RAG de Estudo e promova documentos com score > 0.85 para o RAG Operacional.', status: 'active' },
  { id: 'analyze_vehicle', name: 'Analisar Veiculo', agent: 'Insights', trigger: 'api', template: 'Analise problemas comuns, recalls e manutencao preventiva para {brand} {model} {year}.', status: 'active' },
  { id: 'generate_blog', name: 'Gerar Blog Post', agent: 'Insights', trigger: 'manual', template: 'Gere um artigo completo sobre {topic} no estilo {style} com titulo, tags SEO e conteudo.', status: 'active' },
  { id: 'reactivate', name: 'Reativar Lead', agent: 'Sophia', trigger: 'cron', template: 'Gere mensagem personalizada de reativacao para lead inativo: {lead_name}, ultimo contato: {last_contact}.', status: 'active' },
  { id: 'cost_alert', name: 'Alerta de Custo', agent: 'Simone', trigger: 'threshold', template: 'Gasto diario atingiu {amount}. Analise e sugira otimizacoes.', status: 'draft' },
]

const triggerTypes = [
  { id: 'auto', label: 'Automatico', desc: 'Dispara automaticamente baseado no contexto' },
  { id: 'manual', label: 'Manual', desc: 'Disparado por comando do usuario' },
  { id: 'api', label: 'API', desc: 'Disparado por chamada de API' },
  { id: 'cron', label: 'Cron', desc: 'Disparado por cron job agendado' },
  { id: 'threshold', label: 'Threshold', desc: 'Disparado quando um limite e atingido' },
  { id: 'webhook', label: 'Webhook', desc: 'Disparado por webhook externo' },
]

const agents = ['Ana', 'Sofia', 'Sophia', 'Simone', 'Insights']

export default function SkillBuilder() {
  const [skills, setSkills] = useState(existingSkills)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '', agent: 'Ana', trigger: 'auto', template: '', description: '',
  })

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const startCreate = () => {
    setCreating(true)
    setEditingId(null)
    setForm({ name: '', agent: 'Ana', trigger: 'auto', template: '', description: '' })
  }

  const startEdit = (skill) => {
    setCreating(false)
    setEditingId(skill.id)
    setForm({ name: skill.name, agent: skill.agent, trigger: skill.trigger, template: skill.template, description: '' })
  }

  const saveSkill = () => {
    if (creating) {
      const newSkill = {
        id: form.name.toLowerCase().replace(/\s+/g, '_'),
        name: form.name,
        agent: form.agent,
        trigger: form.trigger,
        template: form.template,
        status: 'draft',
      }
      setSkills(prev => [...prev, newSkill])
    } else if (editingId) {
      setSkills(prev => prev.map(s => s.id === editingId ? { ...s, name: form.name, agent: form.agent, trigger: form.trigger, template: form.template } : s))
    }
    setCreating(false)
    setEditingId(null)
  }

  const toggleStatus = (id) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'draft' : 'active' } : s))
  }

  const showForm = creating || editingId

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Skill Builder</h2>
          <p className="text-sm text-gray-500 mt-1">Crie e edite skills para os agentes</p>
        </div>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm font-medium transition"
        >
          + Nova Skill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill List */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800/50 text-[10px] text-gray-600 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Skill</th>
                  <th className="text-left px-5 py-3">Agente</th>
                  <th className="text-left px-5 py-3">Trigger</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id} className={`border-b border-gray-800/30 hover:bg-gray-800/20 transition ${editingId === skill.id ? 'bg-gray-800/30' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{skill.name}</p>
                      <p className="text-[10px] text-gray-600 font-mono">{skill.id}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{skill.agent}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{skill.trigger}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggleStatus(skill.id)}>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer ${
                          skill.status === 'active' ? 'bg-brand-500/10 text-brand-500' : 'bg-gray-700 text-gray-400'
                        }`}>{skill.status}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => startEdit(skill)}
                        className="text-[10px] px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 transition"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Panel */}
        <div>
          {showForm ? (
            <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 sticky top-8 space-y-4">
              <h3 className="text-sm font-semibold">
                {creating ? 'Nova Skill' : `Editando: ${form.name}`}
              </h3>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="Ex: Detectar Urgencia"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Agente</label>
                <select
                  value={form.agent}
                  onChange={(e) => updateForm('agent', e.target.value)}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  {agents.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Trigger</label>
                <div className="grid grid-cols-2 gap-1">
                  {triggerTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateForm('trigger', t.id)}
                      className={`text-left p-2 rounded-lg border text-[10px] transition ${
                        form.trigger === t.id
                          ? 'border-brand-500/30 bg-brand-500/5 text-brand-500'
                          : 'border-gray-800/50 text-gray-500 hover:bg-gray-800/50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Template</label>
                <textarea
                  value={form.template}
                  onChange={(e) => updateForm('template', e.target.value)}
                  rows={5}
                  placeholder="Instrucao para o agente executar. Use {variavel} para parametros."
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 resize-y focus:outline-none focus:border-gray-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveSkill}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm font-medium transition"
                >
                  Salvar
                </button>
                <button
                  onClick={() => { setCreating(false); setEditingId(null) }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/30 p-8 text-center">
              <p className="text-gray-600 text-sm">Selecione uma skill para editar ou crie uma nova.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
