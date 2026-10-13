import { useSyncExternalStore } from 'react'

// Per-device settings from the gear on page A.
export type Prefs = { theme: 'auto' | 'light' | 'dark'; sound: boolean }
const KEY = 'workout-lab:prefs'
let prefs: Prefs = read()
const listeners = new Set<() => void>()

function read(): Prefs {
  try { return { theme: 'auto', sound: true, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return { theme: 'auto', sound: true } }
}

// 'auto' follows the phone's own light/dark setting.
function apply() {
  const root = document.documentElement
  if (prefs.theme === 'auto') root.removeAttribute('data-mode')
  else root.setAttribute('data-mode', prefs.theme)
  const dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121514' : '#f3f4f2')
}
apply()

export function getPrefs() {
  return prefs
}
export function setPrefs(patch: Partial<Prefs>) {
  prefs = { ...prefs, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* storage blocked */ }
  apply()
  listeners.forEach((fn) => fn())
}
export function usePrefs(): Prefs {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => prefs)
}
