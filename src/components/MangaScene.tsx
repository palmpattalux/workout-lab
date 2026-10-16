import { useEffect, useRef, useState } from 'react'
import { sound } from '../lib/sound'

// Manga theme: black and white paper with screentone. Home: focus lines in the corner and,
// now and then, a speech bubble with a classic manga line. During a session, page B turns
// into a battlefield: sword slashes cross the page, sometimes a flurry of them.
// Everything is CSS transforms on a few elements, so it costs next to nothing.

const LINES = ['なにっ!?', '行くぞ!', 'まだまだ!', 'やるしかない!', '限界を超えろ!', '負けない…!', 'これが本気だ!', 'さすが…!']
const SFX = ['ゴゴゴゴ', 'ドドドド']
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const rand = (a: number, b: number) => a + Math.random() * (b - a)
// sounds only for the theme in use, never from the little previews in the gallery
const live = (el: Element | null) => !!el && !el.closest('.theme-art')

// Focus lines bursting from the top-right corner (the theme's anchor).
function FocusLines() {
  const rays = Array.from({ length: 26 }, (_, i) => {
    const a = (90 + (i / 25) * 90 + rand(-1.2, 1.2)) * (Math.PI / 180)
    const len = rand(130, 240), w = rand(.6, 2)
    const x = Math.cos(a), y = Math.sin(a)
    const px = -y * w, py = x * w
    return `M0 0 L${(x * len + px).toFixed(1)} ${(y * len + py).toFixed(1)} L${(x * len - px).toFixed(1)} ${(y * len - py).toFixed(1)}Z`
  })
  return (
    <svg className="mg-focus" viewBox="-260 0 260 260" aria-hidden="true">
      <path d={rays.join('')} />
    </svg>
  )
}

type Pop = { id: number; text: string; x: number; y: number; flip: boolean; sfx: boolean }

export default function MangaScene() {
  const ref = useRef<HTMLDivElement>(null)
  const [pop, setPop] = useState<Pop | null>(null)
  useEffect(() => {
    let n = 0
    let t: ReturnType<typeof setTimeout>
    const next = (wait: number) => {
      t = setTimeout(() => {
        const sfx = Math.random() < 0.25
        setPop({ id: ++n, text: sfx ? pick(SFX) : pick(LINES), x: rand(10, 52), y: rand(29, 41), flip: Math.random() < 0.5, sfx })
        if (!sfx && live(ref.current)) sound.bubble()
        t = setTimeout(() => { setPop(null); next(rand(7000, 13000)) }, 2600)
      }, wait)
    }
    next(1800)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="manga-scene" ref={ref} aria-hidden="true">
      <FocusLines />
      <div className="mg-tone" />
      {pop && (pop.sfx
        ? <span key={pop.id} className="mg-sfx" style={{ left: `${pop.x}%`, top: `${pop.y}%` }}>{pop.text}</span>
        : <span key={pop.id} className={`mg-bubble${pop.flip ? ' flip' : ''}`} style={{ left: `${pop.x}%`, top: `${pop.y}%` }}>{pop.text}</span>)}
    </div>
  )
}

type Cut = { id: number; x: number; y: number; a: number; len: number; delay: number }

// Page B during a session. `set` changing upward shows an impact frame.
export function MangaBattle({ set }: { set: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cuts, setCuts] = useState<Cut[]>([])
  const [flurry, setFlurry] = useState(0)
  const [impact, setImpact] = useState(0)
  const last = useRef(set)

  useEffect(() => {
    let n = 0
    let t: ReturnType<typeof setTimeout>
    const cut = (delay: number): Cut => ({ id: ++n, x: rand(15, 85), y: rand(18, 70), a: rand(-55, 55) + (Math.random() < 0.5 ? 0 : 180), len: rand(70, 120), delay })
    const loop = () => {
      // mostly a single cut; every few times a flurry, as if a hundred slices land at once
      const many = Math.random() < 0.3
      const batch = many ? Array.from({ length: 12 }, (_, i) => cut(i * 55)) : [cut(0)]
      setCuts(batch)
      if (many) setFlurry((f) => f + 1)
      if (live(ref.current)) {
        sound.slash()
        if (many) [220, 440].forEach((ms) => setTimeout(() => live(ref.current) && sound.slash(), ms))
      }
      t = setTimeout(() => { setCuts([]); t = setTimeout(loop, rand(5000, 9000)) }, many ? 1300 : 700)
    }
    t = setTimeout(loop, 1500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (set > last.current) { setImpact((i) => i + 1); if (live(ref.current)) sound.impact() }
    last.current = set
  }, [set])

  return (
    <div className="manga-scene battle" ref={ref} aria-hidden="true">
      <div className="mg-wind">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ top: `${12 + i * 12}%`, animationDelay: `${-i * 0.9}s`, animationDuration: `${2.6 + (i % 3) * 0.7}s` }} />)}</div>
      <div className="mg-tone" />
      {flurry > 0 && <div key={'f' + flurry} className="mg-flash" />}
      {cuts.map((c) => (
        <i key={c.id} className="mg-cut" style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.len}cqw`, transform: `translate(-50%, -50%) rotate(${c.a}deg)`, ['--d' as string]: `${c.delay}ms` }} />
      ))}
      {impact > 0 && <div key={'i' + impact} className="mg-impact"><span>ドン!</span></div>}
    </div>
  )
}
