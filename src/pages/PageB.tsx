import { MangaBattle } from '../components/MangaScene'
import { SummitClimb } from '../components/SummitScene'
import { ThemeSession } from '../components/ThemeScene'
import { useSkin, usePreview } from '../lib/theme'
import SessionBar from '../components/SessionBar'
import { useEffect, useRef, useState } from 'react'
import { Icon, WorkoutMark } from '../components/icons'
import HoldPicker from '../components/HoldPicker'
import HoldMenu from '../components/HoldMenu'
import NumberPrompt from '../components/NumberPrompt'
import { updateWorkout, usePresets, addNote, type Workout } from '../lib/store'
import { useSession, switchTo, goToSet, setSided, setKey, keyNum, keySide, record, recordAt, recordMove, endSession, discardSession, removeFromSession } from '../lib/session'
import { useTimer, startTimer, stopTimer, timerState } from '../lib/timer'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'
import { usePlan, atLeast, MAX_SETS, FREE_SETS, showLocked } from '../lib/plan'
import { useSessions } from '../lib/store'

// Weights on the line: whole kilos; in pounds 2.5 lb steps to 15, then 5 lb steps (2.5 lb plates
// a side). Anything else is typed: tap the button.
const steps = (from: number, to: number, by: number) => Array.from({ length: Math.round((to - from) / by) + 1 }, (_, i) => from + i * by)
const LOADS_KG = steps(1, 300, 1)
const LOADS_LB = [...steps(2.5, 15, 2.5), ...steps(20, 500, 5)]
// how often the exercise switcher was used this week (Mon-based), to stop hinting at it
const weekKey = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime() }
function swapUsesThisWeek() {
  try { const v = JSON.parse(localStorage.getItem('dotset:swap-uses') || 'null'); return v && v.week === weekKey() ? v.n : 0 } catch { return 0 }
}
function noteSwapUsed() {
  try { localStorage.setItem('dotset:swap-uses', JSON.stringify({ week: weekKey(), n: swapUsesThisWeek() + 1 })) } catch { /* blocked */ }
}
// reps line goes to 100 (25 shown, then it scrolls); tapping types up to 999
const repOptions = Array.from({ length: 100 }, (_, i) => ({ key: String(i + 1), node: i + 1 }))
// timed holds: every second from 1 to 60 (45 on the line, scrolling on to 60); longer ones are typed.
// The line is tight, so only every fifth second is numbered.
const secOptions = Array.from({ length: 60 }, (_, i) => ({ key: String(i + 1), node: (i + 1) % 5 === 0 || i === 0 ? i + 1 : <i className="tick" />, label: t('{n} sec', { n: i + 1 }) }))

export default function PageB({ workout, workouts, onGo, onHome, onEnded }: {
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
  // (except an exercise just taken out of the session, while the page moves off it)
  const removed = useRef<string | null>(null)
  useEffect(() => {
    if (session && id && session.current !== id && removed.current !== id) switchTo(id)
  }, [session, id])

  const inSession = !!session && !!id && session.current === id
  const skin = useSkin()
  // a session started from a preset: the switcher only offers that preset, in its order
  const presets = usePresets()
  // anyone's first session: from set 2 on, a hologram shows that Active ends it
  const doneSessions = useSessions()
  const firstSession = doneSessions.length === 0
  const preset = session?.preset ? presets.find((p) => p.id === session.preset) : undefined
  // Trying a theme on: the set arrows still move (nothing is saved), so the theme's
  // page B animation can be seen. Sets loop, as if moving on to the next exercise.
  const trying = !!usePreview() && !inSession
  const [demo, setDemo] = useState(0)
  const set = inSession ? session.setOf[id] ?? 1 : trying ? (demo % setCap) + 1 : 1
  // one side at a time: each set is done on one side, then the other (the right arrow goes to
  // the other side first). `first` is the side each set starts on: Left unless Right was chosen.
  const first = inSession && workout?.sided ? workout.first ?? 'L' : undefined
  const second = first && (first === 'L' ? 'R' : 'L')
  const side = first ? session!.side?.[id!] ?? first : undefined
  const key = setKey(set, side)
  // the set before this one: this set's first side when on the second, else the last set's second side
  const prevKey = side && side === second ? setKey(set, first) : setKey(set - 1, second)
  const entry = inSession ? session.sets[id]?.[key] : undefined

  // Outside a session values are only shown, not documented.
  const [loose, setLoose] = useState<{ reps: number | null; weight: number | null }>({ reps: null, weight: null })
  // A new set keeps the weight of the last set that had one (most people stay on the same
  // load); reps start empty. The carried weight is saved with the set once reps are entered.
  const order = (k: string) => keyNum(k) * 2 + (keySide(k) && keySide(k) !== first ? 1 : 0)
  const carried = inSession && entry?.weight == null
    ? Object.entries(session.sets[id] ?? {}).filter(([k, e]) => e.weight != null && order(k) < order(key)).sort(([a], [b]) => order(a) - order(b)).at(-1)?.[1].weight ?? null
    : null
  const reps = inSession ? entry?.reps ?? null : loose.reps
  const weight = inSession ? entry?.weight ?? carried : loose.weight
  const put = (field: 'reps' | 'weight', v: number) => {
    if (!inSession) return setLoose((s) => ({ ...s, [field]: v }))
    if (field === 'reps' && carried != null) record('weight', carried)
    record(field, v)
  }

  const unit = workout?.unit ?? 'kg'
  const loads = unit === 'lbs' ? LOADS_LB : LOADS_KG
  const loadOptions = loads.map((n) => ({ key: String(n), node: n, label: `${n} ${unit}` }))
  // open on this set's weight, else the last set's (closest step), else the lightest
  const near = weight ?? (inSession ? session.sets[id!]?.[prevKey]?.weight ?? null : null)
  const loadStart = near ? loads.reduce((b, n, i) => (Math.abs(n - near) < Math.abs(loads[b] - near) ? i : b), 0) : 0
  const isProgression = workout?.mode === 'progression'
  // progressions: the one done this set, else last set's, else the newest
  const moves = workout?.progressions ?? []
  const chosenMove = (inSession ? entry?.move ?? session.sets[id!]?.[prevKey]?.move : undefined) ?? moves.at(-1)
  const timed = isProgression && workout?.count === 'sec'
  const countValue = (i: number) => i + 1

  const [setsOpen, setSetsOpen] = useState(false)
  // the exercises the switcher offers (a preset's, in its order, else all)
  const switchable = preset ? preset.items.map((pid) => workouts.find((w) => w.id === pid)).filter((w): w is Workout => !!w) : workouts
  // From set 2 on, each set change fades a couple of the other exercises' icons through the
  // switch button, as a hint it's there. Once it has been used twice in a week, no more hints.
  const [swapHint, setSwapHint] = useState<{ n: number; marks: Workout[] } | null>(null)
  const lastSet = useRef(set)
  useEffect(() => {
    const changed = set !== lastSet.current
    lastSet.current = set
    if (!inSession || !changed || set < 2 || swapUsesThisWeek() >= 2) return
    const others = switchable.filter((w) => w.id !== id).slice(0, 2)
    if (others.length === 0) return
    setSwapHint({ n: Date.now(), marks: others })
    const tm = setTimeout(() => setSwapHint(null), 900 * others.length + 1100)
    return () => clearTimeout(tm)
  }, [set])
  // typing a number instead of dragging: tap the load or sec button
  const [typing, setTyping] = useState<'weight' | 'reps' | null>(null)
  // hold timer: slide onto it from the sec line, a 5 s countdown, then it counts up.
  // It lives outside this page (home shows it too); tap the sec button to stop and keep the time.
  const timer = useTimer()
  const timerHere = !!timer && inSession && timer.workoutId === id && String(timer.set) === key
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
  // the switch button's menu is open: the session bar steps aside
  const [switching, setSwitching] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  // the first time anyone starts training: a short safety note, once (Terms section 2)
  const [safety, setSafety] = useState(() => { try { return inSession && !localStorage.getItem('dotset:safety-ok') } catch { return false } })
  const safetyOk = () => { try { localStorage.setItem('dotset:safety-ok', '1') } catch { /* blocked */ } setSafety(false) }
  const [adding, setAdding] = useState(false)
  const [move, setMove] = useState('')
  // Page B guide: one step at a time, each with a moving demo and a short instruction (slide up
  // for weight, slide up for reps, tap the arrow). It runs in the first session until finished or
  // skipped (progression exercises get their own), and the "?" button plays it again any time.
  const tourKey = isProgression ? 'dotset:tour-b-prog' : 'dotset:tour-b'
  const [tour, setTour] = useState(() => { try { return inSession && firstSession && !localStorage.getItem(tourKey) ? 0 : -1 } catch { return -1 } })
  const tourOn = tour >= 0 && inSession && !safety && !confirmEnd && !adding && !typing
  function endTour() { try { localStorage.setItem(tourKey, '1') } catch { /* blocked */ } setTour(-1) }
  // anyone's first session, once the guide is done: from set 2 on, a hologram shows that Active ends it
  const endHint = firstSession && inSession && set >= 2 && !confirmEnd && tour < 0

  function addMove() {
    const text = move.trim()
    if (text && workout) { updateWorkout(workout.id, { progressions: [...(workout.progressions ?? []), text] }); if (inSession) recordMove(text) }
    setMove('')
    setAdding(false)
  }

  return (
    <main className="page" aria-label="Page B">
      {skin === 'manga' && (inSession || trying) && <MangaBattle set={trying ? demo + 1 : set} />}
      {/* To the Top: every set moved on, across the whole session, is a step up the mountain */}
      {skin === 'summit' && (inSession || trying) && <SummitClimb steps={trying ? demo : Object.values(session!.setOf).reduce((a, n) => a + Math.max(0, n - 1), 0)} />}
      {(inSession || trying) && <ThemeSession skin={skin} steps={trying ? demo : Object.values(session!.setOf).reduce((a, n) => a + Math.max(0, n - 1), 0)} />}
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
          <span className="holo-label">{t('Done? Tap Active to end the session')}</span>
        </div>
      )}

      {inSession && tour < 0 && (
        <button className="icon-btn help-b" aria-label={t('How to use this page')} onClick={() => setTour(0)}>?</button>
      )}
      <button className="icon-btn home-back" aria-label={t('Back to home')} onClick={onHome}>
        <Icon name="arrowLeft" size="24px" />
      </button>

      {safety && (
        <div className="scrim">
          <div className="confirm safety" role="alertdialog" aria-label={t('Train safely')}>
            <p>{t('Train safely')}</p>
            <small>{t('Dotset is a workout log, not medical advice. Check with a doctor before starting or changing your training, and stop if you feel pain, dizziness or shortness of breath.')}</small>
            <button className="yes" onClick={safetyOk}>{t('Got it')}</button>
          </div>
        </div>
      )}

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

      {/* set number, only while a session is running (or a theme is being tried on) */}
      {trying && <span className="set-num" aria-label={`Set ${set}`}><small>{t('set')}</small>{set}</span>}
      {inSession && (
        <>
          <button key={key} className={`set-num${side === 'R' ? ' to-right' : side ? ' to-left' : ''}`} aria-label={`Set ${set}${side ? `, ${side === 'L' ? 'left' : 'right'}` : ''}, tap to choose`} aria-expanded={setsOpen} onClick={() => setSetsOpen(!setsOpen)}>
            <small>{t('set')}</small>{set}
            {side && <span className="set-side">{side === 'L' ? t('Left') : t('Right')}</span>}
          </button>
          {setsOpen && (
            <div className="set-menu" role="listbox" aria-label={t('Choose set')}>
              {/* every set number shows; ones past the plan's limit are faded and say why */}
              {Array.from({ length: MAX_SETS }, (_, i) => i + 1).map((n) => n > setCap ? (
                <button key={n} role="option" aria-selected={false} aria-disabled="true" className="limit"
                  onClick={() => showLocked(t('You have reached the set limit for your plan'))}>{n}</button>
              ) : (
                <button key={n} role="option" aria-selected={n === set} className={n === set ? 'on' : undefined}
                  onClick={() => { goToSet(n); setSetsOpen(false) }}>{n}</button>
              ))}
              {/* one side at a time (a single arm or leg): each set gets a Left and a Right */}
              {/* tap to cycle: off, Left first (L|R), Right first (R|L), off */}
              <button className={`side-toggle${workout?.sided ? ' on' : ''}`} role="switch" aria-checked={!!workout?.sided}
                aria-label={`${t('One side at a time')}${workout?.sided ? `: ${workout.first === 'R' ? t('Right first') : t('Left first')}` : ''}`}
                onClick={() => { setSided(id!, !workout?.sided ? 'L' : (workout.first ?? 'L') === 'L' ? 'R' : null); setSetsOpen(false) }}>
                {workout?.sided && workout.first === 'R'
                  ? <><span>{t('R')}</span><i /><span>{t('L')}</span></>
                  : <><span>{t('L')}</span><i /><span>{t('R')}</span></>}
              </button>
            </div>
          )}
        </>
      )}

      {((inSession && (set > 1 || (!!side && side === second))) || (trying && demo > 0)) && (
        <button className={`btn circle big${trying ? ' try-step' : ''}`} style={{ left: '14.9%', top: '43.2%' }} aria-label={side && side === second ? t('Other side') : t('Previous set')}
          onClick={() => (trying ? setDemo(demo - 1) : side && side === second ? goToSet(set, first) : goToSet(set - 1, second))}>
          <Icon name="arrowLeft" />
        </button>
      )}
      {(set < setCap || (!!side && side === first) || trying) && (
        <button className={`btn circle big next-set${trying ? ' try-step' : ''}`} style={{ left: '85.1%', top: '43.2%' }} aria-label={side && side === first ? t('Next side') : t('Next set')}
          onClick={() => { if (trying) setDemo(demo + 1); else if (side && side === first) goToSet(set, second); else if (inSession) goToSet(set + 1) }}>
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
              className="mid move-btn"
              style={{ left: '35.1%', top: '64.1%' }}
              ariaLabel={`Progression${chosenMove ? `: ${chosenMove}` : ''}. Tap to add one, drag up to choose`}
            >
              <Icon name="stairs" />
            </HoldPicker>
          ) : (
            <button className="btn circle mid move-btn" style={{ left: '35.1%', top: '64.1%' }} aria-label="Load: add progression" onClick={() => setAdding(!adding)}>
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
        visible={timed ? 45 : 25}
        start={reps ? Math.min(timed ? 59 : 99, reps - 1) : 0}
        maxStep={20}
        instant
        extra={timed && inSession ? { node: <Icon name="stopwatch" size="22px" />, label: t('Timer'), onPick: () => startTimer(id!, key) } : undefined}
        onChange={(i) => { if (!timerHere) put('reps', countValue(i)) }}
        onPick={(i) => { if (timerHere) stopTimer(); put('reps', countValue(i)) }}
        onTap={() => (timerHere ? stopWatch() : setTyping('reps'))}
        className={`mid reps${timed ? ' dense' : ''}${timerHere ? (ts?.counting ? ' timing counting' : ' timing') : ''}`}
        style={{ left: '69%', top: '64.1%' }}
        ariaLabel={timerHere ? t('Timer running: tap to stop') : `${timed ? 'Seconds' : 'Reps'} (B4)${reps ? `: ${reps}` : ''}, tap to type, drag up to set`}
      >
        {timerHere && ts
          ? ts.counting
            ? <span key={ts.left} className="val countdown">{ts.left}</span>
            : <span className="val"><Icon name="stopwatch" size="14px" />{ts.held}<small>{t('sec')}</small></span>
          : reps ? <span className="val">{reps}{timed && <small>{t('sec')}</small>}</span> : timed ? <span className="unit-label">{t('sec')}</span> : <Icon name="numbers" />}
      </HoldPicker>
      {tourOn && <BTour step={tour} progression={isProgression} timed={timed} unit={unit} onStep={setTour} onEnd={endTour} />}
      {typing && (
        <NumberPrompt
          title={typing === 'weight' ? t('Weight') : timed ? t('Seconds') : t('Reps')}
          unit={typing === 'weight' ? unit : timed ? t('sec') : t('reps')}
          value={typing === 'weight' ? weight : reps}
          decimal={typing === 'weight'}
          max={typing === 'reps' && !timed ? 999 : undefined}
          onSave={(n) => { if (typing === 'reps' && timerHere) stopTimer(); put(typing, n) }}
          onClose={() => setTyping(null)}
        />
      )}

      {/* switch exercise: tap for the list of all of them, or drag and let go on one */}
      <HoldMenu
        items={switchable.map((w, i) => ({
          key: w.id,
          label: w.exercise || t('Untitled'),
          current: w.id === id,
          num: preset ? i + 1 : undefined,
          node: <WorkoutMark icon={w.icon} letter={w.letter} size="1.1em" />,
        }))}
        onPick={(wid) => { noteSwapUsed(); switchTo(wid); onGo(wid) }}
        onOpenChange={setSwitching}
        className={`big pen${swapHint ? ' hinting' : ''}`}
        style={{ left: '52%', top: '89.2%' }}
        ariaLabel={t('Switch exercise: tap for the list, or drag')}
      >
        <span className="swap-face"><Icon name="swap" /></span>
        {swapHint && (
          <span key={swapHint.n} className="swap-hint" aria-hidden="true">
            {swapHint.marks.map((w, i) => <span key={w.id} style={{ animationDelay: `${i * 0.9}s` }}><WorkoutMark icon={w.icon} letter={w.letter} size="1em" /></span>)}
          </span>
        )}
      </HoldMenu>

      {/* the exercises already in this session: tap or slide to go back to one, or take out a wrong one */}
      {inSession && session.order.length > 1 && (
        <SessionBar
          items={session.order.map((wid) => workouts.find((w) => w.id === wid)).filter((w): w is Workout => !!w)}
          current={id}
          hidden={switching}
          onGo={(wid) => { switchTo(wid); onGo(wid) }}
          onRemove={(wid) => { removed.current = wid; const next = removeFromSession(wid); if (next && next !== id) onGo(next) }}
        />
      )}
    </main>
  )
}

// One step of the page B guide: a demo moving on the control (a touch sliding up a small number
// line, or a tap on the arrow) and a card that says what to do. Using the control moves it on.
type TourStep = { sel: string; at: [number, number]; kind: 'slide' | 'tap'; text: string; sub: string; nums?: (number | string)[] }
function BTour({ step, progression, timed, unit, onStep, onEnd }: { step: number; progression: boolean; timed: boolean; unit: string; onStep: (n: number) => void; onEnd: () => void }) {
  const steps: TourStep[] = [
    progression
      ? { sel: '.move-btn', at: [35.1, 64.1], kind: 'tap', text: t('Tap to add a move'), sub: t('e.g. Knee push-up. Slide up later to pick one') }
      : { sel: '.load', at: [35.1, 64.1], kind: 'slide', text: t('Slide up to set the weight'), sub: t('Or tap to type it'), nums: unit === 'lbs' ? [45, 95, 135] : [20, 40, 60] },
    timed
      ? { sel: '.reps', at: [69, 64.1], kind: 'slide', text: t('Slide up to set the seconds'), sub: t('Or tap to type it'), nums: [10, 20, 30] }
      : { sel: '.reps', at: [69, 64.1], kind: 'slide', text: t('Slide up to count your reps'), sub: t('Let go on the number you did'), nums: [6, 8, 10] },
    { sel: '.next-set', at: [85.1, 43.2], kind: 'tap', text: t('Tap for the next set'), sub: t('This set is saved as you go') },
  ]
  const cur = steps[step]
  const next = () => (step + 1 >= steps.length ? onEnd() : onStep(step + 1))
  // using the control itself moves the guide on
  useEffect(() => {
    if (!cur) return
    const el = document.querySelector(cur.sel)
    el?.classList.add('tour-target')
    const up = (e: PointerEvent) => { if ((e.target as Element).closest?.(cur.sel)) setTimeout(next, 350) }
    document.addEventListener('pointerup', up, true)
    return () => { el?.classList.remove('tour-target'); document.removeEventListener('pointerup', up, true) }
  }, [step])
  if (!cur) return null
  const [x, y] = cur.at
  return (
    <>
      <div className={`holo holo-${cur.kind === 'slide' ? 'demo' : 'tap'} b-tour`} key={step} style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">
        <span className="holo-ring" />
        {cur.kind === 'slide' && (
          <span className="demo-line">{cur.nums!.map((n, i) => <i key={i} style={{ ['--i' as string]: i }}>{n}</i>)}</span>
        )}
      </div>
      <div className={`tour-tip b-tip ${cur.kind === 'tap' && x > 60 ? 'right' : ''}`} key={'tip' + step} role="status"
        style={{ left: cur.kind === 'tap' && x > 60 ? undefined : `clamp(118px, ${x}%, calc(100% - 118px))`, top: `calc(${y}% + ${x > 60 && cur.kind === 'tap' ? 'min(24.5cqw, 13.8cqh)' : 'min(17.5cqw, 9.8cqh)'} / 2 + 16px)` }}>
        <b>{cur.text}</b>
        <small>{cur.sub}</small>
        <span className="tour-actions">
          <span className="tour-count">{step + 1}/{steps.length}</span>
          {step < steps.length - 1 && <button onClick={onEnd}>{t('Skip')}</button>}
          <button className="on" onClick={next}>{step < steps.length - 1 ? t('Next') : t('Got it')}</button>
        </span>
      </div>
    </>
  )
}
