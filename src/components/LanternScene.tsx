import '../themes/lantern.css'
import { useId } from 'react'

// Lanterns theme. Day: a dusk sky from lilac to peach, a string of round paper lanterns
// across the top-right corner, a few sky lanterns drifting up, hills over calm water.
// Night: the same place under a deep indigo sky; the lanterns glow amber and the water
// carries faint reflections. One SVG on a 390 x 844 canvas, sliced to fill the page.

const W = 390, H = 844
const rand = (k: number) => { const x = Math.sin(k * 91.7) * 43758.5453; return x - Math.floor(x) }
const STARS = Array.from({ length: 30 }, (_, i) => ({ x: rand(i + 3) * W, y: rand(i + 61) * 420, r: 0.5 + rand(i + 131) * 0.9, tw: i % 7 === 0 }))

// the cord: a quadratic curve across the corner; lanterns hang from points along it
const P0 = [226, -6], P1 = [304, 98], P2 = [404, 110]
const on = (t: number) => [0, 1].map((k) => (1 - t) ** 2 * P0[k] + 2 * t * (1 - t) * P1[k] + t * t * P2[k])
// [t along cord, drop, radius, sway seconds]
const HANG: [number, number, number, number][] = [
  [0.14, 10, 9, 9], [0.33, 20, 13, 11], [0.53, 12, 11, 10], [0.72, 24, 15, 12.5], [0.9, 12, 10, 9.5],
]
// rising sky lanterns: [left %, size px, seconds, delay, sway px]
const SKY: [number, number, number, number, number][] = [
  [9, 16, 19, -3, 6], [82, 20, 17, -9, -7], [58, 12, 20, -14, 5], [28, 11, 18, -6, -4], [70, 14, 16, -1, 4],
]

function Lantern({ r, gid }: { r: number; gid: string }) {
  const ry = r * 0.86
  return (
    <g>
      <circle r={r * 3.2} cy={ry} fill={`url(#${gid}halo)`} className="ln-halo" />
      <rect x={-r * 0.38} y={-1} width={r * 0.76} height={r * 0.24} rx="1" className="ln-cap" />
      <ellipse cy={ry} rx={r} ry={ry} fill={`url(#${gid}paper)`} />
      <ellipse cy={ry} rx={r * 0.55} ry={ry} className="ln-rib" />
      <path d={`M0 ${-0.1} L0 ${ry * 2}`} className="ln-rib" />
      <rect x={-r * 0.32} y={ry * 2 - 1} width={r * 0.64} height={r * 0.2} rx="1" className="ln-cap" />
      <path d={`M0 ${ry * 2 + r * 0.2} L0 ${ry * 2 + r * 0.75}`} className="ln-tassel" />
    </g>
  )
}

export default function LanternScene() {
  const gid = useId().replace(/:/g, '')
  const g = (n: string) => `url(#${gid}${n})`
  return (
    <div className="lantern-scene" aria-hidden="true">
      <svg className="ln-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gid + 'sky'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ln-sky1)' }} />
            <stop offset=".45" style={{ stopColor: 'var(--ln-sky2)' }} />
            <stop offset=".8" style={{ stopColor: 'var(--ln-sky3)' }} />
          </linearGradient>
          <radialGradient id={gid + 'halo'}>
            <stop offset="0" style={{ stopColor: 'var(--ln-glow)', stopOpacity: 'var(--ln-halo)' }} />
            <stop offset=".35" style={{ stopColor: 'var(--ln-glow)', stopOpacity: 'calc(var(--ln-halo) * .35)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ln-glow)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'paper'} cx=".45" cy=".55" r=".6">
            <stop offset="0" style={{ stopColor: 'var(--ln-paper1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ln-paper2)' }} />
          </radialGradient>
          <linearGradient id={gid + 'water'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ln-water1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ln-water2)' }} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={g('sky')} />
        <g className="ln-stars">{STARS.map((s, i) => <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} className={s.tw ? 'tw' : undefined} style={s.tw ? { animationDelay: `${-i * 0.9}s` } : undefined} />)}</g>
        {/* distant hills and the water below them */}
        <path className="ln-hill far" d="M-10 700 L-10 650 C40 628 90 622 140 640 C180 654 220 630 270 618 C320 606 360 626 400 640 L400 700 Z" />
        <path className="ln-hill near" d="M-10 700 L-10 668 C50 652 110 660 170 674 C230 688 300 662 400 668 L400 700 Z" />
        <rect y="698" width={W} height={H - 698} fill={g('water')} />
        <g className="ln-lines">{[712, 730, 752, 778, 808].map((y, i) => <path key={y} d={`M${-10 + i * 14} ${y} L${400 - i * 10} ${y}`} />)}</g>
        {/* faint reflections of the risen lanterns */}
        <g className="ln-refl">
          {[[54, 1], [236, .8], [322, 1.2]].map(([x, k], i) => (
            <g key={i} style={{ animationDelay: `${-i * 2.6}s` }}>
              {[[708, 16], [720, 11], [734, 7], [750, 4]].map(([y, w], j) => (
                <rect key={j} x={x - (w * k) / 2} y={y} width={w * k} height="1.6" rx=".8" className="ln-glint" style={{ opacity: 1 - j * 0.22 }} />
              ))}
            </g>
          ))}
        </g>
        {/* anchor: a string of round lanterns across the corner */}
        <path className="ln-cord" d={`M${P0[0]} ${P0[1]} Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} />
        {HANG.map(([t, drop, r, s], i) => {
          const [x, y] = on(t)
          return (
            <g key={i} className="ln-hang" style={{ transformOrigin: `${x.toFixed(1)}px ${y.toFixed(1)}px`, animationDuration: `${s}s`, animationDelay: `${-i * 2.3}s` }}>
              <path d={`M${x} ${y} L${x} ${y + drop}`} className="ln-drop" />
              <g transform={`translate(${x.toFixed(1)} ${(y + drop).toFixed(1)})`}><Lantern r={r} gid={gid} /></g>
            </g>
          )
        })}
      </svg>
      {SKY.map(([x, size, dur, delay, sway], i) => (
        <span key={i} className="ln-rise" style={{ left: `${x}%`, width: `${size}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s`, ['--ln-sway' as string]: `${sway}px` }}>
          <svg viewBox="0 0 20 26">
            <path className="ln-sky-body" d="M3 2.5 Q10 -0.5 17 2.5 L15 20 Q10 21.6 5 20 Z" />
            <path className="ln-sky-seam" d="M10 1 L10 20.8" />
            <ellipse className="ln-sky-flame" cx="10" cy="22.6" rx="2" ry="1.6" />
          </svg>
        </span>
      ))}
    </div>
  )
}

// Page B during a session: answers each set moved on (see ThemeSession in ThemeScene.tsx).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LanternSession({ steps }: { steps: number }) {
  return null
}
