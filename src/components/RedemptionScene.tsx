// Redemption: a hazy golden afternoon, painted soft like an anime still. A dark tree
// trunk stands close at the left edge with the sun blooming behind it, foliage hangs in
// from the top, a big soft cloud floats right, the field glows to the horizon, and dark
// leaves blow through the warm air with drifting sparks of light.

function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
}

// foliage cluster: many small leaf blobs around a centre, in a 400 × 200 box
function foliage(seed: number, cx: number, cy: number, w: number, h: number, n: number) {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r())
    return { x: cx + Math.cos(a) * d * w, y: cy + Math.sin(a) * d * h, rx: 4 + r() * 8, ry: 2.5 + r() * 4.5, rot: r() * 180, tone: Math.floor(r() * 3) }
  })
}
const CANOPY = [
  ...foliage(3, 30, 30, 85, 62, 300),
  ...foliage(7, 145, 4, 62, 30, 110),
  ...foliage(11, 345, 26, 85, 58, 290),
  ...foliage(15, 404, 120, 30, 80, 130),
  ...foliage(19, 250, 0, 44, 16, 50),
]
const TONES = ['#2e3320', '#3b3f24', '#4d4a28']

// grass blades along the bottom of a 200 × 100 box
function blades(seed: number, n: number, minTop: number, maxTop: number) {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const x = r() * 204 - 2, top = minTop + r() * (maxTop - minTop), lean = (r() - 0.4) * 10
    return `M${x - 0.7} 101 Q${x + lean * 0.3} ${(top + 100) / 2} ${x + lean} ${top} Q${x + lean * 0.3 + 0.8} ${(top + 100) / 2} ${x + 0.7} 101 Z`
  })
}
const GRASS_FAR = blades(5, 320, 20, 70)
const GRASS_NEAR = blades(9, 90, 10, 55)

const LEAVES = Array.from({ length: 22 }, (_, i) => {
  const r = rng(i * 59 + 3)
  return { x: -10 + r() * 60, y: r() * 55, dur: 9 + r() * 8, delay: -r() * 17, drop: 10 + r() * 40, size: 0.7 + r() * 1.1, dark: r() < 0.7 }
})
const SPARKS = Array.from({ length: 22 }, (_, i) => {
  const r = rng(i * 37 + 5)
  return { x: r() * 100, y: 20 + r() * 70, dur: 8 + r() * 9, delay: -r() * 17, s: 1.5 + r() * 2.5 }
})

export default function RedemptionScene() {
  return (
    <div className="redemption-scene" aria-hidden="true">
      <div className="rd-sky" />
      <div className="rd-haze" />
      <div className="rd-cloud big" />
      <div className="rd-cloud small" />
      <div className="rd-sun" />
      <div className="rd-beam" />
      <div className="rd-field" />
      <svg className="rd-grass far" viewBox="0 0 200 100" preserveAspectRatio="none">
        <g className="rd-wave">{GRASS_FAR.map((d, i) => <path key={i} d={d} className={i % 4 === 0 ? 'lit' : undefined} />)}</g>
      </svg>
      <div className="rd-sparks">
        {SPARKS.map((m, i) => <i key={i} style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />)}
      </div>
      <svg className="rd-grass near" viewBox="0 0 200 100" preserveAspectRatio="none">
        <g className="rd-wave near">{GRASS_NEAR.map((d, i) => <path key={i} d={d} className={i % 3 === 0 ? 'lit' : undefined} />)}</g>
      </svg>
      <div className="rd-trunk"><i /></div>
      <svg className="rd-canopy" viewBox="0 0 400 300">
        <g className="rd-rustle">
          {CANOPY.map((l, i) => <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} fill={TONES[l.tone]} transform={`rotate(${l.rot} ${l.x} ${l.y})`} />)}
        </g>
      </svg>
      <div className="rd-leaves">
        {LEAVES.map((l, i) => (
          <span key={i} className="rd-leaf" style={{ left: `${l.x}%`, top: `${l.y}%`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s`, ['--drop' as string]: `${l.drop}cqh` }}>
            <i className={l.dark ? 'dark' : undefined} style={{ animationDuration: `${0.8 + l.size * 0.6}s`, width: 13 * l.size, height: 7 * l.size }} />
          </span>
        ))}
      </div>
      <div className="rd-grade" />
    </div>
  )
}
