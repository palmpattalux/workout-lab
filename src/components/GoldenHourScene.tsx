// Golden Hour: a low sun burning through banks of cloud, hills fading into warm haze,
// a tree on the left whose leaves catch the wind, and flocks of birds crossing the sky.
// Built like Night City: procedural shapes in depth layers, each moving at its own pace.

function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
}

// A cloud bank across a 400-wide box: puffs along a baseline, flat-ish bottom.
function clouds(seed: number, y: number, minR: number, maxR: number) {
  const r = rng(seed)
  const puffs: { cx: number; cy: number; r: number }[] = []
  let x = -20
  while (x < 420) {
    const rad = minR + r() * (maxR - minR)
    puffs.push({ cx: x, cy: y - rad * (0.35 + r() * 0.4), r: rad })
    x += rad * (0.9 + r() * 0.7)
    if (r() < 0.16) x += 40 + r() * 60 // a gap of open sky
  }
  return puffs
}

// Rolling hills as one smooth path across 400 × 100.
function hills(seed: number, lo: number, hi: number) {
  const r = rng(seed)
  const pts = Array.from({ length: 7 }, (_, i) => [i * 400 / 6, lo + r() * (hi - lo)])
  let d = `M-10 100 L-10 ${pts[0][1]} `
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]
    d += `C${x1 + 30} ${y1} ${x2 - 30} ${y2} ${x2} ${y2} `
  }
  return d + 'L410 100 Z'
}

const BACK = [...clouds(13, 74, 7, 13), ...clouds(19, 86, 5, 10)]
const FRONT = clouds(23, 92, 7, 14)
const FAR_HILLS = hills(3, 30, 55)
const MID_HILLS = hills(11, 45, 70)
const NEAR_HILLS = hills(41, 66, 84)

// canopy of the tree: puffs around a centre, in a 120 × 160 box
const CANOPY = (() => {
  const r = rng(77)
  return Array.from({ length: 150 }, () => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 40
    return { cx: 62 + Math.cos(a) * d * 1.3, cy: 50 + Math.sin(a) * d * 0.72, r: 2.5 + r() * 4.5 }
  })
})()

const LEAVES = Array.from({ length: 12 }, (_, i) => {
  const r = rng(i * 59 + 3)
  return { x: 6 + r() * 22, y: 32 + r() * 20, dur: 8 + r() * 6, delay: -r() * 14, hue: i % 3, drop: 6 + r() * 26, size: 0.8 + r() * 0.6 }
})

const FLOCK = [[0, 0], [-7, 3.5], [-14, 7], [7, 3.5], [14, 7], [-21, 10], [21, 10.5]]

function Flock({ className }: { className: string }) {
  return (
    <div className={`gh-flock ${className}`}>
      <svg viewBox="-26 -6 52 22">
        {FLOCK.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path className="gh-bird" style={{ animationDelay: `${-i * 0.13}s` }} d="M-3.2 0 Q-1.6 -1.8 0 0 Q1.6 -1.8 3.2 0" />
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function GoldenHourScene() {
  return (
    <div className="golden-scene" aria-hidden="true">
      <div className="gh-sky" />
      <div className="gh-rays" />
      <div className="gh-sun" />
      <Flock className="far" />
      <svg className="gh-clouds back" viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="gh-cb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6e6" /><stop offset=".7" stopColor="#fbe0b8" /><stop offset="1" stopColor="#f6c88e" />
          </linearGradient>
        </defs>
        {BACK.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="url(#gh-cb)" />)}
      </svg>
      <svg className="gh-clouds front" viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="gh-cf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7d2a4" /><stop offset="1" stopColor="#f0b277" />
          </linearGradient>
        </defs>
        {FRONT.map((p, i) => <ellipse key={i} cx={p.cx} cy={p.cy + p.r * .5} rx={p.r * 2.2} ry={p.r * .45} fill="url(#gh-cf)" />)}
      </svg>
      <Flock className="near" />
      <svg className="gh-hills far" viewBox="0 0 400 100" preserveAspectRatio="none"><path d={FAR_HILLS} /></svg>
      <svg className="gh-hills mid" viewBox="0 0 400 100" preserveAspectRatio="none"><path d={MID_HILLS} /></svg>
      <svg className="gh-tree" viewBox="0 0 120 160">
        <path className="gh-trunk" d="M50 160 C52 130 48 110 56 88 L60 70 L64 70 C62 92 66 112 70 160 Z" />
        <path className="gh-trunk" d="M57 92 C48 82 40 78 30 74 L31 71 C42 74 50 78 59 86 Z" />
        <path className="gh-trunk" d="M63 84 C72 74 80 70 92 66 L93 69 C82 73 74 78 65 90 Z" />
        <g className="gh-canopy">
          {CANOPY.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />)}
        </g>
      </svg>
      <svg className="gh-hills near" viewBox="0 0 400 100" preserveAspectRatio="none"><path d={NEAR_HILLS} /></svg>
      <div className="gh-leaves">
        {LEAVES.map((l, i) => (
          <span key={i} className="gh-leaf" style={{ left: `${l.x}%`, top: `${l.y}%`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s`, ['--drop' as string]: `${l.drop}cqh` }}>
            <i className={`h${l.hue}`} style={{ animationDuration: `${0.9 + l.size}s`, transform: `scale(${l.size})` }} />
          </span>
        ))}
      </div>
      <div className="gh-haze" />
    </div>
  )
}
