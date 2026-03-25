import { useState } from 'react'
import { analyzeVehicle } from '../lib/api'

export default function Insights() {
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!brand || !model) return
    setLoading(true)
    try {
      const data = await analyzeVehicle(brand, model, year)
      setResult(data)
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const quickVehicles = [
    { brand: 'Honda', model: 'Civic', year: '2020' },
    { brand: 'Toyota', model: 'Corolla', year: '2022' },
    { brand: 'Volkswagen', model: 'Gol', year: '2019' },
    { brand: 'Fiat', model: 'Argo', year: '2023' },
    { brand: 'Hyundai', model: 'HB20', year: '2021' },
  ]

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Insights - Analise de Veiculos</h2>

      {/* Quick Select */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {quickVehicles.map((v) => (
          <button
            key={`${v.brand}${v.model}`}
            onClick={() => { setBrand(v.brand); setModel(v.model); setYear(v.year) }}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition"
          >
            {v.brand} {v.model} {v.year}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Marca"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelo"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ano"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
        </div>
        <button onClick={analyze} disabled={loading || !brand || !model}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition w-full">
          {loading ? 'Analisando...' : 'Analisar Veiculo'}
        </button>
      </div>

      {/* Result */}
      {result?.analysis && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">
              {result.vehicle?.brand} {result.vehicle?.model} {result.vehicle?.year}
            </h3>
            <span className="text-xs text-gray-500">{result.sources_used} fontes</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-gray-300">
            {result.analysis}
          </div>
        </div>
      )}
      {result?.error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400 text-sm">
          {result.error}
        </div>
      )}
    </div>
  )
}
