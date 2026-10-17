import { useSyncExternalStore } from 'react'
import { atLeast, getPlan, onPlanChange, type Tier } from './plan'

// Themes gallery: 15 slots, filled one at a time. A theme can be tried on ("previewed")
// without its plan: the look changes and pages can be browsed, but nothing can be used.
// Every theme belongs to a plan: 'premium' themes come with Premium and up, 'exclusive'
// ones with Exclusive and up. All current themes are premium.
export type Theme = { key: string; name: string; blurb: string; tier: Tier }
export const THEME_SLOTS = 15
export const THEMES: (Theme | null)[] = [
  { key: 'sakura', name: 'Sakura', blurb: 'Blossom branches, petals drifting onto still water.', tier: 'premium' },
  { key: 'nightcity', name: 'Night City', blurb: 'A gothic skyline in the rain. Searchlights and lightning by night, the sun about to rise by day.', tier: 'premium' },
  { key: 'neon', name: 'Neon', blurb: 'A cyber city. Neon rooftops and light trails by night, a clean black and white skyline by day.', tier: 'premium' },
  { key: 'manga', name: 'Manga', blurb: 'Black ink on paper. Speech bubbles at home, sword slashes once a session starts.', tier: 'premium' },
  { key: 'summit', name: 'To the Top', blurb: 'Stone pillars in an ink painting. Each set you finish pushes the boulder further up the mountain.', tier: 'premium' },
  { key: 'desert', name: 'Desert', blurb: 'Sand dunes, cacti and red rocks under the sun. At night, a campfire under a sky full of colour and stars.', tier: 'premium' },
  ...Array.from({ length: THEME_SLOTS - 6 }, () => null),
]

let preview: string | null = null
const listeners = new Set<() => void>()

// Taps allowed while previewing: moving between pages, the preview bar, and the drag
// controls (which can be felt, but set nothing: see HoldPicker/HoldMenu and dot drags).
const NAV = '.holdable, .credits-link, .licenses, .plan-link, .plans, .lock-note, .fan-dot, .preview-bar, .themes, #a2, .gear, .settings, .dot.filled, .home-back, [aria-label="Back"], .book [role="tab"], .book .box, .session-row'
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

// A theme can be used for real by accounts on its plan or higher (see plan.ts).
// Everyone else can still try it on.
const SKIN_KEY = 'workout-lab:skin'
let applied: string | null = (() => { try { return localStorage.getItem(SKIN_KEY) } catch { return null } })()
export const themeTier = (key: string): Tier => THEMES.find((t) => t?.key === key)?.tier ?? 'premium'
// Any single theme can also be bought on its own, once, and kept (billing.ts loads them).
export const THEME_PRICE = 149
let owned: string[] = []
export function setOwnedThemes(keys: string[]) { owned = keys; paint() }
export const ownsTheme = (key: string) => owned.includes(key)
export const canUseTheme = (key: string, plan: Tier = getPlan()) => ownsTheme(key) || atLeast(plan, themeTier(key))
const inUse = () => (applied && canUseTheme(applied) ? applied : null)

function paint() {
  const skin = preview ?? inUse()
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

export function useApplied(): string | null { return useSyncExternalStore(subscribe, inUse) }
export function useOwnedThemes(): string[] { return useSyncExternalStore(subscribe, () => owned) }
// what the home page should show: the theme being tried on, else the one in use
export function useSkin(): string | null { return useSyncExternalStore(subscribe, () => preview ?? inUse()) }

export function applyTheme(key: string | null) {
  if (key && !canUseTheme(key)) return
  applied = key
  try { if (key) localStorage.setItem(SKIN_KEY, key); else localStorage.removeItem(SKIN_KEY) } catch { /* private mode */ }
  preview = null
  paint()
}

onPlanChange(paint)
