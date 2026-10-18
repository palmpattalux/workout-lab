import { MangaBattle } from '../components/MangaScene'
import { SummitClimb } from '../components/SummitScene'
import { useSkin } from '../lib/theme'
import { useEffect, useRef, useState } from 'react'
import { Icon, WorkoutMark } from '../components/icons'
import HoldPicker from '../components/HoldPicker'
import HoldMenu from '../components/HoldMenu'
import NumberPrompt from '../components/NumberPrompt'
import { updateWorkout, usePresets, addNote, type Workout } from '../lib/store'
import { useSession, switchTo, goToSet, record, recordAt, recordMove, endSession, discardSession } from '../lib/session'
import { useTimer, startTimer, stopTimer, timerState } from '../lib/timer'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'
import { usePlan, atLeast, MAX_SETS, FREE_SETS } from '../lib/plan'
import { useSessions } from '../lib/store'

// Weights on the line: whole kilos; in pounds 2.5 lb steps to 15, then 5 lb steps (2.5 lb plates
// a side). Anything else is typed: tap the button.
const steps = (from: number, to: number, by: number) => Array.from({ length: Math.round((to - from) / by) + 1 }, (_, i) => from + i * by)
const LOADS_KG = steps(1, 300, 1)
const LOADS_LB = [...steps(2.5, 15, 2.5), ...steps(20, 500, 5)]
const repOptions = Array.from({ length: 25 }, (_, i) => ({ key: String(i + 1), node: i + 1 }))
// timed holds: every second from 1 to 60 (45 on the line, scrolling on to 60); longer ones are typed.
// The line is tight, so only every fifth second is numbered.
const secOptions = Array.from({ length: 60 }, (_, i) => ({ key: String(i + 1), node: (i + 1) % 5 === 0 || i === 0 ? i + 1 : <i className="tick" />, label: t('{n} sec', { n: i + 1 }) }))

export default function PageB({ guest, workout, workouts, onGo, onHome, onEnded }: {
  guest?: boolean
  workout: Workout | null
  workouts: Workout[]
  onGo: (id: string) => void
  onHome: () => void
  onEnded: (sessionId: string) => void
}) {
  const session = useSession()
  // Free plan: sets past FREE_SETS are not offered
  const plan = usePlan()
  const setCap = atLeast(plan, 'premium') ? MAX_SETS : FREE_SETS
  const id = workout?.id ?? null

  // While a session is running, whatever exercise is on screen is part of it.
  useEffect(() => {
    if (session && id && session.current !== id) switchTo(id)
  }, [session, id])

  const inSession = !!session && !!id && session.current === id
  const skin = useSkin()
  // a session started from a preset: the switcher only offers that preset, in its order
  const presets = usePresets()
  // a guest's first session: from set 2 on, a hologram shows that Active ends it
  const doneSessions = useSessions()
  const firstSession = !!guest && doneSessions.length === 0
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
  const loads = unit === 'lbs' ? LOADS_LB : LOADS_KG
  const loadOptions = loads.map((n) => ({ key: String(n), node: n, label: `${n} ${unit}` }))
  // open on this set's weight, else the last set's (closest step), else the lightest
  const near = weight ?? (inSession ? session.sets[id!]?.[String(set - 1)]?.weight ?? null : null)
  const loadStart = near ? loads.reduce((b, n, i) => (Math.abs(n - near) < Math.abs(loads[b] - near) ? i : b), 0) : 0
  const isProgression = workout?.mode === 'progression'
  // progressions: the one done this set, else last set's, else the newest
  const moves = workout?.progressions ?? []
  const chosenMove = (inSession ? entry?.move ?? session.sets[id!]?.[String(set - 1)]?.move : undefined) ?? moves.at(-1)
  const timed = isProgression && workout?.count === 'sec'
  const countValue = (i: number) => i + 1

  const [setsOpen, setSetsOpen] = useState(false)
  // typing a number instead of dragging: tap the load or sec button
  const [typing, setTyping] = useState<'weight' | 'reps' | null>(null)
  // hold timer: slide onto it from the sec line, a 5 s countdown, then it counts up.
  // It lives outside this page (home shows it too); tap the sec button to stop and keep the time.
  const timer = useTimer()
  const timerHere = !!timer && inSession && timer.workoutId === id && timer.set === set
  const [, tickWatch] = useState(0)
  const ts = timer ? timerState(timer) : null
  useEffect(() => {
    if (!timerHere) return
    const iv = setInterval(() => tickWatch((n) => n + 1), 200)
    return () => clearInterval(iv)
  }, [timerHere])
  const lastLeft = useRef(0)
  useEffect(() => {
    if (!timerHere || !ts) return
    const key = ts.counting ? ts.left : 0
    if (key !== lastLeft.current) { if (ts.counting) sound.tick(); else if (lastLeft.current > 0) sound.pop() }
    lastLeft.current = key
  })
  function stopWatch() {
    const t0 = stopTimer()
    if (!t0) return
    const st = timerState(t0)
    if (!st.counting) recordAt(t0.workoutId, t0.set, { reps: Math.max(1, st.held) })
  }
  const [confirmEnd, setConfirmEnd] = useState(false)
  const endHint = firstSession && inSession && set >= 2 && !confirmEnd
  const [adding, setAdding] = useState(false)
  const [move, setMove] = useState('')

  function addMove() {
    const text = move.trim()
    if (text && workout) { updateWorkout(workout.id, { progressions: [...(workout.progressions ?? []), text] }); if (inSession) recordMove(text) }
    setMove('')
    setAdding(false)
  }

  return (
    <main className="page" aria-label="Page B">
      {skin === 'manga' && inSession && <MangaBattle set={set} />}
      {/* To the Top: every set moved on, across the whole session, is a step up the mountain */}
      {skin === 'summit' && inSession && <SummitClimb steps={Object.values(session.setOf).reduce((a, n) => a + Math.max(0, n - 1), 0)} />}
      <div className="tabs">
        <button className={`btn pill${session ? ' live' : ''}${endHint ? ' holo-target' : ''}`} id="b1" aria-label={session ? t('Active session: tap to end') : t('Active')} onClick={() => session && setConfirmEnd(true)}>
          <span className="led" />{t('Active')}
        </button>
        <button className="btn pill" id="b2" aria-label={t('Notes')}
          onClick={() => { const n = addNote({ sessionId: session?.id, workoutId: id ?? undefined }); location.hash = 'note-' + n.id }}>{t('Notes')}</button>
      </div>
      {preset && <span className="preset-chip"><Icon name="preset" size="14px" strokeWidth={2.2} />{preset.name}</span>}

      {endHint && (
        <div className="holo holo-end" aria-hidden="true">
          <span className="holo-hand"><Icon name="hand" size="100%" strokeWidth={1.6} /></span>
          <span className="holo-label">{t('Done? Tap Active to end the session')}</span>
        </div>
      )}

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
              {Array.from({ length: setCap }, (_, i) => i + 1).map((n) => (
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
      {set < setCap && (
        <button className="btn circle big" style={{ left: '85.1%', top: '43.2%' }} aria-label={t('Next set')}
          onClick={() => { if (inSession) goToSet(set + 1) }}>
          <Icon name="arrowRight" />
        </button>
      )}

      {/* B3 load: kg/lbs number picker for equipment workouts, stairs + "add" for progression workouts */}
      {isProgression ? (
        <>
          {moves.length > 0 && (
            <ul className="moves" aria-label={t('Progressions')}>
              {moves.slice(-4).map((m, i) => <li key={i} className={m === chosenMove ? 'on' : undefined}>{m}</li>)}
            </ul>
          )}
          {/* tap: add a new progression; drag up: choose which one this set is */}
          {moves.length > 0 ? (
            <HoldPicker
              options={moves.map((m, i) => ({ key: String(i), node: i + 1, label: m }))}
              visible={Math.min(moves.length, 15)}
              start={chosenMove ? Math.max(0, moves.lastIndexOf(chosenMove)) : moves.length - 1}
              maxStep={30}
              instant
              onTap={() => setAdding(!adding)}
              onPick={(i) => { if (inSession) recordMove(moves[i]) }}
              className="mid"
              style={{ left: '35.1%', top: '64.1%' }}
              ariaLabel={`Progression${chosenMove ? `: ${chosenMove}` : ''}. Tap to add one, drag up to choose`}
            >
              <Icon name="stairs" />
            </HoldPicker>
          ) : (
            <button className="btn circle mid" style={{ left: '35.1%', top: '64.1%' }} aria-label="Load: add progression" onClick={() => setAdding(!adding)}>
              <Icon name="stairs" />
            </button>
          )}
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
          start={loadStart}
          maxStep={20}
          instant
          onChange={(i) => put('weight', loads[i])}
          onPick={(i) => put('weight', loads[i])}
          onTap={() => setTyping('weight')}
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
        visible={timed ? 45 : undefined}
        start={timed && reps ? Math.min(59, reps - 1) : 0}
        maxStep={20}
        instant
        extra={timed && inSession ? { node: <Icon name="stopwatch" size="22px" />, label: t('Timer'), onPick: () => startTimer(id!, set) } : undefined}
        onChange={(i) => { if (!timerHere) put('reps', countValue(i)) }}
        onPick={(i) => { if (timerHere) stopTimer(); put('reps', countValue(i)) }}
        onTap={timed ? () => (timerHere ? stopWatch() : setTyping('reps')) : undefined}
        className={`mid reps${timed ? ' dense' : ''}${timerHere ? (ts?.counting ? ' timing counting' : ' timing') : ''}`}
        style={{ left: '69%', top: '64.1%' }}
        ariaLabel={timerHere ? t('Timer running: tap to stop') : `${timed ? 'Seconds' : 'Reps'} (B4)${reps ? `: ${reps}` : ''}, ${timed ? 'tap to type, ' : ''}drag up to set`}
      >
        {timerHere && ts
          ? ts.counting
            ? <span key={ts.left} className="val countdown">{ts.left}</span>
            : <span className="val"><Icon name="stopwatch" size="14px" />{ts.held}<small>{t('sec')}</small></span>
          : reps ? <span className="val">{reps}{timed && <small>{t('sec')}</small>}</span> : timed ? <span className="unit-label">{t('sec')}</span> : <Icon name="numbers" />}
      </HoldPicker>
      {typing && (
        <NumberPrompt
          title={typing === 'weight' ? t('Weight') : t('Seconds')}
          unit={typing === 'weight' ? unit : t('sec')}
          value={typing === 'weight' ? weight : reps}
          decimal={typing === 'weight'}
          onSave={(n) => { if (typing === 'reps' && timerHere) stopTimer(); put(typing, n) }}
          onClose={() => setTyping(null)}
        />
      )}

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
