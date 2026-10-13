import { useState } from 'react'
import { Icon, WorkoutMark } from '../components/icons'
import { addWorkout, updateWorkout, type Workout } from '../lib/store'

// The workout adding page, traced from the reference sketch.
// With `editing` it is the edit page for that workout, filled with what's saved.
export default function CreatePage({ icon, letter, editing, onClose }: { icon: string; letter: string; editing?: Workout; onClose: () => void }) {
  const [exercise, setExercise] = useState(editing?.exercise ?? '')
  const [equipment, setEquipment] = useState(editing?.equipment ?? '')
  const [mode, setMode] = useState<'equipment' | 'progression'>(editing?.mode ?? 'equipment')
  const [unit, setUnit] = useState<'kg' | 'lbs'>(editing?.unit ?? 'kg')
  const [focus, setFocus] = useState(editing?.focus ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')

  function save() {
    const fields = { exercise: exercise.trim(), equipment: equipment.trim(), mode, unit, focus: focus.trim(), notes: notes.trim() }
    if (editing) updateWorkout(editing.id, fields)
    else addWorkout({ icon, letter, ...fields })
    onClose()
  }

  const isEquipment = mode === 'equipment'

  return (
    <main className="page scroll create" aria-label={editing ? 'Edit workout' : 'New workout'}>
      <header className="create-head">
        <h1><WorkoutMark icon={icon} letter={letter} size="1em" /></h1>
        <button className="icon-btn" aria-label="Cancel" onClick={onClose}><Icon name="close" size="22px" /></button>
      </header>

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
