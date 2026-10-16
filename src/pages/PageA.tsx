import { useRef, useState, type PointerEvent } from 'react'
import { Icon, WorkoutIcon, WorkoutMark, WORKOUT_ICONS, BODY_LETTERS } from '../components/icons'
import HoldPicker from '../components/HoldPicker'
import { updateWorkout, type Workout } from '../lib/store'
import { sound } from '../lib/sound'
import { usePrefs, setPrefs } from '../lib/prefs'
import { useSkin, getPreview } from '../lib/theme'
import ThemeScene from '../components/ThemeScene'
import { useEmail, signOut } from '../lib/auth'
import { t, LANGS } from '../lib/i18n'
import { LangPicker } from '../components/Flag'

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

// A unit is what sits in one slot: a single workout, or a group of them in one bubble.
type Unit = { key: string; members: Workout[] }
function unitsOf(workouts: Workout[]): Unit[] {
  const out: Unit[] = []
  const byGroup = new Map<string, Unit>()
  for (const w of workouts) {
    if (w.group) {
      const u = byGroup.get(w.group)
      if (u) { u.members.push(w); continue }
      const nu = { key: w.group, members: [w] }
      byGroup.set(w.group, nu); out.push(nu)
    } else out.push({ key: w.id, members: [w] })
  }
  // a group left with one member is just that workout again
  return out.map((u) => (u.members.length === 1 ? { key: u.members[0].id, members: u.members } : u))
}

// Each unit keeps the slot it was dragged to; the rest fill free slots in order.
function placeAll(units: Unit[]) {
  const taken = new Map<number, Unit>()
  for (const u of units) {
    const s = u.members[0].slot
    if (s !== undefined && s < SLOTS.length && !taken.has(s)) taken.set(s, u)
  }
  const placed = new Set(taken.values())
  let free = 0
  for (const u of units) {
    if (placed.has(u)) continue
    while (free < SLOTS.length && taken.has(free)) free++
    if (free >= SLOTS.length) break
    taken.set(free, u)
  }
  return taken
}

const setSlot = (u: Unit, slot: number) => u.members.forEach((w) => { if (w.slot !== slot) updateWorkout(w.id, { slot }) })
const GROUP_DWELL = 220 // ms hovering over another exercise before letting go groups them

// Where a group's exercises fan out around its bubble: an arc that opens toward the middle of the screen.
function fan(slot: number, n: number) {
  const s = SLOTS[slot]
  const centre = s.left > 70 ? -125 : s.left < 42 ? -55 : -90
  const step = n > 5 ? 34 : 44
  return Array.from({ length: n }, (_, i) => {
    const a = (centre + (i - (n - 1) / 2) * step) * Math.PI / 180
    return { dx: Math.cos(a), dy: Math.sin(a) }
  })
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
  const units = unitsOf(workouts)
  const bySlot = placeAll(units)
  const slotOf = new Map<string, number>() // unit key and every member id -> slot
  for (const [i, u] of bySlot) { slotOf.set(u.key, i); u.members.forEach((w) => slotOf.set(w.id, i)) }
  const unitAt = (key: string) => [...bySlot.values()].find((u) => u.key === key)

  // Dragging a dot: it follows the finger, then glides into the nearest slot (swapping with whoever is there).
  // Held over another exercise for a moment, it offers to group with it instead.
  const [drag, setDrag] = useState<{ key: string; x: number; y: number } | null>(null)
  const press = useRef<{ key: string; x: number; y: number; moved: boolean } | null>(null)
  const nearest = useRef<number | null>(null)
  const justDragged = useRef(false)
  const [groupWith, setGroupWith] = useState<{ slot: number; ready: boolean } | null>(null)
  const dwell = useRef<number | null>(null)

  // A group bubble fans out its exercises the moment it's touched.
  const [ring, setRing] = useState<{ key: string; hover: number | null } | null>(null)
  const ringPress = useRef<{ key: string; cx: number; cy: number; w: number; h: number; dot: number } | null>(null)

  function pagePoint(e: PointerEvent<HTMLElement>) {
    const r = (e.currentTarget.offsetParent as HTMLElement).getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }
  }
  function closest(pt: { x: number; y: number; w: number; h: number }) {
    let best = 0, bestD = Infinity
    SLOTS.forEach((s, i) => {
      const d = Math.hypot(pt.x - (s.left / 100) * pt.w, pt.y - (s.top / 100) * pt.h)
      if (d < bestD) { bestD = d; best = i }
    })
    return { slot: best, dist: bestD }
  }
  function clearDwell() { if (dwell.current) { clearTimeout(dwell.current); dwell.current = null } }

  function onDotDown(e: PointerEvent<HTMLButtonElement>, key: string) {
    press.current = { key, x: e.clientX, y: e.clientY, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function startDrag(key: string) {
    nearest.current = slotOf.get(key) ?? null
    setRing(null)
    sound.pop()
  }
  function dragTo(e: PointerEvent<HTMLButtonElement>, key: string) {
    const pt = pagePoint(e)
    setDrag({ key, x: pt.x, y: pt.y })
    const { slot: n, dist } = closest(pt)
    if (n !== nearest.current) { nearest.current = n; sound.tick() }
    // over another exercise (not an empty slot, not itself): wait a beat, then offer to group
    const target = bySlot.get(n)
    const dot = e.currentTarget.offsetWidth
    const over = target && target.key !== key && dist < dot * 0.55
    if (!over) { clearDwell(); if (groupWith) setGroupWith(null); return }
    if (groupWith?.slot === n) return
    clearDwell()
    setGroupWith({ slot: n, ready: false })
    dwell.current = window.setTimeout(() => { setGroupWith({ slot: n, ready: true }); sound.pop() }, GROUP_DWELL)
  }
  function onDotMove(e: PointerEvent<HTMLButtonElement>) {
    const p = press.current
    if (!p) return
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) return
    if (!p.moved) { p.moved = true; startDrag(p.key) }
    dragTo(e, p.key)
  }
  function endDrag(e: PointerEvent<HTMLButtonElement>, key: string) {
    justDragged.current = true
    clearDwell()
    const ready = groupWith?.ready ? groupWith.slot : null
    setGroupWith(null)
    // trying a theme on: the dot can be dragged around, then glides back home
    if (getPreview()) { setDrag(null); sound.tap(); return }
    const me = unitAt(key)
    if (!me) { setDrag(null); return }
    if (ready !== null) {
      for (const [i, x] of bySlot) setSlot(x, i)
      const target = bySlot.get(ready)!
      const id = target.members.length > 1 ? target.key : me.members.length > 1 ? me.key : 'g' + Date.now().toString(36)
      ;[...me.members, ...target.members].forEach((w) => updateWorkout(w.id, { group: id, slot: ready }))
      setDrag(null); setChosen(null)
      sound.tap()
      return
    }
    const to = closest(pagePoint(e)).slot
    const from = slotOf.get(key)
    const other = bySlot.get(to)
    // pin every unit to where it is now so nothing else shifts, then move/swap the two
    for (const [i, u] of bySlot) setSlot(u, i)
    if (other && other.key !== key && from !== undefined) setSlot(other, from)
    setSlot(me, to)
    setDrag(null)
    sound.tap()
  }
  function onDotUp(e: PointerEvent<HTMLButtonElement>) {
    const p = press.current
    press.current = null
    if (!p?.moved) return
    endDrag(e, p.key)
  }

  // group bubble: touch fans it out; slide onto an exercise and let go to pick it;
  // drag well past the fan to move the whole bubble instead
  function onGroupDown(e: PointerEvent<HTMLButtonElement>, u: Unit) {
    if (chosen && u.members.some((w) => w.id === chosen)) return // armed: a tap opens it
    const el = e.currentTarget, page = el.offsetParent as HTMLElement
    const r = page.getBoundingClientRect(), b = el.getBoundingClientRect()
    ringPress.current = { key: u.key, cx: b.left + b.width / 2 - r.left, cy: b.top + b.height / 2 - r.top, w: r.width, h: r.height, dot: b.width }
    press.current = { key: u.key, x: e.clientX, y: e.clientY, moved: false }
    el.setPointerCapture(e.pointerId)
    setChosen(null)
    setRing({ key: u.key, hover: null })
    sound.pop()
  }
  function onGroupMove(e: PointerEvent<HTMLButtonElement>, u: Unit) {
    const p = press.current, rp = ringPress.current
    if (!p) return
    if (p.moved) { dragTo(e, u.key); return }
    if (!rp) return
    const pt = pagePoint(e)
    const R = rp.dot * 1.15
    const far = Math.hypot(pt.x - rp.cx, pt.y - rp.cy)
    if (far > R + rp.dot * 0.9) { p.moved = true; ringPress.current = null; startDrag(u.key); dragTo(e, u.key); return }
    const spots = fan(slotOf.get(u.key)!, u.members.length)
    let hover: number | null = null, best = rp.dot * 0.45
    spots.forEach((s, i) => {
      const d = Math.hypot(pt.x - (rp.cx + s.dx * R), pt.y - (rp.cy + s.dy * R))
      if (d < best) { best = d; hover = i }
    })
    if (hover !== ring?.hover) { if (hover !== null) sound.tick(); setRing({ key: u.key, hover }) }
  }
  function onGroupUp(e: PointerEvent<HTMLButtonElement>, u: Unit) {
    const p = press.current
    press.current = null
    ringPress.current = null
    if (p?.moved) { endDrag(e, u.key); return }
    if (ring?.hover != null) { setChosen(u.members[ring.hover].id); setRing(null); justDragged.current = true; sound.tap() }
    // let go on the bubble itself: the fan stays open, tap an exercise to pick it
  }

  // Take the armed exercise out of its group, into the nearest free slot.
  function ungroup(id: string) {
    const slot = slotOf.get(id)
    if (slot === undefined) return
    const u = bySlot.get(slot)!
    const free = SLOTS.map((s, i) => ({ i, d: Math.hypot(s.left - SLOTS[slot].left, s.top - SLOTS[slot].top) }))
      .filter((x) => !bySlot.has(x.i)).sort((a, b) => a.d - b.d)[0]
    for (const [i, x] of bySlot) setSlot(x, i)
    updateWorkout(id, { group: undefined, slot: free ? free.i : undefined })
    if (u.members.length === 2) { const rest = u.members.find((w) => w.id !== id)!; updateWorkout(rest.id, { group: undefined }) }
    setChosen(null)
    sound.tap()
  }
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false) // flags stay folded until the arrow is tapped
  const lastTap = useRef(0)
  // While an icon is picked, a double tap on "+" or a press anywhere else means "never mind".
  function tapAdd() {
    const now = Date.now()
    if (pickedIcon && now - lastTap.current < 400) setPickedIcon(null)
    lastTap.current = now
  }
  const prefs = usePrefs()
  const email = useEmail()
  const skin = useSkin()

  return (
    <main className="page" aria-label="Page A"
      onPointerDownCapture={(e) => { if (pickedIcon && !(e.target as Element).closest('.add')) setPickedIcon(null) }}
      onClick={(e) => { if (e.target === e.currentTarget) { setChosen(null); setSettingsOpen(false); setRing(null) } }}>
      <ThemeScene skin={skin} />
      <button className="btn pill" id="a2" aria-label={t('Book')} onClick={onOpenBook}>
        <Icon name="book" size="46%" />
      </button>

      {/* empty slots: the first four always, every one while dragging */}
      {SLOTS.map((s, i) => (bySlot.has(i) || (i >= 4 && !drag)) ? null : (
        <span key={'slot' + i} className={`btn circle dot empty${drag && nearest.current === i ? ' target' : ''}`}
          style={{ left: `${s.left}%`, top: `${s.top}%` }} aria-hidden="true" />
      ))}

      {[...bySlot].map(([i, u]) => {
        const s = SLOTS[i]
        const dragging = drag?.key === u.key
        const isGroup = u.members.length > 1
        const armedMember = chosen !== null && !dragging ? u.members.find((w) => w.id === chosen) : undefined
        const merging = groupWith?.slot === i && !dragging
        const fanned = ring?.key === u.key && !dragging
        const pos = { left: dragging ? drag.x : `${s.left}%`, top: dragging ? drag.y : `${s.top}%`, animationDelay: armedMember ? undefined : `${-i * 0.7}s` }
        const cls = `btn circle dot filled float${armedMember ? ' armed' : ''}${dragging ? ' dragging' : ''}${isGroup ? ' group' : ''}${merging ? (groupWith!.ready ? ' merge ready' : ' merge') : ''}${fanned ? ' fanned' : ''}`
        if (!isGroup) {
          const w = u.members[0]
          return (
            <button
              key={u.key}
              className={cls}
              style={pos}
              aria-label={`${w.exercise || 'Workout'} ${w.letter}, drag to move or onto another to group`}
              onPointerDown={(e) => onDotDown(e, u.key)}
              onPointerMove={onDotMove}
              onPointerUp={onDotUp}
              onPointerCancel={() => { press.current = null; setDrag(null); clearDwell(); setGroupWith(null) }}
              onClick={() => { if (justDragged.current) { justDragged.current = false; return } if (chosen === w.id) onOpenDot(w.id); else setChosen(w.id) }}
            >
              {armedMember
                ? <Icon name="play" size="38%" strokeWidth={2} />
                : <WorkoutMark icon={w.icon} letter={w.letter} size="1.15em" />}
            </button>
          )
        }
        return (
          <button
            key={u.key}
            className={cls}
            style={pos}
            aria-label={`Group of ${u.members.length}: ${u.members.map((w) => w.exercise || 'Workout').join(', ')}. Touch to open, slide onto one to pick`}
            onPointerDown={(e) => onGroupDown(e, u)}
            onPointerMove={(e) => onGroupMove(e, u)}
            onPointerUp={(e) => onGroupUp(e, u)}
            onPointerCancel={() => { press.current = null; ringPress.current = null; setDrag(null); clearDwell(); setGroupWith(null) }}
            onClick={() => { if (justDragged.current) { justDragged.current = false; return } if (armedMember) onOpenDot(armedMember.id) }}
          >
            {armedMember
              ? <Icon name="play" size="38%" strokeWidth={2} />
              : (
                <span className={`stack n${Math.min(3, u.members.length)}`}>
                  {u.members.slice(0, 3).map((w) => <i key={w.id}><WorkoutIcon k={w.icon} size="62%" strokeWidth={2.2} /></i>)}
                </span>
              )}
            {!armedMember && <span className="count">{u.members.length}</span>}
          </button>
        )
      })}

      {groupWith && drag && (
        <span className={`group-pop${groupWith.ready ? ' on' : ''}`} style={{ left: `${SLOTS[groupWith.slot].left}%`, top: `calc(${SLOTS[groupWith.slot].top}% - min(18.7cqw, 10.6cqh) / 2 - 22px)` }}>{t('Group')}</span>
      )}

      {ring && !drag && (() => {
        const slot = slotOf.get(ring.key)
        const u = slot !== undefined ? bySlot.get(slot) : undefined
        if (!u || slot === undefined) return null
        return fan(slot, u.members.length).map((p, i) => {
          const w = u.members[i]
          return (
            <button key={w.id} className={`btn circle fan-dot${ring.hover === i ? ' hover' : ''}`}
              style={{ left: `calc(${SLOTS[slot].left}% + ${p.dx} * min(18.7cqw, 10.6cqh) * 1.15)`, top: `calc(${SLOTS[slot].top}% + ${p.dy} * min(18.7cqw, 10.6cqh) * 1.15)`, animationDelay: `${i * 30}ms` }}
              aria-label={w.exercise || t('Workout')}
              onClick={() => { setChosen(w.id); setRing(null); sound.tap() }}
            >
              <WorkoutMark icon={w.icon} letter={w.letter} size="1em" />
              {ring.hover === i && <span className="fan-name">{w.exercise || t('Untitled')}</span>}
            </button>
          )
        })
      })()}

      {chosen !== null && !drag && slotOf.has(chosen) && (
        <>
        <span className="dot-name" style={{ right: `calc(${100 - SLOTS[slotOf.get(chosen)!].left}% + min(13cqw, 7.4cqh) / 2 + 8px)`, top: `calc(${SLOTS[slotOf.get(chosen)!].top}% - min(18.7cqw, 10.6cqh) / 2 - 34px)` }}>
          {workouts.find((w) => w.id === chosen)?.exercise || t('Untitled')}
        </span>
        <button
          className="btn circle choice"
          style={{ left: `${SLOTS[slotOf.get(chosen)!].left}%`, top: `calc(${SLOTS[slotOf.get(chosen)!].top}% - min(18.7cqw, 10.6cqh) / 2 - 34px)` }}
          aria-label={t('Edit workout')}
          onClick={() => onEdit(chosen)}
        >
          <Icon name="write" size="48%" />
        </button>
        {(bySlot.get(slotOf.get(chosen)!)?.members.length ?? 1) > 1 && (
          <button
            className="btn circle choice ungroup"
            style={{ left: `calc(${SLOTS[slotOf.get(chosen)!].left}% + min(13cqw, 7.4cqh) + 6px)`, top: `calc(${SLOTS[slotOf.get(chosen)!].top}% - min(18.7cqw, 10.6cqh) / 2 - 34px)` }}
            aria-label={t('Take out of group')}
            onClick={() => ungroup(chosen)}
          >
            <Icon name="ungroup" size="50%" />
          </button>
        )}
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
        <div className="settings" role="dialog" aria-label={t('Settings')}>
          <h2>{t('Appearance')}</h2>
          <div className="seg" role="radiogroup" aria-label="Theme">
            {(['light', 'dark', 'auto'] as const).map((m) => (
              <button key={m} role="radio" aria-checked={prefs.theme === m} className={prefs.theme === m ? 'on' : undefined}
                onClick={() => setPrefs({ theme: m })}>{t(m[0].toUpperCase() + m.slice(1))}</button>
            ))}
          </div>
          <div className="set-row">
            <span>{t('Sounds')}</span>
            <button className={`switch${prefs.sound ? ' on' : ''}`} role="switch" aria-checked={prefs.sound} aria-label={t('Sounds')}
              onClick={() => setPrefs({ sound: !prefs.sound })}>
              <span className="knob" />
            </button>
          </div>
          <button className={`set-row themes-link lang-toggle${langOpen ? ' open' : ''}`} aria-expanded={langOpen} onClick={() => setLangOpen(!langOpen)}>
            <span>{t('Language')}</span>
            <span className="lang-now">{LANGS.find((l) => l.key === prefs.lang)?.name}</span>
            <span className="chev"><Icon name="back" size="18px" /></span>
          </button>
          {langOpen && <div className="lang-flags"><LangPicker /></div>}
          <button className="set-row themes-link" onClick={onThemes}>
            <span>{t('Themes')}</span>
            <span className="chev"><Icon name="back" size="18px" /></span>
          </button>
          <div className="set-row account">
            <span className="who">{email ?? t('Signed in')}</span>
            <button className="logout-btn" onClick={() => { setSettingsOpen(false); signOut() }}>{t('Log out')}</button>
          </div>
        </div>
      )}

      <button className={`btn circle mid gear${settingsOpen ? ' open' : ''}`} style={{ left: '86%', top: '90%' }}
        aria-label={t('Settings')} aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>
        <Icon name="gear" size="44%" />
      </button>
    </main>
  )
}
