import { Icon, WorkoutMark, WORKOUT_ICONS, BODY_LETTERS } from '../components/icons'
import { useSessions, type Workout } from '../lib/store'
import { day, time, setLines } from '../lib/format'
import SessionsList from './SessionsPage'
import { supabase, signOut } from '../lib/auth'

// A2 book: two tabs. Exercises: one box per workout, tap for its notes, details and
// past sessions. Sessions: every session, newest first.
export default function BookPage({ workouts, view, openId, onOpen, onView }: {
  workouts: Workout[]
  view: 'exercises' | 'sessions'
  openId: string | null
  onOpen: (id: string) => void
  onView: (v: 'exercises' | 'sessions') => void
}) {
  const open = openId ? workouts.find((w) => w.id === openId) : null

  return (
    <main className="page scroll book" aria-label="Book">
      <header className="create-head">
        <h1>{open ? <WorkoutMark icon={open.icon} letter={open.letter} /> : <Icon name="book" size="1em" strokeWidth={2} />}</h1>
        <button className="icon-btn" aria-label="Back" onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>

      {!open && (
        <div className="book-tabs" role="tablist">
          <button role="tab" aria-selected={view === 'exercises'} className={view === 'exercises' ? 'on' : undefined} onClick={() => onView('exercises')}>Exercises</button>
          <button role="tab" aria-selected={view === 'sessions'} className={view === 'sessions' ? 'on' : undefined} onClick={() => onView('sessions')}>Sessions</button>
        </div>
      )}

      {!open && supabase && (
        <button className="logout" onClick={() => signOut()}>Log out</button>
      )}

      {open ? <Detail w={open} /> : view === 'sessions' ? <SessionsList workouts={workouts} /> : workouts.length === 0 ? (
        <p className="empty-note">No workouts yet. Hold the + on the first page to make one.</p>
      ) : (
        <div className="boxes">
          {workouts.map((w) => (
            <button key={w.id} className="box" onClick={() => onOpen(w.id)}>
              <WorkoutMark icon={w.icon} letter={w.letter} size="1.3em" />
              <span className="box-name">{w.exercise || 'Untitled'}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}

function Detail({ w }: { w: Workout }) {
  const sessions = useSessions()
  const past = sessions.filter((s) => s.order.includes(w.id)).reverse()
  const iconName = WORKOUT_ICONS.find((i) => i.key === w.icon)?.name
  const part = BODY_LETTERS.find((l) => l.key === w.letter)?.name
  const rows: [string, string][] = [
    ['Exercise', w.exercise],
    [w.mode === 'equipment' ? 'Equipment' : 'Progression', w.equipment],
    ['Type', w.mode === 'equipment' ? `Equipment, ${w.unit}` : 'Progressions'],
    ['Icon', [iconName, part].filter(Boolean).join(', ')],
    ['Specific focus', w.focus],
  ]
  return (
    <div className="detail">
      <section className="notes">
        <h2>General notes</h2>
        <p>{w.notes || 'No notes yet.'}</p>
      </section>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>
        ))}
        <div><dt>Created</dt><dd>{new Date(w.createdAt).toLocaleDateString()}</dd></div>
      </dl>
      <section className="past">
        <h2>Past sessions</h2>
        {past.length === 0 ? <p className="muted">No finished sessions with this exercise yet.</p> : past.map((s) => {
          const lines = setLines(s, w.id, w)
          const move = s.snap?.[w.id]?.move
          return (
            <div key={s.id} className="past-row">
              <p className="past-when">{day(s.startedAt)} <small>{time(s.startedAt)}</small></p>
              {move && <p className="muted">Progression: {move}</p>}
              {lines.length === 0 ? <p className="muted">Nothing recorded</p> : (
                <ul>{lines.map((l) => <li key={l.set}><span>Set {l.set}</span>{l.text}</li>)}</ul>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
