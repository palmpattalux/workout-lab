import { useEffect, useState } from 'react'
import { Icon, WorkoutMark } from '../components/icons'
import { useNotes, useSessions, updateNote, deleteNote, getNotes, type Workout } from '../lib/store'
import { day, time } from '../lib/format'
import { t } from '../lib/i18n'

// One note, plain and quick: a star, where it was taken, and the text. Saves as you type;
// a note left empty is thrown away when you leave.
export default function NotePage({ id, workouts }: { id: string; workouts: Workout[] }) {
  const note = useNotes().find((n) => n.id === id)
  const sessions = useSessions()
  const [removing, setRemoving] = useState(false)

  useEffect(() => () => { const n = getNotes().find((x) => x.id === id); if (n && !n.text.trim()) deleteNote(id) }, [id])

  if (!note) {
    return (
      <main className="page scroll note-page" aria-label={t('Note')}>
        <header className="create-head">
          <h1>{t('Note')}</h1>
          <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
        </header>
        <p className="empty-note">{t('This note was removed.')}</p>
      </main>
    )
  }
  const w = note.workoutId ? workouts.find((x) => x.id === note.workoutId) : undefined
  const s = note.sessionId ? sessions.find((x) => x.id === note.sessionId) : undefined

  return (
    <main className="page scroll note-page" aria-label={t('Note')}>
      <header className="create-head">
        <h1 className="note-when">{day(note.createdAt)}<small>{time(note.createdAt)}</small></h1>
        <div className="note-actions">
          <button className={`icon-btn star${note.star ? ' on' : ''}`} aria-pressed={!!note.star} aria-label={t('Favourite')} onClick={() => updateNote(id, { star: !note.star })}>
            <Icon name="star" size="22px" strokeWidth={2} />
          </button>
          <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
        </div>
      </header>
      {(w || note.sessionId) && (
        <p className="note-context">
          {w && <span><WorkoutMark icon={w.icon} letter={w.letter} size="1em" /> {w.exercise || t('Untitled')}</span>}
          {note.sessionId && <span className="muted">{s ? t('Session · {day}', { day: day(s.startedAt) }) : t('During a session')}</span>}
        </p>
      )}
      <textarea className="note-text" autoFocus={!note.text} placeholder={t('Write a note… (please no medical details)')} value={note.text}
        onChange={(e) => updateNote(id, { text: e.target.value })} />
      {note.text.trim() && <button className="remove note-remove" onClick={() => setRemoving(true)}>{t('Remove note')}</button>}
      {removing && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setRemoving(false) }}>
          <div className="confirm" role="alertdialog" aria-label={t('Remove note?')}>
            <p>{t('Remove note?')}</p>
            <div>
              <button onClick={() => setRemoving(false)}>{t('No')}</button>
              <button className="yes danger" onClick={() => { deleteNote(id); setRemoving(false); history.back() }}>{t('Yes')}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

// A note in a list: first line as its title, when, a star you can tap.
export function NoteRow({ note, workouts, onOpen }: { note: ReturnType<typeof getNotes>[number]; workouts: Workout[]; onOpen: () => void }) {
  const [first, ...rest] = note.text.trim().split('\n')
  const w = note.workoutId ? workouts.find((x) => x.id === note.workoutId) : undefined
  return (
    <li className="note-row">
      <button className="note-open" onClick={onOpen}>
        <b>{first}</b>
        {rest.join(' ').trim() && <span className="note-more">{rest.join(' ').trim()}</span>}
        <small>{w && <WorkoutMark icon={w.icon} letter={w.letter} size="1em" />}{day(note.createdAt)} · {time(note.createdAt)}</small>
      </button>
      <button className={`icon-btn star${note.star ? ' on' : ''}`} aria-pressed={!!note.star} aria-label={t('Favourite')} onClick={() => updateNote(note.id, { star: !note.star })}>
        <Icon name="star" size="20px" strokeWidth={2} />
      </button>
    </li>
  )
}
