// Castle: a stone castle on a hill above a pine forest, mountains fading behind.
// Light mode is a calm morning (sun, drifting clouds); dark mode is night (moon,
// stars, torch-lit windows). Same drawing, colours come from CSS variables.

function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
}

// towers: x, width, top y, roof ('cone' | 'wall'), flag
const TOWERS: { x: number; w: number; top: number; roof: 'cone' | 'wall'; flag?: boolean }[] = [
  { x: 112, w: 24, top: 118, roof: 'cone', flag: true },
  { x: 168, w: 20, top: 140, roof: 'wall' },
  { x: 196, w: 44, top: 92, roof: 'cone', flag: true },
  { x: 250, w: 20, top: 138, roof: 'wall' },
  { x: 282, w: 26, top: 112, roof: 'cone', flag: true },
]
const WALL = { x1: 124, x2: 296, top: 160 }

function merlons(x1: number, x2: number, y: number, size = 5) {
  let d = ''
  for (let x = x1; x < x2 - 1; x += size * 2) d += `M${x} ${y} h${Math.min(size, x2 - x)} v-${size} h-${Math.min(size, x2 - x)} Z `
  return d
}

const STARS = Array.from({ length: 40 }, (_, i) => {
  const r = rng(i * 7919 + 104729)
  return { x: r() * 100, y: r() * 52, s: 1 + r() * 1.8, d: -r() * 4, t: 2 + r() * 3 }
})

// pines along the bottom of a 400 × 80 box
const PINES = (() => {
  const r = rng(29)
  const out: string[] = []
  let x = -10
  while (x < 410) {
    const h = 26 + r() * 40, w = 12 + r() * 10, base = 80
    out.push(`M${x} ${base} L${x + w / 2} ${base - h} L${x + w} ${base} Z M${x + w * 0.12} ${base - h * 0.35} L${x + w / 2} ${base - h * 0.85} L${x + w * 0.88} ${base - h * 0.35} Z`)
    x += w * (0.45 + r() * 0.4)
  }
  return out
})()

export default function CastleScene() {
  return (
    <div className="castle-scene" aria-hidden="true">
      <div className="cs-sky" />
      <div className="cs-stars">
        {STARS.map((s, i) => <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s`, animationDuration: `${s.t}s` }} />)}
      </div>
      <div className="cs-orb" />
      <div className="cs-clouds"><i className="a" /><i className="b" /><i className="c" /></div>
      <svg className="cs-mountains" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M-10 100 L-10 34 L30 20 L62 31 L104 10 L150 30 L188 19 L232 35 L280 14 L320 28 L360 17 L410 31 L410 100 Z" />
      </svg>
      <div className="cs-fog back" />
      <svg className="cs-castle" viewBox="0 0 400 260">
        <path className="cs-hill" d="M-10 260 L-10 214 C60 196 120 182 210 180 C300 182 350 196 410 210 L410 260 Z" />
        {/* curtain wall */}
        <rect className="cs-stone" x={WALL.x1} y={WALL.top} width={WALL.x2 - WALL.x1} height={190 - WALL.top} />
        <path className="cs-stone" d={merlons(WALL.x1, WALL.x2, WALL.top)} />
        <path className="cs-gate" d="M206 190 V176 a12 12 0 0 1 24 0 V190 Z" />
        {TOWERS.map((t, i) => (
          <g key={i}>
            <rect className={i === 2 ? 'cs-stone keep' : 'cs-stone'} x={t.x} y={t.top} width={t.w} height={190 - t.top} />
            <rect className="cs-shade" x={t.x + t.w * 0.62} y={t.top} width={t.w * 0.38} height={190 - t.top} />
            {t.roof === 'cone'
              ? <path className="cs-roof" d={`M${t.x - 3} ${t.top} L${t.x + t.w / 2} ${t.top - t.w * 1.15} L${t.x + t.w + 3} ${t.top} Z`} />
              : <path className="cs-stone" d={merlons(t.x, t.x + t.w, t.top, 4)} />}
            {t.flag && (
              <g transform={`translate(${t.x + t.w / 2} ${t.top - t.w * 1.15})`}>
                <path className="cs-pole" d="M0 0 V-14" />
                <path className="cs-flag" style={{ animationDelay: `${-i * 0.4}s` }} d="M0 -14 Q6 -15 12 -12.5 Q7 -10.5 12 -8 Q6 -9 0 -8.5 Z" />
              </g>
            )}
            {Array.from({ length: Math.floor((190 - t.top) / 22) }, (_, k) => (
              <path key={k} className="cs-win" style={{ animationDelay: `${-(i * 3 + k) * 0.9}s` }}
                d={`M${t.x + t.w / 2 - 2} ${t.top + 14 + k * 22} v5 h4 v-5 a2 2 0 0 0 -4 0 Z`} />
            ))}
          </g>
        ))}
      </svg>
      <div className="cs-fog front" />
      <svg className="cs-pines" viewBox="0 0 400 80" preserveAspectRatio="xMidYMax slice">
        {PINES.map((d, i) => <path key={i} d={d} />)}
      </svg>
      <div className="cs-grade" />
    </div>
  )
}
