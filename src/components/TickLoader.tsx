import { useEffect, useMemo, useRef } from 'react'
import G from '../splash/glyphs.json'
import { useLongLoading } from '../lib/loading'

// Desktop loading ring: DOTSET six times round a dot, ticking clockwise like a watch's second hand.
// Same ring as the phone opening screen, drawn in the theme's own ink so it fits every theme.
// The letters are outlines (Montserrat Bold, from scripts/splash-glyphs.py), so no font has to load.
const R = 161
const C = 2 * Math.PI * R
type Glyphs = { upmM: number; spaceM: number; g: Record<string, { advM: number; c: { m: number[] }[] }> }
const data = G as unknown as Glyphs

function ringPath(): string {
  const word = 'DOTSET'
  const s = (C / 6) / ([...word].reduce((n, c) => n + data.g[c].advM, 0) / data.upmM + .25) / data.upmM
  let d = ''
  for (let w = 0; w < 6; w++) {
    let x = w * C / 6 + .125 * s * data.upmM // half a word gap before each word
    for (const c of word) {
      for (const contour of data.g[c].c) {
        const m = contour.m
        for (let i = 0; i < m.length; i += 2) {
          const a = (x + m[i] * s) / R, r = R + m[i + 1] * s // along the ring clockwise from the top, letters standing outward
          d += (i ? 'L' : 'M') + (r * Math.sin(a)).toFixed(1) + ' ' + (-r * Math.cos(a)).toFixed(1)
        }
        d += 'Z'
      }
      x += data.g[c].advM * s
    }
  }
  return d
}

const backOut = (u: number) => { const c = 1.25; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2 }

export default function TickLoader() {
  const on = useLongLoading()
  const d = useMemo(ringPath, [])
  const ring = useRef<SVGGElement>(null)
  useEffect(() => {
    if (!on) return
    const start = performance.now()
    let raf = 0
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const frame = (now: number) => {
      const x = (now - start) / 1000, n = Math.floor(x / .62), u = Math.min(1, (x - n * .62) / .24)
      ring.current?.setAttribute('transform', `rotate(${still ? 0 : (n + backOut(u)) * 12})`)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [on])
  if (!on) return null
  return (
    <div className="tick-loader" role="status" aria-label="Loading">
      <svg viewBox="-215 -215 430 430" aria-hidden="true">
        <g ref={ring}><path d={d} /></g>
        <circle className="tl-shade" cx="5" cy="6" r="70" />
        <circle r="70" />
      </svg>
    </div>
  )
}
