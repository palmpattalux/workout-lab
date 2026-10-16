import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { sound } from '../lib/sound'
import { getPreview, previewBlocked } from '../lib/theme'

const HOLD_MS = 280
const SIZE = 54 // px, each popped-up button

export type MenuItem = { key: string; node: ReactNode; label: string; current?: boolean; num?: number }

// A round button that, when pressed and held, pops buttons up in an arc around
// it. Slide onto one and let go to pick it. A quick tap calls onTap instead.
export default function HoldMenu({ items, onPick, onTap, className, style, ariaLabel, children }: {
  items: MenuItem[]
  onPick: (key: string) => void
  onTap?: () => void
  className: string
  style: CSSProperties
  ariaLabel: string
  children: ReactNode
}) {
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | null>(null)
  const start = useRef({ x: 0, y: 0 })
  const [spots, setSpots] = useState<{ x: number; y: number }[] | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const origin = useRef({ x: 0, y: 0, px: 0, py: 0 })

  function open() {
    if (items.length === 0) return
    const el = btn.current!
    const page = el.offsetParent!.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const cx = r.left - page.left + r.width / 2
    const cy = r.top - page.top + r.height / 2
    origin.current = { x: cx, y: cy, px: page.left, py: page.top }
    // spread over the upper half-circle, wider when there are more items
    const n = items.length
    const radius = Math.max(r.width / 2 + SIZE * 0.9, (n * SIZE * 1.1) / Math.PI)
    const room = Math.min(cx, page.width - cx) - SIZE / 2 - 4
    setSpots(items.map((_, i) => {
      const a = Math.PI * (n === 1 ? 0.5 : 0.92 - (0.84 * i) / (n - 1))
      return { x: cx + Math.max(-room, Math.min(room, radius * Math.cos(a))), y: cy - radius * Math.sin(a) }
    }))
    setHover(null)
    sound.pop()
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    start.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    timer.current = window.setTimeout(() => { timer.current = null; open() }, HOLD_MS)
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!spots) {
      if (timer.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 12) cancel()
      return
    }
    const x = e.clientX - origin.current.px
    const y = e.clientY - origin.current.py
    let best: number | null = null
    let bestD = SIZE * 0.85
    spots.forEach((s, i) => {
      const d = Math.hypot(s.x - x, s.y - y)
      if (d < bestD) { bestD = d; best = i }
    })
    if (best !== hover && best !== null) sound.tick()
    setHover(best)
  }

  function cancel() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setSpots(null)
    setHover(null)
  }

  function release() {
    const wasTap = timer.current !== null
    const picked = spots && hover !== null ? items[hover].key : null
    cancel()
    if (getPreview()) { if (picked) previewBlocked(); return }
    if (picked) onPick(picked)
    else if (wasTap) onTap?.()
  }

  return (
    <>
      <button
        ref={btn}
        className={`btn circle holdable ${className}${spots ? ' holding' : ''}`}
        style={style}
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        {children}
      </button>

      {spots && items.map((it, i) => (
        <div
          key={it.key}
          className={`pop${hover === i ? ' on' : ''}${it.current ? ' current' : ''}`}
          style={{ left: spots[i].x, top: spots[i].y, width: SIZE, height: SIZE, animationDelay: `${i * 18}ms` }}
        >
          {it.node}
          {it.num !== undefined && <span className="pnum">{it.num}</span>}
        </div>
      ))}
      {spots && hover !== null && (
        <div className="pop-label" style={{ left: origin.current.x, top: Math.min(...spots.map((s) => s.y)) - SIZE / 2 - 30 }}>
          {items[hover].label}
        </div>
      )}
    </>
  )
}
