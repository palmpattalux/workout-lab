import { useState } from 'react'
import { Icon, WorkoutIcon, WorkoutMark, WORKOUT_ICONS, BODY_LETTERS } from '../components/icons'
import { addWorkout, updateWorkout, type Workout } from '../lib/store'

// The workout adding page, traced from the reference sketch.
// With `editing` it is the edit page for that workout, filled with what's saved.
export default function CreatePage({ icon: icon0, letter: letter0, editing, onClose }: { icon: string; letter: string; editing?: Workout; onClose: () => void }) {
  const [icon, setIcon] = useState(icon0)
  const [letter, setLetter] = useState(letter0)
  const [picking, setPicking] = useState(false)
  const [exercise, setExercise] = useState(editing?.exercise ?? '')
  const [equipment, setEquipment] = useState(editing?.equipment ?? '')
  const [mode, setMode] = useState<'equipment' | 'progression'>(editing?.mode ?? 'equipment')
  const [unit, setUnit] = useState<'kg' | 'lbs'>(editing?.unit ?? 'kg')
  const [focus, setFocus] = useState(editing?.focus ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')

  function save() {
    const fields = { icon, letter, exercise: exercise.trim(), equipment: equipment.trim(), mode, unit, focus: focus.trim(), notes: notes.trim() }
    if (editing) updateWorkout(editing.id, fields)
    else addWorkout(fields)
    onClose()
  }

  const isEquipment = mode === 'equipment'

  return (
    <main className="page scroll create" aria-label={editing ? 'Edit workout' : 'New workout'}>
      <header className="create-head">
        <h1>
          <button className="mark-btn" aria-label="Change icon and body part" aria-expanded={picking} onClick={() => setPicking(!picking)}>
            <WorkoutMark icon={icon} letter={letter} size="1em" />
            <svg className="caret" viewBox="0 0 24 24" style={{ strokeWidth: 2.4 }} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </h1>
        <button className="icon-btn" aria-label="Cancel" onClick={onClose}><Icon name="close" size="22px" /></button>
      </header>

      {picking && (
        <div className="mark-sheet">
          <h2>Icon</h2>
          <div className="mark-grid">
            {WORKOUT_ICONS.map((i) => (
              <button key={i.key} aria-label={i.name} aria-pressed={i.key === icon} className={i.key === icon ? 'on' : undefined} onClick={() => setIcon(i.key)}>
                <WorkoutIcon k={i.key} size="56%" strokeWidth={1.9} />
              </button>
            ))}
          </div>
          <h2>Body part</h2>
          <div className="mark-grid letters">
            {BODY_LETTERS.map((l) => (
              <button key={l.key} aria-label={l.name} aria-pressed={l.key === letter} className={l.key === letter ? 'on' : undefined} onClick={() => setLetter(l.key)}>
                {l.key}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form">
        <input id="exercise" className="field" placeholder="Exercise" value={exercise} onChange={(e) => setExercise(e.target.value)} />

        <div className="field-row">
          <input
            id="equipment"
            className="field"
            placeholder={isEquipment ? 'Equipment' : 'Progression'}
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
          <button
            className={`switch${isEquipment ? ' on' : ''}`}
            role="switch"
            aria-checked={isEquipment}
            aria-label={isEquipment ? 'Equipment (switch to progressions)' : 'Progressions (switch to equipment)'}
            onClick={() => setMode(isEquipment ? 'progression' : 'equipment')}
          >
            <span className="knob" />
          </button>
        </div>

        {isEquipment ? (
          <button className="unit" onClick={() => setUnit(unit === 'kg' ? 'lbs' : 'kg')} aria-label={`Unit: ${unit}, tap to switch`}>
            <span className={unit === 'kg' ? 'on' : ''}>kg</span> / <span className={unit === 'lbs' ? 'on' : ''}>lbs</span>
          </button>
        ) : (
          <p className="hint later">add later as you progress</p>
        )}

        <textarea id="focus" className="field box" placeholder="Specific focus" value={focus} onChange={(e) => setFocus(e.target.value)} />
        <p className="hint">Reminder in your next session</p>

        <textarea id="notes" className="field box" placeholder="General notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <p className="hint">Control your variables</p>
      </div>

      <button className="btn circle big save-new" aria-label="Save workout" onClick={save}>
        <Icon name="write" />
      </button>
    </main>
  )
}
