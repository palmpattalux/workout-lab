import { useId } from 'react'

// Desert theme. Day: a pale sky, the sun, red mesas on the horizon, dunes with a lit and a
// shaded side, saguaro cacti and rocks, sand blowing off the crests, a hawk gliding.
// Night: the same desert under a soft multicolour sky full of stars, lit by a campfire.
// One SVG on a 390 x 844 canvas, sliced to fill the page; colours come from theme tokens.

const W = 390, H = 844
const rand = (k: number) => { const x = Math.sin(k * 91.7) * 43758.5453; return x - Math.floor(x) }
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: rand(i + 1) * W, y: rand(i + 77) * 380, r: 0.5 + rand(i + 151) * 1.1, tw: i % 4 === 0 }))

// a saguaro: rounded trunk with two arms, standing on (0, 0), h tall
function cactus(h: number, left = 0.5, right = 0.62) {
  const w = h * 0.13, r = w / 2, ay = -h * left, by = -h * right, aw = w * 0.82
  return `M${-r} 0 L${-r} ${-h + r} A${r} ${r} 0 0 1 ${r} ${-h + r} L${r} 0 Z
    M${-r + 1} ${ay} L${-r - w * 1.3} ${ay} A${aw / 2} ${aw / 2} 0 0 1 ${-r - w * 1.3 - aw / 2} ${ay - aw / 2} L${-r - w * 1.3 - aw / 2} ${ay - h * 0.26}
    A${aw / 2} ${aw / 2} 0 0 1 ${-r - w * 1.3 + aw / 2} ${ay - h * 0.26} L${-r - w * 1.3 + aw / 2} ${ay - aw} L${-r + 1} ${ay - aw} Z
    M${r - 1} ${by} L${r + w * 1.1} ${by} A${aw / 2} ${aw / 2} 0 0 0 ${r + w * 1.1 + aw / 2} ${by - aw / 2} L${r + w * 1.1 + aw / 2} ${by - h * 0.2}
    A${aw / 2} ${aw / 2} 0 0 0 ${r + w * 1.1 - aw / 2} ${by - h * 0.2} L${r + w * 1.1 - aw / 2} ${by - aw} L${r - 1} ${by - aw} Z`
}

const MESAS = 'M-10 470 L-10 430 L18 430 L26 404 L74 402 L82 430 L120 432 L128 446 L250 448 L258 418 L266 396 L318 394 L326 420 L340 422 L346 410 L400 408 L400 470 Z'
// dunes far to near: [shape, shaded side]
const DUNES: [string, string][] = [
  [`M-10 ${H} L-10 486 C60 462 120 456 180 474 C230 488 290 470 400 452 L400 ${H} Z`,
    'M180 474 C230 488 290 470 400 452 L400 520 C320 512 250 500 180 474 Z'],
  [`M-10 ${H} L-10 590 C40 552 110 520 170 530 C220 538 260 580 300 586 C340 592 370 574 400 566 L400 ${H} Z`,
    'M170 530 C220 538 260 580 300 586 L300 640 C250 630 210 580 170 530 Z'],
  [`M-10 ${H} L-10 700 C50 670 120 650 190 668 C250 684 300 710 400 690 L400 ${H} Z`,
    'M190 668 C250 684 300 710 400 690 L400 760 C300 760 240 720 190 668 Z'],
]
const FIRE: [number, number] = [196, 792]

export default function DesertScene() {
  const gid = useId().replace(/:/g, '')
  const g = (n: string) => `url(#${gid}${n})`
  return (
    <div className="desert-scene" aria-hidden="true">
      <svg className="ds-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gid + 'sky'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ds-sky1)' }} />
            <stop offset=".3" style={{ stopColor: 'var(--ds-sky2)' }} />
            <stop offset=".46" style={{ stopColor: 'var(--ds-sky3)' }} />
            <stop offset=".56" style={{ stopColor: 'var(--ds-sky4)' }} />
          </linearGradient>
          <linearGradient id={gid + 'aur'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ds-aur1)', stopOpacity: 'var(--ds-aur)' }} />
            <stop offset=".5" style={{ stopColor: 'var(--ds-aur2)', stopOpacity: 'calc(var(--ds-aur) * .7)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ds-aur3)', stopOpacity: 0 }} />
          </linearGradient>
          <radialGradient id={gid + 'halo'}>
            <stop offset=".3" style={{ stopColor: 'var(--ds-sun)', stopOpacity: .5 }} />
            <stop offset="1" style={{ stopColor: 'var(--ds-sun)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'glow'}>
            <stop offset="0" style={{ stopColor: '#ffb35c', stopOpacity: 'calc(var(--ds-fire) * .55)' }} />
            <stop offset=".45" style={{ stopColor: '#ff7a2e', stopOpacity: 'calc(var(--ds-fire) * .18)' }} />
            <stop offset="1" style={{ stopColor: '#ff7a2e', stopOpacity: 0 }} />
          </radialGradient>
          {/* by night the sun becomes a crescent moon */}
          <mask id={gid + 'moon'}>
            <rect width={W} height="240" fill="#fff" />
            <circle cx="333" cy="95" r="19" fill="#000" className="ds-bite" />
          </mask>
          <filter id={gid + 'soft'} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="14" /></filter>
          {[0, 1, 2].map((i) => (
            <linearGradient key={i} id={gid + 'dune' + i} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: `var(--ds-dune${i})` }} />
              <stop offset="1" style={{ stopColor: `var(--ds-dune${i}b)` }} />
            </linearGradient>
          ))}
        </defs>
        <rect width={W} height={H} fill={g('sky')} />
        <path className="ds-aurora" d="M-20 60 C80 20 160 120 260 90 C320 72 360 110 410 96 L410 300 C330 260 250 300 160 250 C90 214 30 260 -20 240 Z" fill={g('aur')} filter={g('soft')} />
        <g className="ds-stars">{STARS.map((s, i) => <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} className={s.tw ? 'tw' : undefined} style={s.tw ? { animationDelay: `${-i * 0.7}s` } : undefined} />)}</g>
        <circle cx="322" cy="104" r="62" fill={g('halo')} className="ds-halo" />
        <circle cx="322" cy="104" r="22" className="ds-sun" mask={g('moon')} />
        <path d={MESAS} className="ds-mesa" />
        {DUNES.map(([d, sh], i) => (
          <g key={i}>
            <path d={d} fill={g('dune' + i)} />
            <path d={sh} className="ds-shade" />
            {i === 1 && <path className="ds-cactus" d={cactus(46)} transform="translate(92 532)" />}
          </g>
        ))}
        <circle cx={FIRE[0]} cy={FIRE[1] - 10} r="170" fill={g('glow')} className="ds-glow" />
        <g className="ds-rocks">
          <ellipse cx="290" cy="728" rx="22" ry="11" /><ellipse cx="312" cy="732" rx="12" ry="7" />
          <ellipse cx="56" cy="788" rx="16" ry="8" />
        </g>
        <path className="ds-cactus near" d={cactus(150, 0.48, 0.6)} transform="translate(344 712)" />
        <path className="ds-cactus near" d={cactus(78, 0.55, 0.42)} transform="translate(30 704)" />
        <g className="ds-wisps">
          <path d="M120 470 C150 462 180 466 210 474" /><path d="M200 532 C226 526 250 530 272 540" style={{ animationDelay: '-3s' }} />
          <path d="M60 676 C90 668 120 668 150 674" style={{ animationDelay: '-6s' }} />
        </g>
        {/* campfire: stones by day, flames by night */}
        <g transform={`translate(${FIRE[0]} ${FIRE[1]})`}>
          <g className="ds-fire">
            <path className="f1" d="M0 -2 C-11 -8 -8 -22 -2 -34 C0 -24 6 -22 7 -14 C9 -20 8 -24 7 -27 C14 -18 13 -6 0 -2 Z" />
            <path className="f2" d="M0 -3 C-6 -7 -5 -15 -1 -22 C1 -16 5 -14 4 -9 C6 -11 6 -13 6 -15 C9 -9 7 -4 0 -3 Z" />
            {[0, 1, 2, 3, 4].map((i) => <circle key={i} className="spark" r="1.1" cx={(i - 2) * 3} cy="-20" style={{ animationDelay: `${-i * 0.5}s`, ['--sx' as string]: `${(rand(i + 9) - 0.5) * 24}px` }} />)}
          </g>
          <path className="ds-log" d="M-15 2 L13 -4 M-13 -4 L15 2" />
          <g className="ds-stones">{[-16, -8, 0, 8, 16].map((x, i) => <ellipse key={i} cx={x} cy={4 + Math.abs(x) * -0.06} rx="4.4" ry="3" />)}</g>
        </g>
      </svg>
      <svg className="ds-hawk" viewBox="0 0 30 10"><path d="M1 6 Q8 0 15 5 Q22 0 29 6 Q22 3 15 7 Q8 3 1 6 Z" /></svg>
    </div>
  )
}
