import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { sound } from '../lib/sound'
import { getPreview, previewBlocked } from '../lib/theme'

const SIZE = 54 // px, each popped-up button
const DRAG_PX = 8

export type MenuItem = { key: string; node: ReactNode; label: string; current?: boolean; num?: number }

// A round button with two ways in, no holding:
// - drag from it: buttons pop up in an arc; slide onto one and let go to pick it
// - tap it: a list of every item opens above it; tap one to pick, anywhere else to close
export default function HoldMenu({ items, onPick, onOpenChange, className, style, ariaLabel, children }: {
  items: MenuItem[]
  onPick: (key: string) => void
  onOpenChange?: (open: boolean) => void
  className: string
  style: CSSProperties
  ariaLabel: string
  children: ReactNode
}) {
  const btn = useRef<HTMLButtonElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const [spots, setSpots] = useState<{ x: number; y: number }[] | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [list, setList] = useState<{ x: number; bottom: number } | null>(null)
  const origin = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const isOpen = !!spots || !!list
  useEffect(() => { onOpenChange?.(isOpen) }, [isOpen])

  function geometry() {
    const el = btn.current!
    const page = el.offsetParent!.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    return { page, r, cx: r.left - page.left + r.width / 2, cy: r.top - page.top + r.height / 2 }
  }

  function open() {
    if (items.length === 0) return
    const { page, r, cx, cy } = geometry()
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
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!start.current) return
    if (!spots) {
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > DRAG_PX) { setList(null); open() }
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
    start.current = null
    setSpots(null)
    setHover(null)
  }

  function pick(key: string) {
    if (getPreview()) { previewBlocked(); return }
    onPick(key)
  }

  function release() {
    if (!start.current) return
    const dragged = !!spots
    const picked = spots && hover !== null ? items[hover].key : null
    cancel()
    if (dragged) { if (picked) pick(picked); return }
    // a tap: open (or close) the list
    if (list) { setList(null); return }
    if (items.length === 0) return
    const { page, cx, cy, r } = geometry()
    setList({ x: Math.max(120, Math.min(page.width - 120, cx)), bottom: page.height - cy + r.height / 2 + 12 })
    sound.pop()
  }

  return (
    <>
      <button
        ref={btn}
        className={`btn circle holdable ${className}${spots || list ? ' holding' : ''}`}
        style={style}
        aria-label={ariaLabel}
        aria-expanded={!!list}
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

      {list && (
        <>
          <div className="menu-scrim" onPointerDown={() => setList(null)} />
          <ul className="menu-list" role="menu" style={{ left: list.x, bottom: list.bottom }}>
            {items.map((it) => (
              <li key={it.key}>
                <button role="menuitem" className={it.current ? 'current' : undefined} onClick={() => { setList(null); pick(it.key) }}>
                  {it.num !== undefined && <i className="ml-num">{it.num}</i>}
                  <span className="ml-mark">{it.node}</span>
                  <span className="ml-name">{it.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
