import { Icon, WorkoutMark } from '../components/icons'
import { useSessions, usePresets, deletePreset, useNotes, addNote, type Workout, type Preset } from '../lib/store'
import { NoteRow } from './NotePage'
import { useState } from 'react'
import { usePlan, atLeast, showLocked } from '../lib/plan'
import { useNewWeek } from '../lib/week'
import { LockBadge } from '../components/LockNote'
import { day, time, setLines } from '../lib/format'
import SessionsList from './SessionsPage'
import { supabase, signOut } from '../lib/auth'
import { t, locale } from '../lib/i18n'

// A2 book: three tabs. Exercises: one box per workout, tap for its notes, details and
// past sessions. Sessions: every session, newest first. Presets (Exclusive): one row
// per preset, tap for only the sessions done from it. Notes: every note, newest first.
// "This week" (Exclusive) opens the weekly summary.
type View = 'exercises' | 'sessions' | 'presets' | 'notes'
export default function BookPage({ workouts, view, openId, presetId, onOpen, onOpenPreset, onView }: {
  workouts: Workout[]
  view: View
  openId: string | null
  presetId: string | null
  onOpen: (id: string) => void
  onOpenPreset: (id: string) => void
  onView: (v: View) => void
}) {
  const open = openId ? workouts.find((w) => w.id === openId) : null
  const presets = usePresets()
  const canPreset = atLeast(usePlan(), 'exclusive')
  const newWeek = useNewWeek()
  const preset = presetId && canPreset ? presets.find((p) => p.id === presetId) ?? null : null

  return (
    <main className="page scroll book" aria-label={t('Book')}>
      <header className="create-head">
        <h1>{open ? <WorkoutMark icon={open.icon} letter={open.letter} /> : preset ? <span className="preset-title">{preset.name}</span> : <Icon name="book" size="1em" strokeWidth={2} />}</h1>
        {!open && !preset && (
          <button className={`week-link${canPreset ? '' : ' locked'}`}
            onClick={() => { if (canPreset) location.hash = 'week'; else showLocked(t('The weekly summary is an Exclusive feature'), 'exclusive') }}>
            {!canPreset && <LockBadge />}{t('This week')}
            {newWeek && <span className="new-dot" aria-label={t('New summary')} />}
          </button>
        )}
        <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>

      {!open && !preset && (
        <div className="book-tabs" role="tablist">
          <button role="tab" aria-selected={view === 'exercises'} className={view === 'exercises' ? 'on' : undefined} onClick={() => onView('exercises')}>{t('Exercises')}</button>
          <button role="tab" aria-selected={view === 'sessions'} className={view === 'sessions' ? 'on' : undefined} onClick={() => onView('sessions')}>{t('Sessions')}</button>
          <button role="tab" aria-selected={view === 'presets'} className={`${view === 'presets' ? 'on' : ''}${canPreset ? '' : ' locked'}`}
            onClick={() => { if (canPreset) onView('presets'); else showLocked(t('Presets are an Exclusive feature'), 'exclusive') }}>
            {!canPreset && <LockBadge />}{t('Presets')}
          </button>
          <button role="tab" aria-selected={view === 'notes'} className={view === 'notes' ? 'on' : undefined} onClick={() => onView('notes')}>{t('Notes')}</button>
        </div>
      )}

      {!open && !preset && supabase && (
        <button className="logout" onClick={() => { signOut(); location.replace('#') }}>{t('Log out')}</button>
      )}

      {open ? <Detail w={open} /> : preset ? <PresetDetail p={preset} workouts={workouts} /> : view === 'sessions' ? <SessionsList workouts={workouts} />
        : view === 'notes' ? <NotesList workouts={workouts} />
        : view === 'presets' && canPreset ? (presets.length === 0
          ? <p className="empty-note">{t('No presets yet. Tap the list button on the first page to make one.')}</p>
          : <div className="boxes">{presets.map((p) => <PresetBox key={p.id} p={p} workouts={workouts} onOpen={() => onOpenPreset(p.id)} />)}</div>)
        : workouts.length === 0 ? (
        <p className="empty-note">{t('No workouts yet. Hold the + on the first page to make one.')}</p>
      ) : (
        <div className="boxes">
          {workouts.map((w) => (
            <button key={w.id} className="box" onClick={() => onOpen(w.id)}>
              <WorkoutMark icon={w.icon} letter={w.letter} size="1.3em" />
              <span className="box-name">{w.exercise || t('Untitled')}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}

// Book > Notes: newest first (sorting comes later), with a quick way to start one.
function NotesList({ workouts }: { workouts: Workout[] }) {
  const notes = useNotes().filter((n) => n.text.trim())
  return (
    <div className="notes-list">
      <button className="new-note" onClick={() => { location.hash = 'note-' + addNote().id }}><Icon name="plus" size="16px" strokeWidth={2.4} />{t('New note')}</button>
      {notes.length === 0 ? <p className="empty-note">{t('No notes yet. Tap Notes on an exercise during a session, or start one here.')}</p> : (
        <ul>{[...notes].reverse().map((n) => <NoteRow key={n.id} note={n} workouts={workouts} onOpen={() => { location.hash = 'note-' + n.id }} />)}</ul>
      )}
    </div>
  )
}

// One preset in the list: its name, how many sessions, and its exercises in order.
function PresetBox({ p, workouts, onOpen }: { p: Preset; workouts: Workout[]; onOpen: () => void }) {
  const n = useSessions().filter((s) => s.preset === p.id).length
  return (
    <button className="box preset-box" onClick={onOpen}>
      <span className="box-name">{p.name}</span>
      <small className="muted">{n === 1 ? t('1 session') : t('{n} sessions', { n })}</small>
      <PresetOrder p={p} workouts={workouts} />
    </button>
  )
}
function PresetOrder({ p, workouts }: { p: Preset; workouts: Workout[] }) {
  return (
    <span className="preset-order">
      {p.items.map((id, i) => {
        const w = workouts.find((x) => x.id === id)
        return w ? <span key={id}><i>{i + 1}</i><WorkoutMark icon={w.icon} letter={w.letter} size="1em" /></span> : null
      })}
    </span>
  )
}

// A preset opened from the book: its order, then only the sessions done from it.
function PresetDetail({ p, workouts }: { p: Preset; workouts: Workout[] }) {
  const [removing, setRemoving] = useState(false)
  return (
    <div className="preset-detail">
      <PresetOrder p={p} workouts={workouts} />
      <SessionsList workouts={workouts} only={p.id} />
      <button className="remove" onClick={() => setRemoving(true)}>{t('Remove preset')}</button>
      {removing && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setRemoving(false) }}>
          <div className="confirm" role="alertdialog" aria-label={t('Remove preset?')}>
            <p>{t('Remove preset?')}</p>
            <div>
              <button onClick={() => setRemoving(false)}>{t('No')}</button>
              <button className="yes danger" onClick={() => { deletePreset(p.id); setRemoving(false); history.back() }}>{t('Yes')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ w }: { w: Workout }) {
  const sessions = useSessions()
  const past = sessions.filter((s) => s.order.includes(w.id)).reverse()
  const rows: [string, string][] = [
    [t('Exercise'), w.exercise],
    [w.mode === 'equipment' ? t('Equipment') : t('Progression'), w.equipment],
    [t('Type'), w.mode === 'equipment' ? t('Equipment, {unit}', { unit: w.unit }) : t('Progressions')],
    [t('Specific focus'), w.focus],
  ]
  return (
    <div className="detail">
      <section className="notes">
        <h2>{t('General notes')}</h2>
        <p>{w.notes || t('No notes yet.')}</p>
      </section>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>
        ))}
        <div><dt>{t('Created')}</dt><dd>{new Date(w.createdAt).toLocaleDateString(locale())}</dd></div>
      </dl>
      <section className="past">
        <h2>{t('Past sessions')}</h2>
        {past.length === 0 ? <p className="muted">{t('No finished sessions with this exercise yet.')}</p> : past.map((s) => {
          const lines = setLines(s, w.id, w)
          const move = s.snap?.[w.id]?.move
          return (
            <div key={s.id} className="past-row">
              <p className="past-when">{day(s.startedAt)} <small>{time(s.startedAt)}</small></p>
              {move && <p className="muted">{t('Progression: {move}', { move })}</p>}
              {lines.length === 0 ? <p className="muted">{t('Nothing recorded')}</p> : (
                <ul>{lines.map((l) => <li key={l.set}><span>{t('Set {n}', { n: l.set })}</span>{l.text}</li>)}</ul>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
