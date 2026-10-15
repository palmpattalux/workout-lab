import { useSyncExternalStore } from 'react'

// Themes gallery: 15 slots, filled one at a time. A theme can be tried on ("previewed")
// before it's owned: the look changes and pages can be browsed, but nothing can be used.
export type Theme = { key: string; name: string; blurb: string }
export const THEME_SLOTS = 15
export const THEMES: (Theme | null)[] = [
  { key: 'sakura', name: 'Sakura', blurb: 'Blossom branches, petals drifting onto still water.' },
  { key: 'nightcity', name: 'Night City', blurb: 'A gothic skyline in the rain. Searchlights, fog, the odd flash of lightning.' },
  { key: 'redemption', name: 'Redemption', blurb: 'A hazy golden afternoon. Light through the trees, leaves on the wind.' },
  ...Array.from({ length: THEME_SLOTS - 3 }, () => null),
]

let preview: string | null = null
const listeners = new Set<() => void>()

// Taps allowed while previewing: moving between pages, the preview bar, and the drag
// controls (which can be felt, but set nothing: see HoldPicker/HoldMenu and dot drags).
const NAV = '.holdable, .preview-bar, .themes, #a2, .gear, .settings, .dot.filled, .home-back, [aria-label="Back"], .book [role="tab"], .book .box, .session-row'
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

export function setPreview(key: string | null) {
  preview = key
  const root = document.documentElement
  if (key) root.setAttribute('data-skin', key)
  else root.removeAttribute('data-skin')
  root.toggleAttribute('data-preview', !!key)
  listeners.forEach((fn) => fn())
}
export function getPreview() { return preview }
export function usePreview(): string | null {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => preview)
}
