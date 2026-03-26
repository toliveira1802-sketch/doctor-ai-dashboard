import { useState } from 'react'
import { generateBlog, generateBlogAuto } from '../lib/api'

const STYLES = [
  { value: 'informativo', label: 'Informativo', desc: 'Educacional e detalhado' },
  { value: 'tecnico', label: 'Tecnico', desc: 'Specs e procedimentos' },
  { value: 'comercial', label: 'Comercial', desc: 'Foco em conversao' },
  { value: 'seo', label: 'SEO', desc: 'Otimizado para busca' },
]

const SUGGESTIONS = [
  'Quando trocar pastilhas de freio: sinais de desgaste',
  'Problemas comuns da Hilux 2024 e como resolver',
  'Manutencao preventiva: o guia completo para seu carro',
  'Troca de oleo: intervalos corretos por tipo de motor',
  'Diagnostico de ruidos no motor: o que cada som significa',
  'Como escolher pneus certos para o seu veiculo',
]

export default function BlogGenerator() {
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('informativo')
  const [generating, setGenerating] = useState(false)
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async (customTopic) => {
    const t = customTopic || topic
    if (!t) return
    setGenerating(true)
    setError(null)
    setPost(null)
    try {
      const result = await generateBlog(t, style)
      setPost(result)
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false)
  }

  const handleAutoGenerate = async () => {
    setGenerating(true)
    setError(null)
    setPost(null)
    try {
      const result = await generateBlogAuto()
      setPost(result)
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false)
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
          BLOG GENERATOR
        </h1>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">
          Conteudo Automotivo com IA — RAG-Powered
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left - Controls */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* Topic */}
          <div className="glass-card rounded-lg p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <label className="text-[10px] font-mono uppercase tracking-widest mb-2 block" style={{ color: '#00ffff60' }}>
              Topico do Post
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Problemas comuns do motor EA888 da VW..."
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none"
              style={inputStyle}
            />

            {/* Style selector */}
            <label className="text-[10px] font-mono uppercase tracking-widest mb-2 mt-4 block" style={{ color: '#00ffff60' }}>
              Estilo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className="rounded-lg p-2.5 text-left transition-all font-mono"
                  style={style === s.value ? {
                    background: 'rgba(0,255,255,0.08)',
                    border: '1px solid rgba(0,255,255,0.25)',
                  } : {
                    background: 'rgba(0,20,40,0.4)',
                    border: '1px solid rgba(0,255,255,0.06)',
                  }}
                >
                  <span className="text-[10px] font-bold block" style={{ color: style === s.value ? '#00ffff' : '#9ca3af' }}>
                    {s.label}
                  </span>
                  <span className="text-[9px] block" style={{ color: style === s.value ? '#00ffff60' : '#4b5563' }}>
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleGenerate()}
                disabled={generating || !topic}
                className="flex-1 rounded-lg py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all"
                style={{
                  background: generating ? 'rgba(0,255,255,0.05)' : 'rgba(0,255,255,0.1)',
                  border: '1px solid rgba(0,255,255,0.25)',
                  color: '#00ffff',
                  opacity: !topic && !generating ? 0.5 : 1,
                }}
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    Gerando...
                  </span>
                ) : 'Gerar Post'}
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="rounded-lg py-3 px-4 text-xs font-mono font-bold uppercase tracking-widest transition-all"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.25)',
                  color: '#a855f7',
                }}
              >
                Auto
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="glass-card rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#00ffff60' }}>
              Sugestoes de Topicos
            </p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setTopic(s); handleGenerate(s) }}
                  disabled={generating}
                  className="w-full text-left rounded-lg px-3 py-2 text-[11px] font-mono text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] transition-all"
                  style={{ borderLeft: '2px solid rgba(0,255,255,0.08)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Generated Content */}
        <div className="col-span-12 lg:col-span-7">
          {error && (
            <div className="glass-card rounded-lg p-4 mb-4 animate-fade-in-up" style={{ borderLeft: '2px solid #ef444440' }}>
              <p className="text-[10px] font-mono text-red-400">{error}</p>
            </div>
          )}

          {generating && !post && (
            <div className="glass-card rounded-lg p-12 text-center animate-fade-in-up">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-mono" style={{ color: '#00ffff80' }}>Gerando conteudo com RAG...</p>
              <p className="text-[10px] font-mono text-gray-600 mt-1">Buscando no Knowledge Base + Gerando com IA</p>
            </div>
          )}

          {post && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Post Header */}
              <div className="glass-card rounded-lg p-5" style={{ borderTop: '2px solid rgba(0,255,255,0.2)' }}>
                <h2 className="text-base font-bold font-mono text-gray-100 mb-2">{post.title}</h2>
                {post.meta_description && (
                  <p className="text-xs font-mono text-gray-400 mb-3 italic">{post.meta_description}</p>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  {post.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-mono px-2 py-0.5 rounded"
                      style={{ background: 'rgba(0,255,255,0.08)', color: '#00ffff80', border: '1px solid rgba(0,255,255,0.15)' }}
                    >
                      {tag}
                    </span>
                  ))}
                  {post.word_count && (
                    <span className="text-[9px] font-mono text-gray-600">{post.word_count} palavras</span>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div
                className="glass-card rounded-lg p-6"
                style={{ borderLeft: '2px solid rgba(0,255,255,0.1)' }}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <div
                    className="text-xs font-mono text-gray-300 leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '1.8' }}
                  >
                    {post.content}
                  </div>
                </div>
              </div>

              {/* Sources */}
              {post.sources_used?.length > 0 && (
                <div className="glass-card rounded-lg p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#00ffff60' }}>
                    Fontes RAG Utilizadas
                  </p>
                  <div className="space-y-1">
                    {post.sources_used.map((src, i) => (
                      <p key={i} className="text-[10px] font-mono text-gray-500 truncate">
                        {typeof src === 'string' ? src : src.collection || src.title || JSON.stringify(src)}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy button */}
              <button
                onClick={() => navigator.clipboard.writeText(post.content || '')}
                className="w-full rounded-lg py-2.5 text-[10px] font-mono uppercase tracking-widest transition-all hover:bg-white/[0.03]"
                style={{ border: '1px solid rgba(0,255,255,0.1)', color: '#00ffff80' }}
              >
                Copiar Conteudo
              </button>
            </div>
          )}

          {!post && !generating && (
            <div className="glass-card rounded-lg p-12 text-center animate-fade-in-up">
              <div className="text-4xl mb-4" style={{ color: '#00ffff15' }}>&#9998;</div>
              <p className="text-sm font-mono text-gray-500">Escolha um topico e gere conteudo</p>
              <p className="text-[10px] font-mono text-gray-600 mt-1">
                O blog generator usa o Knowledge Base (RAG) como fonte de dados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
