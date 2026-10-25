import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  // a new exercise starts with just the name, weight type and equipment; focus and notes come once it's named
  const [named, setNamed] = useState(!!editing)

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
                <WorkoutIcon k={i.key} size="56%" />
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
        <input id="exercise" className="field" placeholder={t('Exercise')} value={exercise} enterKeyHint="next" onChange={(e) => setExercise(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && exercise.trim()) { setNamed(true); document.getElementById('equipment')?.focus() } }}
          onBlur={() => { if (exercise.trim()) setNamed(true) }} />

        {/* weight type first, then the equipment it's for */}
        {isEquipment ? (
          <button className="unit" onClick={() => setUnit(unit === 'kg' ? 'lbs' : 'kg')} aria-label={`Unit: ${unit}, tap to switch`}>
            <span className={unit === 'kg' ? 'on' : ''}>kg</span> / <span className={unit === 'lbs' ? 'on' : ''}>lbs</span>
          </button>
        ) : (
          <button className="unit" onClick={() => setCount(count === 'reps' ? 'sec' : 'reps')} aria-label={`Counting ${count}, tap to switch`}>
            <span className={count === 'reps' ? 'on' : ''}>{t('reps')}</span> / <span className={count === 'sec' ? 'on' : ''}>{t('sec')}</span>
          </button>
        )}

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
        {!isEquipment && <p className="hint later">{t('add later as you progress')}</p>}

        {named && (
          <>
            <textarea id="focus" className="field area reveal" placeholder={t('Specific focus')} value={focus} onChange={(e) => setFocus(e.target.value)} />
            <p className="hint reveal">{t('Reminder in your next session')}</p>

            <textarea id="notes" className="field area quiet reveal" placeholder={t('General notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <p className="hint quiet reveal">{t('Control your variables')}</p>
          </>
        )}

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

      {!editing && <CreateTour named={named} progression={!isEquipment} />}

      <button className="btn circle big save-new" aria-label={t('Save workout')} onClick={save}>
        <Icon name="check" strokeWidth={2.2} />
      </button>
    </main>
  )
}

// First exercise ever: a short guided tour, one hint at a time, each pointing at its control.
// A hint moves on when that control is used, or with Next. Shown once per device.
const TOUR_KEY = 'dotset:create-tour'
type Step = { sel: string; text: string; sub?: string; above?: boolean }

function CreateTour({ named, progression }: { named: boolean; progression: boolean }) {
  const [step, setStep] = useState(() => { try { return localStorage.getItem(TOUR_KEY) ? -1 : 0 } catch { return 0 } })
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const steps: Step[] = [
    { sel: '#exercise', text: t('Name your exercise'), sub: t('e.g. Bench press') },
    { sel: '.create .unit', text: progression ? t('Tap to switch reps / seconds') : t('Tap to switch kg / lbs') },
    { sel: '.create .switch', text: t('Equipment or progressions'), sub: t('Tap to switch') },
    { sel: '.create .mark-btn', text: t('Tap to change the icon or colour') },
    { sel: '.save-new', text: t('Tap to save'), above: true },
  ]
  const cur = step >= 0 ? steps[step] : undefined

  function next() {
    if (step + 1 >= steps.length) { try { localStorage.setItem(TOUR_KEY, '1') } catch { /* private mode */ } setStep(-1) }
    else setStep(step + 1)
  }
  function skip() { try { localStorage.setItem(TOUR_KEY, '1') } catch { /* private mode */ } setStep(-1) }

  // the name hint is done once the exercise has a name
  useEffect(() => { if (step === 0 && named) setStep(1) }, [named, step])

  // using the pointed-at control moves the tour on
  useEffect(() => {
    if (!cur || step === 0) return
    const onClick = (e: MouseEvent) => { if ((e.target as Element).closest(cur.sel)) setTimeout(next, 250) }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  })

  // place the hint by its control, and light the control up
  useLayoutEffect(() => {
    if (!cur) return
    const el = document.querySelector(cur.sel)
    const main = ref.current?.parentElement
    if (!el || !main) return
    el.classList.add('tour-target')
    const place = () => {
      const r = el.getBoundingClientRect(), m = main.getBoundingClientRect()
      setBox({ left: r.left - m.left, top: r.top - m.top + main.scrollTop, width: r.width, height: r.height })
    }
    place()
    window.addEventListener('resize', place)
    return () => { el.classList.remove('tour-target'); window.removeEventListener('resize', place) }
  }, [step, named, progression])

  if (!cur) return null
  const center = box ? Math.min(Math.max(box.left + box.width / 2, 110), (ref.current?.parentElement?.clientWidth ?? 390) - 110) : 0
  return (
    <div ref={ref} className="tour-layer">
      {box && (
        <div key={step} className={`tour-tip${cur.above ? ' above' : ''}`} role="status"
          style={{ left: center, top: cur.above ? box.top - 14 : box.top + box.height + 14, ['--arrow' as string]: `${box.left + box.width / 2 - center}px` }}>
          <b>{cur.text}</b>
          {cur.sub && <small>{cur.sub}</small>}
          <span className="tour-actions">
            <span className="tour-count">{step + 1}/{steps.length}</span>
            {step < steps.length - 1 && <button onClick={skip}>{t('Skip')}</button>}
            <button className="on" onClick={next}>{step < steps.length - 1 ? t('Next') : t('Got it')}</button>
          </span>
        </div>
      )}
    </div>
  )
}
