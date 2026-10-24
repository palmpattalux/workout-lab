import '../themes/orbit.css'
import { useEffect, useId, useRef, useState } from 'react'
import { livePage } from '../lib/sound'
import { orbitSound } from '../themes/orbit-sound'

// Orbit theme backdrop: a ringed planet partly off the top-right corner (echoing the logo's
// dot-in-a-ring), one small moon circling it on a faint tilted ellipse, sparse slow stars and
// a faint distant planet. Day: pale lavender "daylight space". Night: deep navy, warm planet.

const rand = (k: number) => { const x = Math.sin(k * 91.7) * 43758.5453; return x - Math.floor(x) }
const W = 390, H = 844
// keep the stars away from the corner planet and sparse elsewhere
const STARS = Array.from({ length: 60 }, (_, i) => ({ x: rand(i + 3) * W, y: rand(i + 41) * H, r: 0.5 + rand(i + 97) * 0.9 }))
  .filter((s) => !(s.x > 170 && s.y < 140))
  .slice(0, 30)
  .map((s, i) => ({ ...s, tw: i % 3 === 0, d: -(i * 1.37) % 9 }))

// corner art geometry (viewBox units)
const PX = 204, PY = 50, PR = 48
const TILT = -16
const RING = { rx: 84, ry: 16 }
const ORBIT = { rx: 128, ry: 36 }

export default function OrbitScene() {
  const gid = useId().replace(/:/g, '')
  const u = (n: string) => `url(#${gid}${n})`
  return (
    <div className="orbit-scene" aria-hidden="true">
      <svg className="ob-sky" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={gid + 'far'} cx=".38" cy=".35" r=".7">
            <stop offset="0" style={{ stopColor: 'var(--ob-far1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ob-far2)' }} />
          </radialGradient>
        </defs>
        <g className="ob-stars">
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)}
              className={s.tw ? 'tw' : undefined} style={s.tw ? { animationDelay: `${s.d.toFixed(2)}s` } : undefined} />
          ))}
        </g>
        <g className="ob-far">
          <circle cx="34" cy="388" r="13" fill={u('far')} />
          <ellipse cx="34" cy="388" rx="21" ry="3.6" transform="rotate(-14 34 388)" className="ob-far-ring" />
        </g>
      </svg>

      <svg className="ob-corner" viewBox="0 0 260 200">
        <defs>
          <radialGradient id={gid + 'glow'}>
            <stop offset=".35" style={{ stopColor: 'var(--ob-glow)', stopOpacity: 'var(--ob-glow-o)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ob-glow)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'planet'} cx=".34" cy=".7" r=".85">
            <stop offset="0" style={{ stopColor: 'var(--ob-p1)' }} />
            <stop offset=".6" style={{ stopColor: 'var(--ob-p2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ob-p3)' }} />
          </radialGradient>
          <radialGradient id={gid + 'moon'} cx=".35" cy=".35" r=".75">
            <stop offset="0" style={{ stopColor: 'var(--ob-m1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ob-m2)' }} />
          </radialGradient>
          {/* the half of the tilted frame nearer to the viewer */}
          <linearGradient id={gid + 'shade'} x1=".2" y1=".85" x2=".85" y2=".1">
            <stop offset=".45" style={{ stopColor: 'var(--ob-shade)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--ob-shade)', stopOpacity: 'var(--ob-shade-o)' }} />
          </linearGradient>
          <clipPath id={gid + 'front'}><rect x="-200" y="0" width="400" height="120" /></clipPath>
          <clipPath id={gid + 'back'}><rect x="-200" y="-120" width="400" height="120" /></clipPath>
        </defs>
        <circle cx={PX} cy={PY} r={PR * 2.1} fill={u('glow')} />

        <g transform={`translate(${PX} ${PY}) rotate(${TILT})`}>
          {/* far side of the moon's path and ring, behind the planet */}
          <ellipse rx={ORBIT.rx} ry={ORBIT.ry} className="ob-path" clipPath={u('back')} />
          <ellipse rx={RING.rx} ry={RING.ry} className="ob-ring" clipPath={u('back')} />
          <g clipPath={u('back')}><Moon fill={u('moon')} /></g>
        </g>

        <circle cx={PX} cy={PY} r={PR} fill={u('planet')} className="ob-planet" />
        <g className="ob-bands" transform={`translate(${PX} ${PY}) rotate(${TILT})`}>
          <path d={`M${-PR * .93} 14 Q0 24 ${PR * .93} 14`} />
          <path d={`M${-PR * .99} 2 Q0 10 ${PR * .99} 2`} className="thin" />
          <path d={`M${-PR * .8} -24 Q0 -17 ${PR * .8} -24`} className="thin" />
        </g>
        <circle cx={PX} cy={PY} r={PR} fill={u('shade')} />

        <g transform={`translate(${PX} ${PY}) rotate(${TILT})`}>
          <ellipse rx={ORBIT.rx} ry={ORBIT.ry} className="ob-path" clipPath={u('front')} />
          <ellipse rx={RING.rx} ry={RING.ry} className="ob-ring" clipPath={u('front')} />
          <g clipPath={u('front')}><Moon fill={u('moon')} /></g>
        </g>
      </svg>
    </div>
  )
}

// x and y swing as two quarter-shifted ease-in-out oscillations, tracing the ellipse
function Moon({ fill }: { fill: string }) {
  return (
    <g className="ob-mx" style={{ ['--ob-rx' as string]: `${ORBIT.rx}px` }}>
      <g className="ob-my" style={{ ['--ob-ry' as string]: `${ORBIT.ry}px` }}>
        <circle r="5.4" fill={fill} className="ob-moon" transform={`rotate(${-TILT})`} />
      </g>
    </g>
  )
}

// Page B during a session: faint orbit rings round a small planet in the bottom-left corner
// (and a faint echo top-right). Every set moved on sends a soft shooting star across the top
// and adds a moon that joins one of the orbits, so the little system grows through the session.
const SYS_RINGS = [112, 178, 252]
const MAX_MOONS = 12
const moonOf = (i: number) => {
  const ring = i % 3
  const R = SYS_RINGS[ring]
  // each moon swings slowly to and fro along the visible quarter of its ring
  const a0 = -(14 + rand(i + 5) * 22), a1 = -(52 + rand(i + 11) * 24)
  const dur = [24, 34, 46][ring] + rand(i + 17) * 8
  return { R, a0, a1, dur, delay: -(rand(i + 23) * dur * 2), r: 2.6 + rand(i + 29) * 2.2, sat: i % 4 === 3 }
}

export function OrbitSession({ steps }: { steps: number }) {
  const gid = useId().replace(/:/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(steps)
  const last = useRef(steps)
  const [shot, setShot] = useState<{ n: number; top: number; left: number; a: number } | null>(null)

  useEffect(() => {
    if (steps > last.current) {
      setShot({ n: steps, top: 12 + Math.random() * 5, left: 6 + Math.random() * 18, a: 8 + Math.random() * 10 })
      if (livePage(ref.current)) orbitSound.set()
    }
    last.current = steps
    const t = setTimeout(() => setShot(null), 1800)
    return () => clearTimeout(t)
  }, [steps])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      if (livePage(ref.current)) orbitSound.ambient()
      t = setTimeout(loop, 28000 + Math.random() * 26000)
    }
    t = setTimeout(loop, 9000 + Math.random() * 8000)
    return () => clearTimeout(t)
  }, [])

  const count = Math.min(steps, MAX_MOONS)
  return (
    <div className="orbit-scene ob-session" ref={ref} aria-hidden="true">
      <svg className="ob-sys" viewBox="0 0 390 390">
        <defs>
          <radialGradient id={gid + 'sg'}>
            <stop offset=".2" style={{ stopColor: 'var(--ob-glow)', stopOpacity: 'var(--ob-glow-o)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ob-glow)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'sp'} cx=".7" cy=".3" r=".8">
            <stop offset="0" style={{ stopColor: 'var(--ob-p1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ob-p3)' }} />
          </radialGradient>
        </defs>
        <g transform="translate(0 390)">
          <circle r="170" fill={`url(#${gid}sg)`} className="ob-sys-glow" />
          {SYS_RINGS.map((R, i) => <circle key={i} r={R} className={`ob-sys-ring r${i}`} />)}
          <circle r="40" fill={`url(#${gid}sp)`} className="ob-sys-planet" />
          <circle r="58" className="ob-sys-halo" />
          {Array.from({ length: count }, (_, i) => {
            const m = moonOf(i)
            return (
              <g key={i} className="ob-sw" style={{ ['--a0' as string]: `${m.a0.toFixed(1)}deg`, ['--a1' as string]: `${m.a1.toFixed(1)}deg`, animationDuration: `${m.dur.toFixed(1)}s`, animationDelay: `${m.delay.toFixed(1)}s` }}>
                <g transform={`translate(${m.R} 0)`}>
                  <g className={i >= first.current ? 'ob-join' : undefined}>
                    <circle r={m.r * 3} fill={`url(#${gid}sg)`} className="ob-sys-moonglow" />
                    <circle r={m.r.toFixed(2)} className={m.sat ? 'ob-sys-moon sat' : 'ob-sys-moon'} />
                  </g>
                </g>
              </g>
            )
          })}
        </g>
      </svg>
      <svg className="ob-echo" viewBox="0 0 200 200">
        <g transform="translate(200 0)">
          <circle r="74" className="ob-sys-ring r0" />
          <circle r="136" className="ob-sys-ring r2" />
          <circle r="5" className="ob-echo-sun" />
        </g>
      </svg>
      {shot && (
        <div key={shot.n} className="ob-shoot" style={{ top: `${shot.top.toFixed(1)}%`, left: `${shot.left.toFixed(1)}%`, transform: `rotate(${shot.a.toFixed(1)}deg)` }}>
          <i />
        </div>
      )}
    </div>
  )
}
