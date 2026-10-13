import { useEffect, useState } from 'react'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Set on the public site (see .env.example). On the claude.ai link it is null:
// there are no accounts and the page's own database is used instead.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

// undefined while checking, null when signed out.
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(supabase ? undefined : null)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return user
}

// Supabase's raw messages, in plainer words where they're unclear.
function friendly(msg?: string | null) {
  if (!msg) return null
  if (/fetch|network/i.test(msg)) return "Can't reach the server. Check your connection and try again."
  if (/invalid login/i.test(msg)) return 'That email and password don\'t match an account.'
  if (/not confirmed/i.test(msg)) return 'Open the link we emailed you to finish signing up, then log in.'
  return msg
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase!.auth.signInWithPassword({ email, password })
  return friendly(error?.message)
}

// Returns 'confirm' when Supabase sent a confirmation email before the account can be used.
export async function signUp(email: string, password: string): Promise<{ error: string | null; confirm: boolean }> {
  const { data, error } = await supabase!.auth.signUp({ email, password })
  return { error: friendly(error?.message), confirm: !error && !data.session }
}

export async function resetPassword(email: string) {
  const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })
  return friendly(error?.message)
}

export function signOut() {
  return supabase?.auth.signOut()
}
