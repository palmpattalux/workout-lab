import { useState } from 'react'
import { WorkoutIcon, WorkoutMark, WORKOUT_ICONS, BODY_LETTERS } from './icons'
import { addWorkout, useWorkouts, TINTS } from '../lib/store'
import { atLeast, usePlan, FREE_WORKOUTS } from '../lib/plan'
import { t } from '../lib/i18n'

// Desktop: make an exercise here, use it on the phone. It is saved to the account like one made
// in the app (a visitor who isn't signed in keeps it in this browser, and it moves into the
// account they sign up for here). Nothing of the phone UI is shown: just a form and a preview dot.
export default function DesktopCreate({ signedIn }: { signedIn: boolean }) {
  const all = useWorkouts()
  const plan = usePlan()
  const [icon, setIcon] = useState('barbell')
  const [letter, setLetter] = useState('A')
  const [color, setColor] = useState('sky')
  const [exercise, setExercise] = useState('')
  const [mode, setMode] = useState<'equipment' | 'progression'>('equipment')
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg')
  const [count, setCount] = useState<'reps' | 'sec'>('reps')
  const [focus, setFocus] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const full = !atLeast(plan, 'premium') && all.length >= FREE_WORKOUTS

  function save() {
    if (!exercise.trim() || full) return
    addWorkout({ icon, letter, color: color || undefined, exercise: exercise.trim(), equipment: '', mode, unit, count, focus: focus.trim(), notes: '' })
    setSaved(exercise.trim())
    setExercise(''); setFocus('')
  }

  return (
    <div className="dc">
      <div className="dc-form">
        <label className="dc-label" htmlFor="dc-name">{t('Exercise')}</label>
        <input id="dc-name" className="dc-field" placeholder={t('e.g. Bench press')} value={exercise} maxLength={40}
          onChange={(e) => { setExercise(e.target.value); setSaved(null) }} onKeyDown={(e) => { if (e.key === 'Enter') save() }} />

        <span className="dc-label">{t('Icon')}</span>
        <div className="dc-icons" role="radiogroup" aria-label={t('Icon')}>
          {WORKOUT_ICONS.map((i) => (
            <button key={i.key} role="radio" aria-checked={i.key === icon} aria-label={t(i.name)} title={t(i.name)} className={i.key === icon ? 'on' : undefined} onClick={() => setIcon(i.key)}>
              <WorkoutIcon k={i.key} size="22px" strokeWidth={1.9} />
            </button>
          ))}
        </div>

        <div className="dc-two">
          <div>
            <span className="dc-label">{t('Letter')}</span>
            <div className="dc-letters" role="radiogroup" aria-label={t('Letter')}>
              {BODY_LETTERS.map((l) => (
                <button key={l.key} role="radio" aria-checked={l.key === letter} className={l.key === letter ? 'on' : undefined} onClick={() => setLetter(l.key)}>{l.key}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="dc-label">{t('Colour')}</span>
            <div className="dc-tints" role="radiogroup" aria-label={t('Colour')}>
              {['', ...TINTS].map((k) => (
                <button key={k || 'none'} role="radio" aria-checked={k === color} aria-label={k ? t(k[0].toUpperCase() + k.slice(1)) : t('No colour')}
                  className={`${k ? 'tinted tint-' + k : 'none'}${k === color ? ' on' : ''}`} onClick={() => setColor(k)} />
              ))}
            </div>
          </div>
        </div>

        <span className="dc-label">{t('How you count it')}</span>
        <div className="dc-seg" role="radiogroup">
          <button role="radio" aria-checked={mode === 'equipment' && unit === 'kg'} className={mode === 'equipment' && unit === 'kg' ? 'on' : undefined} onClick={() => { setMode('equipment'); setUnit('kg') }}>{t('Weight in kg')}</button>
          <button role="radio" aria-checked={mode === 'equipment' && unit === 'lbs'} className={mode === 'equipment' && unit === 'lbs' ? 'on' : undefined} onClick={() => { setMode('equipment'); setUnit('lbs') }}>{t('Weight in lbs')}</button>
          <button role="radio" aria-checked={mode === 'progression' && count === 'reps'} className={mode === 'progression' && count === 'reps' ? 'on' : undefined} onClick={() => { setMode('progression'); setCount('reps') }}>{t('Bodyweight reps')}</button>
          <button role="radio" aria-checked={mode === 'progression' && count === 'sec'} className={mode === 'progression' && count === 'sec' ? 'on' : undefined} onClick={() => { setMode('progression'); setCount('sec') }}>{t('Hold in seconds')}</button>
        </div>

        <label className="dc-label" htmlFor="dc-focus">{t('Specific focus')} <small>{t('optional')}</small></label>
        <input id="dc-focus" className="dc-field" placeholder={t('A reminder for your next session')} value={focus} maxLength={80} onChange={(e) => setFocus(e.target.value)} />
      </div>

      <div className="dc-side">
        <div className="dc-preview" aria-hidden="true">
          <span className={`dc-dot${color ? ' tinted tint-' + color : ''}`}><WorkoutMark icon={icon} letter={letter} size="1em" /></span>
          <span className="dc-name">{exercise.trim() || t('Your exercise')}</span>
        </div>
        {full
          ? <p className="dc-note">{t('The Free plan holds {n} exercises. Premium removes the limit.', { n: FREE_WORKOUTS })}</p>
          : <button className="ld-btn dc-save" disabled={!exercise.trim()} onClick={save}>{t('Save to my app')}</button>}
        {saved && (
          <div className="dc-done" role="status">
            <b>{t("{name} is in your mobile app!", { name: saved })}</b>
            <p>{signedIn ? t('Open Dotset on your phone and sign in with this account to use it.') : t('Sign up so it is waiting for you, then download Dotset and sign in to use it.')}</p>
            {!signedIn && <button className="ld-btn" onClick={() => { location.hash = 'signup' }}>{t('Sign up')}</button>}
          </div>
        )}
        {!saved && <p className="dc-hint">{t("It's in your mobile app! Download Dotset and sign in to use it.")}</p>}
        {all.length > 0 && (
          <div className="dc-list">
            <span className="dc-label">{signedIn ? t('In your app') : t('Saved in this browser')}</span>
            <ul>
              {all.map((w) => (
                <li key={w.id}><span className={w.color ? 'tinted tint-' + w.color : undefined}><WorkoutMark icon={w.icon} letter={w.letter} size="15px" /></span>{w.exercise || t('Untitled')}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
