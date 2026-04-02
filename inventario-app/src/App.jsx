import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  fetchPecas,
  buscarPecaPorCodigo,
  buscarPecas,
  salvarPeca,
  atualizarEstoque,
  deletarPeca,
  uploadFoto,
} from './supabase'

// ─── Icons ───
const IconScan = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" strokeWidth={2} />
  </svg>
)
const IconSearch = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
  </svg>
)
const IconBox = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
)
const IconClose = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const IconDown = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)
const IconPlus = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
  </svg>
)
const IconCamera = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
)
const IconMinus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" d="M20 12H4" />
  </svg>
)
const IconPlusSmall = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
  </svg>
)

function StatusBadge({ qtd }) {
  if (qtd === 0) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">ZERADO</span>
  if (qtd <= 3) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">BAIXO</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400">OK</span>
}

// ─── Scanner ───
function Scanner({ onResult, onClose }) {
  const scannerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    const qr = new Html5Qrcode('qr-reader')
    scannerRef.current = qr

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 120 }, aspectRatio: 1.0 },
      (decoded) => {
        if (mounted) {
          qr.stop().catch(() => {})
          onResult(decoded)
        }
      },
      () => {}
    ).catch(() => {
      if (mounted) onClose()
    })

    return () => {
      mounted = false
      qr.stop().catch(() => {})
    }
  }, [onResult, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-white font-bold">Escanear Codigo</h3>
        <button onClick={onClose} className="p-2 text-white"><IconClose /></button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden" />
      </div>
      <p className="p-4 text-center text-gray-500 text-xs">Aponte a camera para o codigo de barras da peca</p>
    </div>
  )
}

// ─── Detail Sheet ───
function PecaSheet({ peca, onClose, onUpdate, onDelete }) {
  const [qty, setQty] = useState(peca?.quantidade_estoque || 0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (peca) setQty(peca.quantidade_estoque)
  }, [peca])

  if (!peca) return null

  async function handleQtyChange(delta) {
    const next = Math.max(0, qty + delta)
    setQty(next)
    setSaving(true)
    try {
      await atualizarEstoque(peca.id, next)
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  async function handleFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFoto(peca.codigo_peca, file)
      await salvarPeca({ ...peca, foto_url: url })
      onUpdate()
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Remover esta peca do inventario?')) return
    await deletarPeca(peca.id)
    onUpdate()
    onClose()
  }

  const preco = Number(peca.preco_medio_mercado) || 0

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl p-5 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />

        {/* Foto */}
        {peca.foto_url && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img src={peca.foto_url} alt={peca.tipo_peca} className="w-full h-40 object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 font-mono">{peca.codigo_peca}</p>
            <h3 className="text-lg font-black text-white mt-0.5">{peca.tipo_peca}</h3>
          </div>
          <StatusBadge qtd={qty} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-gray-800/80 rounded-xl p-3 text-center">
            <p className="text-[9px] uppercase tracking-widest text-gray-500">Estoque</p>
            <p className="text-xl font-black text-white mt-1">{qty}</p>
          </div>
          <div className="bg-gray-800/80 rounded-xl p-3 text-center">
            <p className="text-[9px] uppercase tracking-widest text-gray-500">Preco</p>
            <p className="text-xl font-black text-green-400 mt-1">R${preco.toFixed(0)}</p>
          </div>
          <div className="bg-gray-800/80 rounded-xl p-3 text-center">
            <p className="text-[9px] uppercase tracking-widest text-gray-500">Total</p>
            <p className="text-xl font-black text-white mt-1">R${(qty * preco).toFixed(0)}</p>
          </div>
        </div>

        {/* Qty controls */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <button onClick={() => handleQtyChange(-1)} disabled={saving} className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center active:scale-95 transition disabled:opacity-50">
            <IconMinus />
          </button>
          <span className="text-3xl font-black text-white w-16 text-center">{qty}</span>
          <button onClick={() => handleQtyChange(1)} disabled={saving} className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center active:scale-95 transition disabled:opacity-50">
            <IconPlusSmall />
          </button>
        </div>

        {/* Foto button */}
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full py-3 mb-3 bg-gray-800 rounded-xl flex items-center justify-center gap-2 text-sm text-gray-300 active:bg-gray-700 transition disabled:opacity-50">
          <IconCamera />
          {uploading ? 'Enviando foto...' : peca.foto_url ? 'Trocar Foto' : 'Tirar Foto da Peca'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />

        {/* Carros */}
        {peca.carros_suportados?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Carros Suportados</p>
            <div className="flex flex-wrap gap-1.5">
              {peca.carros_suportados.map((c) => (
                <span key={c} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Equivalentes */}
        {peca.pecas_equivalentes?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Pecas Equivalentes</p>
            <div className="flex flex-wrap gap-1.5">
              {peca.pecas_equivalentes.map((eq) => (
                <span key={eq} className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-mono">{eq}</span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-800 text-gray-400 font-bold text-sm rounded-xl transition">
            Fechar
          </button>
          <button onClick={handleDelete} className="px-5 py-3 bg-red-500/10 text-red-400 font-bold text-sm rounded-xl transition">
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Peca Form ───
function AddPecaSheet({ onClose, onSaved, initialCode }) {
  const [form, setForm] = useState({
    codigo_peca: initialCode || '',
    tipo_peca: '',
    carros_suportados: '',
    pecas_equivalentes: '',
    quantidade_estoque: 1,
    preco_medio_mercado: 0,
  })
  const [foto, setFoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.codigo_peca || !form.tipo_peca) return
    setSaving(true)
    try {
      let foto_url = null
      if (foto) {
        foto_url = await uploadFoto(form.codigo_peca, foto)
      }
      await salvarPeca({
        codigo_peca: form.codigo_peca.trim(),
        tipo_peca: form.tipo_peca.trim(),
        carros_suportados: form.carros_suportados.split(',').map((s) => s.trim()).filter(Boolean),
        pecas_equivalentes: form.pecas_equivalentes.split(',').map((s) => s.trim()).filter(Boolean),
        quantidade_estoque: parseInt(form.quantidade_estoque) || 0,
        preco_medio_mercado: parseFloat(form.preco_medio_mercado) || 0,
        foto_url,
      })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/40"

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl p-5 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-black text-white mb-4">Nova Peca</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500">Codigo da Peca *</label>
            <input value={form.codigo_peca} onChange={(e) => update('codigo_peca', e.target.value)} placeholder="Ex: WP-0948" className={inputClass} required />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500">Tipo / Descricao *</label>
            <input value={form.tipo_peca} onChange={(e) => update('tipo_peca', e.target.value)} placeholder="Ex: Bomba D'agua" className={inputClass} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-500">Quantidade</label>
              <input type="number" min="0" value={form.quantidade_estoque} onChange={(e) => update('quantidade_estoque', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-500">Preco Medio (R$)</label>
              <input type="number" min="0" step="0.01" value={form.preco_medio_mercado} onChange={(e) => update('preco_medio_mercado', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500">Carros Suportados (separar por virgula)</label>
            <input value={form.carros_suportados} onChange={(e) => update('carros_suportados', e.target.value)} placeholder="VW Gol 2008-2023, Fiat Uno 2010-2020" className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500">Pecas Equivalentes (separar por virgula)</label>
            <input value={form.pecas_equivalentes} onChange={(e) => update('pecas_equivalentes', e.target.value)} placeholder="Bosch ABC123, NGK XYZ789" className={inputClass} />
          </div>

          {/* Foto */}
          <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-3 bg-gray-800 rounded-xl flex items-center justify-center gap-2 text-sm text-gray-300 active:bg-gray-700 transition">
            <IconCamera />
            {foto ? foto.name : 'Tirar Foto da Peca'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] || null)} className="hidden" />

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-800 text-gray-400 font-bold text-sm rounded-xl">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-green-500 text-white font-bold text-sm rounded-xl disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar Peca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Install Banner ───
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  async function install() {
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setShow(false)
    setDeferredPrompt(null)
  }

  return (
    <div className="mx-4 mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-slide-up">
      <IconDown />
      <div className="flex-1">
        <p className="text-sm font-bold text-white">Instalar App</p>
        <p className="text-xs text-gray-400">Adicione na tela inicial</p>
      </div>
      <button onClick={install} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg">Instalar</button>
      <button onClick={() => setShow(false)} className="text-gray-600 p-1"><IconClose /></button>
    </div>
  )
}

// ─── Main App ───
export default function App() {
  const [pecas, setPecas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('scan')
  const [scanning, setScanning] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [resultados, setResultados] = useState([])
  const [lastScan, setLastScan] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addCode, setAddCode] = useState('')

  async function loadPecas() {
    try {
      const data = await fetchPecas()
      setPecas(data)
    } catch (err) {
      console.error('Erro ao carregar pecas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPecas() }, [])

  const handleScanResult = useCallback(async (code) => {
    setScanning(false)
    const found = await buscarPecaPorCodigo(code)
    if (found) {
      setSelected(found)
      setLastScan(found)
    } else {
      const partial = await buscarPecas(code)
      if (partial.length === 1) {
        setSelected(partial[0])
        setLastScan(partial[0])
      } else if (partial.length > 0) {
        setQuery(code)
        setResultados(partial)
      } else {
        // Peca nao encontrada — oferecer cadastro
        setAddCode(code)
        setShowAdd(true)
      }
    }
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    const exact = await buscarPecaPorCodigo(query)
    if (exact) {
      setSelected(exact)
      setResultados([])
    } else {
      const res = await buscarPecas(query)
      setResultados(res)
    }
  }

  const totalItens = pecas.reduce((a, p) => a + p.quantidade_estoque, 0)
  const totalValor = pecas.reduce((a, p) => a + p.quantidade_estoque * Number(p.preco_medio_mercado), 0)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Inventario</h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Pitoco Loco Corp</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-gray-600">{totalItens} itens</span>
            </div>
            <button onClick={() => { setAddCode(''); setShowAdd(true) }} className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
              <IconPlus />
            </button>
          </div>
        </div>
      </header>

      <InstallBanner />

      {/* Tabs */}
      <div className="flex-shrink-0 flex mx-4 mb-3 bg-gray-900 rounded-xl p-1">
        <button onClick={() => setTab('scan')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${tab === 'scan' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>
          <IconScan /> Scanner
        </button>
        <button onClick={() => setTab('lista')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${tab === 'lista' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>
          <IconBox /> Estoque
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {tab === 'scan' && (
          <div className="space-y-4">
            <button onClick={() => setScanning(true)} className="w-full py-6 bg-gradient-to-b from-green-500/20 to-green-500/5 border-2 border-dashed border-green-500/30 rounded-2xl flex flex-col items-center gap-2 active:scale-[0.98] transition">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400"><IconScan /></div>
              <span className="text-sm font-bold text-white">Escanear Codigo da Peca</span>
              <span className="text-xs text-gray-500">Toque para abrir a camera</span>
            </button>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"><IconSearch /></span>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Codigo, peca ou carro..." className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/40" />
              </div>
              <button type="submit" className="px-5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition text-sm">Buscar</button>
            </form>

            {/* Quick codes */}
            {pecas.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Acesso Rapido</p>
                <div className="flex flex-wrap gap-1.5">
                  {pecas.slice(0, 8).map((p) => (
                    <button key={p.id} onClick={() => setSelected(p)} className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs font-mono text-gray-400 active:bg-gray-800 transition">
                      {p.codigo_peca}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {lastScan && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Ultimo Escaneamento</p>
                <button onClick={() => setSelected(lastScan)} className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 active:bg-gray-800 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {lastScan.foto_url && <img src={lastScan.foto_url} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                      <div>
                        <p className="text-xs font-mono text-green-400">{lastScan.codigo_peca}</p>
                        <p className="text-sm font-bold text-white mt-0.5">{lastScan.tipo_peca}</p>
                      </div>
                    </div>
                    <StatusBadge qtd={lastScan.quantidade_estoque} />
                  </div>
                </button>
              </div>
            )}

            {resultados.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">{resultados.length} resultado(s)</p>
                <div className="space-y-2">
                  {resultados.map((p) => (
                    <button key={p.id} onClick={() => setSelected(p)} className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 active:bg-gray-800 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {p.foto_url && <img src={p.foto_url} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                          <div>
                            <p className="text-xs font-mono text-green-400">{p.codigo_peca}</p>
                            <p className="text-sm font-bold text-white mt-0.5">{p.tipo_peca}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge qtd={p.quantidade_estoque} />
                          <p className="text-xs text-gray-500 mt-1">{p.quantidade_estoque} un.</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'lista' && (
          <div className="space-y-2">
            {pecas.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)} className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 active:bg-gray-800 transition">
                <div className="flex items-center gap-3">
                  {p.foto_url && <img src={p.foto_url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-green-400">{p.codigo_peca}</p>
                      <StatusBadge qtd={p.quantidade_estoque} />
                    </div>
                    <p className="text-sm font-bold text-white mt-1 truncate">{p.tipo_peca}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.carros_suportados?.[0] || ''} {(p.carros_suportados?.length || 0) > 1 ? `+${p.carros_suportados.length - 1}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-white">{p.quantidade_estoque}</p>
                    <p className="text-xs text-gray-500">R${Number(p.preco_medio_mercado).toFixed(0)}</p>
                  </div>
                </div>
              </button>
            ))}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Resumo do Estoque</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-black text-white">{pecas.length}</p>
                  <p className="text-[10px] text-gray-500">Tipos</p>
                </div>
                <div>
                  <p className="text-lg font-black text-white">{totalItens}</p>
                  <p className="text-[10px] text-gray-500">Unidades</p>
                </div>
                <div>
                  <p className="text-lg font-black text-green-400">R${totalValor.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-500">Valor Total</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      {scanning && <Scanner onResult={handleScanResult} onClose={() => setScanning(false)} />}
      {selected && <PecaSheet peca={selected} onClose={() => setSelected(null)} onUpdate={loadPecas} onDelete={() => { setSelected(null); loadPecas() }} />}
      {showAdd && <AddPecaSheet onClose={() => setShowAdd(false)} onSaved={loadPecas} initialCode={addCode} />}
    </div>
  )
}
