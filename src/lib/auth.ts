import { useEffect, useState } from 'react'
import { createClient, type SupabaseClient, type EmailOtpType } from '@supabase/supabase-js'
import { t } from './i18n'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Set on the public site once Supabase is configured (see .env.example). Until then
// accounts are kept on this device (below), so logging in works everywhere today.
// PKCE: the email link comes back as ?code=… rather than #access_token=…, which would
// clash with the app's #page routing.
export const supabase: SupabaseClient | null = url && anonKey
  ? createClient(url, anonKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null

// Where verification and reset links send people back to: this same page.
const home = () => location.origin + location.pathname

// Set when the page was opened from a verification link (?code=…). The link confirms
// the email on Supabase's side; if it was opened in another browser no session comes
// with it, so the login screen says the email is confirmed and asks to log in.
// Email links come as ?token_hash=…&type=… (our email templates, works in any browser)
// or ?code=… (Supabase's default, only works in the browser that asked for it).
const linkParams = new URLSearchParams(location.search)
const tokenHash = linkParams.get('token_hash')
export const arrivedFromEmailLink = linkParams.has('code') || !!tokenHash
// A password reset link (?reset=1 or type=recovery): once signed in from it, the app
// asks for a new password before anything else.
export const resetLink = linkParams.has('reset') || linkParams.get('type') === 'recovery'
let recovering = resetLink
// Signs in from a token_hash link once, before the session is first read.
// emailLinkFailed: the link had expired or was already used, so nobody got signed in.
export let emailLinkFailed = false
const linkReady: Promise<unknown> = supabase && tokenHash
  ? supabase.auth.verifyOtp({ token_hash: tokenHash, type: (linkParams.get('type') ?? 'email') as EmailOtpType })
    .then(({ error }) => { if (error) emailLinkFailed = true }, () => { emailLinkFailed = true })
  : Promise.resolve()
const recoverListeners = new Set<() => void>()
export function useRecovering() {
  const [r, setR] = useState(recovering)
  useEffect(() => { const fn = () => setR(recovering); recoverListeners.add(fn); return () => { recoverListeners.delete(fn) } }, [])
  return r
}
export async function setNewPassword(password: string) {
  const { error } = await supabase!.auth.updateUser({ password })
  return friendly(error?.message)
}
export function endRecovery() { recovering = false; recoverListeners.forEach((fn) => fn()) }
function dropCodeFromUrl() {
  if (!location.search) return
  history.replaceState(null, '', location.pathname + location.hash)
}

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
  if (wait) return t('Too many tries. Wait {n} seconds, then try again.', { n: Math.ceil(wait / 1000) })
  const acc = read<Record<string, Account>>(ACCOUNTS, {})[email.toLowerCase()]
  if (!acc || (await digest(acc.salt + password)) !== acc.hash) {
    const left = failedTry()
    return left > 0 ? `${t("That email and password don't match an account.")} ${left === 1 ? t('1 try left.') : t('{n} tries left.', { n: left })}` : t('Too many tries. Wait {n} seconds, then try again.', { n: 30 })
  }
  write(TRIES, null)
  setMe({ id: acc.id, email: email.toLowerCase() })
  return null
}
async function localSignUp(email: string, password: string) {
  const all = read<Record<string, Account>>(ACCOUNTS, {})
  const k = email.toLowerCase()
  if (all[k]) return t('There is already an account with that email. Log in instead.')
  const salt = crypto.randomUUID()
  all[k] = { id: crypto.randomUUID(), salt, hash: await digest(salt + password) }
  write(ACCOUNTS, all)
  markNewAccount(all[k].id)
  setMe({ id: all[k].id, email: k })
  return null
}

// Only a brand-new account takes over what was made before signing up (see adoptDeviceData).
function markNewAccount(id: string) {
  try { localStorage.setItem('workout-lab:adopt-guest', id) } catch { /* storage blocked */ }
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
    linkReady.then(() => supabase!.auth.getSession()).then(({ data }) => { setUser(data.session?.user ?? null); dropCodeFromUrl() })
    const { data } = supabase.auth.onAuthStateChange((e, session) => {
      if (e === 'PASSWORD_RECOVERY') { recovering = true; recoverListeners.forEach((fn) => fn()) }
      setUser(session?.user ?? null)
    })
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
  if (/fetch|network/i.test(msg)) return t("Can't reach the server. Check your connection and try again.")
  if (/invalid login/i.test(msg)) return t("That email and password don't match an account.")
  if (/not confirmed/i.test(msg)) return t('Verify your email first: open the link we sent you, then log in.')
  if (/rate limit|too many/i.test(msg)) return t('Too many emails sent. Wait a minute, then try again.')
  if (/already registered/i.test(msg)) return t('There is already an account with that email. Log in instead.')
  if (/different from the old/i.test(msg)) return t("That's your current password. Choose a new one.")
  if (/at least \d|weak/i.test(msg)) return t('Use at least 6 characters.')
  if (/invalid format|valid email/i.test(msg)) return t("That email doesn't look right. Check it for typos.")
  return msg
}

export async function signIn(email: string, password: string) {
  if (!supabase) return localSignIn(email, password)
  const { error } = await supabase!.auth.signInWithPassword({ email, password })
  return friendly(error?.message)
}

// Returns 'confirm' when Supabase sent a confirmation email before the account can be used.
// `exists` when the email already has an account (Supabase sends nothing then).
export async function signUp(email: string, password: string): Promise<{ error: string | null; confirm: boolean; exists?: boolean }> {
  if (!supabase) return { error: await localSignUp(email, password), confirm: false }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: home() } })
  // An email that already has an account comes back with no identities: not new.
  if (!error && data.user && !data.user.identities?.length) return { error: null, confirm: false, exists: true }
  if (!error && data.user) markNewAccount(data.user.id)
  return { error: friendly(error?.message), confirm: !error && !data.session }
}

export async function resetPassword(email: string) {
  const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: home() + '?reset=1' })
  return friendly(error?.message)
}

export const canResetPassword = !!supabase
export const verifiesEmail = !!supabase

// Sends the verification email again (online accounts only).
export async function resendVerification(email: string) {
  const { error } = await supabase!.auth.resend({ type: 'signup', email, options: { emailRedirectTo: home() } })
  return friendly(error?.message)
}

export function signOut() {
  if (!supabase) { setMe(null); return }
  return supabase.auth.signOut()
}
