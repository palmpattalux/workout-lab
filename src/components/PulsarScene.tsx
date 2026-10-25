import '../themes/pulsar.css'
import { useEffect, useId, useRef, useState } from 'react'
import { livePage, onPick } from '../lib/sound'
import { pulsarSound } from '../themes/pulsar-sound'

// Pulsar theme backdrop: a spinning neutron star in the top-right corner, two thin light beams
// sweeping round from its poles, faint field loops and a soft pulse ring every turn, among
// sparse stars and a wisp of nebula. Day: pale icy space with violet beams. Night: deep blue
// black with cyan-white beams.

const rand = (k: number) => { const x = Math.sin(k * 71.3) * 43758.5453; return x - Math.floor(x) }
const W = 390, H = 844
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: rand(i + 7) * W, y: rand(i + 53) * H, r: 0.45 + rand(i + 101) * 0.85 }))
  .filter((s) => !(s.x > 190 && s.y < 160))
  .slice(0, 34)
  .map((s, i) => ({ ...s, tw: i % 3 === 0, d: -(i * 1.61) % 8 }))

export default function PulsarScene() {
  const gid = useId().replace(/:/g, '')
  return (
    <div className="pulsar-scene" aria-hidden="true">
      <svg className="pl-sky" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={gid + 'neb'}>
            <stop offset="0" style={{ stopColor: 'var(--pl-neb)', stopOpacity: 'var(--pl-neb-o)' }} />
            <stop offset="1" style={{ stopColor: 'var(--pl-neb)', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <ellipse cx="70" cy="520" rx="190" ry="70" transform="rotate(-24 70 520)" fill={`url(#${gid}neb)`} className="pl-neb" />
        <g className="pl-stars">
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)}
              className={s.tw ? 'tw' : undefined} style={s.tw ? { animationDelay: `${s.d.toFixed(2)}s` } : undefined} />
          ))}
        </g>
      </svg>
      <svg className="pl-corner" viewBox="0 0 260 220">
        <Star gid={gid} x={198} y={64} scale={1} />
      </svg>
    </div>
  )
}

// The star itself: glow, field loops, beams (spinning in .pl-spin), pulse ring and core.
function Star({ gid, x, y, scale, spin }: { gid: string; x: number; y: number; scale: number; spin?: number }) {
  const u = (n: string) => `url(#${gid}${n})`
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={gid + 'glow'}>
          <stop offset=".1" style={{ stopColor: 'var(--pl-glow)', stopOpacity: 'var(--pl-glow-o)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pl-glow)', stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={gid + 'core'}>
          <stop offset="0" style={{ stopColor: 'var(--pl-core1)' }} />
          <stop offset=".55" style={{ stopColor: 'var(--pl-core2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pl-core2)', stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={gid + 'beam'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--pl-beam)', stopOpacity: 'var(--pl-beam-o)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pl-beam)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <circle r="70" fill={u('glow')} className="pl-glow" />
      <g className="pl-field" transform="rotate(-28)">
        <ellipse cx="0" cy="-17" rx="12" ry="19" />
        <ellipse cx="0" cy="17" rx="12" ry="19" />
        <ellipse cx="0" cy="-27" rx="21" ry="29" className="far" />
        <ellipse cx="0" cy="27" rx="21" ry="29" className="far" />
      </g>
      <g className="pl-turn" style={spin !== undefined ? { transform: `rotate(${spin}deg)` } : undefined}>
        <g className="pl-spin">
          <polygon points="0,-1.6 240,-15 240,15 0,1.6" fill={u('beam')} className="pl-beam" />
          <polygon points="0,-1.6 240,-15 240,15 0,1.6" fill={u('beam')} className="pl-beam" transform="rotate(180)" />
        </g>
      </g>
      <circle r="10" className="pl-ring" />
      <circle r="13" fill={u('core')} className="pl-halo" />
      <circle r="4.2" className="pl-core" />
    </g>
  )
}

// Page B during a session: a bigger pulsar low in the left corner. Every step while dragging
// reps or load turns it a little with its radio tick; every set moved on sends out a pulse.
export function PulsarSession({ steps }: { steps: number }) {
  const gid = useId().replace(/:/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const last = useRef(steps)
  const [spin, setSpin] = useState(0)
  const [flash, setFlash] = useState(0)
  const [wave, setWave] = useState(0)

  useEffect(() => onPick((dir) => {
    if (!livePage(ref.current)) return false
    setSpin((s) => s + (dir < 0 ? -26 : 26))
    setFlash((f) => f + 1)
    pulsarSound.tick()
    return true
  }), [])

  useEffect(() => {
    if (steps > last.current) {
      setWave((w) => w + 1)
      if (livePage(ref.current)) pulsarSound.set()
    }
    last.current = steps
  }, [steps])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      if (livePage(ref.current)) pulsarSound.ambient()
      t = setTimeout(loop, 30000 + Math.random() * 24000)
    }
    t = setTimeout(loop, 10000 + Math.random() * 8000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="pulsar-scene pl-session" ref={ref} aria-hidden="true">
      <svg className="pl-sys" viewBox="0 0 390 390">
        <Star gid={gid} x={52} y={338} scale={1.5} spin={spin} />
        <g transform="translate(52 338)">
          {flash > 0 && <circle key={'f' + flash} r="9" className="pl-tickflash" />}
          {wave > 0 && <circle key={'w' + wave} r="12" className="pl-wave" />}
          {wave > 0 && <circle key={'v' + wave} r="12" className="pl-wave late" />}
        </g>
      </svg>
    </div>
  )
}
