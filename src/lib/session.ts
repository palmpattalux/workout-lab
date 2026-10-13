import { useSyncExternalStore } from 'react'
import { saveSession, getWorkouts, onScopeChange, scopedKey, type Session, type SetEntry } from './store'

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

// Start a session, or switch exercise inside the running one.
export function switchTo(workoutId: string) {
  const s = active ?? { id: crypto.randomUUID(), startedAt: Date.now(), current: workoutId, order: [], setOf: {}, sets: {} }
  set({
    ...s,
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

export function endSession() {
  if (!active) return
  const snap: NonNullable<Session['snap']> = {}
  for (const w of getWorkouts()) {
    if (!active.order.includes(w.id)) continue
    snap[w.id] = { exercise: w.exercise, icon: w.icon, letter: w.letter, mode: w.mode, unit: w.unit, move: w.progressions?.at(-1) }
  }
  saveSession({ ...active, endedAt: Date.now(), snap })
  set(null)
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, () => active)
}
