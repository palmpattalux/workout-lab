import { useRef, useState, type PointerEvent } from 'react'
import { Icon, WorkoutIcon, WorkoutMark, WORKOUT_ICONS, BODY_LETTERS } from '../components/icons'
import HoldPicker from '../components/HoldPicker'
import { updateWorkout, type Workout } from '../lib/store'
import { sound } from '../lib/sound'
import { usePrefs, setPrefs } from '../lib/prefs'
import { usePreview, getPreview } from '../lib/theme'
import SakuraScene from '../components/SakuraScene'

// Exercise dot positions, as % of the screen: low and toward the right, in easy reach of a
// right thumb. The first four are always shown; the rest fill in as more workouts exist.
const SLOTS = [
  { left: 58, top: 57 },
  { left: 82, top: 55 },
  { left: 40, top: 70 },
  { left: 63, top: 72 },
  { left: 85, top: 72.5 },
  { left: 34, top: 55.5 },
  { left: 43, top: 86 },
  { left: 65, top: 88 },
]

// Each workout keeps the slot it was dragged to; the rest fill free slots in order.
function placeAll(workouts: Workout[]) {
  const taken = new Map<number, Workout>()
  for (const w of workouts) if (w.slot !== undefined && w.slot < SLOTS.length && !taken.has(w.slot)) taken.set(w.slot, w)
  const placed = new Set(taken.values())
  let free = 0
  for (const w of workouts) {
    if (placed.has(w)) continue
    while (free < SLOTS.length && taken.has(free)) free++
    if (free >= SLOTS.length) break
    taken.set(free, w)
  }
  return taken
}

const iconOptions = WORKOUT_ICONS.map((i) => ({ key: i.key, label: i.name, node: <WorkoutIcon k={i.key} size="24px" strokeWidth={2} /> }))
const letterOptions = BODY_LETTERS.map((l) => ({ key: l.key, label: l.name, node: <b className="letter">{l.key}</b> }))

export default function PageA({ workouts, onOpenDot, onEdit, onOpenBook, onThemes, onCreate }: {
  workouts: Workout[]
  onOpenDot: (id: string) => void
  onEdit: (id: string) => void
  onOpenBook: () => void
  onThemes: () => void
  onCreate: (icon: string, letter: string) => void
}) {
  // "+" flow: first drag up picks the workout icon, second drag up picks the body-part letter.
  const [pickedIcon, setPickedIcon] = useState<string | null>(null)
  // First tap on a workout dot arms it: it turns into a glowing fingerprint (tap again to start)
  // and a pen (edit) appears above it.
  const [chosen, setChosen] = useState<string | null>(null)
  const bySlot = placeAll(workouts)
  const slotOf = new Map([...bySlot].map(([i, w]) => [w.id, i]))

  // Dragging a dot: it follows the finger, then glides into the nearest slot (swapping with whoever is there).
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const press = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null)
  const nearest = useRef<number | null>(null)
  const justDragged = useRef(false)

  function pagePoint(e: PointerEvent<HTMLElement>) {
    const r = (e.currentTarget.offsetParent as HTMLElement).getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }
  }
  function onDotDown(e: PointerEvent<HTMLButtonElement>, id: string) {
    if (getPreview()) return // previewing a theme: dots can be opened, not moved
    press.current = { id, x: e.clientX, y: e.clientY, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onDotMove(e: PointerEvent<HTMLButtonElement>) {
    const p = press.current
    if (!p) return
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) return
    if (!p.moved) { p.moved = true; nearest.current = slotOf.get(p.id) ?? null; sound.pop() }
    const pt = pagePoint(e)
    setDrag({ id: p.id, x: pt.x, y: pt.y })
    const n = closest(pt)
    if (n !== nearest.current) { nearest.current = n; sound.tick() }
  }
  function closest(pt: { x: number; y: number; w: number; h: number }) {
    let best = 0, bestD = Infinity
    SLOTS.forEach((s, i) => {
      const d = Math.hypot(pt.x - (s.left / 100) * pt.w, pt.y - (s.top / 100) * pt.h)
      if (d < bestD) { bestD = d; best = i }
    })
    return best
  }
  function onDotUp(e: PointerEvent<HTMLButtonElement>) {
    const p = press.current
    press.current = null
    if (!p?.moved) return
    justDragged.current = true
    const to = closest(pagePoint(e))
    const from = slotOf.get(p.id)
    const other = bySlot.get(to)
    // pin every dot to where it is now so nothing else shifts, then move/swap the two
    workouts.forEach((w) => { const s = slotOf.get(w.id); if (s !== undefined && w.slot !== s) updateWorkout(w.id, { slot: s }) })
    if (other && other.id !== p.id && from !== undefined) updateWorkout(other.id, { slot: from })
    updateWorkout(p.id, { slot: to })
    setDrag(null)
    sound.tap()
  }
  const [settingsOpen, setSettingsOpen] = useState(false)
  const lastTap = useRef(0)
  // While an icon is picked, a double tap on "+" or a press anywhere else means "never mind".
  function tapAdd() {
    const now = Date.now()
    if (pickedIcon && now - lastTap.current < 400) setPickedIcon(null)
    lastTap.current = now
  }
  const prefs = usePrefs()
  const skin = usePreview()

  return (
    <main className="page" aria-label="Page A"
      onPointerDownCapture={(e) => { if (pickedIcon && !(e.target as Element).closest('.add')) setPickedIcon(null) }}
      onClick={(e) => { if (e.target === e.currentTarget) { setChosen(null); setSettingsOpen(false) } }}>
      {skin === 'sakura' && <SakuraScene />}
      <button className="btn pill" id="a2" aria-label="Book (A2)" onClick={onOpenBook}>
        <Icon name="book" size="46%" />
      </button>

      {/* empty slots: the first four always, every one while dragging */}
      {SLOTS.map((s, i) => (bySlot.has(i) || (i >= 4 && !drag)) ? null : (
        <span key={'slot' + i} className={`btn circle dot empty${drag && nearest.current === i ? ' target' : ''}`}
          style={{ left: `${s.left}%`, top: `${s.top}%` }} aria-hidden="true" />
      ))}

      {[...bySlot].map(([i, w]) => {
        const s = SLOTS[i]
        const dragging = drag?.id === w.id
        const armed = chosen === w.id && !dragging
        return (
          <button
            key={w.id}
            className={`btn circle dot filled float${armed ? ' armed' : ''}${dragging ? ' dragging' : ''}`}
            style={{ left: dragging ? drag.x : `${s.left}%`, top: dragging ? drag.y : `${s.top}%`, animationDelay: armed ? undefined : `${-i * 0.7}s` }}
            aria-label={`${w.exercise || 'Workout'} ${w.letter}, drag to move`}
            onPointerDown={(e) => onDotDown(e, w.id)}
            onPointerMove={onDotMove}
            onPointerUp={onDotUp}
            onPointerCancel={() => { press.current = null; setDrag(null) }}
            onClick={() => { if (justDragged.current) { justDragged.current = false; return } if (chosen === w.id) onOpenDot(w.id); else setChosen(w.id) }}
          >
            {armed
              ? <Icon name="play" size="38%" strokeWidth={2} />
              : <WorkoutMark icon={w.icon} letter={w.letter} size="1.15em" />}
          </button>
        )
      })}

      {chosen !== null && !drag && slotOf.has(chosen) && (
        <>
        <span className="dot-name" style={{ right: `calc(${100 - SLOTS[slotOf.get(chosen)!].left}% + min(13cqw, 7.4cqh) / 2 + 8px)`, top: `calc(${SLOTS[slotOf.get(chosen)!].top}% - min(18.7cqw, 10.6cqh) / 2 - 34px)` }}>
          {bySlot.get(slotOf.get(chosen)!)!.exercise || 'Untitled'}
        </span>
        <button
          className="btn circle choice"
          style={{ left: `${SLOTS[slotOf.get(chosen)!].left}%`, top: `calc(${SLOTS[slotOf.get(chosen)!].top}% - min(18.7cqw, 10.6cqh) / 2 - 34px)` }}
          aria-label="Edit workout"
          onClick={() => onEdit(chosen)}
        >
          <Icon name="write" size="48%" />
        </button>
        </>
      )}

      {pickedIcon === null ? (
        <HoldPicker
          options={iconOptions}
          maxStep={40}
          instant
          onPick={(i) => setPickedIcon(iconOptions[i].key)}
          className="dot add float"
          style={{ left: '20%', top: '87%' }}
          ariaLabel="Add workout, drag up to pick an icon"
        >
          <Icon name="plus" strokeWidth={2.6} />
        </HoldPicker>
      ) : (
        <HoldPicker
          options={letterOptions}
          maxStep={40}
          instant
          onTap={tapAdd}
          onPick={(i) => { const icon = pickedIcon; setPickedIcon(null); onCreate(icon, letterOptions[i].key) }}
          className="dot add float in-progress"
          style={{ left: '20%', top: '87%' }}
          ariaLabel="Adding workout, drag up to pick a body part, double tap to cancel"
        >
          <WorkoutIcon k={pickedIcon} size="40%" />
          <span className="badge" aria-hidden="true">?</span>
        </HoldPicker>
      )}

      {settingsOpen && (
        <div className="settings" role="dialog" aria-label="Settings">
          <h2>Appearance</h2>
          <div className="seg" role="radiogroup" aria-label="Theme">
            {(['light', 'dark', 'auto'] as const).map((t) => (
              <button key={t} role="radio" aria-checked={prefs.theme === t} className={prefs.theme === t ? 'on' : undefined}
                onClick={() => setPrefs({ theme: t })}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          <div className="set-row">
            <span>Sounds</span>
            <button className={`switch${prefs.sound ? ' on' : ''}`} role="switch" aria-checked={prefs.sound} aria-label="Sounds"
              onClick={() => setPrefs({ sound: !prefs.sound })}>
              <span className="knob" />
            </button>
          </div>
          <button className="set-row themes-link" onClick={onThemes}>
            <span>Themes</span>
            <span className="chev"><Icon name="back" size="18px" /></span>
          </button>
        </div>
      )}

      <button className={`btn circle mid gear${settingsOpen ? ' open' : ''}`} style={{ left: '86%', top: '90%' }}
        aria-label="Settings (A1)" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>
        <Icon name="gear" size="44%" />
      </button>
    </main>
  )
}
