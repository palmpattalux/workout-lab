import { useEffect, useState } from 'react'
import { WorkoutMark } from '../components/icons'
import { useSessions, deleteSession, updateSession, useNotes, type Workout, type Session, type SetEntry } from '../lib/store'
import { Icon } from '../components/icons'
import { useSession, discardSession, canContinue, continueSession } from '../lib/session'
import SetList from '../components/SetList'
import { keyNum, keySide } from '../lib/session'
import { day, time, duration, setLines } from '../lib/format'
import { compare } from '../lib/progress'
import { t, locale } from '../lib/i18n'

// A small change chip, the same look as the summary page: ▲ +3 reps, ▼ −2.5 kg, first time.
function Change({ d, unit, label }: { d: number | null; unit?: string; label: string }) {
  if (d === null) return <span className="delta new static">{t('{label}: first time', { label })}</span>
  const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'same'
  const text = d === 0 ? t('same') : `${d > 0 ? '+' : '−'}${Math.abs(+d.toFixed(1))}${unit ? ' ' + unit : ''}`
  return <span className={`delta ${cls} static`}>{label} {d > 0 && '▲ '}{d < 0 && '▼ '}{text}</span>
}

// Every session as a row, newest at the top. Tap a row to see its exercises and sets.
export default function SessionsList({ workouts, only, startOpen }: { workouts: Workout[]; only?: string; startOpen?: string | null }) {
  const done = useSessions()
  const live = useSession()
  const allNotes = useNotes().filter((n) => n.text.trim() && n.sessionId)
  const [open, setOpen] = useState<string | null>(startOpen ?? null)
  const [removing, setRemoving] = useState<(Session & { live?: boolean }) | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  // opened from the book button's drag-down list: bring that session into view
  useEffect(() => { if (startOpen) document.getElementById('s-' + startOpen)?.scrollIntoView({ block: 'center' }) }, [startOpen])
  // `only`: a preset's id, to list just the sessions done from it
  const rows: (Session & { live?: boolean })[] = [...(live ? [{ ...live, live: true }] : []), ...[...done].reverse()].filter((s) => !only || s.preset === only)

  if (rows.length === 0) {
    return <p className="empty-note">{only ? t('No sessions from this preset yet. Pick it on the first page, then open one of its exercises.') : t('No sessions yet. Open an exercise from the first page to start one.')}</p>
  }

  return (
    <>
    {removing && (
      <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setRemoving(null) }}>
        <div className="confirm" role="alertdialog" aria-label={t('Remove session?')}>
          <p>{t('Remove session?')}</p>
          <div>
            <button onClick={() => setRemoving(null)}>{t('No')}</button>
            <button className="yes danger" onClick={() => {
              if (removing.live) discardSession(); else deleteSession(removing.id)
              setOpen(null); setRemoving(null)
            }}>{t('Yes')}</button>
          </div>
        </div>
      </div>
    )}
    <ol className="sessions">
      {rows.map((s) => {
        const isOpen = open === s.id
        // compare with the sessions before this one (oldest first); a live session comes after all of them
        const at = s.live ? done.length : done.findIndex((x) => x.id === s.id)
        const changes = Object.fromEntries(s.order.map((id) => [id, compare(done, at, s, id)]))
        const gains = s.order.filter((id) => changes[id].up).length
        const notes = allNotes.filter((n) => n.sessionId === s.id)
        return (
          <li key={s.id} className={s.live ? 'live' : undefined} id={'s-' + s.id}>
            <button className="session-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
              {/* what was trained first, when it was on the right */}
              <span className="marks">
                {s.order.map((id) => {
                  const info = s.snap?.[id] ?? workouts.find((w) => w.id === id)
                  const tint = workouts.find((w) => w.id === id)?.color
                  return info ? <span key={id} className={tint ? 'tinted tint-' + tint : undefined}><WorkoutMark icon={info.icon} letter={info.letter} size="1em" /></span> : null
                })}
              </span>
              {gains > 0 && <span className="gain-badge" aria-label={t('{n} improved', { n: gains })}>▲ {gains}</span>}
              {notes.length > 0 && <span className="note-badge" aria-label={t('{n} notes', { n: notes.length })}><Icon name="note" size="13px" strokeWidth={2.2} />{notes.length}</span>}
              <span className="when">
                <b>{day(s.startedAt)}</b>
                <small>{s.live ? t('In progress since {time}', { time: time(s.startedAt) }) : `${time(s.startedAt)} · ${duration(s.startedAt, s.endedAt ?? s.startedAt)}`}</small>
              </span>
            </button>
            {isOpen && editing === s.id && !s.live && (
              <SessionEditor s={s} workouts={workouts} onClose={() => setEditing(null)} />
            )}
            {isOpen && editing !== s.id && (
              <div className="session-detail">
                {s.order.map((id) => {
                  const current = workouts.find((w) => w.id === id)
                  const info = s.snap?.[id] ?? current
                  const lines = setLines(s, id, current)
                  return (
                    <div key={id} className="ex">
                      <p className="ex-name">{info ? <WorkoutMark icon={info.icon} letter={info.letter} size="1em" /> : null} {info?.exercise || t('Untitled')}</p>
                      {s.snap?.[id]?.move && <p className="muted">{t('Progression: {move}', { move: s.snap[id].move! })}</p>}
                      {changes[id].now && (
                        <div className="changes">
                          <Change d={changes[id].repDelta} label={info?.mode === 'progression' && info?.count === 'sec' ? t('Seconds') : t('Reps')} />
                          {info?.mode !== 'progression' && changes[id].now!.top !== null && changes[id].prev && <Change d={changes[id].topDelta} unit={info?.unit ?? 'kg'} label={t('Top load')} />}
                        </div>
                      )}
                      {lines.length === 0 ? <p className="muted">{t('Nothing recorded')}</p> : (
                        <SetList lines={lines} />
                      )}
                    </div>
                  )
                })}
                {notes.length > 0 && (
                  <div className="session-notes">
                    {notes.map((n) => (
                      <button key={n.id} className="session-note" onClick={() => { location.hash = 'note-' + n.id }}>
                        <Icon name="note" size="16px" strokeWidth={2} /><span>{n.text.trim().split('\n')[0]}</span><i aria-hidden="true">›</i>
                      </button>
                    ))}
                  </div>
                )}
                <div className="detail-actions">
                  {!s.live && <button className="edit-session" onClick={() => setEditing(s.id)}>{t('Edit')}</button>}
                  {/* ended by mistake: the last session can be picked up again for 2 hours */}
                  {!s.live && canContinue(s.id) && <button className="edit-session" onClick={() => { const w = continueSession(s.id); if (w) location.hash = 'b-' + w }}>{t('Continue session')}</button>}
                  <button className="remove" onClick={() => setRemoving(s)}>{t('Remove session')}</button>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ol>
    </>
  )
}

// Edit an ended session in place: each set's load and reps, and for progressions
// whether the number was reps or seconds.
function SessionEditor({ s, workouts, onClose }: { s: Session; workouts: Workout[]; onClose: () => void }) {
  const [sets, setSets] = useState<Session['sets']>(() => JSON.parse(JSON.stringify(s.sets)))
  const [counts, setCounts] = useState<Record<string, 'reps' | 'sec'>>(() =>
    Object.fromEntries(s.order.map((id) => [id, (s.snap?.[id] ?? workouts.find((w) => w.id === id))?.count ?? 'reps'])))

  function put(id: string, n: string, k: keyof SetEntry, v: string) {
    const num = v.trim() === '' ? null : Math.max(0, Number(v))
    setSets((x) => ({ ...x, [id]: { ...x[id], [n]: { ...(x[id]?.[n] ?? { reps: null, weight: null }), [k]: Number.isFinite(num as number) || num === null ? num : null } } }))
  }
  function save() {
    const snap = { ...(s.snap ?? {}) }
    for (const id of s.order) {
      const w = workouts.find((x) => x.id === id)
      const base = snap[id] ?? (w ? { exercise: w.exercise, icon: w.icon, letter: w.letter, mode: w.mode, unit: w.unit } : undefined)
      if (base) snap[id] = { ...base, count: counts[id] }
    }
    updateSession({ ...s, sets, snap })
    onClose()
  }

  return (
    <div className="session-detail editing">
      {s.order.map((id) => {
        const info = s.snap?.[id] ?? workouts.find((w) => w.id === id)
        const progression = info?.mode === 'progression'
        const unit = info?.unit ?? 'kg'
        const count = counts[id]
        const nums = Object.keys(sets[id] ?? {}).sort((a, b) => keyNum(a) - keyNum(b) || a.localeCompare(b))
        return (
          <div key={id} className="ex">
            <p className="ex-name">{info ? <WorkoutMark icon={info.icon} letter={info.letter} size="1em" /> : null} {info?.exercise || t('Untitled')}</p>
            {progression && (
              <button className="unit small" onClick={() => setCounts((c) => ({ ...c, [id]: count === 'reps' ? 'sec' : 'reps' }))} aria-label={`Counting ${count}, tap to switch`}>
                <span className={count === 'reps' ? 'on' : ''}>{t('reps')}</span> / <span className={count === 'sec' ? 'on' : ''}>{t('sec')}</span>
              </button>
            )}
            {nums.length === 0 ? <p className="muted">{t('Nothing recorded')}</p> : (
              <ul className="set-edit">
                {nums.map((n) => (
                  <li key={n}>
                    <span>{t('Set {n}', { n: keyNum(n) })}{keySide(n) && <b className="side-tag">{keySide(n) === 'L' ? t('L') : t('R')}</b>}</span>
                    {!progression && (
                      <label><input inputMode="decimal" type="number" min="0" step="any" value={sets[id][n].weight ?? ''} onChange={(e) => put(id, n, 'weight', e.target.value)} aria-label={`Set ${n} load`} /><small>{unit}</small></label>
                    )}
                    <label><input inputMode="numeric" type="number" min="0" value={sets[id][n].reps ?? ''} onChange={(e) => put(id, n, 'reps', e.target.value)} aria-label={`Set ${n} ${progression && count === 'sec' ? 'seconds' : 'reps'}`} /><small>{progression && count === 'sec' ? t('sec') : t('reps')}</small></label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      <div className="detail-actions">
        <button className="edit-session primary" onClick={save}>{t('Save')}</button>
        <button className="edit-session" onClick={onClose}>{t('Cancel')}</button>
      </div>
    </div>
  )
}

// Book > Sessions > Calendar: a month of day boxes, each holding the sessions done that day
// (their exercise icons). An easier way to see which days you trained. Tap a session to open
// it in the list, the usual session view.
const dayStart = (ts: number) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime() }
export function SessionsCalendar({ workouts, onOpen }: { workouts: Workout[]; onOpen: (id: string) => void }) {
  const done = useSessions()
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime() })
  const first = new Date(month)
  const y = first.getFullYear(), m = first.getMonth()
  const days = new Date(y, m + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // Monday first
  const byDay = new Map<number, Session[]>()
  for (const s of done) {
    const k = dayStart(s.startedAt)
    const d = new Date(k)
    if (d.getFullYear() !== y || d.getMonth() !== m) continue
    byDay.set(k, [...(byDay.get(k) ?? []), s])
  }
  const count = [...byDay.values()].reduce((n, l) => n + l.length, 0)
  const today = dayStart(Date.now())
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale(), { weekday: 'narrow' }))
  const shift = (n: number) => setMonth(new Date(y, m + n, 1).getTime())
  const isThisMonth = new Date(today).getFullYear() === y && new Date(today).getMonth() === m

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="icon-btn" aria-label={t('Previous month')} onClick={() => shift(-1)}><Icon name="arrowLeft" size="20px" /></button>
        <span className="cal-title">
          <b>{first.toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}</b>
          <small>{count === 1 ? t('1 session') : t('{n} sessions', { n: count })}</small>
        </span>
        <button className="icon-btn" aria-label={t('Next month')} disabled={isThisMonth} onClick={() => shift(1)}><Icon name="arrowRight" size="20px" /></button>
      </div>
      <div className="cal-grid" role="grid">
        {weekdays.map((w, i) => <span key={'w' + i} className="cal-wd" aria-hidden="true">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={'e' + i} className="cal-day blank" />)}
        {Array.from({ length: days }, (_, i) => {
          const k = new Date(y, m, i + 1).getTime()
          const list = byDay.get(k) ?? []
          return (
            <div key={k} role="gridcell" className={`cal-day${list.length ? ' trained' : ''}${k === today ? ' today' : ''}${k > today ? ' future' : ''}`}>
              <span className="cal-num">{i + 1}</span>
              {list.map((s) => {
                const marks = s.order.map((id) => s.snap?.[id] ?? workouts.find((w) => w.id === id)).filter((x): x is NonNullable<typeof x> => !!x)
                return (
                  <button key={s.id} className="cal-session" aria-label={`${day(s.startedAt)} ${time(s.startedAt)}, ${marks.map((x) => x.exercise || t('Untitled')).join(', ')}`} onClick={() => onOpen(s.id)}>
                    {marks.slice(0, 2).map((x, j) => <WorkoutMark key={j} icon={x.icon} letter={x.letter} size="1em" />)}
                    {marks.length > 2 && <small>+{marks.length - 2}</small>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
