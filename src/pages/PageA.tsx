import { useRef, useState } from 'react'
import { Icon, WorkoutIcon, WorkoutMark, WORKOUT_ICONS, BODY_LETTERS } from '../components/icons'
import HoldPicker from '../components/HoldPicker'
import type { Workout } from '../lib/store'
import { usePrefs, setPrefs } from '../lib/prefs'

// Exercise dot positions, as % of the screen. The first four are traced from
// sketch A; the rest fill open space once more than four workouts exist.
const SLOTS = [
  { left: 54.9, top: 42.8 },
  { left: 78.5, top: 40.1 },
  { left: 36.6, top: 53.0 },
  { left: 24.6, top: 66.7 },
  { left: 78.5, top: 28.0 },
  { left: 56.0, top: 59.5 },
  { left: 52.0, top: 76.0 },
  { left: 85.0, top: 87.0 },
]

const iconOptions = WORKOUT_ICONS.map((i) => ({ key: i.key, label: i.name, node: <WorkoutIcon k={i.key} size="24px" strokeWidth={2} /> }))
const letterOptions = BODY_LETTERS.map((l) => ({ key: l.key, label: l.name, node: <b className="letter">{l.key}</b> }))

export default function PageA({ workouts, onOpenDot, onEdit, onOpenBook, onCreate }: {
  workouts: Workout[]
  onOpenDot: (id: string) => void
  onEdit: (id: string) => void
  onOpenBook: () => void
  onCreate: (icon: string, letter: string) => void
}) {
  // "+" flow: first drag up picks the workout icon, second drag up picks the body-part letter.
  const [pickedIcon, setPickedIcon] = useState<string | null>(null)
  // First tap on a workout dot arms it: it turns into a glowing fingerprint (tap again to start)
  // and a pen (edit) appears above it.
  const [chosen, setChosen] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const lastTap = useRef(0)
  // While an icon is picked, a double tap on "+" or a press anywhere else means "never mind".
  function tapAdd() {
    const now = Date.now()
    if (pickedIcon && now - lastTap.current < 400) setPickedIcon(null)
    lastTap.current = now
  }
  const prefs = usePrefs()

  return (
    <main className="page" aria-label="Page A"
      onPointerDownCapture={(e) => { if (pickedIcon && !(e.target as Element).closest('.add')) setPickedIcon(null) }}
      onClick={(e) => { if (e.target === e.currentTarget) { setChosen(null); setSettingsOpen(false) } }}>
      <button className="btn pill" id="a2" aria-label="Book (A2)" onClick={onOpenBook}>
        <Icon name="book" size="46%" />
      </button>

      {SLOTS.map((s, i) => {
        const w = workouts[i]
        if (!w && i >= 4) return null
        return (
          <button
            key={w?.id ?? 'slot' + i}
            className={`btn circle dot${w ? ' filled' : ' empty'}${chosen === i ? ' armed' : ''}`}
            style={{ left: `${s.left}%`, top: `${s.top}%` }}
            aria-label={w ? `${w.exercise || 'Workout'} ${w.letter}` : `Exercise ${i + 1}`}
            onClick={() => { if (!w) return; if (chosen === i) onOpenDot(w.id); else setChosen(i) }}
          >
            {w && (chosen === i
              ? <Icon name="fingerprint" size="52%" strokeWidth={1.9} />
              : <WorkoutMark icon={w.icon} letter={w.letter} size="1.15em" />)}
          </button>
        )
      })}

      {chosen !== null && workouts[chosen] && (
        <>
          <button
            className="btn circle choice"
            style={{ left: `${SLOTS[chosen].left}%`, top: `calc(${SLOTS[chosen].top}% - min(18.7cqw, 10.6cqh) / 2 - 34px)` }}
            aria-label="Edit workout"
            onClick={() => onEdit(workouts[chosen].id)}
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
          className="dot add"
          style={{ left: '26.9%', top: '80.1%' }}
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
          className="dot add in-progress"
          style={{ left: '26.9%', top: '80.1%' }}
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
        </div>
      )}

      <button className={`btn circle mid gear${settingsOpen ? ' open' : ''}`} style={{ left: '78%', top: '71.8%' }}
        aria-label="Settings (A1)" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>
        <Icon name="gear" size="44%" />
      </button>
    </main>
  )
}
