import { useState, useEffect, useRef } from 'react'
import { ingestFile, ingestURL, ingestText, ingestPerplexity, getIngestCollections, getIngestHistory } from '../lib/api'

const TABS = [
  { id: 'file', label: 'Upload', icon: '⬆', desc: 'PDF, Imagem, Áudio, Vídeo' },
  { id: 'url', label: 'URL', icon: '🔗', desc: 'Scraping de página web' },
  { id: 'text', label: 'Texto', icon: '✎', desc: 'Colar conteúdo direto' },
  { id: 'perplexity', label: 'Perplexity', icon: '⚡', desc: 'Pesquisa AI em tempo real' },
]

const COLLECTIONS = [
  { value: 'study_car_manuals', label: 'Manuais de Veículos', rag: 'study' },
  { value: 'study_industry_news', label: 'Notícias do Setor', rag: 'study' },
  { value: 'study_diagnostic_kb', label: 'Base Diagnósticos', rag: 'study' },
  { value: 'study_business_insights', label: 'Insights Negócio', rag: 'study' },
  { value: 'ops_client_support', label: 'Suporte ao Cliente', rag: 'operational' },
  { value: 'ops_service_procedures', label: 'Procedimentos Serviço', rag: 'operational' },
  { value: 'ops_pricing_guidelines', label: 'Regras de Preço', rag: 'operational' },
]

const PERPLEXITY_MODELS = [
  { value: 'sonar', label: 'Sonar — Rápido' },
  { value: 'sonar-pro', label: 'Sonar Pro — Profundo' },
  { value: 'sonar-reasoning-pro', label: 'Sonar Reasoning — Complexo' },
]

function StatusBadge({ status }) {
  const styles = {
    completed: { bg: '#22c55e15', color: '#22c55e', text: 'CONCLUÍDO' },
    processing: { bg: '#f59e0b15', color: '#f59e0b', text: 'PROCESSANDO' },
    error: { bg: '#ef444415', color: '#ef4444', text: 'ERRO' },
    empty_no_text_extracted: { bg: '#f59e0b15', color: '#f59e0b', text: 'SEM TEXTO' },
  }
  const s = styles[status] || styles.error
  return (
    <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider" style={{ background: s.bg, color: s.color }}>
      {s.text}
    </span>
  )
}

/* ========== Drop Zone ========== */
function DropZone({ onFiles, processing }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  return (
    <div
      className={`relative rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${processing ? 'pointer-events-none opacity-50' : ''}`}
      style={{
        border: `2px dashed ${dragOver ? '#00ffff' : 'rgba(0,255,255,0.15)'}`,
        background: dragOver ? 'rgba(0,255,255,0.05)' : 'rgba(0,255,255,0.02)',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.txt,.png,.jpg,.jpeg,.gif,.webp,.mp3,.mp4,.wav,.m4a,.ogg,.flac,.avi,.mov,.mkv,.docx"
        onChange={(e) => onFiles(Array.from(e.target.files || []))}
      />
      <div className="text-3xl mb-3" style={{ color: '#00ffff40' }}>⬆</div>
      <p className="text-sm font-mono" style={{ color: '#00ffff80' }}>
        Arraste arquivos aqui ou clique para selecionar
      </p>
      <p className="text-[10px] font-mono mt-2 text-gray-600">
        PDF · Imagem · Áudio · Vídeo · Texto
      </p>
    </div>
  )
}

/* ========== Result Card ========== */
function ResultCard({ result }) {
  if (!result) return null
  const isError = result.error
  return (
    <div
      className="glass-card rounded-lg p-4 animate-fade-in-up mt-4"
      style={{ borderLeft: `2px solid ${isError ? '#ef4444' : '#22c55e'}40` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: isError ? '#ef4444' : '#22c55e' }} />
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: isError ? '#ef4444' : '#22c55e' }}>
          {isError ? 'Erro na Ingestão' : 'Ingestão Concluída'}
        </span>
      </div>
      {isError ? (
        <p className="text-xs font-mono text-red-400">{result.error}</p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-mono text-gray-300">
            <span style={{ color: '#00ffff80' }}>Documento:</span> {result.title}
          </p>
          <p className="text-xs font-mono text-gray-300">
            <span style={{ color: '#00ffff80' }}>Chunks:</span> {result.chunk_count}
          </p>
          <p className="text-xs font-mono text-gray-300">
            <span style={{ color: '#00ffff80' }}>Collection:</span> {result.collection}
          </p>
          <p className="text-xs font-mono text-gray-300">
            <span style={{ color: '#00ffff80' }}>ID:</span> {result.document_id}
          </p>
        </div>
      )}
    </div>
  )
}

/* ========== Main Page ========== */
export default function Ingestion() {
  const [tab, setTab] = useState('file')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [collections, setCollections] = useState([])
  const [history, setHistory] = useState([])

  // Form states
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [title, setTitle] = useState('')
  const [collection, setCollection] = useState('study_car_manuals')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [pxModel, setPxModel] = useState('sonar-pro')

  useEffect(() => {
    getIngestCollections()
      .then(d => setCollections(d.collections || []))
      .catch(() => {})
    getIngestHistory()
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const refreshData = () => {
    getIngestCollections().then(d => setCollections(d.collections || [])).catch(() => {})
    getIngestHistory().then(d => setHistory(Array.isArray(d) ? d : [])).catch(() => {})
  }

  const selectedCol = COLLECTIONS.find(c => c.value === collection)
  const targetRag = selectedCol?.rag || 'study'

  const handleSubmit = async () => {
    setProcessing(true)
    setResult(null)
    setUploadProgress(0)
    try {
      let res
      if (tab === 'file' && selectedFiles.length > 0) {
        // Upload each file with progress
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          res = await ingestFile(file, title || file.name, targetRag, collection, (pct) => {
            // Weight progress across all files
            const filePct = (i / selectedFiles.length) * 100 + (pct / selectedFiles.length)
            setUploadProgress(Math.round(filePct))
          })
        }
        setUploadProgress(100)
      } else if (tab === 'url' && url) {
        res = await ingestURL(url, title, collection)
      } else if (tab === 'text' && text) {
        res = await ingestText(title || 'Texto manual', text, targetRag, collection)
      } else if (tab === 'perplexity' && query) {
        res = await ingestPerplexity(query, collection, pxModel)
      } else {
        setResult({ error: 'Preencha os campos obrigatórios' })
        setProcessing(false)
        return
      }
      setResult(res)
      // Reset form
      setSelectedFiles([])
      setTitle('')
      setUrl('')
      setText('')
      setQuery('')
      refreshData()
    } catch (err) {
      setResult({ error: err.message })
    }
    setProcessing(false)
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
          INGESTION PIPELINE
        </h1>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">
          Feed the Neural Core — Upload, Scrape, Research
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left — Ingestion Form */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* Tabs */}
          <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setResult(null) }}
                className="flex-1 rounded-lg p-3 transition-all duration-200 text-left font-mono"
                style={tab === t.id ? {
                  background: 'rgba(0,255,255,0.08)',
                  border: '1px solid rgba(0,255,255,0.25)',
                  boxShadow: '0 0 15px rgba(0,255,255,0.05)',
                } : {
                  background: 'rgba(0,20,40,0.4)',
                  border: '1px solid rgba(0,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{t.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: tab === t.id ? '#00ffff' : '#6b7280' }}>
                    {t.label}
                  </span>
                </div>
                <p className="text-[9px] mt-1" style={{ color: tab === t.id ? '#00ffff60' : '#4b5563' }}>
                  {t.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="glass-card rounded-lg p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {/* Collection selector (shared) */}
            <div className="mb-4">
              <label className="text-[10px] font-mono uppercase tracking-widest mb-2 block" style={{ color: '#00ffff60' }}>
                Collection Destino
              </label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                style={inputStyle}
              >
                <optgroup label="📚 Study RAG">
                  {COLLECTIONS.filter(c => c.rag === 'study').map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="⚙️ Operational RAG">
                  {COLLECTIONS.filter(c => c.rag === 'operational').map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Title (shared for file, url, text) */}
            {tab !== 'perplexity' && (
              <div className="mb-4">
                <label className="text-[10px] font-mono uppercase tracking-widest mb-2 block" style={{ color: '#00ffff60' }}>
                  Título do Documento
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Manual Hilux 2024, Artigo sobre freios ABS..."
                  className="w-full rounded-lg px-3 py-2.5 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                  style={inputStyle}
                />
              </div>
            )}

            {/* Tab-specific content */}
            {tab === 'file' && (
              <>
                <DropZone
                  processing={processing}
                  onFiles={(files) => setSelectedFiles(files)}
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded" style={{ background: 'rgba(0,255,255,0.03)' }}>
                        <span className="text-xs font-mono text-gray-300">{f.name}</span>
                        <span className="text-[10px] font-mono text-gray-500">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'url' && (
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest mb-2 block" style={{ color: '#00ffff60' }}>
                  URL para Scraping
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemplo.com/artigo-sobre-veiculos"
                  className="w-full rounded-lg px-3 py-2.5 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                  style={inputStyle}
                />
              </div>
            )}

            {tab === 'text' && (
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest mb-2 block" style={{ color: '#00ffff60' }}>
                  Conteúdo
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Cole o texto aqui... Manuais, procedimentos, specs técnicas..."
                  rows={8}
                  className="w-full rounded-lg px-3 py-2.5 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none"
                  style={inputStyle}
                />
                <p className="text-[10px] font-mono text-gray-600 mt-1">{text.length} caracteres</p>
              </div>
            )}

            {tab === 'perplexity' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest mb-2 block" style={{ color: '#00ffff60' }}>
                    Pergunta de Pesquisa
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: Quais os problemas mais comuns da Hilux 2024?"
                    className="w-full rounded-lg px-3 py-2.5 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest mb-2 block" style={{ color: '#00ffff60' }}>
                    Modelo
                  </label>
                  <select
                    value={pxModel}
                    onChange={(e) => setPxModel(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    style={inputStyle}
                  >
                    {PERPLEXITY_MODELS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {processing && tab === 'file' && uploadProgress > 0 && (
              <div className="mt-5" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do upload">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono" style={{ color: '#00ffff80' }}>Upload</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: '#00ffff' }}>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #00ffff, #a855f7)', boxShadow: '0 0 8px rgba(0,255,255,0.4)' }}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="mt-4 w-full rounded-lg py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300"
              style={{
                background: processing ? 'rgba(0,255,255,0.05)' : 'rgba(0,255,255,0.1)',
                border: '1px solid rgba(0,255,255,0.25)',
                color: '#00ffff',
                boxShadow: processing ? 'none' : '0 0 20px rgba(0,255,255,0.08)',
              }}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  {tab === 'file' && uploadProgress < 100 ? `Uploading ${uploadProgress}%...` : 'Processando...'}
                </span>
              ) : (
                `Ingerir \u2192 ${selectedCol?.label || collection}`
              )}
            </button>

            {/* Result */}
            <ResultCard result={result} />
          </div>
        </div>

        {/* Right — Collections & History */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Collections */}
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              RAG Collections
            </p>
            <div className="space-y-2">
              {collections.length > 0 ? collections.map(c => (
                <div key={c.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition">
                  <div>
                    <p className="text-[11px] font-mono text-gray-300">{c.name}</p>
                    <p className="text-[9px] font-mono" style={{ color: c.rag === 'study' ? '#f59e0b' : '#a855f7' }}>
                      {c.rag}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold" style={{ color: '#00ffff' }}>{c.count}</p>
                    <p className="text-[9px] font-mono text-gray-600">docs</p>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] font-mono text-gray-600">Carregando collections...</p>
              )}
            </div>
          </div>

          {/* Supported Formats */}
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Formatos Suportados
            </p>
            <div className="space-y-2">
              {[
                { type: 'PDF', ext: '.pdf', color: '#ef4444' },
                { type: 'Imagem', ext: '.png .jpg .webp .gif', color: '#22c55e' },
                { type: 'Áudio', ext: '.mp3 .wav .m4a .ogg .flac', color: '#3b82f6' },
                { type: 'Vídeo', ext: '.mp4 .avi .mov .mkv', color: '#f59e0b' },
                { type: 'Texto', ext: '.txt .docx', color: '#06b6d4' },
              ].map(f => (
                <div key={f.type} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
                  <span className="text-[10px] font-mono font-semibold w-12" style={{ color: f.color }}>{f.type}</span>
                  <span className="text-[10px] font-mono text-gray-500">{f.ext}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent History */}
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Histórico Recente
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {history.length > 0 ? history.map((doc, i) => (
                <div key={doc.id || i} className="py-2 px-3 rounded-lg hover:bg-white/[0.02] transition" style={{ borderLeft: '2px solid rgba(0,255,255,0.1)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-gray-300 truncate mr-2">{doc.title}</span>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-gray-600">{doc.source_type}</span>
                    <span className="text-[9px] font-mono text-gray-600">{doc.chunk_count} chunks</span>
                    <span className="text-[9px] font-mono text-gray-600">{doc.collection_name}</span>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] font-mono text-gray-600">Nenhum documento ingerido ainda</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
