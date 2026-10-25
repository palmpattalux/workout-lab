import '../themes/rain.css'
import { useId } from 'react'

// Rain theme: the page is a window pane on a rainy day. Behind the glass, soft blurred shapes
// (day: pale clouds over distant rooftops; night: warm and cool city bokeh). Thin rain streaks
// fall slowly outside, and a few drops on the glass slide down leaving faint trails.
// Anchor top-right: a soft rain cloud by day, a blurred streetlamp glow by night.

const W = 390, H = 844

// distant rooftops: one soft silhouette low on the page
const ROOFS = 'M-10 844 L-10 610 L24 610 L24 586 L58 586 L58 604 L96 604 L110 578 L124 604 L150 604 L150 560 L190 560 L190 596 L226 596 L226 574 L262 574 L262 548 L276 548 L276 574 L300 574 L300 602 L340 602 L352 584 L364 602 L400 602 L400 844 Z'
// night bokeh: [x, y, r, warm?]
const BOKEH: [number, number, number, boolean][] = [
  [40, 560, 18, true], [96, 610, 11, false], [150, 540, 14, true], [214, 590, 20, false],
  [268, 556, 12, true], [330, 612, 16, true], [372, 548, 10, false], [70, 470, 9, false],
  [250, 470, 8, true], [180, 650, 10, true], [20, 660, 12, false], [356, 680, 9, true],
  [120, 400, 7, true], [300, 420, 7, false],
]
// streaks outside the glass: x (%), length (cqh), duration, delay, opacity
const STREAKS = [
  [8, 9, 9, 0, .7], [21, 6, 10.5, -3, .5], [35, 8, 8.5, -6, .6], [49, 5, 11, -1.5, .45],
  [62, 9, 9.5, -7.5, .65], [74, 6, 10, -4.5, .5], [87, 8, 8.8, -2.2, .6], [97, 5, 11.5, -8.6, .45],
]
// drops on the glass: x (%), y (%), size (cqw), fall (cqh), duration, delay
const DROPS = [
  [7, 30, 3.8, 22, 17, 0], [17, 3, 2.8, 16, 14, -5], [58, 6, 3.2, 12, 19, -11],
  [91, 33, 4.2, 22, 16, -3], [80, 52, 3, 18, 18, -9], [5, 60, 3.4, 14, 15, -13],
  [45, 38, 2.6, 10, 20, -7], [94, 66, 2.8, 12, 13, -1],
]

export default function RainScene() {
  const gid = useId().replace(/:/g, '')
  const g = (n: string) => `url(#${gid}${n})`
  return (
    <div className="rain-scene" aria-hidden="true">
      <svg className="rn-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gid + 'sky'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--rn-sky1)' }} />
            <stop offset=".6" style={{ stopColor: 'var(--rn-sky2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--rn-sky3)' }} />
          </linearGradient>
          <radialGradient id={gid + 'lamp'}>
            <stop offset="0" style={{ stopColor: 'var(--rn-lamp)', stopOpacity: .75 }} />
            <stop offset=".35" style={{ stopColor: 'var(--rn-lamp)', stopOpacity: .22 }} />
            <stop offset="1" style={{ stopColor: 'var(--rn-lamp)', stopOpacity: 0 }} />
          </radialGradient>
          <filter id={gid + 'far'} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
          <filter id={gid + 'bokeh'} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" /></filter>
          <filter id={gid + 'soft'} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
        </defs>
        <rect width={W} height={H} fill={g('sky')} />
        {/* day: pale grey clouds drifting behind the glass */}
        <g className="rn-clouds" filter={g('far')}>
          <ellipse cx="70" cy="170" rx="110" ry="34" />
          <ellipse cx="250" cy="300" rx="140" ry="30" />
          <ellipse cx="120" cy="430" rx="150" ry="26" />
        </g>
        <path d={ROOFS} className="rn-roofs" filter={g('far')} />
        {/* night: city lights blurred through wet glass */}
        <g className="rn-bokeh" filter={g('bokeh')}>
          {BOKEH.map(([x, y, r, warm], i) => <circle key={i} cx={x} cy={y} r={r} className={warm ? 'w' : 'c'} />)}
        </g>
        {/* anchor, day: a soft rain cloud */}
        <g className="rn-cloud" filter={g('soft')}>
          <path className="rn-cloud-body" d="M256 118 C238 118 230 104 237 91 C242 81 255 77 266 81 C270 63 288 54 305 58 C318 44 345 46 356 62 C373 58 390 70 390 87 C402 92 404 114 388 118 Z" />
          <path className="rn-cloud-belly" d="M256 118 C272 109 298 110 316 115 C338 108 366 108 388 118 Z" />
        </g>
        <g className="rn-cloud-rain">
          {[278, 300, 322, 344, 366].map((x, i) => <path key={i} d={`M${x} ${122 + (i % 2) * 6} l-4 ${14 + (i % 3) * 3}`} />)}
        </g>
        {/* anchor, night: a streetlamp glowing through the rain */}
        <g className="rn-lampset">
          <circle cx="322" cy="86" r="96" fill={g('lamp')} className="rn-glow" />
          <g filter={g('soft')}>
            <path className="rn-post" d="M404 40 C372 34 346 44 336 66" />
            <path className="rn-head" d="M322 70 L350 70 L344 80 L328 80 Z" />
            <ellipse cx="336" cy="82" rx="8" ry="3" className="rn-bulb" />
          </g>
        </g>
      </svg>
      {STREAKS.map(([x, len, dur, delay, o], i) => (
        <i key={i} className="rn-streak" style={{ left: `${x}%`, height: `${len}cqh`, opacity: o, animationDuration: `${dur}s`, animationDelay: `${delay}s` }} />
      ))}
      {DROPS.map(([x, y, s, fall, dur, delay], i) => {
        const vars = { left: `${x}%`, top: `${y}%`, ['--rn-s' as string]: `${s}cqw`, ['--rn-fall' as string]: `${fall}cqh` }
        const anim = { animationDuration: `${dur}s`, animationDelay: `${delay}s` }
        return (
          <span key={i} className="rn-drop" style={vars}>
            <i className="rn-trail" style={anim} />
            <i className="rn-bead" style={anim} />
          </span>
        )
      })}
      <div className="rn-glass" />
    </div>
  )
}
