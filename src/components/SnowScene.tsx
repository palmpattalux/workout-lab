import '../themes/snow.css'
import { useId } from 'react'

// Snowfall theme. Day: an icy-blue winter sky, a pale sun, low snowy ridges, slow snow.
// Night: the same mountains under an indigo sky with a moon, and a small cabin whose window glows.
// One SVG on a 390 x 844 canvas, sliced to fill the page; snowflakes are CSS dots on top.

const W = 390, H = 844
const rand = (k: number) => { const x = Math.sin(k * 91.7) * 43758.5453; return x - Math.floor(x) }
const STARS = Array.from({ length: 26 }, (_, i) => ({ x: rand(i + 3) * W, y: 20 + rand(i + 61) * 300, r: 0.5 + rand(i + 133) * 0.8 }))
const FLAKES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.round(rand(i + 11) * 96 + 2), size: 2.5 + rand(i + 41) * 3.5, sway: (rand(i + 71) - 0.5) * 10,
  dur: 12 + rand(i + 101) * 8, delay: -rand(i + 201) * 20, o: 0.45 + rand(i + 251) * 0.45,
}))

const FAR = `M-10 ${H} L-10 600 L30 578 L62 556 L96 572 L140 530 L176 556 L214 540 L250 512 L292 548 L330 532 L362 552 L400 538 L400 ${H} Z`
const FAR_CAPS = 'M50 564 L62 556 L74 562 L68 566 L62 562 L56 568 Z M126 542 L140 530 L156 544 L148 541 L141 548 L134 541 Z M236 524 L250 512 L266 527 L258 524 L251 531 L243 524 Z M318 540 L330 532 L342 539 L335 538 L330 542 L324 538 Z'
const MID = `M-10 ${H} L-10 640 C30 628 60 612 98 618 C140 624 170 600 212 604 C252 608 280 632 318 626 C350 621 372 612 400 616 L400 ${H} Z`
const NEAR = `M-10 ${H} L-10 712 C50 694 110 690 170 702 C230 714 280 690 330 676 C356 669 380 672 400 676 L400 ${H} Z`
const CABIN: [number, number] = [334, 676]

export default function SnowScene() {
  const gid = useId().replace(/:/g, '')
  const g = (n: string) => `url(#${gid}${n})`
  return (
    <div className="snow-scene" aria-hidden="true">
      <svg className="sn-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gid + 'sky'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--sn-sky1)' }} />
            <stop offset=".5" style={{ stopColor: 'var(--sn-sky2)' }} />
            <stop offset=".78" style={{ stopColor: 'var(--sn-sky3)' }} />
          </linearGradient>
          <radialGradient id={gid + 'halo'}>
            <stop offset=".25" style={{ stopColor: 'var(--sn-sun)', stopOpacity: .55 }} />
            <stop offset="1" style={{ stopColor: 'var(--sn-sun)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'warm'}>
            <stop offset="0" style={{ stopColor: '#ffc77a', stopOpacity: 'calc(var(--sn-night) * .5)' }} />
            <stop offset=".5" style={{ stopColor: '#ff9f50', stopOpacity: 'calc(var(--sn-night) * .14)' }} />
            <stop offset="1" style={{ stopColor: '#ff9f50', stopOpacity: 0 }} />
          </radialGradient>
          <mask id={gid + 'moon'}>
            <rect width={W} height="240" fill="#fff" />
            <circle cx="333" cy="94" r="18" fill="#000" className="sn-bite" />
          </mask>
          {[0, 1, 2].map((i) => (
            <linearGradient key={i} id={gid + 'hill' + i} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: `var(--sn-hill${i})` }} />
              <stop offset="1" style={{ stopColor: `var(--sn-hill${i}b)` }} />
            </linearGradient>
          ))}
        </defs>
        <rect width={W} height={H} fill={g('sky')} />
        <g className="sn-stars">{STARS.map((s, i) => <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} className={i % 5 === 0 ? 'tw' : undefined} style={i % 5 === 0 ? { animationDelay: `${-i * 0.9}s` } : undefined} />)}</g>
        <circle cx="322" cy="104" r="66" fill={g('halo')} className="sn-halo" />
        <circle cx="322" cy="104" r="21" className="sn-sun" mask={g('moon')} />
        <path d={FAR} fill={g('hill0')} />
        <path d={FAR_CAPS} className="sn-cap" />
        <path d={MID} fill={g('hill1')} />
        <path d={NEAR} fill={g('hill2')} />
        {/* pines on the middle ridge */}
        <g className="sn-pines">
          {[[30, 632, 18], [44, 628, 13], [262, 618, 15], [276, 622, 11]].map(([x, y, h], i) => (
            <path key={i} d={`M${x} ${y - h} L${x + h * 0.36} ${y} L${x - h * 0.36} ${y} Z`} />
          ))}
        </g>
        {/* cabin: snowy roof, one window that glows at night */}
        <circle cx={CABIN[0]} cy={CABIN[1] - 10} r="80" fill={g('warm')} className="sn-glow" />
        <g transform={`translate(${CABIN[0]} ${CABIN[1]})`}>
          <rect className="sn-wall" x="-15" y="-16" width="30" height="16" />
          <rect className="sn-chim" x="6" y="-30" width="4.5" height="10" />
          <path className="sn-roof" d="M-19 -15 L0 -29 L19 -15 Z" />
          <path className="sn-roof-snow" d="M-20 -14.5 L0 -30 L20 -14.5 L17 -14.5 L0 -27 L-17 -14.5 Z" />
          <rect className="sn-win" x="-9" y="-11" width="7" height="6" rx=".6" />
          <rect className="sn-door" x="4" y="-10" width="6" height="10" />
        </g>
      </svg>
      {FLAKES.map((f, i) => (
        <i key={i} className="sn-flake" style={{
          left: `${f.x}%`, width: `${f.size.toFixed(1)}px`, height: `${f.size.toFixed(1)}px`,
          ['--sn-sway' as string]: `${f.sway.toFixed(1)}cqw`, ['--sn-o' as string]: f.o.toFixed(2),
          animationDuration: `${f.dur.toFixed(1)}s`, animationDelay: `${f.delay.toFixed(1)}s`,
        }} />
      ))}
    </div>
  )
}
