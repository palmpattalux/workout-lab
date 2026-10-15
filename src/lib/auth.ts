import { useEffect, useState } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Set on the public site once Supabase is configured (see .env.example). Until then
// accounts are kept on this device (below), so logging in works everywhere today.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export type AppUser = { id: string; email?: string }

// ---------- device accounts (used while there is no Supabase) ----------
// Each account is stored in this browser with a salted SHA-256 of its password.
// The signed-in account is remembered until "Log out".
type Account = { id: string; salt: string; hash: string }
const ACCOUNTS = 'workout-lab:accounts'
const ME = 'workout-lab:me'
const TRIES = 'workout-lab:login-tries'
const MAX_TRIES = 5
const LOCK_MS = 30_000

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T } catch { return d } }
const write = (k: string, v: unknown) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage blocked */ } }
async function digest(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

let me: AppUser | null = read<AppUser | null>(ME, null)
const meListeners = new Set<() => void>()
function setMe(u: AppUser | null) { me = u; write(ME, u); meListeners.forEach((fn) => fn()) }

// Basic lockout: after 5 wrong passwords, logging in pauses for 30 seconds.
function lockedFor() {
  const t = read<{ n: number; until: number }>(TRIES, { n: 0, until: 0 })
  return Math.max(0, t.until - Date.now())
}
function failedTry() {
  const t = read<{ n: number; until: number }>(TRIES, { n: 0, until: 0 })
  const n = t.n + 1
  write(TRIES, n >= MAX_TRIES ? { n: 0, until: Date.now() + LOCK_MS } : { n, until: 0 })
  return MAX_TRIES - n
}

async function localSignIn(email: string, password: string) {
  const wait = lockedFor()
  if (wait) return `Too many tries. Wait ${Math.ceil(wait / 1000)} seconds, then try again.`
  const acc = read<Record<string, Account>>(ACCOUNTS, {})[email.toLowerCase()]
  if (!acc || (await digest(acc.salt + password)) !== acc.hash) {
    const left = failedTry()
    return left > 0 ? `That email and password don't match an account. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many tries. Wait 30 seconds, then try again.'
  }
  write(TRIES, null)
  setMe({ id: acc.id, email: email.toLowerCase() })
  return null
}
async function localSignUp(email: string, password: string) {
  const all = read<Record<string, Account>>(ACCOUNTS, {})
  const k = email.toLowerCase()
  if (all[k]) return 'There is already an account with that email. Log in instead.'
  const salt = crypto.randomUUID()
  all[k] = { id: crypto.randomUUID(), salt, hash: await digest(salt + password) }
  write(ACCOUNTS, all)
  setMe({ id: all[k].id, email: k })
  return null
}

// undefined while checking, null when signed out.
export function useUser(): AppUser | null | undefined {
  const [user, setUser] = useState<AppUser | null | undefined>(supabase ? undefined : me)
  useEffect(() => {
    if (!supabase) {
      const fn = () => setUser(me)
      meListeners.add(fn)
      return () => { meListeners.delete(fn) }
    }
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return user
}
export function useEmail(): string | null {
  const u = useUser()
  return u?.email ?? null
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
  if (!supabase) return localSignIn(email, password)
  const { error } = await supabase!.auth.signInWithPassword({ email, password })
  return friendly(error?.message)
}

// Returns 'confirm' when Supabase sent a confirmation email before the account can be used.
export async function signUp(email: string, password: string): Promise<{ error: string | null; confirm: boolean }> {
  if (!supabase) return { error: await localSignUp(email, password), confirm: false }
  const { data, error } = await supabase!.auth.signUp({ email, password })
  return { error: friendly(error?.message), confirm: !error && !data.session }
}

export async function resetPassword(email: string) {
  const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })
  return friendly(error?.message)
}

export const canResetPassword = !!supabase

export function signOut() {
  if (!supabase) { setMe(null); return }
  return supabase.auth.signOut()
}
