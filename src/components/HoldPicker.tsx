import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { sound } from '../lib/sound'
import { getPreview, previewBlocked } from '../lib/theme'

const HOLD_MS = 280
const SCROLL_MS = 130

export type PickerOption = { key: string; node: ReactNode; label?: string }

// A round button that, when pressed and held, opens a vertical line of options
// above itself. Sliding the finger up moves through them; letting go picks one.
// Used for B4 reps (1..25), the weights (15, scrolling on up to 30), and the
// "+" workout icon and body-part letter.
//
// `visible` shows only that many options at once. Holding the finger at the top
// of the line keeps scrolling to higher options; at the bottom, back down.
export default function HoldPicker({ options, visible, start = 0, side = 'above', instant, onTap, onPick, onChange, maxStep, className, style, ariaLabel, children }: {
  options: PickerOption[]
  visible?: number
  start?: number // option the line opens on (e.g. the weight already set), so long lists don't start from the bottom
  side?: 'above' | 'left' // 'left' for buttons near the top of the screen
  instant?: boolean // open as soon as the finger drags up, no hold
  onTap?: () => void // pressed and let go without opening
  onPick: (index: number) => void
  onChange?: (index: number) => void
  maxStep: number
  className: string
  style: CSSProperties
  ariaLabel: string
  children: ReactNode
}) {
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | null>(null)
  const scroller = useRef<number | null>(null)
  const startY = useRef(0)
  const [ruler, setRuler] = useState<{ left: number; top: number; step: number } | null>(null)
  const [offset, setOffset] = useState(0)
  const [local, setLocal] = useState(0)
  const pos = useRef({ offset: 0, local: 0 })
  const base = useRef(0)
  const total = options.length
  const shown = Math.min(visible ?? total, total)

  useEffect(() => () => stopScroll(), [])

  function update(nextOffset: number, nextLocal: number) {
    const before = pos.current.offset + pos.current.local
    pos.current = { offset: nextOffset, local: nextLocal }
    setOffset(nextOffset)
    setLocal(nextLocal)
    if (nextOffset + nextLocal !== before) {
      if (!getPreview()) onChange?.(nextOffset + nextLocal)
      sound.tick()
    }
  }

  function open() {
    const el = btn.current!
    const page = el.offsetParent!.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (side === 'left') {
      // line sits beside the button, option 1 level with its center
      const cy = r.top - page.top + r.height / 2
      const step = Math.max(10, Math.min(maxStep, (cy - 8) / shown))
      setRuler({ left: r.left - page.left - 50, top: cy + step / 2 - step * shown, step })
    } else {
      const step = Math.max(10, Math.min(maxStep, (r.top - page.top - 16) / shown))
      setRuler({ left: r.left - page.left + r.width / 2 - 22, top: r.top - page.top - step * shown - 4, step })
    }
    const at = Math.max(0, Math.min(total - 1, start))
    const o = Math.max(0, Math.min(total - shown, at - 3))
    base.current = at - o
    pos.current = { offset: o, local: at - o }
    setOffset(o)
    setLocal(at - o)
    if (!getPreview()) onChange?.(at)
    sound.pop()
  }

  function stopScroll() {
    if (scroller.current) { clearInterval(scroller.current); scroller.current = null }
  }

  function startScroll(dir: 1 | -1) {
    if (scroller.current) return
    scroller.current = window.setInterval(() => {
      const { offset: o, local: l } = pos.current
      const next = o + dir
      if (next < 0 || next + shown > total) return stopScroll()
      update(next, l)
    }, SCROLL_MS)
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    startY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
    if (instant) return
    timer.current = window.setTimeout(() => { timer.current = null; open() }, HOLD_MS)
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!ruler) {
      if (instant) { if (startY.current - e.clientY > 6) open(); return }
      // moved before the hold registered: treat it as a scroll and cancel
      if (timer.current && Math.abs(e.clientY - startY.current) > 12) cancel()
      return
    }
    const raw = base.current + (startY.current - e.clientY) / ruler.step
    const l = Math.max(0, Math.min(shown - 1, Math.round(raw)))
    if (l !== pos.current.local) update(pos.current.offset, l)
    // at either end of a scrolling line, keep going while the finger stays there
    if (shown < total && raw >= shown - 1) startScroll(1)
    else if (shown < total && raw <= 0 && pos.current.offset > 0) startScroll(-1)
    else stopScroll()
  }

  function cancel() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    stopScroll()
    setRuler(null)
  }

  function release() {
    const picked = ruler ? pos.current.offset + pos.current.local : null
    const held = !!timer.current
    cancel()
    // trying a theme on: the drag can be felt, but nothing is set
    if (getPreview()) { if (picked !== null) previewBlocked(); return }
    if (picked !== null) onPick(picked)
    else if (instant || held) onTap?.()
  }

  const current = offset + local
  const label = ruler ? options[current].label : undefined
  const windowed = options.slice(offset, offset + shown)

  return (
    <>
      <button
        ref={btn}
        className={`btn circle holdable ${className}${ruler ? ' holding' : ''}`}
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

      {ruler && (
        <div className={`ruler${shown < total && offset + shown < total ? ' more' : ''}`} style={{ left: ruler.left, top: ruler.top, height: ruler.step * shown }}>
          {windowed.map((o, i) => (
            <span key={o.key} className={i === local ? 'on' : undefined}>{o.node}</span>
          ))}
          <div className="fill" style={{ height: (local + 1) * ruler.step }} />
          {label && (
            <div className={`tag${side === 'left' ? ' left' : ''}`} style={{ bottom: (local + 0.5) * ruler.step }}>{label}</div>
          )}
        </div>
      )}
    </>
  )
}
