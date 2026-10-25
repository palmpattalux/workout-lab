import { useSyncExternalStore } from 'react'
import { atLeast, getPlan, onPlanChange, type Tier } from './plan'

// Themes gallery: 15 slots, filled one at a time. A theme can be tried on ("previewed")
// without its plan: the look changes and pages can be browsed, but nothing can be used.
// Every theme belongs to a plan: 'premium' themes come with Premium and up, 'exclusive'
// ones with Exclusive and up. Desert is the first exclusive one.
// has: what the theme brings beyond its look (shown as small icons under its picture)
export type Feature = 'anim' | 'sound' | 'live'
// price: what one theme costs on its own, in baht. Three steps: Lite ฿75 (animated), Premium ฿149
// (animated + its own sounds), Exclusive ฿159 (animated, sounds, reacts to your sets).
export type Theme = { key: string; name: string; blurb: string; tier: Tier; price: number; has: Feature[] }
export const THEME_SLOTS = 20
export const THEMES: (Theme | null)[] = [
  { key: 'sakura', name: 'Sakura', blurb: 'Blossom branches, petals drifting onto still water.', tier: 'premium', price: 149, has: ['anim', 'sound'] },
  { key: 'nightcity', name: 'Night City', blurb: 'A gothic skyline in the rain. Searchlights and lightning by night, the sun about to rise by day.', tier: 'premium', price: 149, has: ['anim', 'sound'] },
  { key: 'neon', name: 'Neon', blurb: 'A cyber city. Neon rooftops and light trails by night, a clean black and white skyline by day.', tier: 'premium', price: 149, has: ['anim', 'sound'] },
  { key: 'manga', name: 'Manga', blurb: 'Black ink on paper. Speech bubbles at home, sword slashes once a session starts.', tier: 'premium', price: 149, has: ['anim', 'sound', 'live'] },
  { key: 'summit', name: 'To the Top', blurb: 'Stone pillars in an ink painting. Each set you finish pushes the boulder further up the mountain.', tier: 'premium', price: 149, has: ['anim', 'sound', 'live'] },
  { key: 'pulsar', name: 'Pulsar', blurb: 'A spinning star sweeping its beams through space. It turns and ticks with every rep and load you choose.', tier: 'premium', price: 149, has: ['anim', 'sound', 'live'] },
  { key: 'ocean', name: 'Ocean', blurb: 'Rolling waves and a lighthouse. Gulls by day, a sweeping beam over a moonlit sea by night.', tier: 'premium', price: 75, has: ['anim'] },
  { key: 'forest', name: 'Forest', blurb: 'Layers of pine in morning mist. Fireflies drift between the trees at night.', tier: 'premium', price: 75, has: ['anim'] },
  { key: 'snow', name: 'Snowfall', blurb: 'Quiet mountains under soft falling snow. A cabin window glows at night.', tier: 'premium', price: 75, has: ['anim'] },
  { key: 'autumn', name: 'Autumn', blurb: 'A maple branch in the corner, red leaves floating down and settling on the ground.', tier: 'premium', price: 75, has: ['anim'] },
  { key: 'zen', name: 'Zen Garden', blurb: 'Raked sand, a still stone and bamboo leaves. Slow ripples circle the stone.', tier: 'premium', price: 75, has: ['anim'] },
  { key: 'rain', name: 'Rain', blurb: 'Soft rain on glass, drops sliding down. A grey day, or city lights blurred at night.', tier: 'premium', price: 75, has: ['anim'] },
  { key: 'desert', name: 'Desert', blurb: 'Sand dunes, cacti and red rocks under the sun. At night, a campfire under a sky full of colour and stars.', tier: 'exclusive', price: 159, has: ['anim', 'sound', 'live'] },
  { key: 'lantern', name: 'Lanterns', blurb: 'Paper lanterns rising into the sky, glowing warm against the night.', tier: 'exclusive', price: 159, has: ['anim', 'sound', 'live'] },
  { key: 'orbit', name: 'Orbit', blurb: 'A planet in the corner and one small moon circling it among slow stars.', tier: 'exclusive', price: 159, has: ['anim', 'sound', 'live'] },
  { key: 'koi', name: 'Koi Pond', blurb: 'Koi gliding under lily pads. Their shadows pass slowly across the water.', tier: 'exclusive', price: 159, has: ['anim', 'sound', 'live'] },
  ...Array.from({ length: THEME_SLOTS - 16 }, () => null),
]

// Other things sold the same way as a theme (once, kept for good, or free with a plan).
export type Extra = { key: string; name: string; kind: 'icons'; tier: Tier }
export const EXTRAS: Extra[] = [{ key: 'tokyo-icons', name: 'Tokyo icons', kind: 'icons', tier: 'premium' }]
export const shopItem = (key: string): (Theme & { kind?: undefined }) | Extra | null =>
  THEMES.find((t) => t?.key === key) ?? EXTRAS.find((x) => x.key === key) ?? null

let preview: string | null = null
const listeners = new Set<() => void>()

// Taps allowed while previewing: moving between pages, the preview bar, and the drag
// controls (which can be felt, but set nothing: see HoldPicker/HoldMenu and dot drags).
const NAV = '.try-step, .holdable, .icons-link, .icon-tile, .live-chip, .more-toggle, .credits-link, .licenses, .plan-link, .plans, .lock-note, .fan-dot, .preview-bar, .themes, #a2, .gear, .settings, .dot.filled, .home-back, [aria-label="Back"], .book [role="tab"], .book .box, .ex-row, .session-row'
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
export const themeTier = (key: string): Tier => shopItem(key)?.tier ?? 'premium'
// Any single theme can also be bought on its own, once, and kept (billing.ts loads them).
// Extras (icon packs) cost the Premium price.
export const THEME_PRICE = 149
export const themePrice = (key: string): number => { const x = shopItem(key); return x && 'price' in x ? x.price : THEME_PRICE }
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

export function setPreview(key: string | null) { preview = key; if (!key) releaseMode(); paint() }
// The store's sun/moon picks day or night for that page. When someone leaves the store while
// trying a theme on, the try-on keeps that look; their own setting comes back when it ends.
let heldMode: string | null | undefined
export function holdMode(before: string | null) { heldMode = before }
export const heldModeOr = (now: string | null) => (heldMode === undefined ? now : heldMode)
export function dropHeldMode() { heldMode = undefined }
function releaseMode() {
  if (heldMode === undefined) return
  const root = document.documentElement
  if (heldMode === null) root.removeAttribute('data-mode'); else root.setAttribute('data-mode', heldMode)
  heldMode = undefined
}
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
  releaseMode()
  paint()
}

onPlanChange(paint)
