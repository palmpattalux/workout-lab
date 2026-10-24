import '../themes/ocean.css'
import { useId } from 'react'

// Ocean theme. Day: a soft sky over pale sand light, calm sea bands rolling at the bottom,
// a small lighthouse on a rock in the top-right corner, a few gulls gliding.
// Night: the same coast under a navy sky, the lighthouse beam sweeping slowly,
// a moon and its shimmer on the water. Colours come from theme tokens.

// one wave period is 195 units; each band svg is 200cqw wide and shows 780 units (4 periods),
// so sliding it by -50cqw (2 periods) loops seamlessly.
function wave(amp: number, y: number, h: number) {
  let d = `M0 ${y}`
  for (let x = 0; x < 780; x += 195) {
    d += ` C${x + 48} ${y - amp} ${x + 97} ${y - amp} ${x + 97.5} ${y} S${x + 146} ${y + amp} ${x + 195} ${y}`
  }
  return d + ` L780 ${h} L0 ${h} Z`
}
const BANDS = [
  { amp: 3, y: 8, dur: 20, top: 0 },
  { amp: 3.5, y: 8, dur: 16, top: 26 },
  { amp: 4, y: 8, dur: 13, top: 52 },
]
const STARS: [number, number, number][] = [
  [40, 70, .9], [92, 112, .7], [214, 58, .8], [262, 128, .6], [30, 160, .6], [178, 140, .5], [250, 30, .7], [120, 26, .6],
]
const GULLS = [
  { x: 112, y: 92, s: 1, dur: 17, delay: 0 },
  { x: 150, y: 76, s: .75, dur: 14, delay: -5 },
  { x: 228, y: 104, s: .85, dur: 19, delay: -9 },
]
const LAMP: [number, number] = [334, 77]

export default function OceanScene() {
  const gid = useId().replace(/:/g, '')
  const g = (n: string) => `url(#${gid}${n})`
  return (
    <div className="ocean-scene" aria-hidden="true">
      <svg className="oc-top" viewBox="0 0 390 230" preserveAspectRatio="xMaxYMin meet">
        <defs>
          <linearGradient id={gid + 'beam'} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" style={{ stopColor: 'var(--oc-beam)', stopOpacity: .55 }} />
            <stop offset="1" style={{ stopColor: 'var(--oc-beam)', stopOpacity: 0 }} />
          </linearGradient>
          <radialGradient id={gid + 'halo'}>
            <stop offset=".2" style={{ stopColor: 'var(--oc-beam)', stopOpacity: .6 }} />
            <stop offset="1" style={{ stopColor: 'var(--oc-beam)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'moonhalo'}>
            <stop offset=".35" style={{ stopColor: 'var(--oc-moon)', stopOpacity: .28 }} />
            <stop offset="1" style={{ stopColor: 'var(--oc-moon)', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <g className="oc-stars">
          {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} className={i % 3 === 0 ? 'tw' : undefined} style={i % 3 === 0 ? { animationDelay: `${-i * 1.3}s` } : undefined} />)}
        </g>
        <g className="oc-moon">
          <circle cx="204" cy="100" r="26" fill={g('moonhalo')} />
          <circle cx="204" cy="100" r="9.5" className="oc-moon-disc" />
        </g>
        <path className="oc-beam" d={`M${LAMP[0]} ${LAMP[1]} L70 ${LAMP[1] - 46} L70 ${LAMP[1] + 6} Z`} fill={g('beam')} />
        <g className="oc-gulls">
          {GULLS.map((b, i) => (
            <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
              <path className="oc-gull" d="M-8 0 Q-4 -4.2 0 0.4 Q4 -4.2 8 0 Q4 -2.4 0 1.8 Q-4 -2.4 -8 0 Z" style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }} />
            </g>
          ))}
        </g>
        {/* rock and lighthouse */}
        <g className="oc-light" transform="translate(334 156) scale(1.2) translate(-334 -156)">
        <ellipse className="oc-pool" cx="340" cy="158" rx="62" ry="6" />
        <path className="oc-rock" d="M296 156 C300 146 310 140 322 139 C332 133 346 134 354 140 C366 140 378 146 384 156 Z" />
        <path className="oc-rock-shade" d="M346 140 C362 140 376 146 384 156 L352 156 C354 150 352 144 346 140 Z" />
        <path className="oc-tower" d="M326.5 140 L328.5 90 L339.5 90 L341.5 140 Z" />
        <path className="oc-stripe" d="M327.3 120 L327.8 110 L340.2 110 L340.7 120 Z" />
        <path className="oc-stripe" d="M328.4 100 L328.6 95 L339.4 95 L339.6 100 Z" />
        <rect className="oc-tower-shade" x="336" y="90" width="3.5" height="50" />
        <rect className="oc-door" x="332.2" y="132" width="3.6" height="8" rx="1.8" />
        <rect className="oc-gallery" x="325.5" y="87.5" width="17" height="2.8" rx=".8" />
        <rect className="oc-glass" x="329" y="73" width="10" height="14.5" rx="1" />
        <circle className="oc-halo" cx={LAMP[0]} cy={LAMP[1] + 3} r="16" fill={g('halo')} />
        <rect className="oc-lamp" x="331.6" y="76" width="4.8" height="8.5" rx="1.2" />
        <path className="oc-cap" d="M327.5 73.5 Q334 63 340.5 73.5 Z" />
        <rect className="oc-cap" x="333.4" y="61.5" width="1.2" height="4" rx=".6" />
        <g className="oc-foam">
          <path d="M292 158 C304 156 316 160 328 158" />
          <path d="M340 159 C352 157 366 161 386 158" style={{ animationDelay: '-3s' }} />
        </g>
        </g>
      </svg>
      <div className="oc-sea">
        {BANDS.map((b, i) => (
          <svg key={i} className={`oc-band b${i}`} viewBox="0 0 780 120" preserveAspectRatio="none"
            style={{ top: `${b.top}%`, animationDuration: `${b.dur}s` }}>
            <path d={wave(b.amp, b.y, 120)} />
          </svg>
        ))}
        <div className="oc-shimmer">
          {[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ top: `${12 + i * 16}%`, width: `${16 - i * 2.2}cqw`, marginLeft: `${(i % 2 ? 1 : -1) * i * .8}cqw`, animationDelay: `${-i * 1.7}s` }} />)}
        </div>
      </div>
    </div>
  )
}
