import { useEffect, useState } from 'react'
import { WorkoutMark } from './icons'
import { statOf } from '../lib/progress'
import { t } from '../lib/i18n'
import type { Session, Workout } from '../lib/store'

// Back on the home page after a session: a glass card drops out of the book. Each exercise shows
// when it was last done ("3 days ago") with that time's numbers; a moment later the numbers run to
// today's and the change pops in. Then the card folds back up into the book. The point is the
// habit: every session ends with a glance at last time.

export type RecapRow = {
  id: string
  icon: string
  letter: string
  ago: number // whole days between last time and this session
  unit: string
  timed: boolean
  progression: boolean
  prev: { reps: number; top: number | null }
  now: { reps: number; top: number | null }
}

const dayOf = (ts: number) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime() }

// The latest session's exercises that were also done before (up to 3), or null when none were.
export function recapOf(sessions: Session[], workouts: Workout[]): RecapRow[] | null {
  const s = sessions.at(-1)
  if (!s) return null
  const earlier = sessions.slice(0, -1).reverse()
  const rows: RecapRow[] = []
  for (const wid of s.order) {
    const now = statOf(s, wid)
    const before = now && earlier.find((x) => statOf(x, wid))
    if (!now || !before) continue
    const prev = statOf(before, wid)!
    const info = s.snap?.[wid] ?? workouts.find((w) => w.id === wid)
    if (!info) continue
    rows.push({
      id: wid, icon: info.icon, letter: info.letter,
      ago: Math.max(0, Math.round((dayOf(s.startedAt) - dayOf(before.startedAt)) / 86400000)),
      unit: info.unit ?? 'kg', timed: info.mode === 'progression' && info.count === 'sec', progression: info.mode === 'progression',
      prev: { reps: prev.reps, top: prev.top }, now: { reps: now.reps, top: now.top },
    })
    if (rows.length === 3) break
  }
  return rows.length ? rows : null
}

const ease = (k: number) => 1 - Math.pow(1 - k, 3)
// runs from `from` to `to` once, starting `delay` ms after it appears
function Count({ from, to, delay, dur = 1100 }: { from: number; to: number; delay: number; dur?: number }) {
  const [v, setV] = useState(from)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { const tm = setTimeout(() => setV(to), delay); return () => clearTimeout(tm) }
    let raf = 0
    const t0 = performance.now() + delay
    const step = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur))
      setV(from + (to - from) * ease(k))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [from, to, delay, dur])
  const decimals = Number.isInteger(from) && Number.isInteger(to) ? 0 : 1
  return <>{+v.toFixed(decimals)}</>
}

const agoText = (n: number) => (n === 0 ? t('Earlier today') : n === 1 ? t('Yesterday') : t('{n} days ago', { n }))
const RUN_AT = 1500 // ms: last time's numbers sit still this long, then run to today's

export default function BookRecap({ rows }: { rows: RecapRow[] }) {
  const [gone, setGone] = useState(false)
  if (gone) return null
  return (
    <div className="book-recap" role="status" aria-label={t('Since last time')} onAnimationEnd={(e) => { if (e.target === e.currentTarget) setGone(true) }}>
      {rows.map((r, i) => {
        const delay = RUN_AT + i * 250
        const showTop = !r.progression && r.now.top !== null && r.prev.top !== null
        const dTop = showTop ? r.now.top! - r.prev.top! : 0
        const dReps = r.now.reps - r.prev.reps
        const up = dTop > 0 || (dTop === 0 && dReps > 0)
        const down = dTop < 0 || (dTop === 0 && dReps < 0)
        const change = dTop !== 0 ? `${dTop > 0 ? '+' : '−'}${Math.abs(+dTop.toFixed(1))} ${r.unit}`
          : dReps !== 0 ? `${dReps > 0 ? '+' : '−'}${Math.abs(dReps)} ${r.timed ? t('sec') : t('reps')}` : t('same')
        return (
          <div key={r.id} className="recap-row" style={{ ['--d' as string]: `${delay}ms` }}>
            <span className="recap-mark"><WorkoutMark icon={r.icon} letter={r.letter} size="1em" /></span>
            <span className="recap-when">
              <i className="was">{agoText(r.ago)}</i>
              <i className="now">{t('Today')}</i>
            </span>
            <span className="recap-num">
              {showTop && <><Count from={r.prev.top!} to={r.now.top!} delay={delay} /><small>{r.unit}</small><em>·</em></>}
              <Count from={r.prev.reps} to={r.now.reps} delay={delay} /><small>{r.timed ? t('sec') : t('reps')}</small>
            </span>
            <span className={`recap-delta ${up ? 'up' : down ? 'down' : 'same'}`}>{up && '▲ '}{down && '▼ '}{change}</span>
          </div>
        )
      })}
    </div>
  )
}
