import { useState } from 'react'
import { Icon, WorkoutIcon, WorkoutMark, WORKOUT_ICONS, BODY_LETTERS } from '../components/icons'
import HoldPicker from '../components/HoldPicker'
import type { Workout } from '../lib/store'

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
  // "+" flow: first hold picks the workout icon, second hold picks the body-part letter.
  const [pickedIcon, setPickedIcon] = useState<string | null>(null)
  // First tap on a workout dot arms it: it turns into a glowing fingerprint (tap again to start)
  // and a pen (edit) appears above it.
  const [chosen, setChosen] = useState<number | null>(null)

  return (
    <main className="page" aria-label="Page A" onClick={(e) => { if (e.target === e.currentTarget) setChosen(null) }}>
      <button className="btn pill" id="a2" aria-label="Book (A2)" onClick={onOpenBook}>
        <Icon name="book" size="46%" />
      </button>

      {SLOTS.map((s, i) => {
        const w = workouts[i]
        if (!w && i >= 4) return null
        return (
          <button
            key={w?.id ?? 'slot' + i}
            className={`btn circle dot${w ? ' filled' : ''}${chosen === i ? ' armed' : ''}`}
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
          maxStep={36}
          onPick={(i) => setPickedIcon(iconOptions[i].key)}
          className="dot"
          style={{ left: '26.9%', top: '80.1%' }}
          ariaLabel="Add workout, press and hold to pick an icon"
        >
          <Icon name="plus" strokeWidth={2.6} />
        </HoldPicker>
      ) : (
        <HoldPicker
          options={letterOptions}
          maxStep={40}
          onPick={(i) => { const icon = pickedIcon; setPickedIcon(null); onCreate(icon, letterOptions[i].key) }}
          className="dot in-progress"
          style={{ left: '26.9%', top: '80.1%' }}
          ariaLabel="Adding workout, press and hold to pick a body part"
        >
          <WorkoutIcon k={pickedIcon} size="40%" />
          <span className="badge" aria-hidden="true">?</span>
        </HoldPicker>
      )}

      <button className="btn circle big" style={{ left: '78%', top: '71.8%' }} aria-label="Home (A1)">
        <Icon name="home" />
      </button>
    </main>
  )
}
