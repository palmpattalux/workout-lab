import '../themes/forest.css'
import { useId } from 'react'

// Forest theme. Day: layers of flat pines fading into a misty sage morning, a pale sun behind
// the trees top-right, a slow band of mist drifting through. Night: the same pines under a
// crescent moon, with a few warm fireflies drifting and pulsing. One SVG on a 390 x 844 canvas,
// sliced to fill the page; colours come from theme tokens.

const W = 390, H = 844
const rand = (k: number) => { const x = Math.sin(k * 91.7) * 43758.5453; return x - Math.floor(x) }

// a flat pine: three tiers and a short trunk, standing on (x, base), h tall
function pine(x: number, base: number, h: number) {
  const hw = h * 0.27, top = base - h, tw = Math.max(1.2, h * 0.035)
  const tiers = [0.36, 0.64, 0.9]
  const R: string[] = [], L: string[] = []
  tiers.forEach((t, i) => {
    const y = top + h * t, ox = hw * (0.55 + 0.45 * (i + 1) / 3)
    R.push(`${(x + ox).toFixed(1)} ${y.toFixed(1)}`)
    L.unshift(`${(x - ox).toFixed(1)} ${y.toFixed(1)}`)
    if (i < 2) {
      const nx = ox * 0.42, ny = y - h * 0.04
      R.push(`${(x + nx).toFixed(1)} ${ny.toFixed(1)}`)
      L.unshift(`${(x - nx).toFixed(1)} ${ny.toFixed(1)}`)
    }
  })
  const ty = top + h * 0.9
  return `M${x} ${top.toFixed(1)} L${R.join(' L')} L${(x + tw).toFixed(1)} ${ty.toFixed(1)} L${(x + tw).toFixed(1)} ${base} L${(x - tw).toFixed(1)} ${base} L${(x - tw).toFixed(1)} ${ty.toFixed(1)} L${L.join(' L')} Z`
}

// a row of pines along a ground line; taller towards the sides, low in the middle
function row(seed: number, base: (x: number) => number, hMin: number, hMax: number, step: number, gap: [number, number] | null) {
  let d = ''
  for (let x = -14, i = 0; x < W + 20; x += step * (0.75 + rand(seed + i) * 0.5), i++) {
    if (gap && x > gap[0] && x < gap[1]) continue
    const edge = Math.abs(x - W / 2) / (W / 2) // 0 middle, 1 sides
    const h = hMin + (hMax - hMin) * (0.35 + 0.65 * edge * edge) * (0.8 + rand(seed + i * 3.1) * 0.4)
    d += pine(Math.round(x), base(x), h)
  }
  return d
}

// ground lines, far to near: dipping in the middle so the centre stays open
const curve = (y0: number, dip: number) => (x: number) => Math.round(y0 + dip * Math.sin(Math.PI * x / W))
const LAYERS = [
  { base: curve(600, 22), hMin: 38, hMax: 150, step: 22, gap: null as [number, number] | null, seed: 1 },
  { base: curve(690, 30), hMin: 30, hMax: 190, step: 30, gap: [120, 270] as [number, number], seed: 40 },
  { base: curve(816, 22), hMin: 26, hMax: 236, step: 40, gap: [96, 300] as [number, number], seed: 90 },
]
const RIDGE = [[240, 40], [258, 52], [276, 38], [294, 58], [312, 46], [330, 62], [348, 50], [366, 58], [384, 44], [400, 54]]
  .map(([x, h], i) => pine(x, 182 - (i % 2) * 4, h)).join('')
const ground = (b: (x: number) => number) => {
  let d = `M-10 ${H} L-10 ${b(-10)}`
  for (let x = 0; x <= W + 10; x += 15) d += ` L${x} ${b(x)}`
  return d + ` L${W + 10} ${H} Z`
}

const FLIES = [
  { x: 12, y: 58, dx: 5, dy: -4, dur: 15, pd: 4.2, d: 0 },
  { x: 84, y: 54, dx: -4, dy: -5, dur: 17, pd: 3.6, d: -6 },
  { x: 22, y: 71, dx: 6, dy: -3, dur: 13, pd: 4.8, d: -3 },
  { x: 74, y: 68, dx: -5, dy: -3, dur: 16, pd: 3.9, d: -9 },
  { x: 92, y: 76, dx: -3, dy: -5, dur: 14, pd: 5.2, d: -2 },
  { x: 6, y: 82, dx: 4, dy: -4, dur: 18, pd: 4.4, d: -11 },
  { x: 58, y: 80, dx: 4, dy: -3, dur: 12, pd: 3.4, d: -5 },
  { x: 36, y: 62, dx: -4, dy: -4, dur: 19, pd: 4.6, d: -13 },
  { x: 66, y: 89, dx: -5, dy: -2, dur: 15, pd: 5, d: -7 },
  { x: 88, y: 44, dx: -3, dy: 4, dur: 17, pd: 4, d: -4 },
]

export default function ForestScene() {
  const gid = useId().replace(/:/g, '')
  const g = (n: string) => `url(#${gid}${n})`
  return (
    <div className="forest-scene" aria-hidden="true">
      <svg className="fo-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gid + 'sky'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--fo-sky1)' }} />
            <stop offset=".55" style={{ stopColor: 'var(--fo-sky2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--fo-sky3)' }} />
          </linearGradient>
          <radialGradient id={gid + 'halo'}>
            <stop offset=".25" style={{ stopColor: 'var(--fo-sun)', stopOpacity: 'var(--fo-halo)' }} />
            <stop offset="1" style={{ stopColor: 'var(--fo-sun)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'mist'} cx=".5" cy=".5" r=".5">
            <stop offset="0" style={{ stopColor: 'var(--fo-mist)', stopOpacity: 'var(--fo-mist-o)' }} />
            <stop offset=".6" style={{ stopColor: 'var(--fo-mist)', stopOpacity: 'calc(var(--fo-mist-o) * .5)' }} />
            <stop offset="1" style={{ stopColor: 'var(--fo-mist)', stopOpacity: 0 }} />
          </radialGradient>
          {[0, 1, 2].map((i) => (
            <linearGradient key={i} id={gid + 'fade' + i} gradientUnits="userSpaceOnUse" x1="0" y1={LAYERS[i].base(0) - 150} x2="0" y2={LAYERS[i].base(W / 2) + 10}>
              <stop offset="0" style={{ stopColor: 'var(--fo-mist)', stopOpacity: 0 }} />
              <stop offset="1" style={{ stopColor: 'var(--fo-mist)', stopOpacity: `calc(var(--fo-fade) * ${1 - i * 0.3})` }} />
            </linearGradient>
          ))}
          <linearGradient id={gid + 'rfade'} gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="182">
            <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id={gid + 'ridge'}><rect x="200" y="0" width="200" height="240" fill={g('rfade')} /></mask>
          {/* by night the sun becomes a crescent moon */}
          <mask id={gid + 'moon'}>
            <rect width={W} height="240" fill="#fff" />
            <circle cx="333" cy="90" r="20" fill="#000" className="fo-bite" />
          </mask>
        </defs>
        <rect width={W} height={H} fill={g('sky')} />
        <circle cx="320" cy="102" r="78" fill={g('halo')} className="fo-halo" />
        <circle cx="320" cy="102" r="24" className="fo-sun" mask={g('moon')} />
        {/* a few distant pines in front of the sun, dissolving into the mist below */}
        <path className="fo-ridge" d={RIDGE} mask={g('ridge')} />
        {LAYERS.map((l, i) => (
          <g key={i} className={`fo-layer l${i}`}>
            <path d={ground(l.base)} />
            <path d={row(l.seed, l.base, l.hMin, l.hMax, l.step, l.gap)} />
            <rect className="fo-fade" x="-10" y={l.base(0) - 150} width={W + 20} height={H - l.base(0) + 160} fill={g('fade' + i)} />
            {i === 0 && <ellipse className="fo-mist m1" cx="200" cy={l.base(W / 2) - 10} rx="300" ry="46" fill={g('mist')} />}
            {i === 1 && <ellipse className="fo-mist m2" cx="190" cy={l.base(W / 2) - 16} rx="280" ry="40" fill={g('mist')} />}
          </g>
        ))}
        <ellipse className="fo-mist m3" cx="210" cy="430" rx="320" ry="36" fill={g('mist')} />
      </svg>
      {FLIES.map((f, i) => (
        <i key={i} className="fo-fly" style={{
          left: `${f.x}%`, top: `${f.y}%`, ['--dx' as string]: `${f.dx}cqw`, ['--dy' as string]: `${f.dy}cqh`,
          animationDuration: `${f.dur}s, ${f.pd}s`, animationDelay: `${f.d}s, ${f.d * 0.7}s`,
        }} />
      ))}
    </div>
  )
}
