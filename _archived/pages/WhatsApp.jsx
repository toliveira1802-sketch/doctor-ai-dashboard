import { useState, useEffect } from 'react'
import { evoCreateInstance, evoGetQR, evoStatus, evoAnnaCreateInstance, evoAnnaGetQR, evoAnnaStatus } from '../lib/api'

function InstancePanel({ title, subtitle, color, createFn, qrFn, statusFn }) {
  const [status, setStatus] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const checkStatus = () => {
    statusFn().then(setStatus).catch(() => setStatus({ state: 'offline' }))
  }

  useEffect(() => { checkStatus() }, [])

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      await createFn()
      setTimeout(async () => {
        try {
          const qr = await qrFn()
          setQrData(qr)
          checkStatus()
        } catch (e) { setError(e.message) }
        setLoading(false)
      }, 2000)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  const handleQR = async () => {
    setLoading(true)
    setError(null)
    try {
      const qr = await qrFn()
      setQrData(qr)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const connected = status?.state === 'open' || status?.instance?.state === 'open'

  return (
    <div className="glass-card rounded-lg p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-mono font-bold" style={{ color }}>{title}</p>
          <p className="text-[9px] font-mono text-gray-600 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: connected ? '#25D366' : '#ef4444', boxShadow: `0 0 8px ${connected ? '#25D36660' : '#ef444460'}` }} />
          <span className="text-[10px] font-mono font-bold" style={{ color: connected ? '#25D366' : '#ef4444' }}>
            {connected ? 'CONECTADO' : 'DESCONECTADO'}
          </span>
        </div>
      </div>

      {connected ? (
        <div className="rounded-lg p-4" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
          <p className="text-xs font-mono" style={{ color }}>{title} ativo no WhatsApp!</p>
          <p className="text-[10px] font-mono text-gray-500 mt-1">Recebendo e respondendo mensagens automaticamente.</p>
          <button onClick={checkStatus} className="mt-3 text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all hover:bg-white/[0.03]" style={{ border: `1px solid ${color}30`, color: `${color}80` }}>
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={loading} className="flex-1 rounded-lg py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  Conectando...
                </span>
              ) : 'Criar Instancia'}
            </button>
            <button onClick={handleQR} disabled={loading} className="flex-1 rounded-lg py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all" style={{ background: `${color}08`, border: `1px solid ${color}20`, color: `${color}80` }}>
              Gerar QR
            </button>
          </div>

          {qrData && (
            <div className="rounded-lg p-5 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20` }}>
              {qrData.base64 || qrData.qrcode?.base64 ? (
                <>
                  <img src={qrData.base64 || qrData.qrcode?.base64} alt="QR Code" className="mx-auto rounded-lg" style={{ maxWidth: '240px', background: 'white', padding: '10px' }} />
                  <p className="text-[10px] font-mono mt-3" style={{ color: `${color}80` }}>Escaneie com o WhatsApp</p>
                  <button onClick={() => { handleQR(); setTimeout(checkStatus, 5000) }} className="mt-2 text-[9px] font-mono uppercase px-3 py-1 rounded-lg" style={{ border: `1px solid ${color}20`, color: `${color}60` }}>
                    Atualizar QR
                  </button>
                </>
              ) : (
                <p className="text-[10px] font-mono text-gray-500">{JSON.stringify(qrData).substring(0, 200)}</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="text-[10px] font-mono text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

export default function WhatsApp() {
  return (
    <div className="min-h-screen neural-grid p-6 max-w-[1200px] mx-auto">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-lg font-bold font-mono tracking-wider" style={{ color: '#25D366' }}>
          WHATSAPP CHANNELS
        </h1>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">
          Evolution API — Conexao direta via QR Code
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InstancePanel
          title="Anna — Vendas"
          subtitle="Atende clientes, classifica leads, fecha agendamentos"
          color="#ec4899"
          createFn={evoAnnaCreateInstance}
          qrFn={evoAnnaGetQR}
          statusFn={evoAnnaStatus}
        />
        <InstancePanel
          title="Pitoco Loco — Estrategico"
          subtitle="Braco direito, Second Brain, planejamento"
          color="#a855f7"
          createFn={evoCreateInstance}
          qrFn={evoGetQR}
          statusFn={evoStatus}
        />
      </div>

      <div className="glass-card rounded-lg p-4 mt-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#25D36660' }}>Como Funciona</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold" style={{ color: '#ec4899' }}>Anna (Vendas)</p>
            <div className="space-y-1">
              {['Cliente manda msg → Anna processa com RAG', 'Classifica lead (hot/warm/cold)', 'Responde com tecnica consultiva', 'Salva no CRM automaticamente'].map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[9px] font-mono font-bold shrink-0 w-5" style={{ color: '#ec489940' }}>0{i + 1}</span>
                  <p className="text-[10px] font-mono text-gray-500">{t}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold" style={{ color: '#a855f7' }}>Pitoco Loco (Estrategico)</p>
            <div className="space-y-1">
              {['Tu manda msg → Pitoco processa com Second Brain', 'Consulta vault Obsidian via RAG', 'Responde como braco direito estrategico', 'Foco em planejamento e posicionamento'].map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[9px] font-mono font-bold shrink-0 w-5" style={{ color: '#a855f740' }}>0{i + 1}</span>
                  <p className="text-[10px] font-mono text-gray-500">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
