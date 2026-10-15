import { useEffect, useState } from 'react'
import { Icon, WorkoutMark } from '../components/icons'
import HoldPicker from '../components/HoldPicker'
import HoldMenu from '../components/HoldMenu'
import { updateWorkout, type Workout } from '../lib/store'
import { useSession, switchTo, goToSet, record, endSession, discardSession } from '../lib/session'

const MAX_SET = 5
const repOptions = Array.from({ length: 25 }, (_, i) => ({ key: String(i + 1), node: i + 1 }))

export default function PageB({ workout, workouts, onGo, onHome }: {
  workout: Workout | null
  workouts: Workout[]
  onGo: (id: string) => void
  onHome: () => void
}) {
  const session = useSession()
  const id = workout?.id ?? null

  // While a session is running, whatever exercise is on screen is part of it.
  useEffect(() => {
    if (session && id && session.current !== id) switchTo(id)
  }, [session, id])

  const inSession = !!session && !!id && session.current === id
  const set = inSession ? session.setOf[id] ?? 1 : 1
  const entry = inSession ? session.sets[id]?.[String(set)] : undefined

  // Outside a session values are only shown, not documented.
  const [loose, setLoose] = useState<{ reps: number | null; weight: number | null }>({ reps: null, weight: null })
  const reps = inSession ? entry?.reps ?? null : loose.reps
  const weight = inSession ? entry?.weight ?? null : loose.weight
  const put = (field: 'reps' | 'weight', v: number) =>
    inSession ? record(field, v) : setLoose((s) => ({ ...s, [field]: v }))

  const unit = workout?.unit ?? 'kg'
  const loadOptions = Array.from({ length: 30 }, (_, i) => ({ key: String(i + 1), node: i + 1, label: `${i + 1} ${unit}` }))
  const isProgression = workout?.mode === 'progression'

  const [setsOpen, setSetsOpen] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [move, setMove] = useState('')

  function addMove() {
    const text = move.trim()
    if (text && workout) updateWorkout(workout.id, { progressions: [...(workout.progressions ?? []), text] })
    setMove('')
    setAdding(false)
  }

  return (
    <main className="page" aria-label="Page B">
      <div className="tabs">
        <button className={`btn pill${session ? ' live' : ''}`} id="b1" aria-label={session ? 'Session active, tap to end' : 'No session'} onClick={() => session && setConfirmEnd(true)}>
          <span className="led" />Active
        </button>
        <button className="btn pill" id="b2" aria-label="Notes (B2)">Notes</button>
      </div>

      <button className="icon-btn home-back" aria-label="Back to home" onClick={onHome}>
        <Icon name="arrowLeft" size="24px" />
      </button>

      {confirmEnd && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setConfirmEnd(false) }}>
          <div className="confirm" role="alertdialog" aria-label="End session?">
            <p>End session?</p>
            <div>
              <button onClick={() => setConfirmEnd(false)}>No</button>
              <button className="yes" onClick={() => { endSession(); setConfirmEnd(false) }}>Yes</button>
            </div>
            <button className="cancel-session" onClick={() => { discardSession(); setConfirmEnd(false) }}>Cancel session, record nothing</button>
          </div>
        </div>
      )}

      {workout?.focus && (
        <p className="focus-reminder"><span>Focus</span>{workout.focus}</p>
      )}

      {/* set number, only while a session is running */}
      {inSession && (
        <>
          <button className="set-num" aria-label={`Set ${set}, tap to choose`} aria-expanded={setsOpen} onClick={() => setSetsOpen(!setsOpen)}>
            <small>set</small>{set}
          </button>
          {setsOpen && (
            <div className="set-menu" role="listbox" aria-label="Choose set">
              {Array.from({ length: MAX_SET }, (_, i) => i + 1).map((n) => (
                <button key={n} role="option" aria-selected={n === set} className={n === set ? 'on' : undefined}
                  onClick={() => { goToSet(n); setSetsOpen(false) }}>{n}</button>
              ))}
            </div>
          )}
        </>
      )}

      {inSession && set > 1 && (
        <button className="btn circle big" style={{ left: '14.9%', top: '43.2%' }} aria-label="Previous set" onClick={() => goToSet(set - 1)}>
          <Icon name="arrowLeft" />
        </button>
      )}
      {set < MAX_SET && (
        <button className="btn circle big" style={{ left: '85.1%', top: '43.2%' }} aria-label="Next set" onClick={() => inSession && goToSet(set + 1)}>
          <Icon name="arrowRight" />
        </button>
      )}

      {/* B3 load: kg/lbs number picker for equipment workouts, stairs + "add" for progression workouts */}
      {isProgression ? (
        <>
          {(workout.progressions?.length ?? 0) > 0 && (
            <ul className="moves" aria-label="Progressions">
              {workout.progressions!.slice(-4).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
          <button className="btn circle mid" style={{ left: '35.1%', top: '64.1%' }} aria-label="Load: add progression" onClick={() => setAdding(!adding)}>
            <Icon name="stairs" />
          </button>
          {adding && (
            <form className="move-form" onSubmit={(e) => { e.preventDefault(); addMove() }}>
              <input id="move" autoFocus placeholder="New move" value={move} onChange={(e) => setMove(e.target.value)} />
              <button type="submit">Add</button>
            </form>
          )}
        </>
      ) : (
        <HoldPicker
          options={loadOptions}
          visible={15}
          maxStep={20}
          onChange={(i) => put('weight', i + 1)}
          onPick={(i) => put('weight', i + 1)}
          className="mid load"
          style={{ left: '35.1%', top: '64.1%' }}
          ariaLabel={`Load (B3)${weight ? `: ${weight} ${unit}` : ` in ${unit}`}, press and hold to set`}
        >
          {weight ? <span className="val">{weight}<small>{unit}</small></span> : <span className="unit-label">{unit}</span>}
        </HoldPicker>
      )}
      <HoldPicker
        options={repOptions}
        maxStep={20}
        onChange={(i) => put('reps', i + 1)}
        onPick={(i) => put('reps', i + 1)}
        className="mid reps"
        style={{ left: '69%', top: '64.1%' }}
        ariaLabel={`Reps (B4)${reps ? `: ${reps}` : ''}, press and hold to set`}
      >
        {reps ? <span className="val">{reps}</span> : <Icon name="numbers" />}
      </HoldPicker>

      {/* pen: hold to pick an exercise and start/continue a session; tap to end the session */}
      <HoldMenu
        items={workouts.map((w) => ({
          key: w.id,
          label: w.exercise || 'Untitled',
          current: w.id === id,
          node: <WorkoutMark icon={w.icon} letter={w.letter} size="1.1em" />,
        }))}
        onPick={(wid) => { switchTo(wid); onGo(wid) }}
        className="big pen"
        style={{ left: '52%', top: '89.2%' }}
        ariaLabel="Hold to switch exercise"
      >
        <Icon name="swap" />
      </HoldMenu>
    </main>
  )
}
