import { useSyncExternalStore } from 'react'
import { supabase } from './auth'
import { setPaidTier, type Tier } from './plan'
import { setOwnedThemes } from './theme'

// Paying for a plan on the website. Omise (Opn Payments) takes the payment; our server
// (api/*.js on Vercel) checks it and records the plan in Supabase, which the app reads here.
// Only on the public site, and only once the Omise public key is set.
const PUBLIC_KEY = import.meta.env.VITE_OMISE_PUBLIC_KEY as string | undefined
export const canPay = !!supabase && !!PUBLIC_KEY

export type Method = 'card' | 'promptpay' | 'truemoney'
export type Subscription = { tier: Tier; paid_until: string; method: Method; renews: boolean } | null
// a card renewal is charged on the day the plan ends, so allow a few days for it to land
export const GRACE = 3 * 86400000

let sub: Subscription = null
const listeners = new Set<() => void>()
function setSub(next: Subscription) {
  sub = next
  setPaidTier(next && new Date(next.paid_until).getTime() + GRACE > Date.now() ? next.tier : 'free')
  listeners.forEach((fn) => fn())
}
export function useSubscription(): Subscription { return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => sub) }

export async function refreshSubscription(userId: string | null | undefined) {
  if (!supabase || !userId) { setOwnedThemes([]); return setSub(null) }
  const [{ data }, themes] = await Promise.all([
    supabase.from('subscriptions').select('tier, paid_until, method, renews').eq('user_id', userId).maybeSingle(),
    supabase.from('owned_themes').select('theme').eq('user_id', userId),
  ])
  setOwnedThemes(((themes.data ?? []) as { theme: string }[]).map((r) => r.theme))
  setSub((data as Subscription) ?? null)
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await supabase!.auth.getSession()
  const r = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await r.json().catch(() => ({ error: 'network' }))
  if (!r.ok) throw new Error(json.error || 'network')
  return json as T
}

export type Started = { charge: string; status: string; authorizeUri: string | null; qr: string | null; expiresAt: string | null; failure: string | null }
// what is being bought: a plan, or one theme
export type Item = { tier: Tier; theme?: undefined } | { theme: string; tier?: undefined }
export const startCheckout = (item: Item, method: Method, extra: { token?: string; phone?: string } = {}) =>
  api<Started>('/api/checkout', { ...item, method, ...extra })
export const chargeStatus = (id: string) =>
  api<{ status: string; tier: Tier | null; theme: string | null; paidUntil: string | null; failure: string | null }>('/api/charge?id=' + encodeURIComponent(id))
export const cancelRenewal = () => api<{ ok: true }>('/api/subscription', { action: 'cancel' })

// The payment being waited on survives the trip to a bank or wallet page and back.
const PENDING = 'workout-lab:pending-charge'
export type Pending = { charge: string; tier?: Tier; theme?: string; method: Method; qr?: string | null; expiresAt?: string | null }
export const savePending = (p: Pending) => { try { localStorage.setItem(PENDING, JSON.stringify(p)) } catch { /* fine */ } }
export const getPending = (): Pending | null => { try { return JSON.parse(localStorage.getItem(PENDING) || 'null') } catch { return null } }
export const clearPending = () => { try { localStorage.removeItem(PENDING) } catch { /* fine */ } }

// Card numbers go straight from the page to Omise (Omise.js); our server only ever sees a token.
type OmiseJs = { setPublicKey(k: string): void; createToken(kind: 'card', card: Record<string, string>, cb: (status: number, r: { id?: string; message?: string }) => void): void }
let omiseJs: Promise<OmiseJs> | null = null
export function loadOmise(): Promise<OmiseJs> {
  omiseJs ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.omise.co/omise.js'
    s.onload = () => { const O = (window as unknown as { Omise: OmiseJs }).Omise; O.setPublicKey(PUBLIC_KEY!); resolve(O) }
    s.onerror = () => { omiseJs = null; reject(new Error('network')) }
    document.head.appendChild(s)
  })
  return omiseJs
}
export async function cardToken(card: { name: string; number: string; month: string; year: string; cvc: string }): Promise<string> {
  const O = await loadOmise()
  return new Promise((resolve, reject) => O.createToken('card', {
    name: card.name, number: card.number.replace(/\s/g, ''), expiration_month: card.month, expiration_year: card.year.length === 2 ? '20' + card.year : card.year, security_code: card.cvc,
  }, (status, r) => (status === 200 && r.id ? resolve(r.id) : reject(new Error(r.message || 'card')))))
}
