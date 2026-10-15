import { useState } from 'react'
import { WorkoutMark } from '../components/icons'
import { useSessions, deleteSession, updateSession, type Workout, type Session, type SetEntry } from '../lib/store'
import { useSession, discardSession } from '../lib/session'
import { day, time, duration, setLines } from '../lib/format'

// Every session as a row, newest at the top. Tap a row to see its exercises and sets.
export default function SessionsList({ workouts }: { workouts: Workout[] }) {
  const done = useSessions()
  const live = useSession()
  const [open, setOpen] = useState<string | null>(null)
  const [removing, setRemoving] = useState<(Session & { live?: boolean }) | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const rows: (Session & { live?: boolean })[] = [...(live ? [{ ...live, live: true }] : []), ...[...done].reverse()]

  if (rows.length === 0) {
    return <p className="empty-note">No sessions yet. Open an exercise from the first page to start one.</p>
  }

  return (
    <>
    {removing && (
      <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setRemoving(null) }}>
        <div className="confirm" role="alertdialog" aria-label="Remove session?">
          <p>Remove session?</p>
          <div>
            <button onClick={() => setRemoving(null)}>No</button>
            <button className="yes danger" onClick={() => {
              if (removing.live) discardSession(); else deleteSession(removing.id)
              setOpen(null); setRemoving(null)
            }}>Yes</button>
          </div>
        </div>
      </div>
    )}
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
                      <p className="ex-name">{info ? <WorkoutMark icon={info.icon} letter={info.letter} size="1em" /> : null} {info?.exercise || 'Untitled'}</p>
                      {s.snap?.[id]?.move && <p className="muted">Progression: {s.snap[id].move}</p>}
                      {lines.length === 0 ? <p className="muted">Nothing recorded</p> : (
                        <ul>{lines.map((l) => <li key={l.set}><span>Set {l.set}</span>{l.text}</li>)}</ul>
                      )}
                    </div>
                  )
                })}
                <div className="detail-actions">
                  {!s.live && <button className="edit-session" onClick={() => setEditing(s.id)}>Edit</button>}
                  <button className="remove" onClick={() => setRemoving(s)}>Remove session</button>
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
        const nums = Object.keys(sets[id] ?? {}).sort((a, b) => Number(a) - Number(b))
        return (
          <div key={id} className="ex">
            <p className="ex-name">{info ? <WorkoutMark icon={info.icon} letter={info.letter} size="1em" /> : null} {info?.exercise || 'Untitled'}</p>
            {progression && (
              <button className="unit small" onClick={() => setCounts((c) => ({ ...c, [id]: count === 'reps' ? 'sec' : 'reps' }))} aria-label={`Counting ${count}, tap to switch`}>
                <span className={count === 'reps' ? 'on' : ''}>reps</span> / <span className={count === 'sec' ? 'on' : ''}>sec</span>
              </button>
            )}
            {nums.length === 0 ? <p className="muted">Nothing recorded</p> : (
              <ul className="set-edit">
                {nums.map((n) => (
                  <li key={n}>
                    <span>Set {n}</span>
                    {!progression && (
                      <label><input inputMode="decimal" type="number" min="0" step="any" value={sets[id][n].weight ?? ''} onChange={(e) => put(id, n, 'weight', e.target.value)} aria-label={`Set ${n} load`} /><small>{unit}</small></label>
                    )}
                    <label><input inputMode="numeric" type="number" min="0" value={sets[id][n].reps ?? ''} onChange={(e) => put(id, n, 'reps', e.target.value)} aria-label={`Set ${n} ${progression && count === 'sec' ? 'seconds' : 'reps'}`} /><small>{progression && count === 'sec' ? 'sec' : 'reps'}</small></label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      <div className="detail-actions">
        <button className="edit-session primary" onClick={save}>Save</button>
        <button className="edit-session" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
