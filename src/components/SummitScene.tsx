import { useEffect, useId, useRef } from 'react'
import { sound } from '../lib/sound'

// "To the Top" theme: a Chinese ink painting of tall stone pillars rising out of the mist,
// one great mountain in the middle. On page B, during a session, a small figure pushes a
// boulder up a switchback trail on that mountain: every next set moves them higher.
// One SVG on a 390 x 844 canvas, sliced to fill the page, so the trail lines up everywhere.

const W = 390, H = 844
const rand = (k: number) => { const x = Math.sin(k * 127.1) * 43758.5453; return x - Math.floor(x) }
const live = (el: Element | null) => !!el && !el.closest('.theme-art')

// A stone pillar: straight-ish sides that wander a little and a rounded crown.
function pillar(cx: number, w: number, top: number, base: number, k: number) {
  const pts: string[] = []
  const r = w * 0.5
  const side = (y: number, s: number) => {
    const t = (y - top) / (base - top)
    const half = r * (0.82 + 0.18 * t)
    return cx + s * half + Math.sin(y * 0.045 + k * 3) * w * 0.07 + Math.sin(y * 0.11 + k) * w * 0.035
  }
  for (let y = base; y > top + r; y -= 14) pts.push(`${side(y, -1).toFixed(1)} ${y.toFixed(1)}`)
  const l = side(top + r, -1), rr = side(top + r, 1)
  const tilt = (rand(k) - 0.5) * w * 0.3
  let d = `M${pts.join(' L')} L${l.toFixed(1)} ${(top + r).toFixed(1)} C${l.toFixed(1)} ${(top + r * 0.2).toFixed(1)} ${(cx + tilt - r * 0.5).toFixed(1)} ${top} ${(cx + tilt).toFixed(1)} ${top} C${(cx + tilt + r * 0.5).toFixed(1)} ${top} ${rr.toFixed(1)} ${(top + r * 0.3).toFixed(1)} ${rr.toFixed(1)} ${(top + r).toFixed(1)}`
  for (let y = top + r + 14; y <= base; y += 14) d += ` L${side(y, 1).toFixed(1)} ${y.toFixed(1)}`
  return d + ` L${side(base, 1).toFixed(1)} ${base} Z`
}

// [x, width, top, base]
const FAR: [number, number, number, number][] = [
  [24, 40, 330, 700], [72, 22, 410, 700], [300, 28, 300, 700], [346, 46, 236, 700], [386, 24, 372, 700],
]
const NEAR: [number, number, number, number][] = [
  [8, 50, 452, 860], [384, 50, 470, 860],
]

// The great mountain, and the trail up its face (feet of the climber follow it).
const PEAK: [number, number] = [205, 132]
const MOUNTAIN = `M-20 ${H} L-20 700 C10 640 28 540 44 460 C58 380 80 320 118 260 C150 214 178 170 ${PEAK[0] - 6} ${PEAK[1] + 4}
  C${PEAK[0] + 4} ${PEAK[1] - 2} ${PEAK[0] + 14} ${PEAK[1] + 2} 226 150 C262 196 286 260 306 330 C326 400 352 470 410 560 L410 ${H} Z`
const TRAIL: [number, number][] = [[46, 690], [338, 620], [64, 456], [256, 418], [92, 300], [186, 200], [PEAK[0] - 14, PEAK[1] + 8]]
export const SUMMIT_STEPS = 12

const segs = TRAIL.slice(1).map((p, i) => {
  const a = TRAIL[i], dx = p[0] - a[0], dy = p[1] - a[1]
  return { a, dx, dy, len: Math.hypot(dx, dy) }
})
const TRAIL_LEN = segs.reduce((s, g) => s + g.len, 0)
function at(dist: number) {
  let d = Math.max(0, Math.min(TRAIL_LEN, dist))
  for (const g of segs) {
    if (d <= g.len || g === segs[segs.length - 1]) {
      const t = g.len ? Math.min(1, d / g.len) : 0
      const dir = g.dx >= 0 ? 1 : -1
      return { x: g.a[0] + g.dx * t, y: g.a[1] + g.dy * t, dir, angle: Math.atan2(g.dy, g.dx * dir) * 180 / Math.PI }
    }
    d -= g.len
  }
  return { x: TRAIL[0][0], y: TRAIL[0][1], dir: 1, angle: 0 }
}
// Where the climber rests after each set: evenly spaced, nudged so they never stop
// behind a button on page B (set number, arrows, load, reps, switcher).
const KEEP_CLEAR: [number, number, number][] = [[195, 285, 46], [330, 365, 52], [58, 365, 52], [137, 541, 40], [268, 541, 40], [203, 752, 52]]
const clear = (d: number) => {
  const p = at(d), cx = p.x + p.dir * 10, cy = p.y - 16
  return KEEP_CLEAR.every(([x, y, r]) => Math.hypot(cx - x, cy - y) > r + 26)
}
const STOPS = Array.from({ length: SUMMIT_STEPS + 1 }, (_, k) => {
  const d = k / SUMMIT_STEPS * TRAIL_LEN
  if (k === 0 || k === SUMMIT_STEPS) return d
  for (let o = 0; o < 70; o += 3) for (const s of [-1, 1]) if (clear(d + s * o)) return d + s * o
  return d
})
const trailD = 'M' + TRAIL.map((p) => p.join(' ')).join(' L')

// small pines clinging to the cliffs, a classic of these paintings
function Pine({ x, y, s, flip }: { x: number; y: number; s: number; flip?: boolean }) {
  return (
    <g className="tt-pine" transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path className="tt-trunk" d="M0 0 C-2 -6 3 -10 1 -18 C0 -22 4 -26 6 -28" />
      <ellipse cx="7" cy="-28" rx="9" ry="2.6" />
      <ellipse cx="-1" cy="-20" rx="8" ry="2.4" />
      <ellipse cx="6" cy="-13" rx="7" ry="2.2" />
    </g>
  )
}

function Painting({ gid, climb }: { gid: string; climb?: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id={gid + 'far'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 'var(--tt-far)' }} />
          <stop offset=".6" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id={gid + 'near'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 'var(--tt-near)' }} />
          <stop offset=".8" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id={gid + 'main'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 'var(--tt-main)' }} />
          <stop offset=".45" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 'calc(var(--tt-main) * .45)' }} />
          <stop offset=".95" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id={gid + 'side'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 0 }} />
          <stop offset=".55" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: 'var(--tt-ink)', stopOpacity: 'calc(var(--tt-main) * .5)' }} />
        </linearGradient>
      </defs>
      <circle className="tt-sun" cx="328" cy="94" r="25" />
      <g fill={`url(#${gid}far)`}>{FAR.map(([x, w, t, b], i) => <path key={i} d={pillar(x, w, t, b, i + 1)} />)}</g>
      <path d={MOUNTAIN} fill={`url(#${gid}main)`} />
      <path d={MOUNTAIN} fill={`url(#${gid}side)`} />
      {/* texture strokes down the face, like dry-brush ink */}
      <g className="tt-cun">
        <path d="M150 222 C138 300 132 380 126 470" /><path d="M188 176 C180 250 176 300 178 360" />
        <path d="M232 168 C250 230 262 300 268 380" /><path d="M110 300 C96 360 90 420 88 500" />
      </g>
      <g fill={`url(#${gid}near)`}>{NEAR.map(([x, w, t, b], i) => <path key={i} d={pillar(x, w, t, b, i + 11)} />)}</g>
      <Pine x={226} y={150} s={0.9} />
      <Pine x={118} y={262} s={0.7} flip />
      <Pine x={346} y={238} s={0.6} flip />
      {climb && <path className="tt-trail" d={trailD} />}
    </>
  )
}

// mist bands drifting across the foot of the mountains, and a pair of birds now and then
function Mist() {
  return (
    <>
      <i className="tt-mist" style={{ top: '52%', animationDuration: '38s' }} />
      <i className="tt-mist" style={{ top: '68%', animationDuration: '52s', animationDelay: '-20s' }} />
      <i className="tt-mist low" />
      <svg className="tt-birds" viewBox="0 0 40 16"><path d="M2 8 Q7 3 11 7 Q15 3 20 7" /><path d="M24 12 Q27 9 30 11.5 Q33 9 36 11" /></svg>
    </>
  )
}

export default function SummitScene() {
  const gid = useId().replace(/:/g, '')
  return (
    <div className="summit-scene" aria-hidden="true">
      <svg className="tt-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><Painting gid={gid} /></svg>
      <Mist />
    </div>
  )
}

// Where the climber was last seen, so moving between exercises doesn't restart the climb.
let lastDist = -1

// Page B during a session: the figure and the boulder on the trail. `steps` = sets moved on.
export function SummitClimb({ steps }: { steps: number }) {
  const gid = useId().replace(/:/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const body = useRef<SVGGElement>(null)
  const rock = useRef<SVGGElement>(null)
  const legs = useRef<SVGPathElement>(null)
  const done = useRef<SVGPathElement>(null)
  const top = steps >= SUMMIT_STEPS
  const target = STOPS[Math.min(steps, SUMMIT_STEPS)]

  useEffect(() => {
    const from = lastDist < 0 ? target : lastDist
    lastDist = target
    let raf = 0
    const draw = (d: number, phase: number) => {
      const p = at(d)
      const angle = d >= TRAIL_LEN - 0.5 ? 0 : p.angle
      body.current?.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.dir} 1) rotate(${angle.toFixed(1)})`)
      rock.current?.setAttribute('transform', `translate(25 -15) rotate(${(d / 15 * 57.3).toFixed(0)})`)
      const sw = Math.sin(phase) * 4.5
      legs.current?.setAttribute('d', `M-6 -13 L${(-4 + sw / 2).toFixed(1)} -7 L${(-3 + sw).toFixed(1)} 0 M-6 -13 L${(-9 - sw / 2).toFixed(1)} -6.5 L${(-14 - sw).toFixed(1)} 0`)
      if (done.current) done.current.style.strokeDasharray = `${d.toFixed(1)} 9999`
    }
    if (from === target) { draw(target, 0); return }
    if (target > from && live(ref.current)) sound.roll()
    const t0 = performance.now(), dur = 1400 + Math.min(1200, Math.abs(target - from) * 6)
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
      draw(from + (target - from) * e, (now - t0) / 140)
      if (k < 1) raf = requestAnimationFrame(tick)
      else if (target >= TRAIL_LEN && live(ref.current)) sound.summit()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return (
    <div className={`summit-scene climb${top ? ' top' : ''}`} ref={ref} aria-hidden="true">
      <Mist />
      <svg className="tt-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Painting gid={gid} climb />
        <path ref={done} className="tt-trail done" d={trailD} style={{ strokeDasharray: '0 9999' }} />
        <g ref={body} className="tt-climber">
          <g ref={rock}>
            <circle r="15" className="tt-rock" />
            <path className="tt-crack" d="M-9 -6 C-3 -3 2 -8 8 -4 M-2 6 C2 3 6 7 10 5" />
          </g>
          {top ? (
            <g className="tt-figure">
              <path d="M-12 -13 L-14 0 M-12 -13 L-9 0 M-12 -13 L-12 -24 M-12 -22 L-18 -32 M-12 -22 L-5 -19" />
              <circle cx="-12" cy="-27.5" r="3.2" />
            </g>
          ) : (
            <g className="tt-figure">
              <path ref={legs} d="M-6 -13 L-4 -7 L-3 0 M-6 -13 L-9 -6.5 L-14 0" />
              <path d="M-6 -13 L4 -22 M4 -22 L11 -18.5 M3 -21 L10.5 -15" />
              <circle cx="7" cy="-25" r="3.2" />
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}
