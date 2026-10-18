import { useSyncExternalStore } from 'react'
import { scopedKey, onScopeChange } from './store'

// The hold timer on page B: a 5 second countdown, then it counts up until stopped.
// Kept in this browser (like the running session) so leaving page B doesn't lose it;
// it belongs to the exercise and set it was started on.
export type Timer = { goAt: number; workoutId: string; set: number }
export const COUNTDOWN = 5

const listeners = new Set<() => void>()
let timer: Timer | null = read()
onScopeChange(() => { timer = read(); listeners.forEach((fn) => fn()) })

function read(): Timer | null {
  try { return JSON.parse(localStorage.getItem(scopedKey('timer')) || 'null') } catch { return null }
}
function put(next: Timer | null) {
  timer = next
  try { next ? localStorage.setItem(scopedKey('timer'), JSON.stringify(next)) : localStorage.removeItem(scopedKey('timer')) } catch { /* blocked */ }
  listeners.forEach((fn) => fn())
}

export function startTimer(workoutId: string, set: number) { put({ goAt: Date.now() + COUNTDOWN * 1000, workoutId, set }) }
export function stopTimer(): Timer | null { const t = timer; if (t) put(null); return t }
export function getTimer() { return timer }
export function useTimer(): Timer | null {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => timer)
}
// seconds left in the countdown (> 0), or seconds held so far (<= 0 means counting up: use held)
export const timerState = (t: Timer, now = Date.now()) =>
  now < t.goAt ? { counting: true, left: Math.ceil((t.goAt - now) / 1000), held: 0 } : { counting: false, left: 0, held: Math.floor((now - t.goAt) / 1000) }
