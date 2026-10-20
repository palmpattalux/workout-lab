import { useMemo, useState } from 'react'
import { WorkoutMark } from '../components/icons'
import { useSessions, useWorkouts, type Session, type Workout } from '../lib/store'
import { weekStart, DAY } from '../lib/week'
import { t, locale } from '../lib/i18n'

// Desktop "View": the progress a phone screen is too small for. Built only from what the app
// already saves (ended sessions and their sets), so there is nothing extra to log.
const LB = 0.45359237
type Point = { t: number; v: number; sid: string }
type Metric = 'top' | 'e1rm' | 'volume' | 'reps'
const METRICS: { key: Metric; label: string; weighted: boolean }[] = [
  { key: 'top', label: 'Top weight', weighted: true },
  { key: 'e1rm', label: 'Est. 1-rep max', weighted: true },
  { key: 'volume', label: 'Volume', weighted: true },
  { key: 'reps', label: 'Total reps', weighted: false },
]

const fmtDay = (ms: number) => new Date(ms).toLocaleDateString(locale(), { month: 'short', day: 'numeric' })
const fmtNum = (n: number) => (Math.round(n * 10) / 10).toLocaleString(locale())
const kgOf = (s: Session, w: Workout | undefined, wid: string, v: number) => ((s.snap?.[wid]?.unit ?? w?.unit) === 'lbs' ? v * LB : v)

// one exercise in one session: everything the charts need
function exStats(s: Session, wid: string, w: Workout | undefined) {
  const entries = Object.values(s.sets[wid] ?? {}).filter((e) => e.reps !== null || e.weight !== null)
  if (!entries.length) return null
  let top = 0, e1rm = 0, volume = 0, reps = 0
  for (const e of entries) {
    const kg = e.weight !== null ? kgOf(s, w, wid, e.weight) : 0
    const r = e.reps ?? 0
    reps += r
    volume += kg * r
    top = Math.max(top, kg)
    if (kg > 0 && r > 0) e1rm = Math.max(e1rm, kg * (1 + r / 30)) // Epley
  }
  return { top, e1rm, volume, reps, sets: entries.length }
}

export default function ViewPage({ signedIn }: { signedIn: boolean }) {
  const workouts = useWorkouts()
  const all = useSessions()
  const sessions = useMemo(() => all.filter((s) => s.endedAt), [all])
  const byId = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts])

  if (!signedIn) {
    return (
      <section className="vw-empty">
        <h1>{t('Your progress, on a big screen')}</h1>
        <p>{t('Sign in with your Dotset account to see every session, your records and how each exercise is moving.')}</p>
        <button className="ld-btn" onClick={() => { location.hash = 'login' }}>{t('Sign in')}</button>
      </section>
    )
  }
  if (!sessions.length) {
    return (
      <section className="vw-empty">
        <h1>{t('Nothing to show yet')}</h1>
        <p>{t('Finish your first session in the app and your progress shows up here.')}</p>
      </section>
    )
  }
  return <Progress sessions={sessions} byId={byId} />
}

function Progress({ sessions, byId }: { sessions: Session[]; byId: Map<string, Workout> }) {
  // totals
  const totals = useMemo(() => {
    let sets = 0, volume = 0
    for (const s of sessions) for (const wid of Object.keys(s.sets)) {
      const st = exStats(s, wid, byId.get(wid)); if (st) { sets += st.sets; volume += st.volume }
    }
    // weeks in a row with a session, counting back from this week (or last week, if this one is empty so far)
    const weeks = new Set(sessions.map((s) => weekStart(Math.floor((s.startedAt - weekStart(0)) / (7 * DAY)))))
    let streak = 0, w = weeks.has(weekStart(0)) ? 0 : -1
    while (weeks.has(weekStart(w))) { streak++; w-- }
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0)
    return { sets, volume, streak, thisMonth: sessions.filter((s) => s.startedAt >= month.getTime()).length }
  }, [sessions, byId])

  // exercises that have history, most used first
  const exercises = useMemo(() => {
    const n = new Map<string, number>()
    sessions.forEach((s) => Object.keys(s.sets).forEach((wid) => { if (exStats(s, wid, byId.get(wid))) n.set(wid, (n.get(wid) ?? 0) + 1) }))
    return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([wid, count]) => {
      const w = byId.get(wid)
      const snap = [...sessions].reverse().find((s) => s.snap?.[wid])?.snap?.[wid]
      return { wid, count, name: w?.exercise || snap?.exercise || t('Untitled'), icon: w?.icon ?? snap?.icon ?? 'dumbbell', letter: w?.letter ?? snap?.letter ?? '', color: w?.color }
    })
  }, [sessions, byId])
  const [pick, setPick] = useState<string | null>(null)
  const ex = exercises.find((e) => e.wid === pick) ?? exercises[0]

  return (
    <div className="vw">
      <header className="vw-head">
        <h1>{t('Your progress')}</h1>
        <p>{t('Everything you logged in the app, sorted and measured.')}</p>
      </header>

      <div className="vw-tiles">
        <Tile label={t('Sessions')} value={sessions.length.toLocaleString(locale())} sub={t('{n} this month', { n: totals.thisMonth })} />
        <Tile label={t('Sets logged')} value={totals.sets.toLocaleString(locale())} />
        <Tile label={t('Total volume')} value={fmtNum(Math.round(totals.volume))} unit="kg" sub={t('weight × reps')} />
        <Tile label={t('Week streak')} value={String(totals.streak)} sub={totals.streak === 1 ? t('week in a row') : t('weeks in a row')} />
      </div>

      <section className="vw-card">
        <h2>{t('Activity')}</h2>
        <Heatmap sessions={sessions} byId={byId} />
      </section>

      <section className="vw-card vw-ex">
        <div className="vw-ex-list" role="tablist" aria-label={t('Exercises')}>
          {exercises.map((e) => (
            <button key={e.wid} role="tab" aria-selected={e.wid === ex.wid} className={e.wid === ex.wid ? 'on' : undefined} onClick={() => setPick(e.wid)}>
              <span className={e.color ? 'tinted tint-' + e.color : undefined}><WorkoutMark icon={e.icon} letter={e.letter} size="16px" /></span>
              <span className="vw-ex-name">{e.name}</span>
              <small>{e.count}</small>
            </button>
          ))}
        </div>
        <ExerciseDetail key={ex.wid} wid={ex.wid} name={ex.name} sessions={sessions} w={byId.get(ex.wid)} />
      </section>

      <section className="vw-card">
        <h2>{t('Weekly volume')}</h2>
        <WeeklyBars sessions={sessions} byId={byId} />
      </section>

      <section className="vw-card">
        <h2>{t('Recent sessions')}</h2>
        <SessionTable sessions={sessions} byId={byId} />
      </section>
    </div>
  )
}

function Tile({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div className="vw-tile">
      <span>{label}</span>
      <b>{value}{unit && <small> {unit}</small>}</b>
      {sub && <em>{sub}</em>}
    </div>
  )
}

// ---------- one exercise over time ----------
function ExerciseDetail({ wid, name, sessions, w }: { wid: string; name: string; sessions: Session[]; w?: Workout }) {
  const rows = useMemo(() => sessions.map((s) => ({ s, st: exStats(s, wid, w) })).filter((r): r is { s: Session; st: NonNullable<ReturnType<typeof exStats>> } => !!r.st), [sessions, wid, w])
  const weighted = rows.some((r) => r.st.top > 0)
  const options = METRICS.filter((m) => m.weighted === weighted || (weighted && m.key === 'reps'))
  const [metric, setMetric] = useState<Metric>(weighted ? 'top' : 'reps')
  const pts: Point[] = rows.map((r) => ({ t: r.s.startedAt, v: r.st[metric], sid: r.s.id }))
  const unit = metric === 'reps' ? ((w?.count ?? 'reps') === 'sec' ? t('sec') : t('reps')) : 'kg'
  const best = Math.max(...pts.map((p) => p.v))
  const first = pts[0]?.v ?? 0, latest = pts[pts.length - 1]?.v ?? 0
  const change = first > 0 ? ((latest - first) / first) * 100 : null

  return (
    <div className="vw-ex-body">
      <div className="vw-ex-top">
        <h2>{name}</h2>
        <div className="vw-seg" role="radiogroup" aria-label={t('Measure')}>
          {options.map((m) => <button key={m.key} role="radio" aria-checked={m.key === metric} className={m.key === metric ? 'on' : undefined} onClick={() => setMetric(m.key)}>{t(m.label)}</button>)}
        </div>
      </div>
      <div className="vw-ex-stats">
        <div><span>{t('Latest')}</span><b>{fmtNum(latest)} <small>{unit}</small></b></div>
        <div><span>{t('Best')}</span><b>{fmtNum(best)} <small>{unit}</small></b></div>
        <div><span>{t('Since first session')}</span><b className={change === null ? '' : change >= 0 ? 'up' : 'down'}>{change === null ? '–' : `${change >= 0 ? '+' : ''}${fmtNum(change)}%`}</b></div>
        <div><span>{t('Sessions')}</span><b>{pts.length}</b></div>
      </div>
      {pts.length > 1 ? <LineChart pts={pts} unit={unit} /> : <p className="vw-muted">{t('One more session and a line appears here.')}</p>}
      {metric === 'e1rm' && <p className="vw-foot">{t('Estimated from your best set each session (weight × (1 + reps ÷ 30)).')}</p>}
    </div>
  )
}

// Single series, so no legend: the selected measure names it. Hover shows the exact value.
function LineChart({ pts, unit }: { pts: Point[]; unit: string }) {
  const W = 760, H = 260, L = 48, R = 16, T = 16, B = 30
  const [hover, setHover] = useState<number | null>(null)
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t
  const vals = pts.map((p) => p.v)
  let lo = Math.min(...vals), hi = Math.max(...vals)
  const pad = (hi - lo) * 0.15 || Math.max(1, hi * 0.1)
  lo = Math.max(0, lo - pad); hi = hi + pad
  const x = (tm: number) => L + ((tm - t0) / (t1 - t0 || 1)) * (W - L - R)
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B)
  const ticks = niceTicks(lo, hi, 4)
  const xTicks = pts.length <= 6 ? pts.map((p) => p.t) : [0, 1, 2, 3, 4].map((i) => t0 + ((t1 - t0) * i) / 4)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('')
  const h = hover !== null ? pts[hover] : null

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const mx = ((e.clientX - r.left) / r.width) * W
    let best = 0
    pts.forEach((p, i) => { if (Math.abs(x(p.t) - mx) < Math.abs(x(pts[best].t) - mx)) best = i })
    setHover(best)
  }
  return (
    <div className="vw-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('Progress chart')} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="vw-grid" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" className="vw-axis">{fmtNum(v)}</text>
          </g>
        ))}
        {xTicks.map((tm, i) => <text key={i} x={x(tm)} y={H - 8} textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'} className="vw-axis">{fmtDay(tm)}</text>)}
        <path d={line} className="vw-line" />
        {h && <line x1={x(h.t)} x2={x(h.t)} y1={T} y2={H - B} className="vw-cross" />}
        {pts.map((p, i) => (i === hover || pts.length <= 24) && <circle key={p.sid} cx={x(p.t)} cy={y(p.v)} r={i === hover ? 6 : 4} className="vw-pt" />)}
      </svg>
      {h && (
        <div className="vw-tip" style={{ left: `${(x(h.t) / W) * 100}%`, top: `${(y(h.v) / H) * 100}%` }}>
          <b>{fmtNum(h.v)} {unit}</b><span>{fmtDay(h.t)}</span>
        </div>
      )}
    </div>
  )
}

function niceTicks(lo: number, hi: number, n: number) {
  const span = hi - lo || 1
  const step0 = span / n
  const mag = 10 ** Math.floor(Math.log10(step0))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? 10 * mag
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 100) / 100)
  return out
}

// ---------- activity: the last 26 weeks, one square per day ----------
function Heatmap({ sessions, byId }: { sessions: Session[]; byId: Map<string, Workout> }) {
  const WEEKS = 52
  const [hover, setHover] = useState<{ day: number; sets: number; col: number; row: number } | null>(null)
  const perDay = useMemo(() => {
    const m = new Map<number, number>()
    for (const s of sessions) {
      const d = new Date(s.startedAt); d.setHours(0, 0, 0, 0)
      const n = Object.keys(s.sets).reduce((k, wid) => k + (exStats(s, wid, byId.get(wid))?.sets ?? 0), 0)
      m.set(d.getTime(), (m.get(d.getTime()) ?? 0) + Math.max(1, n))
    }
    return m
  }, [sessions, byId])
  const start = weekStart(-(WEEKS - 1))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const level = (n: number) => (n === 0 ? 0 : n <= 5 ? 1 : n <= 12 ? 2 : n <= 20 ? 3 : 4)
  const days = ['Mon', '', 'Wed', '', 'Fri', '', '']
  return (
    <div className="vw-heat">
      <div className="vw-heat-days" aria-hidden="true">{days.map((d, i) => <span key={i}>{d && t(d)}</span>)}</div>
      <div className="vw-heat-grid">
        {Array.from({ length: WEEKS }, (_, col) => (
          <div key={col} className="vw-heat-col">
            {Array.from({ length: 7 }, (_, row) => {
              const day = new Date(start); day.setDate(day.getDate() + col * 7 + row)
              const ms = day.getTime()
              if (ms > today.getTime()) return <i key={row} className="future" />
              const n = perDay.get(ms) ?? 0
              return <i key={row} className={'l' + level(n)} onMouseEnter={() => setHover({ day: ms, sets: n, col, row })} onMouseLeave={() => setHover(null)} />
            })}
          </div>
        ))}
        {hover && (
          <div className="vw-tip small" style={{ left: `${((hover.col + 0.5) / WEEKS) * 100}%`, top: `${(hover.row / 7) * 100}%` }}>
            <b>{hover.sets ? t('{n} sets', { n: hover.sets }) : t('Rest day')}</b><span>{fmtDay(hover.day)}</span>
          </div>
        )}
      </div>
      <div className="vw-heat-key" aria-hidden="true"><span>{t('Less')}</span>{[0, 1, 2, 3, 4].map((l) => <i key={l} className={'l' + l} />)}<span>{t('More')}</span></div>
    </div>
  )
}

// ---------- weekly volume: last 12 weeks ----------
function WeeklyBars({ sessions, byId }: { sessions: Session[]; byId: Map<string, Workout> }) {
  const N = 12
  const [hover, setHover] = useState<number | null>(null)
  const weeks = useMemo(() => Array.from({ length: N }, (_, i) => {
    const from = weekStart(i - (N - 1)), to = from + 7 * DAY
    let vol = 0, count = 0
    for (const s of sessions) if (s.startedAt >= from && s.startedAt < to) {
      count++
      for (const wid of Object.keys(s.sets)) vol += exStats(s, wid, byId.get(wid))?.volume ?? 0
    }
    return { from, vol, count }
  }), [sessions, byId])
  const max = Math.max(1, ...weeks.map((w) => w.vol))
  return (
    <div className="vw-bars">
      {weeks.map((w, i) => (
        <div key={w.from} className="vw-bar" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <div className="vw-bar-track"><i style={{ height: `${(w.vol / max) * 100}%` }} className={w.vol ? undefined : 'zero'} /></div>
          <span>{fmtDay(w.from)}</span>
          {hover === i && <div className="vw-tip small" style={{ left: '50%', top: `${100 - (w.vol / max) * 78}%` }}><b>{fmtNum(Math.round(w.vol))} kg</b><span>{t('{n} sessions', { n: w.count })}</span></div>}
        </div>
      ))}
    </div>
  )
}

// ---------- the table view ----------
function SessionTable({ sessions, byId }: { sessions: Session[]; byId: Map<string, Workout> }) {
  const recent = [...sessions].reverse().slice(0, 12)
  return (
    <table className="vw-table">
      <thead><tr><th>{t('Date')}</th><th>{t('Length')}</th><th>{t('Exercises')}</th><th className="num">{t('Sets')}</th><th className="num">{t('Volume')}</th></tr></thead>
      <tbody>
        {recent.map((s) => {
          const ids = Object.keys(s.sets).filter((wid) => exStats(s, wid, byId.get(wid)))
          const sets = ids.reduce((n, wid) => n + exStats(s, wid, byId.get(wid))!.sets, 0)
          const vol = ids.reduce((n, wid) => n + exStats(s, wid, byId.get(wid))!.volume, 0)
          const mins = s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : null
          return (
            <tr key={s.id}>
              <td>{new Date(s.startedAt).toLocaleDateString(locale(), { weekday: 'short', month: 'short', day: 'numeric' })}</td>
              <td>{mins !== null ? t('{n} min', { n: mins }) : '–'}</td>
              <td>{ids.map((wid) => byId.get(wid)?.exercise || s.snap?.[wid]?.exercise || t('Untitled')).join(', ')}</td>
              <td className="num">{sets}</td>
              <td className="num">{vol ? `${fmtNum(Math.round(vol))} kg` : '–'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
