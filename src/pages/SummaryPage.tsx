import { useEffect, useState } from 'react'
import { Icon, WorkoutMark } from '../components/icons'
import { useSessions, type Session, type Workout } from '../lib/store'
import { day, duration } from '../lib/format'

// Shown right after a session ends: this session's numbers count up from the last
// session's, the change pops in, then everything settles still (good for a screenshot).

type Stat = { reps: number; top: number | null; sets: number }

function statOf(s: Session, wid: string): Stat | null {
  const entries = Object.values(s.sets[wid] ?? {}).filter((e) => e.reps !== null || e.weight !== null)
  if (entries.length === 0) return null
  const weights = entries.map((e) => e.weight).filter((w): w is number => w !== null)
  return {
    reps: entries.reduce((n, e) => n + (e.reps ?? 0), 0),
    top: weights.length ? Math.max(...weights) : null,
    sets: entries.length,
  }
}

const ease = (k: number) => 1 - Math.pow(1 - k, 3)

// A number that runs from `from` to `to` once, after `delay` ms.
function Count({ from, to, delay, dur = 1400, decimals = 0 }: { from: number; to: number; delay: number; dur?: number; decimals?: number }) {
  const [v, setV] = useState(from)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return }
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
  return <>{v.toFixed(decimals)}</>
}

function Delta({ d, unit, delay }: { d: number | null; unit?: string; delay: number }) {
  if (d === null) return <span className="delta new" style={{ animationDelay: `${delay}ms` }}>first time</span>
  const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'same'
  const text = d === 0 ? 'same' : `${d > 0 ? '+' : '−'}${Math.abs(+d.toFixed(1))}${unit ? ' ' + unit : ''}`
  return <span className={`delta ${cls}`} style={{ animationDelay: `${delay}ms` }}>{d > 0 && '▲ '}{d < 0 && '▼ '}{text}</span>
}

export default function SummaryPage({ id, workouts, onDone }: { id: string; workouts: Workout[]; onDone: () => void }) {
  const sessions = useSessions()
  const index = sessions.findIndex((x) => x.id === id)
  const s = sessions[index]
  if (!s) return <main className="page summary"><p className="empty-note">Session not found.</p></main>

  const earlier = sessions.slice(0, index)
  const rows = s.order.map((wid) => {
    const now = statOf(s, wid)
    const prevSession = [...earlier].reverse().find((x) => statOf(x, wid))
    const prev = prevSession ? statOf(prevSession, wid) : null
    const info = s.snap?.[wid] ?? workouts.find((w) => w.id === wid)
    return { wid, now, prev, info }
  }).filter((r) => r.now)

  const totalSets = rows.reduce((n, r) => n + r.now!.sets, 0)
  const isTimed = (r: { wid: string; info?: { mode?: string; count?: string } }) => r.info?.mode === 'progression' && r.info?.count === 'sec'
  const totalReps = rows.filter((r) => !isTimed(r)).reduce((n, r) => n + r.now!.reps, 0)
  const START = 500 // header first, then the cards one after another
  const STAGGER = 260

  return (
    <main className="page scroll summary" aria-label="Session summary">
      <header className="sum-head">
        <p className="sum-kicker">Session complete</p>
        <h1 className="sum-num">#<Count from={Math.max(0, index)} to={index + 1} delay={150} dur={700} /></h1>
        <p className="sum-when">{day(s.startedAt)} · {duration(s.startedAt, s.endedAt ?? s.startedAt)}</p>
        <div className="sum-totals">
          <div><b><Count from={0} to={totalSets} delay={300} dur={900} /></b><span>sets</span></div>
          <div><b><Count from={0} to={totalReps} delay={300} dur={1100} /></b><span>reps</span></div>
          <div><b>{rows.length}</b><span>{rows.length === 1 ? 'exercise' : 'exercises'}</span></div>
        </div>
      </header>

      {rows.length === 0 && <p className="empty-note">Nothing was recorded in this session.</p>}

      <ol className="sum-list">
        {rows.map((r, i) => {
          const delay = START + i * STAGGER
          const after = delay + 1400
          const unit = r.info?.unit ?? 'kg'
          const progression = r.info?.mode === 'progression'
          const repDelta = r.prev ? r.now!.reps - r.prev.reps : null
          const topDelta = r.prev && r.prev.top !== null && r.now!.top !== null ? r.now!.top - r.prev.top : r.prev ? 0 : null
          const up = (repDelta ?? 0) > 0 || (topDelta ?? 0) > 0
          return (
            <li key={r.wid} className={`sum-card${up ? ' gain' : ''}`} style={{ ['--in-delay' as string]: `${delay - 200}ms`, ['--glow-delay' as string]: `${after + 150}ms` }}>
              <p className="sum-ex">{r.info && <WorkoutMark icon={r.info.icon} letter={r.info.letter} size="1em" />}<span className="nm">{r.info?.exercise || 'Untitled'}</span><small>{r.now!.sets} {r.now!.sets === 1 ? 'set' : 'sets'}</small></p>
              <div className="sum-stats">
                <div className="sum-stat">
                  <span className="lbl">{isTimed(r) ? 'Seconds' : 'Reps'}</span>
                  <b><Count from={r.prev?.reps ?? 0} to={r.now!.reps} delay={delay} />{isTimed(r) && <small>sec</small>}</b>
                  <Delta d={repDelta} unit={isTimed(r) ? 'sec' : undefined} delay={after} />
                </div>
                {!progression && r.now!.top !== null && (
                  <div className="sum-stat">
                    <span className="lbl">Top load</span>
                    <b><Count from={r.prev?.top ?? 0} to={r.now!.top} delay={delay} decimals={Number.isInteger(r.now!.top) ? 0 : 1} /><small>{unit}</small></b>
                    <Delta d={topDelta} unit={unit} delay={after + 80} />
                  </div>
                )}
                {progression && s.snap?.[r.wid]?.move && (
                  <div className="sum-stat">
                    <span className="lbl">Progression</span>
                    <b className="move">{s.snap[r.wid].move}</b>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <button className="btn circle big save-new" aria-label="Done" onClick={onDone}>
        <Icon name="check" strokeWidth={2.2} />
      </button>
    </main>
  )
}
