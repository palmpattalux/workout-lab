import { useSyncExternalStore } from 'react'

// Themes gallery: 15 slots, filled one at a time. A theme can be tried on ("previewed")
// before it's owned: the look changes and pages can be browsed, but nothing can be used.
// An owned theme can be put to use for real.
export type Theme = { key: string; name: string; blurb: string }
export const THEME_SLOTS = 15
export const THEMES: (Theme | null)[] = [
  { key: 'sakura', name: 'Sakura', blurb: 'Blossom branches, petals drifting onto still water.' },
  { key: 'nightcity', name: 'Night City', blurb: 'A gothic skyline in the rain. Searchlights and lightning by night, the sun about to rise by day.' },
  { key: 'neon', name: 'Neon', blurb: 'A cyber city. Neon rooftops and light trails by night, a clean black and white skyline by day.' },
  ...Array.from({ length: THEME_SLOTS - 3 }, () => null),
]

let preview: string | null = null
const listeners = new Set<() => void>()

// Taps allowed while previewing: moving between pages, the preview bar, and the drag
// controls (which can be felt, but set nothing: see HoldPicker/HoldMenu and dot drags).
const NAV = '.holdable, .fan-dot, .preview-bar, .themes, #a2, .gear, .settings, .dot.filled, .home-back, [aria-label="Back"], .book [role="tab"], .book .box, .session-row'
let nudge: (() => void) | null = null
function guard(e: Event) {
  if (!preview) return
  const t = e.target as Element | null
  if (t && t.closest && t.closest(NAV)) return
  e.stopPropagation()
  e.preventDefault()
  if (e.type === 'click') nudge?.()
}
for (const type of ['pointerdown', 'click', 'touchstart', 'keydown', 'input', 'change']) {
  document.addEventListener(type, guard, { capture: true, passive: false })
}
export function onBlockedTap(fn: () => void) { nudge = fn }
export function previewBlocked() { nudge?.() }

// Ownership: the app owner's account owns every theme, present and future. Anyone else
// can only preview. On the claude.ai link that's the artifact's owner; on the public
// site it's the signed-in account whose email hashes to OWNER_EMAIL_SHA256 (kept as a
// hash so the address isn't published in the code).
const OWNER_EMAIL_SHA256 = '7785568f1c31b9896a577b29354b34e40401c36472b1b731ff8388705ff8957e'
const SKIN_KEY = 'workout-lab:skin'
let owner = false
let applied: string | null = (() => { try { return localStorage.getItem(SKIN_KEY) } catch { return null } })()

function paint() {
  const skin = preview ?? (owner ? applied : null)
  const root = document.documentElement
  if (skin) root.setAttribute('data-skin', skin)
  else root.removeAttribute('data-skin')
  root.toggleAttribute('data-preview', !!preview)
  listeners.forEach((fn) => fn())
}
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } }

export function setPreview(key: string | null) { preview = key; paint() }
export function getPreview() { return preview }
export function usePreview(): string | null { return useSyncExternalStore(subscribe, () => preview) }

export function useOwner(): boolean { return useSyncExternalStore(subscribe, () => owner) }
export function useApplied(): string | null { return useSyncExternalStore(subscribe, () => (owner ? applied : null)) }
// what the home page should show: the theme being tried on, else the one in use
export function useSkin(): string | null { return useSyncExternalStore(subscribe, () => preview ?? (owner ? applied : null)) }

export function applyTheme(key: string | null) {
  if (!owner) return
  applied = key
  try { if (key) localStorage.setItem(SKIN_KEY, key); else localStorage.removeItem(SKIN_KEY) } catch { /* private mode */ }
  preview = null
  paint()
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}
// Public site: called with the signed-in account's email (or null when signed out).
export async function checkOwnerEmail(email: string | null | undefined) {
  const yes = !!email && crypto.subtle && (await sha256(email.trim().toLowerCase())) === OWNER_EMAIL_SHA256
  if (yes !== owner) { owner = yes; paint() }
}
// claude.ai link: the artifact's owner owns the themes.
;(async () => {
  const claude = (window as unknown as { claude?: { use(n: string): Promise<any> } }).claude
  if (!claude?.use) return
  const user = await claude.use('user')
  if (user?.isOwner?.()) { owner = true; paint() }
})()
