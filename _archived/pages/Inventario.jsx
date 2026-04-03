import { useState, useRef, useEffect } from 'react'
import { pecas, buscarPeca, buscarPecas } from '../data/pecas'

function StatusBadge({ qtd }) {
  if (qtd === 0) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">ZERADO</span>
  if (qtd <= 3) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">BAIXO</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-500">OK</span>
}

function PecaCard({ peca, onClose }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 backdrop-blur animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 font-mono">{peca.codigo_peca}</p>
          <h3 className="text-xl font-bold text-white mt-1">{peca.tipo_peca}</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition text-lg leading-none">&times;</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-gray-900/60 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Estoque</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white">{peca.quantidade_estoque}</span>
            <StatusBadge qtd={peca.quantidade_estoque} />
          </div>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Preco Medio</p>
          <span className="text-2xl font-black text-brand-500">
            R$ {peca.preco_medio_mercado.toFixed(2)}
          </span>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Valor em Estoque</p>
          <span className="text-2xl font-black text-white">
            R$ {(peca.quantidade_estoque * peca.preco_medio_mercado).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Carros Suportados</p>
          <div className="flex flex-wrap gap-1.5">
            {peca.carros_suportados.map((c) => (
              <span key={c} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs">{c}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Pecas Equivalentes (Cross-Ref)</p>
          <div className="flex flex-wrap gap-1.5">
            {peca.pecas_equivalentes.map((e) => (
              <span key={e} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-mono">{e}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Inventario() {
  const [query, setQuery] = useState('')
  const [resultado, setResultado] = useState(null)
  const [resultados, setResultados] = useState([])
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  async function startCamera() {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setScanning(true)
    } catch {
      setCameraError('Camera indisponivel. Use a busca manual abaixo.')
    }
  }

  function handleCapture() {
    // Simulate reading a code from camera — in production, integrate with html5-qrcode
    stopCamera()
    // Pick a random part to simulate a scan
    const random = pecas[Math.floor(Math.random() * pecas.length)]
    setQuery(random.codigo_peca)
    setResultado(random)
    setResultados([])
  }

  function handleSearch(e) {
    e.preventDefault()
    const exact = buscarPeca(query)
    if (exact) {
      setResultado(exact)
      setResultados([])
    } else {
      setResultado(null)
      setResultados(buscarPecas(query))
    }
  }

  function selectPeca(p) {
    setResultado(p)
    setResultados([])
    setQuery(p.codigo_peca)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Inventario Inteligente</h2>
        <p className="text-sm text-gray-500 mt-1">Escaneie ou busque pecas para consultar ficha tecnica e estoque.</p>
      </div>

      {/* Scanner Zone */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Camera / Scanner area */}
          <div className="flex-shrink-0 w-full md:w-72">
            <div className="relative aspect-square bg-gray-800/80 rounded-xl overflow-hidden flex items-center justify-center border border-gray-700/50">
              {scanning ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-brand-500/60 rounded-lg" />
                    <div className="absolute w-48 h-0.5 bg-brand-500/80 animate-pulse" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <button
                      onClick={handleCapture}
                      className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition"
                    >
                      Capturar Codigo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gray-700/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-lg transition"
                  >
                    Abrir Scanner
                  </button>
                  {cameraError && (
                    <p className="text-xs text-amber-400 mt-2">{cameraError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Manual search */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Busca Manual</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Codigo, tipo de peca ou modelo do carro..."
                className="flex-1 bg-gray-800 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition"
              >
                Buscar
              </button>
            </form>

            {/* Quick codes */}
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Codigos Rapidos (teste)</p>
              <div className="flex flex-wrap gap-1.5">
                {pecas.map((p) => (
                  <button
                    key={p.codigo_peca}
                    onClick={() => { setQuery(p.codigo_peca); selectPeca(p) }}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700/50 rounded-lg text-xs font-mono text-gray-400 hover:text-white transition"
                  >
                    {p.codigo_peca}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result: exact match */}
      {resultado && (
        <PecaCard peca={resultado} onClose={() => setResultado(null)} />
      )}

      {/* Result: multiple matches */}
      {!resultado && resultados.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{resultados.length} resultado(s) encontrado(s)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {resultados.map((p) => (
              <button
                key={p.codigo_peca}
                onClick={() => selectPeca(p)}
                className="text-left bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 hover:border-brand-500/30 transition group"
              >
                <p className="text-xs font-mono text-gray-500 group-hover:text-brand-500 transition">{p.codigo_peca}</p>
                <p className="text-sm font-bold text-white mt-1">{p.tipo_peca}</p>
                <div className="flex items-center justify-between mt-2">
                  <StatusBadge qtd={p.quantidade_estoque} />
                  <span className="text-xs text-gray-500">{p.quantidade_estoque} un.</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {!resultado && resultados.length === 0 && query && (
        <div className="text-center py-8 text-gray-600 text-sm">
          Nenhuma peca encontrada. Tente outro codigo ou termo.
        </div>
      )}

      {/* Full inventory table */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Estoque Completo</h3>
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800/50">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-medium">Codigo</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-medium">Estoque</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-medium">Preco</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pecas.map((p) => (
                  <tr
                    key={p.codigo_peca}
                    onClick={() => selectPeca(p)}
                    className="border-b border-gray-800/30 hover:bg-gray-800/40 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-mono text-brand-500">{p.codigo_peca}</td>
                    <td className="px-4 py-3 text-white">{p.tipo_peca}</td>
                    <td className="px-4 py-3 text-gray-300">{p.quantidade_estoque} un.</td>
                    <td className="px-4 py-3 text-gray-300">R$ {p.preco_medio_mercado.toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge qtd={p.quantidade_estoque} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
