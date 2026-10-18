import { useSyncExternalStore } from 'react'
import { stopTimer, getTimer } from './timer'
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

export function record(field: 'reps' | 'weight', value: number) {
  if (!active) return
  recordAt(active.current, active.setOf[active.current] ?? 1, { [field]: value })
}
// the progression done in the current set
export function recordMove(move: string) {
  if (!active) return
  recordAt(active.current, active.setOf[active.current] ?? 1, { move })
}
// write into a given exercise and set (the timer keeps its own, even if you moved on)
export function recordAt(w: string, setNum: number, change: Partial<SetEntry>) {
  if (!active) return
  const n = String(setNum)
  const entry: SetEntry = Object.assign({ reps: null, weight: null }, active.sets[w]?.[n], change)
  set({ ...active, sets: { ...active.sets, [w]: { ...active.sets[w], [n]: entry } } })
}

// Take an exercise out of the running session (picked by mistake): its sets go with it,
// so nothing of it is saved. Returns the exercise to show next when it was the current one.
export function removeFromSession(workoutId: string): string | null {
  if (!active || !active.order.includes(workoutId)) return null
  const order = active.order.filter((w) => w !== workoutId)
  if (order.length === 0) return null
  const { [workoutId]: _s, ...setOf } = active.setOf
  const { [workoutId]: _e, ...sets } = active.sets
  if (getTimer()?.workoutId === workoutId) stopTimer()
  const current = active.current === workoutId ? order[order.length - 1] : active.current
  set({ ...active, order, setOf, sets, current })
  return current
}

export function endSession(): string | null {
  if (!active) return null
  const snap: NonNullable<Session['snap']> = {}
  for (const w of getWorkouts()) {
    if (!active.order.includes(w.id)) continue
    const done = Object.entries(active.sets[w.id] ?? {}).sort(([a], [b]) => Number(b) - Number(a)).find(([, e]) => e.move)?.[1].move
    snap[w.id] = { exercise: w.exercise, icon: w.icon, letter: w.letter, mode: w.mode, unit: w.unit, count: w.count, move: done ?? w.progressions?.at(-1) }
  }
  const id = active.id
  stopTimer()
  saveSession({ ...active, endedAt: Date.now(), snap })
  set(null)
  return id
}

// Throw the running session away without saving it.
export function discardSession() {
  stopTimer()
  set(null)
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, () => active)
}
