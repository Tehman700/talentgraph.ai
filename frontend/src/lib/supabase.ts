import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  as string
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const hasSupabaseConfig = Boolean(url && key)

if (!hasSupabaseConfig) {
  console.warn('Supabase env vars are missing. Auth features are disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
}

const createNoopSupabase = () => ({
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    signUp: async () => ({ data: null, error: new Error('Supabase is not configured') }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase is not configured') }),
    signOut: async () => ({ error: null }),
  },
})

export const supabase = hasSupabaseConfig ? createClient(url, key) : createNoopSupabase()

export type AuthUser = {
  id: string
  email: string | undefined
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
