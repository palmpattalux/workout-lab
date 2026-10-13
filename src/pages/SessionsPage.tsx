import { useState } from 'react'
import { WorkoutMark } from '../components/icons'
import { useSessions, type Workout, type Session } from '../lib/store'
import { useSession } from '../lib/session'
import { day, time, duration, setLines } from '../lib/format'

// Every session as a row, newest at the top. Tap a row to see its exercises and sets.
export default function SessionsList({ workouts }: { workouts: Workout[] }) {
  const done = useSessions()
  const live = useSession()
  const [open, setOpen] = useState<string | null>(null)
  const rows: (Session & { live?: boolean })[] = [...(live ? [{ ...live, live: true }] : []), ...[...done].reverse()]

  if (rows.length === 0) {
    return <p className="empty">No sessions yet. Open an exercise from the first page to start one.</p>
  }

  return (
    <ol className="sessions">
      {rows.map((s) => {
        const isOpen = open === s.id
        return (
          <li key={s.id} className={s.live ? 'live' : undefined}>
            <button className="session-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
              <span className="when">
                <b>{day(s.startedAt)}</b>
                <small>{s.live ? `In progress since ${time(s.startedAt)}` : `${time(s.startedAt)} · ${duration(s.startedAt, s.endedAt ?? s.startedAt)}`}</small>
              </span>
              <span className="marks">
                {s.order.map((id) => {
                  const info = s.snap?.[id] ?? workouts.find((w) => w.id === id)
                  return info ? <WorkoutMark key={id} icon={info.icon} letter={info.letter} size="1em" /> : null
                })}
              </span>
            </button>
            {isOpen && (
              <div className="session-detail">
                {s.order.map((id) => {
                  const current = workouts.find((w) => w.id === id)
                  const info = s.snap?.[id] ?? current
                  const lines = setLines(s, id, current)
                  return (
                    <div key={id} className="ex">
                      <p className="ex-name">{info ? <WorkoutMark icon={info.icon} letter={info.letter} size="1em" /> : null} {info?.exercise || 'Untitled'}</p>
                      {s.snap?.[id]?.move && <p className="muted">Progression: {s.snap[id].move}</p>}
                      {lines.length === 0 ? <p className="muted">Nothing recorded</p> : (
                        <ul>{lines.map((l) => <li key={l.set}><span>Set {l.set}</span>{l.text}</li>)}</ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
