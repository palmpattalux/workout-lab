import { useSyncExternalStore } from 'react'
import { supabase } from './auth'

// One saved workout, created from the "+" flow on page A.
export type Workout = {
  id: string
  icon: string            // key in WORKOUT_ICONS
  letter: string          // key in BODY_LETTERS
  exercise: string
  equipment: string       // text in the second slot (equipment name or progression)
  mode: 'equipment' | 'progression'
  unit: 'kg' | 'lbs'
  focus: string           // shown on page B as a reminder
  notes: string           // general notes, shown only in the book
  progressions?: string[] // progression moves added on page B (progression workouts)
  count?: 'reps' | 'sec'  // progression only: count reps or hold seconds on page B
  slot?: number           // where its dot sits on page A (index in SLOTS), set by dragging
  group?: string          // workouts sharing a group id sit together in one bubble on page A
  createdAt: number
}

// One set inside a session, per exercise.
export type SetEntry = { reps: number | null; weight: number | null }

// A session: everything done between starting it (pen hold on page B) and ending it.
export type Session = {
  id: string
  startedAt: number
  endedAt?: number
  current: string                                   // workout on screen
  order: string[]                                   // workouts in the order they were used
  setOf: Record<string, number>                     // current set per workout
  sets: Record<string, Record<string, SetEntry>>     // workoutId -> set number -> entry
  // how each exercise was set up when the session ended, so history stays right after edits
  snap?: Record<string, { exercise: string; icon: string; letter: string; mode: Workout['mode']; unit: Workout['unit']; count?: Workout['count']; move?: string }>
}

// Speed: everything renders from memory right away. A copy is kept in this
// browser so the app opens instantly, and the online database syncs in the
// background so nothing waits on the network.
//
// Where the online copy lives:
//  - Public site: Supabase, per signed-in account (see auth.ts, supabase/schema.sql).
//  - claude.ai link: that page's built-in private database.

let scope = 'local'                       // whose data is loaded: 'local' or a user id
const key = (name: string) => (scope === 'local' ? `workout-lab:${name}` : `workout-lab:${scope}:${name}`)
let workouts: Workout[] = []
let sessions: Session[] = []
const listeners = new Set<() => void>()
const scopeListeners = new Set<() => void>()

function readCache() {
  try {
    workouts = JSON.parse(localStorage.getItem(key('workouts')) || '[]')
    sessions = JSON.parse(localStorage.getItem(key('sessions')) || '[]')
  } catch { workouts = []; sessions = [] }
}
function writeCache() {
  try {
    localStorage.setItem(key('workouts'), JSON.stringify(workouts))
    localStorage.setItem(key('sessions'), JSON.stringify(sessions))
  } catch { /* storage blocked */ }
}
function emit() {
  writeCache()
  listeners.forEach((fn) => fn())
}
const byDate = (a: Workout, b: Workout) => a.createdAt - b.createdAt
const byStart = (a: Session, b: Session) => a.startedAt - b.startedAt
const clean = (o: object) => JSON.parse(JSON.stringify(o)) as Record<string, unknown>

// ---------- online copy ----------
type Remote = { saveWorkout(w: Workout): void; saveSession(s: Session): void; deleteSession(id: string): void; deleteWorkout(id: string): void }
let remote: Remote | null = null

// Merge what the database has with anything made here before it answered.
function merge(dbWorkouts: Workout[], dbSessions: Session[]) {
  const knownW = new Set(dbWorkouts.map((w) => w.id))
  const knownS = new Set(dbSessions.map((x) => x.id))
  workouts.filter((w) => !knownW.has(w.id)).forEach((w) => { dbWorkouts.push(w); remote?.saveWorkout(w) })
  sessions.filter((x) => !knownS.has(x.id)).forEach((x) => { dbSessions.push(x); remote?.saveSession(x) })
  workouts = dbWorkouts.sort(byDate)
  sessions = dbSessions.sort(byStart)
  emit()
}

// Supabase: one row per record, the record itself kept whole in `data`.
async function useSupabase() {
  const sb = supabase!
  remote = {
    saveWorkout(w) {
      const { id, ...data } = w
      sb.from('workouts').upsert({ id, data: clean(data) }).then(({ error }) => { if (error) console.warn(error.message) })
    },
    saveSession(x) {
      const { id, ...data } = x
      sb.from('sessions').upsert({ id, data: clean(data) }).then(({ error }) => { if (error) console.warn(error.message) })
    },
    deleteWorkout(id) {
      sb.from('workouts').delete().eq('id', id).then(({ error }) => { if (error) console.warn(error.message) })
    },
    deleteSession(id) {
      sb.from('sessions').delete().eq('id', id).then(({ error }) => { if (error) console.warn(error.message) })
    },
  }
  const [w, x] = await Promise.all([sb.from('workouts').select('id, data'), sb.from('sessions').select('id, data')])
  if (w.error || x.error) return // offline: keep the local copy, saves retry on next change
  merge(
    (w.data ?? []).map((r) => ({ ...(r.data as Workout), id: r.id })),
    (x.data ?? []).map((r) => ({ ...(r.data as Session), id: r.id })),
  )
}

// claude.ai link: the page's private built-in database.
async function useArtifactDb() {
  const claude = (window as unknown as { claude?: { use(n: string): Promise<any> } }).claude
  if (!claude?.use) return
  const [db, user] = await Promise.all([claude.use('db'), claude.use('user')])
  if (!db || !user) return
  const uid: string | null = await user.id()
  if (!uid) return
  type Col = {
    doc(id: string): { set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> }
    onSnapshot(next: (s: { docs: { id: string; data(): Record<string, unknown> | undefined }[] }) => void, err?: (e: unknown) => void): () => void
  }
  const col = db.collection('data/users/' + uid) as Col
  remote = {
    saveWorkout(w) { const { id, ...b } = w; col.doc(id).set(clean(b)).catch(() => {}) },
    saveSession(x) { const { id, ...b } = x; col.doc(id).set(clean({ ...b, kind: 'session' })).catch(() => {}) },
    deleteSession(id) { col.doc(id).delete().catch(() => {}) },
    deleteWorkout(id) { col.doc(id).delete().catch(() => {}) },
  }
  let first = true
  col.onSnapshot((snap) => {
    const ws = snap.docs.filter((d) => d.data()?.kind !== 'session').map((d) => ({ ...(d.data() as Workout), id: d.id }))
    const ss = snap.docs.filter((d) => d.data()?.kind === 'session').map((d) => {
      const { kind: _k, ...b } = d.data() as Session & { kind: string }
      return { ...b, id: d.id } as Session
    })
    if (first) { first = false; merge(ws, ss) } else { workouts = ws.sort(byDate); sessions = ss.sort(byStart); emit() }
  }, () => { /* offline or refused: keep the local copy */ })
}

// Called by the app once it knows who is signed in (or that there are no accounts).
export function setScope(userId: string | null) {
  const next = userId ?? 'local'
  if (next === scope && remote) return
  scope = next
  remote = null
  readCache()
  if (userId) adoptDeviceData()
  emit()
  scopeListeners.forEach((fn) => fn())
  if (supabase && userId) useSupabase()
  else if (!supabase) useArtifactDb()
}
// Workouts logged on this device before signing in move into the account the
// first time someone logs in here, then the device-only copy is cleared.
function adoptDeviceData() {
  try {
    const w: Workout[] = JSON.parse(localStorage.getItem('workout-lab:workouts') || '[]')
    const x: Session[] = JSON.parse(localStorage.getItem('workout-lab:sessions') || '[]')
    if (w.length === 0 && x.length === 0) return
    const haveW = new Set(workouts.map((i) => i.id))
    const haveS = new Set(sessions.map((i) => i.id))
    workouts = [...workouts, ...w.filter((i) => !haveW.has(i.id))].sort(byDate)
    sessions = [...sessions, ...x.filter((i) => !haveS.has(i.id))].sort(byStart)
    const live = localStorage.getItem('workout-lab:active-session')
    if (live && !localStorage.getItem(key('active-session'))) localStorage.setItem(key('active-session'), live)
    ;['workouts', 'sessions', 'active-session'].forEach((n) => localStorage.removeItem('workout-lab:' + n))
  } catch { /* storage blocked */ }
}

export function onScopeChange(fn: () => void) {
  scopeListeners.add(fn)
}
export const scopedKey = key

export function getWorkouts() {
  return workouts
}

export function addWorkout(w: Omit<Workout, 'id' | 'createdAt'>): Workout {
  const full: Workout = { ...w, id: crypto.randomUUID(), createdAt: Date.now() }
  workouts = [...workouts, full]
  emit()
  remote?.saveWorkout(full)
  return full
}

export function updateWorkout(id: string, patch: Partial<Omit<Workout, 'id'>>) {
  const w = workouts.find((x) => x.id === id)
  if (!w) return
  const next = { ...w, ...patch }
  workouts = workouts.map((x) => (x.id === id ? next : x))
  emit()
  remote?.saveWorkout(next)
}

export function saveSession(x: Session) {
  sessions = [...sessions, x]
  emit()
  remote?.saveSession(x)
}

// Fixing an ended session later (Book > Sessions > Edit).
export function updateSession(x: Session) {
  sessions = sessions.map((y) => (y.id === x.id ? x : y))
  emit()
  remote?.saveSession(x)
}

export function deleteWorkout(id: string) {
  workouts = workouts.filter((x) => x.id !== id)
  emit()
  remote?.deleteWorkout(id)
}

export function deleteSession(id: string) {
  sessions = sessions.filter((x) => x.id !== id)
  emit()
  remote?.deleteSession(id)
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function useSessions(): Session[] {
  return useSyncExternalStore(subscribe, () => sessions)
}
export function useWorkouts(): Workout[] {
  return useSyncExternalStore(subscribe, () => workouts)
}
