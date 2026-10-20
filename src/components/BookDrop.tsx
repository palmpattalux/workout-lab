import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { WorkoutMark } from './icons'
import { useSessions, useWorkouts } from '../lib/store'
import { day, time } from '../lib/format'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'

// The book button on page A. Tap: the book. Press and drag down: the 5 latest sessions drop out
// under it; dragging on past the last one brings older ones. Let go on one to open it
// (Book > Sessions with it open); let go anywhere else to close the list.
const SHOWN = 5
const DRAG = 10 // px down before the list opens (less is still a tap)

export default function BookDrop({ className, onOpenBook, onOpenSession, children }: {
  className: string
  onOpenBook: () => void
  onOpenSession: (id: string) => void
  children: ReactNode
}) {
  const sessions = useSessions()
  const workouts = useWorkouts()
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const start = useRef<{ y: number; id: number } | null>(null)
  const dragged = useRef(false)
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(SHOWN)
  const [hover, setHover] = useState<number | null>(null)
  const recent = [...sessions].reverse()

  function down(e: PointerEvent<HTMLButtonElement>) {
    start.current = { y: e.clientY, id: e.pointerId }
    dragged.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    if (!start.current) return
    if (!open) {
      if (e.clientY - start.current.y < DRAG || recent.length === 0) return
      dragged.current = true
      setOpen(true)
      setCount(Math.min(SHOWN, recent.length))
      sound.pop()
      return
    }
    // the row under the finger; below the last row, more rows come in one by one
    const rows = list.current ? [...list.current.querySelectorAll<HTMLElement>('li:not(.more)')] : []
    const i = rows.findIndex((r) => { const b = r.getBoundingClientRect(); return e.clientY >= b.top && e.clientY < b.bottom })
    const last = list.current?.lastElementChild?.getBoundingClientRect()
    if (last && e.clientY >= last.bottom && count < recent.length) { setCount(count + 1); setHover(count); sound.tick(); return }
    const next = i >= 0 ? i : null
    if (next !== hover) { setHover(next); if (next !== null) sound.tick() }
  }
  function up() {
    const picked = open && hover !== null ? recent[hover] : null
    start.current = null
    setOpen(false); setHover(null)
    if (picked) onOpenSession(picked.id)
  }
  function click() {
    if (dragged.current) { dragged.current = false; return }
    onOpenBook()
  }

  return (
    <>
      <button ref={btn} className={className + (recent.length && !open && !className.includes('just-saved') ? ' nudge' : '')} id="a2" aria-label={t('Book. Drag down for recent sessions')}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click}>
        {children}
      </button>
      {open && (
        <ol ref={list} className="book-drop" aria-label={t('Recent sessions')}>
          {recent.slice(0, count).map((s, i) => (
            <li key={s.id} className={i === hover ? 'on' : undefined}>
              <span className="marks">
                {s.order.map((id) => {
                  const info = s.snap?.[id] ?? workouts.find((w) => w.id === id)
                  return info ? <WorkoutMark key={id} icon={info.icon} letter={info.letter} size="1em" /> : null
                })}
              </span>
              <span className="when"><b>{day(s.startedAt)}</b><small>{time(s.startedAt)}</small></span>
            </li>
          ))}
          {count < recent.length && <li className="more" aria-hidden="true">{t('Keep dragging for more')}</li>}
        </ol>
      )}
    </>
  )
}
