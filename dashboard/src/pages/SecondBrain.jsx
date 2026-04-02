import { useState, useEffect, useRef } from 'react'
import { thalesSync, thalesStatus, thalesSearch, thalesChat, evoCreateInstance, evoGetQR, evoStatus, obsidianListFiles, obsidianReadNote, obsidianWriteNote, obsidianDailyNote, obsidianAppendDaily } from '../lib/api'

const TABS = [
  { id: 'chat', label: 'Chat', desc: 'Conversar com Pitoco Loco' },
  { id: 'browser', label: 'Vault Browser', desc: 'Navegar & editar notas' },
  { id: 'daily', label: 'Daily Note', desc: 'Nota do dia' },
  { id: 'whatsapp', label: 'WhatsApp', desc: 'Conectar via QR Code' },
  { id: 'vault', label: 'Sync', desc: 'Status & Sync RAG' },
  { id: 'search', label: 'Buscar', desc: 'Pesquisar no vault' },
]

function VaultFileCard({ folder, count, collection }) {
  const colors = {
    study_business_insights: '#a855f7',
    study_car_manuals: '#f59e0b',
    study_industry_news: '#22c55e',
    study_diagnostic_kb: '#ef4444',
    ops_service_procedures: '#3b82f6',
    ops_client_support: '#ec4899',
    ops_pricing_guidelines: '#06b6d4',
  }
  const color = colors[collection] || '#00ffff'
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[11px] font-mono text-gray-300 truncate">{folder}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${color}15`, color }}>
          {collection.replace('study_', '').replace('ops_', '')}
        </span>
      </div>
    </div>
  )
}

/* ========== Vault Browser ========== */
function VaultBrowser() {
  const [currentFolder, setCurrentFolder] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState(null)
  const [noteContent, setNoteContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [breadcrumb, setBreadcrumb] = useState([])

  const loadFolder = async (folder = '') => {
    setLoading(true)
    setSelectedNote(null)
    try {
      const data = await obsidianListFiles(folder)
      setItems(data.items || [])
      setCurrentFolder(folder)
      // Build breadcrumb
      const parts = folder ? folder.split('/') : []
      const crumbs = [{ label: 'Vault', path: '' }]
      let acc = ''
      for (const p of parts) {
        acc = acc ? `${acc}/${p}` : p
        crumbs.push({ label: p, path: acc })
      }
      setBreadcrumb(crumbs)
    } catch (err) {
      setItems([])
    }
    setLoading(false)
  }

  const openNote = async (notePath) => {
    try {
      const data = await obsidianReadNote(notePath)
      setSelectedNote(notePath)
      setNoteContent(data.content || data.raw || '')
      setEditing(false)
    } catch (err) {
      setSelectedNote(null)
    }
  }

  const saveNote = async () => {
    if (!selectedNote) return
    setSaving(true)
    try {
      await obsidianWriteNote(selectedNote, noteContent)
      setEditing(false)
    } catch {}
    setSaving(false)
  }

  useEffect(() => { loadFolder('') }, [])

  const inputStyle = {
    background: 'rgba(0,255,255,0.03)',
    border: '1px solid rgba(0,255,255,0.1)',
    color: '#e5e7eb',
  }

  const FOLDER_COLORS = {
    '00': '#06b6d4', '01': '#a855f7', '02': '#3b82f6', '03': '#f59e0b',
    '04': '#22c55e', '05': '#ef4444', '06': '#3b82f6', '07': '#ec4899',
    '08': '#06b6d4', '99': '#6b7280',
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Breadcrumb */}
      <div className="glass-card rounded-lg px-4 py-3 flex items-center gap-2 flex-wrap">
        {breadcrumb.map((crumb, i) => (
          <div key={crumb.path} className="flex items-center gap-2">
            {i > 0 && <span className="text-[10px] font-mono text-gray-600">/</span>}
            <button
              onClick={() => loadFolder(crumb.path)}
              className="text-[10px] font-mono hover:underline transition"
              style={{ color: i === breadcrumb.length - 1 ? '#00ffff' : '#6b7280' }}
            >
              {crumb.label}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* File list */}
        <div className={`${selectedNote ? 'col-span-4' : 'col-span-12'} glass-card rounded-lg p-4`}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="w-4 h-4 border border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-[10px] font-mono text-gray-600 text-center py-8">Pasta vazia</p>
          ) : (
            <div className="space-y-1">
              {items.map(item => {
                const prefix = item.name.substring(0, 2)
                const color = FOLDER_COLORS[prefix] || '#00ffff'
                return (
                  <button
                    key={item.path}
                    onClick={() => item.type === 'folder' ? loadFolder(item.path) : openNote(item.path)}
                    className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-left transition hover:bg-white/[0.03] ${selectedNote === item.path ? 'bg-white/[0.04]' : ''}`}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                      style={{
                        background: item.type === 'folder' ? `${color}15` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${item.type === 'folder' ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
                        color: item.type === 'folder' ? color : '#9ca3af',
                      }}
                    >
                      {item.type === 'folder' ? '📁' : '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-mono text-gray-300 truncate">{item.name.replace('.md', '')}</p>
                      <p className="text-[9px] font-mono text-gray-600">
                        {item.type === 'folder' ? `${item.files} notas` : `${(item.size / 1024).toFixed(1)}kb`}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Note viewer/editor */}
        {selectedNote && (
          <div className="col-span-8 glass-card rounded-lg flex flex-col" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,255,255,0.06)' }}>
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-gray-300 truncate">{selectedNote}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <button
                      onClick={saveNote}
                      disabled={saving}
                      className="text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.15)', color: '#00ffff' }}
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {editing ? (
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full h-full min-h-[400px] rounded-lg px-4 py-3 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none"
                  style={inputStyle}
                />
              ) : (
                <div className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {noteContent || <span className="text-gray-600">Nota vazia</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ========== Daily Note Panel ========== */
function DailyNotePanel() {
  const [daily, setDaily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newEntry, setNewEntry] = useState('')
  const [section, setSection] = useState('Notas Pessoais')
  const [appending, setAppending] = useState(false)

  const loadDaily = async () => {
    setLoading(true)
    try {
      const data = await obsidianDailyNote()
      setDaily(data)
    } catch {
      setDaily(null)
    }
    setLoading(false)
  }

  useEffect(() => { loadDaily() }, [])

  const handleAppend = async () => {
    if (!newEntry.trim() || appending) return
    setAppending(true)
    try {
      await obsidianAppendDaily(newEntry, null)
      setNewEntry('')
      // Reload to see changes
      await loadDaily()
    } catch {}
    setAppending(false)
  }

  const SECTIONS = ['Resumo do Dia', 'Atividades dos Agentes', 'Leads & Conversas', 'Insights & Decisoes', 'Notas Pessoais']

  const inputStyle = {
    background: 'rgba(0,255,255,0.03)',
    border: '1px solid rgba(0,255,255,0.1)',
    color: '#e5e7eb',
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Add entry */}
      <div className="glass-card rounded-lg p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
          Adicionar entrada
        </p>
        <div className="flex gap-2 mb-3">
          {SECTIONS.map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className="text-[9px] font-mono px-2.5 py-1.5 rounded-lg transition-all"
              style={section === s ? {
                background: 'rgba(0,255,255,0.08)',
                border: '1px solid rgba(0,255,255,0.2)',
                color: '#00ffff',
              } : {
                background: 'rgba(0,20,40,0.3)',
                border: '1px solid rgba(0,255,255,0.06)',
                color: '#6b7280',
              }}
            >
              {s.replace('do Dia', '').replace('dos Agentes', '').replace('& Conversas', '').replace('& Decisoes', '').trim()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAppend()}
            placeholder="Escrever nota..."
            className="flex-1 rounded-lg px-4 py-2.5 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            style={inputStyle}
          />
          <button
            onClick={handleAppend}
            disabled={appending || !newEntry.trim()}
            className="rounded-lg px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              color: '#22c55e',
            }}
          >
            {appending ? '...' : 'Adicionar'}
          </button>
        </div>
      </div>

      {/* Daily note content */}
      <div className="glass-card rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#00ffff60' }}>
              Daily Note
            </p>
            <p className="text-[9px] font-mono text-gray-600 mt-0.5">
              {daily?.date || 'Carregando...'} {daily?.created ? '(criada agora)' : ''}
            </p>
          </div>
          <button
            onClick={loadDaily}
            className="text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all hover:bg-white/[0.03]"
            style={{ border: '1px solid rgba(0,255,255,0.1)', color: '#00ffff60' }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="w-4 h-4 border border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : daily ? (
          <div className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
            {daily.content}
          </div>
        ) : (
          <p className="text-[10px] font-mono text-gray-600 text-center py-8">
            Nao foi possivel carregar a daily note. Verifique se o gateway esta rodando.
          </p>
        )}
      </div>
    </div>
  )
}

function WhatsAppPanel() {
  const [wppStatus, setWppStatus] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const checkStatus = () => {
    evoStatus().then(setWppStatus).catch(() => setWppStatus({ state: 'offline' }))
  }

  useEffect(() => { checkStatus() }, [])

  const handleCreateInstance = async () => {
    setLoading(true)
    setError(null)
    try {
      await evoCreateInstance()
      // Wait a bit then fetch QR
      setTimeout(async () => {
        try {
          const qr = await evoGetQR()
          setQrData(qr)
          checkStatus()
        } catch (e) {
          setError(e.message)
        }
        setLoading(false)
      }, 2000)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const handleGetQR = async () => {
    setLoading(true)
    setError(null)
    try {
      const qr = await evoGetQR()
      setQrData(qr)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const connected = wppStatus?.state === 'open' || wppStatus?.instance?.state === 'open'

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Status Card */}
      <div className="glass-card rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#25D36660' }}>
              WhatsApp — Evolution API
            </p>
            <p className="text-[9px] font-mono text-gray-600 mt-0.5">
              Pitoco Loco responde automaticamente via WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: connected ? '#25D366' : '#ef4444',
                boxShadow: `0 0 8px ${connected ? '#25D36660' : '#ef444460'}`,
              }}
            />
            <span className="text-[10px] font-mono font-bold" style={{ color: connected ? '#25D366' : '#ef4444' }}>
              {connected ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
          </div>
        </div>

        {connected ? (
          <div className="rounded-lg p-4" style={{ background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)' }}>
            <p className="text-xs font-mono" style={{ color: '#25D366' }}>
              WhatsApp ativo! Pitoco Loco recebe e responde mensagens automaticamente.
            </p>
            <p className="text-[10px] font-mono text-gray-500 mt-2">
              As mensagens sao processadas pelo Second Brain + RAG e as respostas enviadas de volta via Evolution API.
            </p>
            <button
              onClick={checkStatus}
              className="mt-3 text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all hover:bg-white/[0.03]"
              style={{ border: '1px solid rgba(37,211,102,0.2)', color: '#25D36680' }}
            >
              Refresh Status
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCreateInstance}
                disabled={loading}
                className="flex-1 rounded-lg py-3 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                style={{
                  background: loading ? 'rgba(37,211,102,0.05)' : 'rgba(37,211,102,0.1)',
                  border: '1px solid rgba(37,211,102,0.25)',
                  color: '#25D366',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                    Conectando...
                  </span>
                ) : '1. Criar Instancia'}
              </button>
              <button
                onClick={handleGetQR}
                disabled={loading}
                className="flex-1 rounded-lg py-3 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                style={{
                  background: 'rgba(37,211,102,0.05)',
                  border: '1px solid rgba(37,211,102,0.15)',
                  color: '#25D36680',
                }}
              >
                2. Gerar QR Code
              </button>
            </div>

            {/* QR Code Display */}
            {qrData && (
              <div className="rounded-lg p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(37,211,102,0.15)' }}>
                {qrData.base64 || qrData.qrcode?.base64 ? (
                  <>
                    <img
                      src={qrData.base64 || qrData.qrcode?.base64}
                      alt="WhatsApp QR Code"
                      className="mx-auto rounded-lg"
                      style={{ maxWidth: '280px', background: 'white', padding: '12px' }}
                    />
                    <p className="text-[10px] font-mono mt-3" style={{ color: '#25D36680' }}>
                      Abra o WhatsApp → Aparelhos conectados → Escanear QR Code
                    </p>
                    <button
                      onClick={() => { handleGetQR(); setTimeout(checkStatus, 5000) }}
                      className="mt-2 text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all hover:bg-white/[0.03]"
                      style={{ border: '1px solid rgba(37,211,102,0.2)', color: '#25D36680' }}
                    >
                      Atualizar QR
                    </button>
                  </>
                ) : qrData.code || qrData.qrcode?.code ? (
                  <div>
                    <p className="text-[10px] font-mono text-gray-400 mb-2">QR Code (texto):</p>
                    <p className="text-[9px] font-mono text-gray-500 break-all">{qrData.code || qrData.qrcode?.code}</p>
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-gray-500">
                    {JSON.stringify(qrData).substring(0, 200)}
                  </p>
                )}
              </div>
            )}

            {/* Steps */}
            <div className="space-y-2">
              {[
                { step: '01', text: 'Clique em "Criar Instancia" para registrar no Evolution API' },
                { step: '02', text: 'Clique em "Gerar QR Code" para conectar o WhatsApp' },
                { step: '03', text: 'Escaneie o QR Code com o WhatsApp do teu celular' },
                { step: '04', text: 'Pronto! Pitoco Loco responde automaticamente' },
              ].map(s => (
                <div key={s.step} className="flex gap-2">
                  <span className="text-[9px] font-mono font-bold shrink-0 w-5" style={{ color: '#25D36640' }}>{s.step}</span>
                  <p className="text-[10px] font-mono text-gray-500">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[10px] font-mono text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SecondBrain() {
  const [tab, setTab] = useState('chat')
  const [status, setStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  // Chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    thalesStatus().then(setStatus).catch(() => {})
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSync = async (force = false) => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await thalesSync(force)
      setSyncResult(result)
      thalesStatus().then(setStatus).catch(() => {})
    } catch (err) {
      setSyncResult({ status: 'error', message: err.message })
    }
    setSyncing(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults(null)
    try {
      const results = await thalesSearch(searchQuery)
      setSearchResults(results)
    } catch (err) {
      setSearchResults({ error: err.message })
    }
    setSearching(false)
  }

  const handleSend = async () => {
    if (!input.trim() || thinking) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setThinking(true)
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const result = await thalesChat(input, history)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.message,
        sources: result.rag_sources,
      }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${err.message}` }])
    }
    setThinking(false)
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
          SECOND BRAIN
        </h1>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">
          Pitoco Loco — Braco Direito Estrategico
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 rounded-lg transition-all font-mono text-left"
            style={tab === t.id ? {
              background: 'rgba(0,255,255,0.08)',
              border: '1px solid rgba(0,255,255,0.25)',
            } : {
              background: 'rgba(0,20,40,0.4)',
              border: '1px solid rgba(0,255,255,0.06)',
            }}
          >
            <span className="text-[10px] font-bold block" style={{ color: tab === t.id ? '#00ffff' : '#6b7280' }}>
              {t.label}
            </span>
            <span className="text-[9px] block" style={{ color: tab === t.id ? '#00ffff60' : '#4b5563' }}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8">

          {/* CHAT TAB */}
          {tab === 'chat' && (
            <div className="glass-card rounded-lg flex flex-col animate-fade-in-up" style={{ height: 'calc(100vh - 220px)' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3" style={{ color: '#00ffff15' }}>&#129504;</div>
                    <p className="text-sm font-mono text-gray-500">Fale com o Pitoco Loco</p>
                    <p className="text-[10px] font-mono text-gray-600 mt-1">
                      Braco direito estrategico — responde com o Second Brain + RAG
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[80%] rounded-lg px-4 py-3"
                      style={msg.role === 'user' ? {
                        background: 'rgba(0,255,255,0.08)',
                        border: '1px solid rgba(0,255,255,0.15)',
                      } : {
                        background: 'rgba(168,85,247,0.08)',
                        border: '1px solid rgba(168,85,247,0.15)',
                      }}
                    >
                      <p className="text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                      {msg.sources?.length > 0 && (
                        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <p className="text-[8px] font-mono uppercase tracking-widest mb-1" style={{ color: '#a855f760' }}>Fontes</p>
                          {msg.sources.map((s, j) => (
                            <p key={j} className="text-[9px] font-mono text-gray-500 truncate">
                              {s.vault_path || s.title || s.collection} — {(s.score * 100).toFixed(0)}%
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.1)' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-mono" style={{ color: '#a855f780' }}>Pitoco Loco pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3" style={{ borderTop: '1px solid rgba(0,255,255,0.06)' }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Fala, Thales... o que vamos construir?"
                    className="flex-1 rounded-lg px-4 py-2.5 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    style={inputStyle}
                  />
                  <button
                    onClick={handleSend}
                    disabled={thinking || !input.trim()}
                    className="rounded-lg px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: 'rgba(168,85,247,0.15)',
                      border: '1px solid rgba(168,85,247,0.3)',
                      color: '#a855f7',
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VAULT BROWSER TAB */}
          {tab === 'browser' && (
            <VaultBrowser />
          )}

          {/* DAILY NOTE TAB */}
          {tab === 'daily' && (
            <DailyNotePanel />
          )}

          {/* WHATSAPP TAB */}
          {tab === 'whatsapp' && (
            <WhatsAppPanel />
          )}

          {/* VAULT TAB */}
          {tab === 'vault' && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Sync Controls */}
              <div className="glass-card rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#00ffff60' }}>
                      Sync Obsidian → RAG
                    </p>
                    <p className="text-[9px] font-mono text-gray-600 mt-0.5">
                      Incremental: so processa arquivos novos ou alterados
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(false)}
                      disabled={syncing}
                      className="rounded-lg px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: syncing ? 'rgba(0,255,255,0.05)' : 'rgba(0,255,255,0.1)',
                        border: '1px solid rgba(0,255,255,0.25)',
                        color: '#00ffff',
                      }}
                    >
                      {syncing ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          Sincronizando...
                        </span>
                      ) : 'Sync'}
                    </button>
                    <button
                      onClick={() => handleSync(true)}
                      disabled={syncing}
                      className="rounded-lg px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-all"
                      style={{
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        color: '#f59e0b',
                      }}
                    >
                      Force
                    </button>
                  </div>
                </div>

                {/* Sync Result */}
                {syncResult && (
                  <div
                    className="rounded-lg p-4 mt-3"
                    style={{
                      borderLeft: `2px solid ${syncResult.status === 'ok' ? '#22c55e40' : '#ef444440'}`,
                      background: syncResult.status === 'ok' ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: syncResult.status === 'ok' ? '#22c55e' : '#ef4444' }} />
                      <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: syncResult.status === 'ok' ? '#22c55e' : '#ef4444' }}>
                        {syncResult.status === 'ok' ? 'Sync Completo' : 'Erro'}
                      </span>
                    </div>
                    {syncResult.status === 'ok' ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-lg font-mono font-bold" style={{ color: '#22c55e' }}>{syncResult.synced}</p>
                          <p className="text-[9px] font-mono text-gray-600">sincronizados</p>
                        </div>
                        <div>
                          <p className="text-lg font-mono font-bold text-gray-500">{syncResult.skipped}</p>
                          <p className="text-[9px] font-mono text-gray-600">sem alteracao</p>
                        </div>
                        <div>
                          <p className="text-lg font-mono font-bold" style={{ color: '#00ffff' }}>{syncResult.total_files}</p>
                          <p className="text-[9px] font-mono text-gray-600">total no vault</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-red-400">{syncResult.message || JSON.stringify(syncResult)}</p>
                    )}
                    {syncResult.errors?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {syncResult.errors.map((e, i) => (
                          <p key={i} className="text-[9px] font-mono text-red-400">{e.path}: {e.error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vault Files */}
              <div className="glass-card rounded-lg p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
                  Pastas do Vault
                </p>
                {status?.folders?.length > 0 ? (
                  <div className="space-y-1">
                    {status.folders.sort().map(folder => (
                      <VaultFileCard key={folder} folder={folder} collection={
                        status.collections_used?.find(c => c.startsWith(folder.slice(0, 2) === '99' ? 'study_business' : '')) || 'study_business_insights'
                      } />
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-gray-600">
                    {status ? 'Nenhuma pasta encontrada' : 'Carregando...'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SEARCH TAB */}
          {tab === 'search' && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="glass-card rounded-lg p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar no vault... Ex: estrategia premium, posicionamento marca"
                    className="flex-1 rounded-lg px-4 py-3 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    style={inputStyle}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="rounded-lg px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: 'rgba(168,85,247,0.1)',
                      border: '1px solid rgba(168,85,247,0.25)',
                      color: '#a855f7',
                    }}
                  >
                    {searching ? (
                      <span className="w-4 h-4 border border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
                    ) : 'Buscar'}
                  </button>
                </div>
              </div>

              {searchResults?.error && (
                <div className="glass-card rounded-lg p-4" style={{ borderLeft: '2px solid #ef444440' }}>
                  <p className="text-[10px] font-mono text-red-400">{searchResults.error}</p>
                </div>
              )}

              {searchResults && !searchResults.error && (
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-gray-500 px-1">
                    {searchResults.total || 0} resultados do vault
                  </p>
                  {(searchResults.results || []).map((r, i) => (
                    <div key={i} className="glass-card rounded-lg p-4" style={{ borderLeft: '2px solid rgba(168,85,247,0.3)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold" style={{ color: '#a855f7' }}>{r.title}</span>
                          {r.vault_path && (
                            <span className="text-[9px] font-mono text-gray-600">{r.vault_path}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold" style={{ color: '#00ffff' }}>
                          {(r.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-300 leading-relaxed">{r.document}</p>
                    </div>
                  ))}
                  {searchResults.total === 0 && (
                    <div className="glass-card rounded-lg p-8 text-center">
                      <p className="text-xs font-mono text-gray-500">Nenhum resultado do vault. Faca sync primeiro.</p>
                    </div>
                  )}
                </div>
              )}

              {!searchResults && !searching && (
                <div className="glass-card rounded-lg p-12 text-center">
                  <div className="text-4xl mb-4" style={{ color: '#a855f715' }}>&#128270;</div>
                  <p className="text-sm font-mono text-gray-500">Busca semantica no vault</p>
                  <p className="text-[10px] font-mono text-gray-600 mt-1">So retorna resultados de notas Obsidian sincronizadas</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Status */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Vault Status */}
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Status do Vault
            </p>
            {status ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: status.vault_exists ? '#22c55e' : '#ef4444', boxShadow: `0 0 6px ${status.vault_exists ? '#22c55e60' : '#ef444460'}` }}
                  />
                  <span className="text-[10px] font-mono" style={{ color: status.vault_exists ? '#22c55e' : '#ef4444' }}>
                    {status.vault_exists ? 'Vault conectado' : 'Vault nao encontrado'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-lg font-mono font-bold" style={{ color: '#00ffff' }}>{status.total_files || 0}</p>
                    <p className="text-[9px] font-mono text-gray-600">arquivos .md</p>
                  </div>
                  <div>
                    <p className="text-lg font-mono font-bold" style={{ color: '#22c55e' }}>{status.synced_files || 0}</p>
                    <p className="text-[9px] font-mono text-gray-600">sincronizados</p>
                  </div>
                </div>
                {status.pending > 0 && (
                  <div className="rounded-lg p-2" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <p className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>
                      {status.pending} arquivo(s) pendente(s) de sync
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] font-mono text-gray-600">Carregando...</p>
            )}
          </div>

          {/* Collections Used */}
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              RAG Collections
            </p>
            <div className="space-y-2">
              {(status?.collections_used || []).map(col => (
                <div key={col} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7' }} />
                  <span className="text-[10px] font-mono text-gray-400">
                    {col.replace('study_', '').replace('ops_', '')}
                  </span>
                </div>
              ))}
              {(!status?.collections_used || status.collections_used.length === 0) && (
                <p className="text-[10px] font-mono text-gray-600">Faca sync para popular</p>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Como Funciona
            </p>
            <div className="space-y-2">
              {[
                { step: '01', text: 'Thales escaneia o vault Obsidian' },
                { step: '02', text: 'Detecta arquivos novos/alterados via MD5' },
                { step: '03', text: 'Mapeia pasta → collection RAG automaticamente' },
                { step: '04', text: 'Chunka, gera embeddings, armazena no ChromaDB' },
                { step: '05', text: 'Ana, Sophia e Insights ganham contexto do vault' },
              ].map(s => (
                <div key={s.step} className="flex gap-2">
                  <span className="text-[9px] font-mono font-bold shrink-0 w-5" style={{ color: '#a855f740' }}>{s.step}</span>
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
