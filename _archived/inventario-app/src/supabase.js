import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://acuufrgoyjwzlyhopaus.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdXVmcmdveWp3emx5aG9wYXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjI5ODgsImV4cCI6MjA4MzgzODk4OH0.V7CgRaRFI8QAblr3TysttxPAY5E-e2vWEpmdu_2au4A'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Queries ───

export async function fetchPecas() {
  const { data, error } = await supabase
    .from('pecas_encontradas')
    .select('*')
    .order('tipo_peca')
  if (error) throw error
  return data
}

export async function buscarPecaPorCodigo(codigo) {
  const { data } = await supabase
    .from('pecas_encontradas')
    .select('*')
    .ilike('codigo_peca', codigo.trim())
    .maybeSingle()
  return data
}

export async function buscarPecas(termo) {
  const t = termo.trim()
  if (!t) return []
  const { data } = await supabase
    .from('pecas_encontradas')
    .select('*')
    .or(`codigo_peca.ilike.%${t}%,tipo_peca.ilike.%${t}%`)
    .order('tipo_peca')
  return data || []
}

export async function salvarPeca(peca) {
  const { data, error } = await supabase
    .from('pecas_encontradas')
    .upsert(peca, { onConflict: 'codigo_peca' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function atualizarEstoque(id, quantidade) {
  const { error } = await supabase
    .from('pecas_encontradas')
    .update({ quantidade_estoque: quantidade })
    .eq('id', id)
  if (error) throw error
}

export async function deletarPeca(id) {
  const { error } = await supabase
    .from('pecas_encontradas')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Storage (fotos) ───

export async function uploadFoto(codigoPeca, file) {
  const ext = file.name?.split('.').pop() || 'jpg'
  const path = `${codigoPeca.replace(/[^a-zA-Z0-9-]/g, '_')}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('pecas-fotos')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('pecas-fotos').getPublicUrl(path)
  return data.publicUrl
}
