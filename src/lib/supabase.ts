import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const configured = Boolean(url && key)
// Admin invitation links use an implicit callback. Ordinary app flows use PKCE.
const callback = new URLSearchParams(window.location.hash.slice(1))
if (callback.has('access_token') && ['invite','recovery'].includes(callback.get('type')||'')) {
  window.history.replaceState(null,'','/update-password'+window.location.search+window.location.hash)
}
export const supabase = createClient(url || 'https://unconfigured.supabase.co', key || 'unconfigured', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: callback.has('access_token')?'implicit':'pkce' },
})
export async function rpc<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc('workspace_action', { action, payload })
  if (error) throw new Error(error.message)
  return data as T
}
export async function rows(table: string, query = '*') {
  const result: any[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from(table).select(query).order('id').range(offset,offset+999)
    if (error) throw new Error(error.message)
    result.push(...(data ?? []))
    if (!data || data.length < 1000) return result
  }
}
