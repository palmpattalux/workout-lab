// Golden Hour: you're standing in a wheat field under a tree. Branches hang into view
// from above and the sides, the sun is somewhere off to the top right (only its light
// shows), wheat sways around you, pollen drifts in the light and leaves blow past.

function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
}
type P = [number, number]
function bez(a: P, b: P, c: P, d: P, t: number): P {
  const u = 1 - t
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]
}

// A branch: a curved stem with leaves along it and a couple of twigs.
type Leaf = { x: number; y: number; a: number; s: number; tone: number }
type Branch = { d: string; twigs: string[]; leaves: Leaf[]; origin: P; delay: number }
function branch(seed: number, pts: [P, P, P, P], count: number, size: number): Branch {
  const r = rng(seed)
  const [a, b, c, d] = pts
  const leaves: Leaf[] = []
  const twigs: string[] = []
  const add = (p: P, dir: number, n: number, s: number) => {
    for (let i = 0; i < n; i++) {
      leaves.push({ x: p[0] + (r() - 0.5) * 10, y: p[1] + (r() - 0.5) * 8, a: dir + (r() - 0.5) * 120, s: s * (0.6 + r() * 0.6), tone: Math.floor(r() * 4) })
    }
  }
  for (let i = 0; i < count; i++) {
    const t = 0.18 + (i / count) * 0.82
    const p = bez(a, b, c, d, t)
    add(p, 90, 4, size)
    if (r() < 0.35) {
      const len = 18 + r() * 26, ang = (r() < 0.5 ? 1 : -1) * (35 + r() * 40) + 90
      const e: P = [p[0] + Math.cos(ang * Math.PI / 180) * len, p[1] + Math.sin(ang * Math.PI / 180) * len]
      twigs.push(`M${p[0]} ${p[1]} Q${(p[0] + e[0]) / 2 + 4} ${(p[1] + e[1]) / 2 - 3} ${e[0]} ${e[1]}`)
      add(e, ang, 8, size * 0.9)
    }
  }
  add(d, 90, 10, size)
  return { d: `M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`, twigs, leaves, origin: a, delay: -r() * 6 }
}

const BRANCHES = [
  branch(3, [[-20, -10], [60, 20], [120, 50], [175, 105]], 18, 19),
  branch(8, [[420, -20], [350, 25], [300, 45], [240, 88]], 18, 19),
  branch(12, [[-20, 100], [14, 112], [34, 150], [44, 215]], 12, 18),
  branch(17, [[420, 90], [392, 108], [376, 150], [368, 212]], 12, 18),
  branch(21, [[150, -20], [160, 10], [175, 25], [205, 48]], 9, 16),
  branch(27, [[-20, 40], [20, 50], [50, 60], [80, 70]], 8, 17),
  branch(31, [[420, 40], [390, 52], [360, 58], [330, 62]], 8, 17),
]
const LEAF_TONES = ['#7a7a34', '#958c3c', '#b39c48', '#5d6330']

// wheat stalks: base on the bottom edge of a 200 × 160 box
function wheat(seed: number, n: number, minTop: number, maxTop: number, xs: [number, number]) {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const x = xs[0] + r() * (xs[1] - xs[0])
    const top = minTop + r() * (maxTop - minTop)
    const lean = (r() - 0.35) * 14
    const tx = x + lean, ang = Math.atan2(top - 160, lean) * 180 / Math.PI + 90
    return { stem: `M${x} 162 Q${x + lean * 0.2} ${(top + 160) / 2} ${tx} ${top}`, tx, ty: top, ang, len: 7 + r() * 5, tone: r() }
  })
}
const FIELD_MID = wheat(5, 260, 64, 100, [-5, 205])
const FIELD_NEAR = [...wheat(9, 16, 18, 60, [-8, 46]), ...wheat(13, 16, 20, 62, [154, 208]), ...wheat(19, 12, 70, 104, [40, 160])]

const MOTES = Array.from({ length: 16 }, (_, i) => {
  const r = rng(i * 37 + 5)
  return { x: 10 + r() * 85, y: 30 + r() * 55, dur: 9 + r() * 8, delay: -r() * 16, s: 2 + r() * 3 }
})
const LEAVES = Array.from({ length: 12 }, (_, i) => {
  const r = rng(i * 59 + 3)
  return { x: 5 + r() * 40, y: 6 + r() * 28, dur: 8 + r() * 6, delay: -r() * 14, hue: i % 3, drop: 18 + r() * 40, size: 0.8 + r() * 0.6 }
})
const FLOCK = [[0, 0], [-7, 3.5], [-14, 7], [7, 3.5], [14, 7]]

function Stalks({ list, className }: { list: ReturnType<typeof wheat>; className: string }) {
  return (
    <svg className={`gh-wheat ${className}`} viewBox="0 0 200 160" preserveAspectRatio="xMidYMax slice">
      {[0, 1, 2].map((g) => (
        <g key={g} className={`gh-sway s${g}`}>
          {list.filter((_, i) => i % 3 === g).map((w, i) => (
            <g key={i}>
              <path className="gh-stem" d={w.stem} />
              <g transform={`translate(${w.tx} ${w.ty}) rotate(${w.ang})`}>
                <ellipse className={w.tone > 0.5 ? 'gh-head lit' : 'gh-head'} cx="0" cy={-w.len / 2} rx={w.len * 0.16} ry={w.len / 2} />
                <path className="gh-awn" d={`M0 ${-w.len} L-1.6 ${-w.len - 4} M0 ${-w.len} L1.6 ${-w.len - 4} M0 ${-w.len * 0.6} L-2.2 ${-w.len * 0.6 - 3.4} M0 ${-w.len * 0.6} L2.2 ${-w.len * 0.6 - 3.4}`} />
              </g>
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}

export default function GoldenHourScene() {
  return (
    <div className="golden-scene" aria-hidden="true">
      <div className="gh-sky" />
      <div className="gh-light" />
      <div className="gh-flock">
        <svg viewBox="-20 -6 40 18">
          {FLOCK.map(([x, y], i) => <path key={i} className="gh-bird" style={{ animationDelay: `${-i * 0.13}s` }} d={`M${x - 3.2} ${y} Q${x - 1.6} ${y - 1.8} ${x} ${y} Q${x + 1.6} ${y - 1.8} ${x + 3.2} ${y}`} />)}
        </svg>
      </div>
      <div className="gh-field" />
      <Stalks list={FIELD_MID} className="mid" />
      <div className="gh-motes">
        {MOTES.map((m, i) => <i key={i} style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />)}
      </div>
      <Stalks list={FIELD_NEAR} className="near" />
      <svg className="gh-canopy" viewBox="0 0 400 260">
        {BRANCHES.map((b, i) => (
          <g key={i} className="gh-branch" style={{ transformOrigin: `${b.origin[0]}px ${b.origin[1]}px`, animationDelay: `${b.delay}s` }}>
            <path className="gh-wood" d={b.d} />
            {b.twigs.map((t, j) => <path key={j} className="gh-wood thin" d={t} />)}
            {b.leaves.map((l, j) => (
              <path key={j} fill={LEAF_TONES[l.tone]} transform={`translate(${l.x} ${l.y}) rotate(${l.a}) scale(${l.s / 12})`} d="M0 0 Q6 -4.2 12 0 Q6 4.2 0 0 Z" />
            ))}
          </g>
        ))}
      </svg>
      <div className="gh-leaves">
        {LEAVES.map((l, i) => (
          <span key={i} className="gh-leaf" style={{ left: `${l.x}%`, top: `${l.y}%`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s`, ['--drop' as string]: `${l.drop}cqh` }}>
            <i className={`h${l.hue}`} style={{ animationDuration: `${0.9 + l.size}s`, transform: `scale(${l.size})` }} />
          </span>
        ))}
      </div>
      <div className="gh-glow" />
    </div>
  )
}
