import { useEffect, useState } from 'react'
import { Icon, WorkoutMark } from '../components/icons'
import HoldPicker from '../components/HoldPicker'
import HoldMenu from '../components/HoldMenu'
import { updateWorkout, usePresets, type Workout } from '../lib/store'
import { useSession, switchTo, goToSet, record, endSession, discardSession } from '../lib/session'
import { t } from '../lib/i18n'
import { usePlan, atLeast, showLocked, MAX_SETS, FREE_SETS } from '../lib/plan'
import { LockBadge } from '../components/LockNote'

const repOptions = Array.from({ length: 25 }, (_, i) => ({ key: String(i + 1), node: i + 1 }))
// timed holds: 5 s steps up to 3 minutes
const secOptions = Array.from({ length: 36 }, (_, i) => ({ key: String((i + 1) * 5), node: (i + 1) * 5, label: t('{n} sec', { n: (i + 1) * 5 }) }))

export default function PageB({ workout, workouts, onGo, onHome, onEnded }: {
  workout: Workout | null
  workouts: Workout[]
  onGo: (id: string) => void
  onHome: () => void
  onEnded: (sessionId: string) => void
}) {
  const session = useSession()
  // Free plan: sets past FREE_SETS show a lock
  const plan = usePlan()
  const setCap = atLeast(plan, 'premium') ? MAX_SETS : FREE_SETS
  const lockedSet = () => showLocked(t('Free plan: up to {n} sets per exercise', { n: FREE_SETS }))
  const id = workout?.id ?? null

  // While a session is running, whatever exercise is on screen is part of it.
  useEffect(() => {
    if (session && id && session.current !== id) switchTo(id)
  }, [session, id])

  const inSession = !!session && !!id && session.current === id
  // a session started from a preset: the switcher only offers that preset, in its order
  const presets = usePresets()
  const preset = session?.preset ? presets.find((p) => p.id === session.preset) : undefined
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
  const timed = isProgression && workout?.count === 'sec'
  const countValue = (i: number) => (timed ? (i + 1) * 5 : i + 1)

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
        <button className={`btn pill${session ? ' live' : ''}`} id="b1" aria-label={session ? t('Active session: tap to end') : t('Active')} onClick={() => session && setConfirmEnd(true)}>
          <span className="led" />{t('Active')}
        </button>
        <button className="btn pill" id="b2" aria-label={t('Notes')}>{t('Notes')}</button>
      </div>
      {preset && <span className="preset-chip"><Icon name="preset" size="14px" strokeWidth={2.2} />{preset.name}</span>}

      <button className="icon-btn home-back" aria-label={t('Back to home')} onClick={onHome}>
        <Icon name="arrowLeft" size="24px" />
      </button>

      {confirmEnd && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setConfirmEnd(false) }}>
          <div className="confirm" role="alertdialog" aria-label={t('End session?')}>
            <p>{t('End session?')}</p>
            <div>
              <button onClick={() => setConfirmEnd(false)}>{t('No')}</button>
              <button className="yes" onClick={() => { const sid = endSession(); setConfirmEnd(false); if (sid) onEnded(sid) }}>{t('Yes')}</button>
            </div>
            <button className="cancel-session" onClick={() => { discardSession(); setConfirmEnd(false) }}>{t('Cancel session, record nothing')}</button>
          </div>
        </div>
      )}

      {workout?.focus && (
        <p className="focus-reminder"><span>{t('Focus')}</span>{workout.focus}</p>
      )}

      {/* set number, only while a session is running */}
      {inSession && (
        <>
          <button className="set-num" aria-label={`Set ${set}, tap to choose`} aria-expanded={setsOpen} onClick={() => setSetsOpen(!setsOpen)}>
            <small>{t('set')}</small>{set}
          </button>
          {setsOpen && (
            <div className="set-menu" role="listbox" aria-label={t('Choose set')}>
              {Array.from({ length: MAX_SETS }, (_, i) => i + 1).map((n) => n > setCap ? (
                <button key={n} role="option" aria-selected={false} aria-disabled="true" className="locked"
                  onClick={() => { setSetsOpen(false); lockedSet() }}>{n}<LockBadge /></button>
              ) : (
                <button key={n} role="option" aria-selected={n === set} className={n === set ? 'on' : undefined}
                  onClick={() => { goToSet(n); setSetsOpen(false) }}>{n}</button>
              ))}
            </div>
          )}
        </>
      )}

      {inSession && set > 1 && (
        <button className="btn circle big" style={{ left: '14.9%', top: '43.2%' }} aria-label={t('Previous set')} onClick={() => goToSet(set - 1)}>
          <Icon name="arrowLeft" />
        </button>
      )}
      {set < MAX_SETS && (
        <button className={`btn circle big${set >= setCap ? ' at-limit' : ''}`} style={{ left: '85.1%', top: '43.2%' }} aria-label={t('Next set')}
          onClick={() => { if (set >= setCap) lockedSet(); else if (inSession) goToSet(set + 1) }}>
          <Icon name="arrowRight" />
          {set >= setCap && <LockBadge />}
        </button>
      )}

      {/* B3 load: kg/lbs number picker for equipment workouts, stairs + "add" for progression workouts */}
      {isProgression ? (
        <>
          {(workout.progressions?.length ?? 0) > 0 && (
            <ul className="moves" aria-label={t('Progressions')}>
              {workout.progressions!.slice(-4).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
          <button className="btn circle mid" style={{ left: '35.1%', top: '64.1%' }} aria-label="Load: add progression" onClick={() => setAdding(!adding)}>
            <Icon name="stairs" />
          </button>
          {adding && (
            <form className="move-form" onSubmit={(e) => { e.preventDefault(); addMove() }}>
              <input id="move" autoFocus placeholder={t('New move')} value={move} onChange={(e) => setMove(e.target.value)} />
              <button type="submit">{t('Add')}</button>
            </form>
          )}
        </>
      ) : (
        <HoldPicker
          options={loadOptions}
          visible={15}
          maxStep={20}
          instant
          onChange={(i) => put('weight', i + 1)}
          onPick={(i) => put('weight', i + 1)}
          className="mid load"
          style={{ left: '35.1%', top: '64.1%' }}
          ariaLabel={`Load (B3)${weight ? `: ${weight} ${unit}` : ` in ${unit}`}, drag up to set`}
        >
          {weight ? <span className="val">{weight}<small>{unit}</small></span> : <span className="unit-label">{unit}</span>}
        </HoldPicker>
      )}
      <HoldPicker
        key={timed ? 'sec' : 'reps'}
        options={timed ? secOptions : repOptions}
        visible={timed ? 15 : undefined}
        maxStep={20}
        instant
        onChange={(i) => put('reps', countValue(i))}
        onPick={(i) => put('reps', countValue(i))}
        className="mid reps"
        style={{ left: '69%', top: '64.1%' }}
        ariaLabel={`${timed ? 'Seconds' : 'Reps'} (B4)${reps ? `: ${reps}` : ''}, drag up to set`}
      >
        {reps ? <span className="val">{reps}{timed && <small>{t('sec')}</small>}</span> : timed ? <span className="unit-label">{t('sec')}</span> : <Icon name="numbers" />}
      </HoldPicker>

      {/* pen: hold to pick an exercise and start/continue a session; tap to end the session */}
      <HoldMenu
        items={(preset ? preset.items.map((pid) => workouts.find((w) => w.id === pid)).filter((w): w is Workout => !!w) : workouts).map((w, i) => ({
          key: w.id,
          label: w.exercise || t('Untitled'),
          current: w.id === id,
          num: preset ? i + 1 : undefined,
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
