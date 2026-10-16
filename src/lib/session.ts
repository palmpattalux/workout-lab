import { useSyncExternalStore } from 'react'
import { saveSession, getWorkouts, getPresets, onScopeChange, scopedKey, type Session, type SetEntry } from './store'

// The active session, if any. Kept in this browser so a reload doesn't lose it;
// written to the database once, when the session ends.
const listeners = new Set<() => void>()
let active: Session | null = read()
// each account keeps its own running session
onScopeChange(() => { active = read(); listeners.forEach((fn) => fn()) })

function read(): Session | null {
  try { return JSON.parse(localStorage.getItem(scopedKey('active-session')) || 'null') } catch { return null }
}
function set(next: Session | null) {
  active = next
  try { next ? localStorage.setItem(scopedKey('active-session'), JSON.stringify(next)) : localStorage.removeItem(scopedKey('active-session')) } catch { /* blocked */ }
  listeners.forEach((fn) => fn())
}

// Start a session, or switch exercise inside the running one. Starting from a
// preset ties the session to it (the switcher on page B then shows only its exercises).
export function switchTo(workoutId: string, preset?: string) {
  const s: Session = active ?? { id: crypto.randomUUID(), startedAt: Date.now(), current: workoutId, order: [], setOf: {}, sets: {} }
  // opening an exercise outside the session's preset leaves the preset
  const keep = preset ?? (s.preset && getPresets().find((p) => p.id === s.preset)?.items.includes(workoutId) ? s.preset : undefined)
  set({
    ...s,
    preset: keep,
    current: workoutId,
    order: s.order.includes(workoutId) ? s.order : [...s.order, workoutId],
    setOf: { ...s.setOf, [workoutId]: s.setOf[workoutId] ?? 1 },
  })
}

export function goToSet(n: number) {
  if (!active) return
  set({ ...active, setOf: { ...active.setOf, [active.current]: n } })
}

export function record(field: keyof SetEntry, value: number) {
  if (!active) return
  const w = active.current
  const n = String(active.setOf[w] ?? 1)
  const entry: SetEntry = Object.assign({ reps: null, weight: null }, active.sets[w]?.[n], { [field]: value })
  set({ ...active, sets: { ...active.sets, [w]: { ...active.sets[w], [n]: entry } } })
}

export function endSession(): string | null {
  if (!active) return null
  const snap: NonNullable<Session['snap']> = {}
  for (const w of getWorkouts()) {
    if (!active.order.includes(w.id)) continue
    snap[w.id] = { exercise: w.exercise, icon: w.icon, letter: w.letter, mode: w.mode, unit: w.unit, count: w.count, move: w.progressions?.at(-1) }
  }
  const id = active.id
  saveSession({ ...active, endedAt: Date.now(), snap })
  set(null)
  return id
}

// Throw the running session away without saving it.
export function discardSession() {
  set(null)
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, () => active)
}
