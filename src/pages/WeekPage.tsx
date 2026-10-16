import { useEffect, useState } from 'react'
import { DAY, weekStart, useNewWeek, markWeekSeen } from '../lib/week'
import { Icon, WorkoutMark } from '../components/icons'
import { useSessions, useNotes, type Workout, type Session } from '../lib/store'
import { statOf, type Stat } from '../lib/progress'
import { duration } from '../lib/format'
import { NoteRow } from './NotePage'
import { usePlan, atLeast } from '../lib/plan'
import { LockBadge } from '../components/LockNote'
import { t, locale } from '../lib/i18n'

// Weekly summary (Exclusive): one page for a Monday-to-Sunday week. First what was
// trained and how it moved compared with before the week, and what wasn't trained;
// then the notes written that week.

function Change({ d, unit, label }: { d: number | null; unit?: string; label: string }) {
  if (d === null) return <span className="delta new static">{t('{label}: first time', { label })}</span>
  const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'same'
  const text = d === 0 ? t('same') : `${d > 0 ? '+' : '−'}${Math.abs(+d.toFixed(1))}${unit ? ' ' + unit : ''}`
  return <span className={`delta ${cls} static`}>{label} {d > 0 && '▲ '}{d < 0 && '▼ '}{text}</span>
}

export default function WeekPage({ workouts }: { workouts: Workout[] }) {
  const can = atLeast(usePlan(), 'exclusive')
  const all = useSessions()
  const notes = useNotes()
  // a new summary just out opens on last week
  const fresh = useNewWeek()
  const [offset, setOffset] = useState(fresh ? -1 : 0)
  useEffect(() => { if (fresh) markWeekSeen() }, [fresh])
  const from = weekStart(offset), to = from + 7 * DAY
  const fmt = (ts: number) => new Date(ts).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })

  const head = (
    <header className="create-head">
      <h1>{t('This week')}</h1>
      <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
    </header>
  )
  if (!can) {
    return (
      <main className="page scroll week" aria-label={t('This week')}>
        {head}
        <div className="week-locked"><LockBadge /><p>{t('The weekly summary is an Exclusive feature')}</p>
          <button className="ln-plans" onClick={() => { location.hash = 'plans' }}>{t('Plans')}</button></div>
      </main>
    )
  }

  const week = all.filter((s) => s.startedAt >= from && s.startedAt < to)
  const before = all.filter((s) => s.startedAt < from)
  const lastWith = (list: Session[], id: string) => [...list].reverse().find((s) => statOf(s, id))
  const done = workouts.filter((w) => week.some((s) => s.order.includes(w.id)))
  const missed = workouts.filter((w) => !done.includes(w))
  const sets = week.reduce((n, s) => n + s.order.reduce((m, id) => m + (statOf(s, id)?.sets ?? 0), 0), 0)
  const minutes = week.reduce((n, s) => n + ((s.endedAt ?? s.startedAt) - s.startedAt), 0)
  const weekNotes = notes.filter((n) => n.text.trim() && n.createdAt >= from && n.createdAt < to).reverse()

  return (
    <main className="page scroll week" aria-label={t('This week')}>
      {head}
      <div className="week-range">
        <button className="icon-btn" aria-label={t('Previous week')} onClick={() => setOffset(offset - 1)}><Icon name="back" size="18px" /></button>
        <span>{offset === 0 ? t('This week') : offset === -1 ? t('Last week') : ''}<small>{fmt(from)} – {fmt(to - DAY)}</small></span>
        <button className="icon-btn next" aria-label={t('Next week')} disabled={offset >= 0} onClick={() => setOffset(offset + 1)}><Icon name="back" size="18px" /></button>
      </div>

      <section className="week-stats">
        <div><b>{week.length}</b><small>{t('Sessions')}</small></div>
        <div><b>{done.length}</b><small>{t('Exercises')}</small></div>
        <div><b>{sets}</b><small>{t('sets')}</small></div>
        <div><b>{week.length ? duration(0, minutes) : '—'}</b><small>{t('Time')}</small></div>
      </section>

      <h2 className="week-h">{t('Progress')}</h2>
      {done.length === 0 ? <p className="empty-note">{t('No sessions this week yet.')}</p> : (
        <ul className="week-ex">
          {done.map((w) => {
            const inWeek = week.filter((s) => s.order.includes(w.id))
            const last = lastWith(week, w.id)
            // compared with the last time before this week; if it's new this week, with the week's first session
            const firstIn = week.find((s) => statOf(s, w.id))
            const prevS = lastWith(before, w.id) ?? (firstIn !== last ? firstIn : undefined)
            const now: Stat | null = last ? statOf(last, w.id) : null
            const prev: Stat | null = prevS ? statOf(prevS, w.id) : null
            const repDelta = now && prev ? now.reps - prev.reps : null
            const topDelta = now && prev && now.top !== null && prev.top !== null ? now.top - prev.top : null
            const move = last?.snap?.[w.id]?.move ?? (w.mode === 'progression' ? w.progressions?.at(-1) : undefined)
            const timed = w.mode === 'progression' && w.count === 'sec'
            const exNotes = weekNotes.filter((n) => n.workoutId === w.id).length
            return (
              <li key={w.id}>
                <p className="ex-name"><WorkoutMark icon={w.icon} letter={w.letter} size="1em" /> {w.exercise || t('Untitled')}
                  <small>{inWeek.length === 1 ? t('1 session') : t('{n} sessions', { n: inWeek.length })}</small></p>
                {now ? (
                  <div className="changes">
                    <Change d={repDelta} label={timed ? t('Seconds') : t('Reps')} />
                    {w.mode !== 'progression' && now.top !== null && prev && <Change d={topDelta} unit={w.unit} label={t('Top load')} />}
                  </div>
                ) : <p className="muted">{t('Nothing recorded')}</p>}
                {move && <p className="muted">{t('Progression: {move}', { move })}</p>}
                {exNotes > 0 && <p className="muted week-note-count"><Icon name="note" size="13px" strokeWidth={2.2} />{exNotes === 1 ? t('1 note') : t('{n} notes', { n: exNotes })}</p>}
              </li>
            )
          })}
        </ul>
      )}
      {missed.length > 0 && (
        <div className="week-missed">
          <h3>{t('Not done this week')}</h3>
          <p>{missed.map((w) => <span key={w.id}><WorkoutMark icon={w.icon} letter={w.letter} size="1em" /> {w.exercise || t('Untitled')}</span>)}</p>
        </div>
      )}

      <h2 className="week-h">{t('Notes')}</h2>
      {weekNotes.length === 0 ? <p className="empty-note">{t('No notes this week.')}</p> : (
        <ul className="notes-list week-notes">{weekNotes.map((n) => <NoteRow key={n.id} note={n} workouts={workouts} onOpen={() => { location.hash = 'note-' + n.id }} />)}</ul>
      )}
    </main>
  )
}
