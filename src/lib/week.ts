import { useSyncExternalStore } from 'react'
import { useSessions, scopedKey, onScopeChange } from './store'
import { usePlan, atLeast } from './plan'

// Weeks run Monday to Sunday. Once a week with sessions is over, its summary is "out":
// a dot shows on the book and on "This week" until the summary is opened.
export const DAY = 86400000
export function weekStart(offset = 0) {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  return d.getTime()
}

const listeners = new Set<() => void>()
const readSeen = () => { try { return Number(localStorage.getItem(scopedKey('week-seen')) || 0) } catch { return 0 } }
let seen = readSeen()
onScopeChange(() => { seen = readSeen(); listeners.forEach((fn) => fn()) })
export function markWeekSeen() {
  seen = weekStart(-1)
  try { localStorage.setItem(scopedKey('week-seen'), String(seen)) } catch { /* blocked */ }
  listeners.forEach((fn) => fn())
}

// true when last week's summary is out and hasn't been opened (Exclusive plan only)
export function useNewWeek(): boolean {
  const can = atLeast(usePlan(), 'exclusive')
  const sessions = useSessions()
  const s = useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => seen)
  const from = weekStart(-1), to = weekStart(0)
  return can && s < from && sessions.some((x) => x.startedAt >= from && x.startedAt < to)
}
