import '../themes/autumn.css'

// Autumn theme backdrop: a thin maple branch in the top-right corner, a few red and amber
// leaves slowly falling, turning, and settling onto a soft band of fallen leaves. Decorative only.

// a flat five-point maple leaf, centred on (0, 0), about 20 units across, stem pointing down
const LEAF = 'M0 -10 L1.8 -6.6 L3.8 -7.4 L2.8 -3.2 L6.4 -5.6 L9.8 -4.8 L8.4 -2 L9.8 -0.6 L4.4 1.4 L7.2 4.8 L4 5 L1 3.4 L0.5 9.8 L-0.5 9.8 L-1 3.4 L-4 5 L-7.2 4.8 L-4.4 1.4 L-9.8 -0.6 L-8.4 -2 L-9.8 -4.8 L-6.4 -5.6 L-2.8 -3.2 L-3.8 -7.4 L-1.8 -6.6 Z'

// leaves on the branch: x, y, scale, rotation, colour
const ON_BRANCH: [number, number, number, number, number][] = [
  [124, 30, 1, -28, 0], [152, 20, .82, 14, 1], [178, 48, .95, 32, 2], [100, 62, .78, -50, 1],
  [142, 74, 1.05, 8, 0], [194, 86, .8, 40, 1], [166, 110, .9, -12, 2], [122, 100, .66, -36, 0],
  [204, 132, .72, 22, 0], [86, 38, .6, -64, 2],
]

// falling leaves: start x %, side drift, landing height, duration, delay, colour
const FALLING = [
  { x: 16, drift: 7, land: 90, dur: 14, delay: 0, c: 0 },
  { x: 70, drift: -9, land: 94, dur: 16, delay: -5, c: 1 },
  { x: 46, drift: 6, land: 91, dur: 15, delay: -9.5, c: 2 },
  { x: 84, drift: -6, land: 89, dur: 17, delay: -2.5, c: 0 },
  { x: 30, drift: 10, land: 95, dur: 18, delay: -12, c: 1 },
  { x: 60, drift: 5, land: 92, dur: 15.5, delay: -7, c: 0 },
  { x: 92, drift: -11, land: 93, dur: 19, delay: -14.5, c: 2 },
]

// leaves already lying on the ground band (viewBox 390 x 80)
const GROUND: [number, number, number, number, number][] = [
  [22, 52, .9, 40, 1], [58, 66, .7, -20, 0], [104, 48, .8, 70, 2], [150, 62, 1, -50, 0],
  [188, 44, .65, 15, 1], [228, 60, .85, 110, 2], [262, 50, .7, -80, 0], [300, 66, .95, 30, 1],
  [342, 48, .75, -10, 2], [372, 62, .8, 60, 0], [126, 72, .6, 150, 1], [206, 74, .7, -130, 0],
]

const CLS = ['au-red', 'au-amber', 'au-rust']

export default function AutumnScene() {
  return (
    <div className="autumn-scene" aria-hidden="true">
      <svg className="au-branch" viewBox="0 0 220 180">
        <path className="au-wood" d="M222 6 C190 18 168 30 146 52 C128 70 116 86 92 100" />
        <path className="au-wood thin" d="M168 31 C160 14 146 10 130 14" />
        <path className="au-wood thin" d="M146 52 C162 74 176 96 200 118" />
        <path className="au-wood thin" d="M118 82 C104 70 92 62 76 56" />
        <path className="au-wood thin" d="M186 106 C180 124 182 140 186 156" />
        {ON_BRANCH.map(([x, y, s, r, c], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s * 1.25})`}>
            <path d={LEAF} className={`au-leaf ${CLS[c]}${i % 4 === 1 ? ' au-sway' : ''}`} style={{ animationDelay: `${-i * 1.7}s` }} />
          </g>
        ))}
      </svg>
      <div className="au-ground">
        <svg viewBox="0 0 390 80" preserveAspectRatio="none">
          {GROUND.map(([x, y, s, r, c], i) => (
            <path key={i} d={LEAF} className={`au-fallen ${CLS[c]}`} transform={`translate(${x} ${y}) scale(1 .5) rotate(${r}) scale(${s * 1.25})`} />
          ))}
        </svg>
      </div>
      {FALLING.map((p, i) => {
        const vars = { ['--x' as string]: `${p.x}%`, ['--drift' as string]: `${p.drift}cqw`, ['--land' as string]: `${p.land}cqh`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }
        return (
          <svg key={i} className={`au-fall ${CLS[p.c]}`} style={vars} viewBox="-10 -10 20 20">
            <path d={LEAF} />
          </svg>
        )
      })}
    </div>
  )
}
