import { useState } from 'react'
import { Icon, WorkoutIcon, WorkoutMark, packIcons, packLetters } from '../components/icons'
import { useIconPack } from '../lib/iconpack'
import { addWorkout, updateWorkout, deleteWorkout, TINTS, type Workout } from '../lib/store'
import { t } from '../lib/i18n'

// The workout adding page, traced from the reference sketch.
// With `editing` it is the edit page for that workout, filled with what's saved.
export default function CreatePage({ icon: icon0, letter: letter0, editing, onClose }: { icon: string; letter: string; editing?: Workout; onClose: () => void }) {
  const pack = useIconPack()
  const [icon, setIcon] = useState(icon0)
  const [letter, setLetter] = useState(letter0)
  const [picking, setPicking] = useState(false)
  const [color, setColor] = useState(editing?.color ?? '')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [exercise, setExercise] = useState(editing?.exercise ?? '')
  const [equipment, setEquipment] = useState(editing?.equipment ?? '')
  const [mode, setMode] = useState<'equipment' | 'progression'>(editing?.mode ?? 'equipment')
  const [unit, setUnit] = useState<'kg' | 'lbs'>(editing?.unit ?? 'kg')
  const [count, setCount] = useState<'reps' | 'sec'>(editing?.count ?? 'reps')
  const [focus, setFocus] = useState(editing?.focus ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')

  function save() {
    const fields = { icon, letter, color: color || undefined, exercise: exercise.trim(), equipment: equipment.trim(), mode, unit, count, focus: focus.trim(), notes: notes.trim() }
    if (editing) updateWorkout(editing.id, fields)
    else addWorkout(fields)
    onClose()
  }

  const isEquipment = mode === 'equipment'

  return (
    <main className="page scroll create" aria-label={editing ? t('Edit workout') : t('New workout')}>
      <header className="create-head">
        <h1>
          <button className="mark-btn" aria-label={t('Change icon and body part')} aria-expanded={picking} onClick={() => setPicking(!picking)}>
            <span className={color ? 'tinted tint-' + color : undefined}><WorkoutMark icon={icon} letter={letter} size="1em" /></span>
            <svg className="caret" viewBox="0 0 24 24" style={{ strokeWidth: 2.4 }} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </h1>
        <button className="icon-btn" aria-label={t('Cancel')} onClick={onClose}><Icon name="close" size="22px" /></button>
      </header>

      {picking && (
        <div className="mark-sheet">
          <h2>{t('Icon')}</h2>
          <div className="mark-grid">
            {packIcons(pack).map((i) => (
              <button key={i.key} aria-label={t(i.name)} aria-pressed={i.key === icon} className={i.key === icon ? 'on' : undefined} onClick={() => setIcon(i.key)}>
                <WorkoutIcon k={i.key} size="56%" strokeWidth={1.9} />
              </button>
            ))}
          </div>
          <h2>{t('Colour')}</h2>
          <div className="tint-row">
            {['', ...TINTS].map((k) => (
              <button key={k || 'none'} className={`tint-dot${k ? ' tint-' + k : ' none'}${k === color ? ' on' : ''}`} aria-label={k ? t(k[0].toUpperCase() + k.slice(1)) : t('No colour')} aria-pressed={k === color} onClick={() => setColor(k)} />
            ))}
          </div>
          <h2>{pack === 'tokyo' ? t('Letter') : t('Body part')}</h2>
          <div className={`mark-grid letters${pack === 'tokyo' ? ' five' : ''}`}>
            {packLetters(pack).map((l) => (
              <button key={l.key} aria-label={l.name} aria-pressed={l.key === letter} className={l.key === letter ? 'on' : undefined} onClick={() => setLetter(l.key)}>
                {l.key}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form">
        <input id="exercise" className="field" placeholder={t('Exercise')} value={exercise} onChange={(e) => setExercise(e.target.value)} />

        <div className="field-row">
          <input
            id="equipment"
            className="field"
            placeholder={isEquipment ? t('Equipment') : t('Progression')}
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
          <>
            <button className="unit" onClick={() => setCount(count === 'reps' ? 'sec' : 'reps')} aria-label={`Counting ${count}, tap to switch`}>
              <span className={count === 'reps' ? 'on' : ''}>{t('reps')}</span> / <span className={count === 'sec' ? 'on' : ''}>{t('sec')}</span>
            </button>
            <p className="hint later">{t('add later as you progress')}</p>
          </>
        )}

        <textarea id="focus" className="field area" placeholder={t('Specific focus')} value={focus} onChange={(e) => setFocus(e.target.value)} />
        <p className="hint">{t('Reminder in your next session')}</p>

        <textarea id="notes" className="field area quiet" placeholder={t('General notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <p className="hint quiet">{t('Control your variables')}</p>

        {editing && <button className="remove" onClick={() => setConfirmRemove(true)}>{t('Remove exercise')}</button>}
      </div>

      {confirmRemove && editing && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setConfirmRemove(false) }}>
          <div className="confirm" role="alertdialog" aria-label={t('Remove exercise?')}>
            <p>{t('Remove exercise?')}</p>
            <div>
              <button onClick={() => setConfirmRemove(false)}>{t('No')}</button>
              <button className="yes danger" onClick={() => { deleteWorkout(editing.id); onClose() }}>{t('Yes')}</button>
            </div>
          </div>
        </div>
      )}

      <button className="btn circle big save-new" aria-label={t('Save workout')} onClick={save}>
        <Icon name="check" strokeWidth={2.2} />
      </button>
    </main>
  )
}
