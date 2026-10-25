import { useSyncExternalStore } from 'react'
import { stopTimer, getTimer } from './timer'
import { saveSession, getSessions, deleteSession, getWorkouts, updateWorkout, getPresets, onScopeChange, scopedKey, type Session, type SetEntry } from './store'

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

// One side at a time (workout.sided): each set is done on both sides, saved as "2L" and "2R".
// workout.first says which side comes first (Left unless Right was chosen).
export const setKey = (n: number, side?: 'L' | 'R') => side ? `${n}${side}` : String(n)
export const keyNum = (key: string) => parseInt(key, 10)
export const keySide = (key: string): 'L' | 'R' | undefined => key.endsWith('L') ? 'L' : key.endsWith('R') ? 'R' : undefined
const firstSide = (wid: string) => { const w = getWorkouts().find((x) => x.id === wid); return w?.sided ? w.first ?? 'L' : undefined }
// the key the current exercise is writing to
function currentKey(s: Session) {
  const n = s.setOf[s.current] ?? 1
  const first = firstSide(s.current)
  return first ? setKey(n, s.side?.[s.current] ?? first) : String(n)
}

// side: which side to show (one-side-at-a-time workouts); a set picked from the menu starts on the first side
export function goToSet(n: number, side?: 'L' | 'R') {
  if (!active) return
  side ??= firstSide(active.current) ?? 'L'
  set({ ...active, setOf: { ...active.setOf, [active.current]: n }, side: { ...active.side, [active.current]: side } })
}

// Turn one side at a time on or off for an exercise. Sets already done in this session
// move with it (on: "2" becomes "2L"; off: "2L" becomes "2"), and nothing is lost.
// first: the side to start each set on (picking it again just changes the order).
export function setSided(workoutId: string, first: 'L' | 'R' | null) {
  const on = !!first
  const wasOn = !!getWorkouts().find((w) => w.id === workoutId)?.sided
  updateWorkout(workoutId, { sided: on, first: first ?? undefined })
  if (!active) return
  if (on && wasOn) { set({ ...active, side: { ...active.side, [workoutId]: first! } }); return }
  if (!active.sets[workoutId]) { set({ ...active, side: { ...active.side, [workoutId]: first ?? 'L' } }); return }
  const moved: Record<string, SetEntry> = {}
  for (const [k, e] of Object.entries(active.sets[workoutId])) {
    const n = keyNum(k)
    const to = on ? (keySide(k) ? k : setKey(n, first!)) : keySide(k) === 'L' && !active.sets[workoutId][String(n)] ? String(n) : k
    moved[to] = e
  }
  set({ ...active, sets: { ...active.sets, [workoutId]: moved }, side: { ...active.side, [workoutId]: first ?? 'L' } })
}

export function record(field: 'reps' | 'weight', value: number) {
  if (!active) return
  recordAt(active.current, currentKey(active), { [field]: value })
}
// the progression done in the current set
export function recordMove(move: string) {
  if (!active) return
  recordAt(active.current, currentKey(active), { move })
}
// write into a given exercise and set (the timer keeps its own, even if you moved on)
export function recordAt(w: string, setNum: number | string, change: Partial<SetEntry>) {
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

// Ended by mistake: the last session can be picked up again from the book for a while, as if it
// never ended (it comes out of the book and is saved again when it really ends).
const CONTINUE_MS = 2 * 60 * 60 * 1000 // 2 hours (user 2026-10-25)
export function canContinue(id: string | null): boolean {
  if (!id || active) return false
  const s = getSessions().at(-1)
  return !!s && s.id === id && !!s.endedAt && Date.now() - s.endedAt < CONTINUE_MS
}
// returns the exercise to open
export function continueSession(id: string): string | null {
  if (!canContinue(id)) return null
  const s = getSessions().at(-1)!
  const { endedAt: _e, snap: _s, ...running } = s
  deleteSession(id)
  set(running)
  return running.current
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
