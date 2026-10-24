import '../themes/zen.css'
import { useId } from 'react'

// Zen Garden theme backdrop: raked sand, a still stone with breathing rake rings, and a few
// bamboo stalks in the top-right corner whose leaves sway gently. By night the sand is
// moonlit grey-blue and a small moon sits behind the bamboo. One 390 x 844 SVG, sliced to fill.

const W = 390, H = 844
const STONE = { x: 300, y: 690 }
const RINGS = [0, 1, 2, 3]
// parallel rake lines across the lower part, each a soft wave
const RAKE = Array.from({ length: 34 }, (_, i) => {
  const y = 572 + i * 8.4
  const a = 1.6 + (i % 3) * 0.4
  return `M-10 ${y.toFixed(1)} C90 ${(y - a).toFixed(1)} 170 ${(y + a).toFixed(1)} 260 ${y.toFixed(1)} S360 ${(y - a).toFixed(1)} 400 ${y.toFixed(1)}`
})
// bamboo stalks: x, width, bottom
const STALKS: [number, number, number][] = [[348, 7, 250], [366, 9, 300], [384, 8, 220]]
// leaf sprigs: x, y, rotation, scale, sway delay
const SPRIGS: [number, number, number, number, number][] = [
  [348, 92, -24, 1, 0], [366, 150, -8, 1.1, -4], [348, 196, -34, 0.85, -7.5], [384, 64, -14, 0.9, -2.5],
]

function Sprig({ x, y, r, s, d }: { x: number; y: number; r: number; s: number; d: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <g className="zn-sprig" style={{ animationDelay: `${d}s` }}>
        <path className="zn-twig" d="M0 0 C-10 2 -20 6 -30 12" />
        <path className="zn-leaf" d="M-6 1 C-20 -6 -40 -6 -56 0 C-40 2 -20 4 -6 1 Z" />
        <path className="zn-leaf b" d="M-16 6 C-28 6 -44 12 -56 22 C-42 18 -28 14 -16 6 Z" />
        <path className="zn-leaf" d="M-26 11 C-34 16 -42 26 -46 38 C-38 28 -32 20 -26 11 Z" />
      </g>
    </g>
  )
}

export default function ZenScene() {
  const gid = useId().replace(/:/g, '')
  const u = (n: string) => `url(#${gid}${n})`
  return (
    <div className="zen-scene" aria-hidden="true">
      <svg className="zn-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gid + 'sand'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--zn-sand1)' }} />
            <stop offset=".6" style={{ stopColor: 'var(--zn-sand2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--zn-sand3)' }} />
          </linearGradient>
          <linearGradient id={gid + 'fade'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" />
            <stop offset=".12" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <linearGradient id={gid + 'stalkfade'} x1="0" y1="0" x2="0" y2="1">
            <stop offset=".35" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <radialGradient id={gid + 'halo'}>
            <stop offset=".25" style={{ stopColor: 'var(--zn-moon)', stopOpacity: .35 }} />
            <stop offset="1" style={{ stopColor: 'var(--zn-moon)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'stone'} cx=".38" cy=".3" r=".8">
            <stop offset="0" style={{ stopColor: 'var(--zn-stone-hi)' }} />
            <stop offset="1" style={{ stopColor: 'var(--zn-stone)' }} />
          </radialGradient>
          {/* rake lines fade in from above and part around the stone's rings */}
          <mask id={gid + 'rake'}>
            <rect x="0" y="560" width={W} height={H - 560} fill={u('fade')} />
            <ellipse cx={STONE.x} cy={STONE.y} rx="98" ry="44" fill="#000" />
          </mask>
          <mask id={gid + 'stalks'}>
            <rect x="320" y="0" width="80" height="330" fill={u('stalkfade')} />
          </mask>
        </defs>
        <rect width={W} height={H} fill={u('sand')} />
        <g className="zn-moonset">
          <circle cx="318" cy="82" r="44" fill={u('halo')} />
          <circle cx="318" cy="82" r="14" className="zn-moon" />
        </g>
        <g className="zn-rake" mask={u('rake')}>
          {RAKE.map((d, i) => <path key={i} d={d} />)}
        </g>
        <g className="zn-rings">
          {RINGS.map((i) => (
            <ellipse key={i} cx={STONE.x} cy={STONE.y} rx={40 + i * 16} ry={17 + i * 7}
              style={{ animationDelay: `${-i * 1.4}s` }} />
          ))}
        </g>
        <ellipse className="zn-moss" cx={STONE.x - 18} cy={STONE.y + 6} rx="12" ry="3.6" />
        <ellipse className="zn-moss" cx={STONE.x + 20} cy={STONE.y + 9} rx="7" ry="2.4" />
        <ellipse className="zn-shadow" cx={STONE.x + 6} cy={STONE.y + 6} rx="28" ry="7" />
        <path className="zn-stone" fill={u('stone')} d={`M${STONE.x - 26} ${STONE.y + 4} C${STONE.x - 26} ${STONE.y - 12} ${STONE.x - 10} ${STONE.y - 20} ${STONE.x + 4} ${STONE.y - 19} C${STONE.x + 20} ${STONE.y - 18} ${STONE.x + 28} ${STONE.y - 8} ${STONE.x + 26} ${STONE.y + 4} C${STONE.x + 14} ${STONE.y + 9} ${STONE.x - 14} ${STONE.y + 9} ${STONE.x - 26} ${STONE.y + 4} Z`} />
        <path className="zn-stone small" fill={u('stone')} d={`M${STONE.x + 24} ${STONE.y + 8} C${STONE.x + 25} ${STONE.y} ${STONE.x + 32} ${STONE.y - 4} ${STONE.x + 38} ${STONE.y - 3} C${STONE.x + 44} ${STONE.y - 2} ${STONE.x + 47} ${STONE.y + 3} ${STONE.x + 46} ${STONE.y + 8} C${STONE.x + 40} ${STONE.y + 11} ${STONE.x + 30} ${STONE.y + 11} ${STONE.x + 24} ${STONE.y + 8} Z`} />
        <g className="zn-bamboo">
          <g mask={u('stalks')}>
            {STALKS.map(([x, w, b], i) => (
              <g key={i}>
                <rect className="zn-stalk" x={x - w / 2} y="-10" width={w} height={b + 10} rx={w / 2} />
                {[40, 108, 176, 244].filter((n) => n < b - 10).map((n) => (
                  <rect key={n} className="zn-node" x={x - w / 2 - 0.8} y={n + i * 14} width={w + 1.6} height="2.2" rx="1.1" />
                ))}
              </g>
            ))}
          </g>
          {SPRIGS.map(([x, y, r, s, d], i) => <Sprig key={i} x={x} y={y} r={r} s={s} d={d} />)}
        </g>
      </svg>
      <i className="zn-drift" />
    </div>
  )
}
