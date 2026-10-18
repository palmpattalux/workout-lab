import { useSyncExternalStore } from 'react'

// Subscription plans. An account is on what it has paid for (billing.ts), else Free;
// the app owner's account always gets the top plan. Each paid plan includes everything below it.
export type Tier = 'free' | 'premium' | 'exclusive' | 'unlimited'
const RANK: Record<Tier, number> = { free: 0, premium: 1, exclusive: 2, unlimited: 3 }
export const atLeast = (have: Tier, need: Tier) => RANK[have] >= RANK[need]

// Free plan limits (Premium and up lift them all)
export const FREE_WORKOUTS = 5
export const FREE_SETS = 3
export const MAX_SETS = 5

export type Plan = { tier: Exclude<Tier, 'free'>; name: string; price: number; perks: string[] }
export const PLANS: Plan[] = [
  { tier: 'premium', name: 'Premium', price: 149, perks: ['Unlimited workouts', '15+ premium themes', 'Group exercises on the home screen', 'Up to 5 sets per exercise', 'Tokyo icon set'] },
  { tier: 'exclusive', name: 'Exclusive', price: 329, perks: ['Everything in Premium', 'Preset exercises for sessions', '30+ premium and exclusive themes', 'Weekly performance summary'] },
  { tier: 'unlimited', name: 'Unlimited', price: 599, perks: [] },
]
export const tierName = (tier: Tier) => (tier === 'free' ? 'Free' : PLANS.find((p) => p.tier === tier)!.name)

// Who's on which plan. On the claude.ai link the artifact's owner is the app owner; on the
// public site it's the signed-in account whose email hashes to OWNER_EMAIL_SHA256 (kept as
// a hash so the address isn't published in the code).
const OWNER_EMAIL_SHA256 = '7785568f1c31b9896a577b29354b34e40401c36472b1b731ff8388705ff8957e'
let tier: Tier = 'free'
let owner = false
let paid: Tier = 'free'
const listeners = new Set<() => void>()
function update() { const next: Tier = owner ? 'unlimited' : paid; if (next !== tier) { tier = next; listeners.forEach((fn) => fn()) } }
function setTier(next: Tier) { owner = next === 'unlimited'; update() }
// what the account has paid for (billing.ts)
export function setPaidTier(next: Tier) { paid = next; update() }
export function onPlanChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } }
export const getPlan = () => tier
export function usePlan(): Tier { return useSyncExternalStore(onPlanChange, () => tier) }

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}
// Public site: called with the signed-in account's email (or null when signed out).
export async function checkOwnerEmail(email: string | null | undefined) {
  const yes = !!email && !!crypto.subtle && (await sha256(email.trim().toLowerCase())) === OWNER_EMAIL_SHA256
  setTier(yes ? 'unlimited' : 'free')
}
// claude.ai link: the artifact's owner is the app owner.
;(async () => {
  const claude = (window as unknown as { claude?: { use(n: string): Promise<any> } }).claude
  if (!claude?.use) return
  const user = await claude.use('user')
  if (user?.isOwner?.()) setTier('unlimited')
})()

// The small "this needs a plan" note that slides up when a locked feature is tried.
export type Locked = { text: string; tier: Tier } | null
let locked: Locked = null
let lockTimer = 0
const lockListeners = new Set<() => void>()
function emitLock() { lockListeners.forEach((fn) => fn()) }
export function showLocked(text: string, need: Tier = 'premium') {
  locked = { text, tier: need }
  clearTimeout(lockTimer)
  lockTimer = window.setTimeout(() => { locked = null; emitLock() }, 3200)
  emitLock()
}
export function hideLocked() { clearTimeout(lockTimer); locked = null; emitLock() }
export function useLocked(): Locked {
  return useSyncExternalStore((fn) => { lockListeners.add(fn); return () => { lockListeners.delete(fn) } }, () => locked)
}
