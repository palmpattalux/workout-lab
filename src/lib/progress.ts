import type { Session } from './store'
import { keyNum } from './session'

// One exercise's totals in one session, and how they compare with the last session
// that had that exercise. Used by the summary page and the session history.

export type Stat = { reps: number; top: number | null; sets: number }

export function statOf(s: Session, wid: string): Stat | null {
  const done = Object.entries(s.sets[wid] ?? {}).filter(([, e]) => e.reps !== null || e.weight !== null)
  const entries = done.map(([, e]) => e)
  if (entries.length === 0) return null
  const weights = entries.map((e) => e.weight).filter((w): w is number => w !== null)
  return {
    reps: entries.reduce((n, e) => n + (e.reps ?? 0), 0),
    top: weights.length ? Math.max(...weights) : null,
    sets: new Set(done.map(([k]) => keyNum(k))).size, // Left and Right count as one set
  }
}

// `sessions` oldest first; `index` is where `s` sits in it (or its length for a live one).
export function compare(sessions: Session[], index: number, s: Session, wid: string) {
  const now = statOf(s, wid)
  const prevSession = sessions.slice(0, index).reverse().find((x) => statOf(x, wid))
  const prev = prevSession ? statOf(prevSession, wid) : null
  const repDelta = now && prev ? now.reps - prev.reps : null
  const topDelta = now && prev ? (prev.top !== null && now.top !== null ? now.top - prev.top : 0) : null
  return { now, prev, repDelta, topDelta, up: (repDelta ?? 0) > 0 || (topDelta ?? 0) > 0 }
}
