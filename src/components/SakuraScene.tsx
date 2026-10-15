// Sakura theme backdrop: a blossom branch in the corner, petals drifting down
// and landing on still water, each leaving a ripple. Purely decorative.
const PETALS = [
  { x: 14, drift: 6, land: 82, dur: 11, delay: 0 },
  { x: 72, drift: -8, land: 90, dur: 13, delay: -4 },
  { x: 48, drift: 5, land: 86, dur: 12, delay: -8.5 },
  { x: 86, drift: -5, land: 79, dur: 14, delay: -2 },
  { x: 30, drift: 9, land: 93, dur: 15, delay: -10.5 },
  { x: 62, drift: 4, land: 81, dur: 12.5, delay: -6 },
  { x: 92, drift: -10, land: 88, dur: 16, delay: -12.5 },
]
const BLOOMS: [number, number, number][] = [
  [118, 30, 1], [150, 22, .8], [176, 46, .9], [96, 60, .7], [140, 70, 1], [190, 82, .75],
  [164, 104, .85], [122, 98, .6], [204, 128, .7], [84, 34, .55], [182, 150, .55],
]

function Bloom({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-5.2" rx="3.6" ry="5.4" transform={`rotate(${r})`} className="sk-petal" />)}
      <circle r="1.7" className="sk-heart" />
    </g>
  )
}

export default function SakuraScene() {
  return (
    <div className="sakura-scene" aria-hidden="true">
      <svg className="sk-branch" viewBox="0 0 220 180">
        <path className="sk-wood" d="M222 6 C190 18 168 30 146 52 C128 70 116 86 92 100" />
        <path className="sk-wood thin" d="M168 31 C160 14 146 10 130 14" />
        <path className="sk-wood thin" d="M146 52 C162 74 176 96 200 118" />
        <path className="sk-wood thin" d="M118 82 C104 70 92 62 76 56" />
        <path className="sk-wood thin" d="M186 106 C180 124 182 140 186 156" />
        {BLOOMS.map(([x, y, s], i) => <Bloom key={i} x={x} y={y} s={s} />)}
      </svg>
      <div className="sk-water" />
      {PETALS.map((p, i) => {
        const vars = { ['--x' as string]: `${p.x}%`, ['--drift' as string]: `${p.drift}cqw`, ['--land' as string]: `${p.land}cqh`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }
        return (
          <span key={i}>
            <i className="sk-fall" style={vars} />
            <i className="sk-ripple" style={vars} />
          </span>
        )
      })}
    </div>
  )
}
