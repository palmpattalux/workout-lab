import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { WorkoutMark } from './icons'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'
import type { Workout } from '../lib/store'

// Page B, once a session holds more than one exercise: a bar of their icons above the switch
// button, the one on screen a little bigger and shaded. Tap another, or slide along the bar and
// let go on one, to go back to it (its name flashes, in case you forget which is which).
// Tap the current one for its name and "Remove", to take out an exercise added by mistake
// (its sets go too, so nothing of it is saved).
let lastSeen: string | null = null
const DRAG_PX = 8

export default function SessionBar({ items, current, hidden, onGo, onRemove }: {
  items: Workout[]
  current: string
  hidden?: boolean
  onGo: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [flash, setFlash] = useState(0)
  const [asking, setAsking] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const drag = useRef<{ x: number; id: string | null; moved: boolean } | null>(null)
  useEffect(() => {
    if (lastSeen !== null && lastSeen !== current) setFlash(Date.now())
    lastSeen = current
    setAsking(false)
  }, [current])
  useEffect(() => { if (hidden) setAsking(false) }, [hidden])

  const markAt = (x: number, y: number) =>
    (document.elementFromPoint(x, y)?.closest('.sb-mark') as HTMLElement | null)?.dataset.id ?? null

  function down(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, id: markAt(e.clientX, e.clientY), moved: false }
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.abs(e.clientX - d.x) > DRAG_PX) { d.moved = true; setAsking(false) }
    if (!d.moved) return
    const id = markAt(e.clientX, e.clientY)
    if (id && id !== hover) sound.tick()
    if (id) setHover(id)
  }
  function up() {
    const d = drag.current
    drag.current = null
    const picked = d?.moved ? hover : d?.id ?? null
    setHover(null)
    if (!d || !picked) return
    if (picked === current) { if (!d.moved) setAsking(!asking); return }
    sound.tick()
    onGo(picked)
  }

  const named = items.find((w) => w.id === (hover ?? current))
  return (
    <div className={`session-bar${hidden ? ' away' : ''}`} role="toolbar" aria-label={t('Exercises in this session')}>
      {asking && named ? (
        <div className="sb-name ask">
          <span>{named.exercise || t('Untitled')}</span>
          <button className="sb-remove" onClick={() => { setAsking(false); sound.pop(); onRemove(named.id) }}>{t('Remove')}</button>
        </div>
      ) : hover && named ? (
        <div className="sb-name"><span>{named.exercise || t('Untitled')}</span></div>
      ) : flash > 0 && named ? (
        <div key={flash} className="sb-name flash" aria-live="polite"><span>{named.exercise || t('Untitled')}</span></div>
      ) : null}
      <div className="sb-row" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; setHover(null) }}>
        {items.map((w) => (
          <button key={w.id} data-id={w.id}
            className={`sb-mark${w.id === current ? ' on' : ''}${w.id === hover ? ' hover' : ''}${w.color ? ' tinted tint-' + w.color : ''}`}
            aria-label={w.exercise || t('Untitled')} aria-pressed={w.id === current}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (w.id === current) setAsking(!asking); else onGo(w.id) } }}>
            <WorkoutMark icon={w.icon} letter={w.letter} size="1em" />
          </button>
        ))}
      </div>
    </div>
  )
}
