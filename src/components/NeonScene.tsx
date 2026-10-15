// Neon: a cyber city at night, kept minimal. Two flat skyline layers with a few
// rooftops traced in neon, a perspective grid rolling toward you, light trails
// gliding between the towers and the odd sign flickering. Purely decorative.

function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
}

// five neon hues: c1 cyan, c2 magenta, c3 violet, c4 amber, c5 mint
type Win = { x: number; y: number; c: number; tw: boolean }
type Tower = { x: number; w: number; top: number; neon: number; wins: Win[] }
function skyline(seed: number, minH: number, maxH: number, neonShare: number, lit: number): Tower[] {
  const r = rng(seed * 7919 + 104729)
  const out: Tower[] = []
  let x = -6
  while (x < 406) {
    const w = 16 + r() * 30, h = minH + r() * (maxH - minH), top = 200 - h
    const neon = r() < neonShare ? 1 + Math.floor(r() * 5) : 0
    // each tower has one window tint, with the odd stray colour
    const tint = [4, 4, 1, 3, 5, 2][Math.floor(r() * 6)]
    const wins: Win[] = []
    const cols = Math.max(2, Math.floor((w - 4) / 5))
    const gx = (w - cols * 5 + 2.4) / 2
    for (let y = top + 6; y < 196; y += 6)
      for (let c = 0; c < cols; c++)
        if (r() < lit) wins.push({ x: x + gx + c * 5, y, c: r() < 0.12 ? 1 + Math.floor(r() * 5) : tint, tw: r() < 0.04 })
    out.push({ x, w, top, neon, wins })
    x += w + r() * 3
  }
  return out
}
const FAR = skyline(3, 50, 140, 0.2, 0.22)
const NEAR = skyline(11, 26, 96, 0.24, 0.3)

const SIGNS = [{ x: 18, y: 50, h: 9, c: 1 }, { x: 44, y: 53, h: 5, c: 4 }, { x: 71, y: 47, h: 7, c: 2 }, { x: 86, y: 55, h: 6, c: 5 }, { x: 58, y: 49, h: 4, c: 3 }]
const TRAILS = [{ y: 52, dur: 7, delay: -1, c: 1 }, { y: 57, dur: 11, delay: -6, c: 2 }, { y: 49, dur: 15, delay: -9, c: 4 }, { y: 54, dur: 13, delay: -3, c: 3 }]

function Layer({ towers, className }: { towers: Tower[]; className: string }) {
  return (
    <svg className={`ne-layer ${className}`} viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice">
      {towers.map((t, i) => <rect key={i} x={t.x} y={t.top} width={t.w} height={200 - t.top} />)}
      <g className="ne-wins">
        {towers.flatMap((t, i) => t.wins.map((w, j) => (
          <rect key={i + '-' + j} className={`c${w.c}${w.tw ? ' tw' : ''}`} x={w.x} y={w.y} width="2.6" height="3" style={w.tw ? { animationDelay: `${-((i * 7 + j) % 9)}s` } : undefined} />
        )))}
      </g>
      {towers.filter((t) => t.neon).map((t, i) => (
        <path key={'n' + i} className={`ne-edge c${t.neon}`} d={`M${t.x} ${t.top + 14} V${t.top} H${t.x + t.w} V${t.top + 14}`} />
      ))}
    </svg>
  )
}

export default function NeonScene() {
  return (
    <div className="neon-scene" aria-hidden="true">
      <div className="ne-sky" />
      <div className="ne-horizon" />
      <Layer towers={FAR} className="far" />
      {TRAILS.map((t, i) => <i key={i} className={`ne-trail c${t.c}${i % 2 ? ' rev' : ''}`} style={{ top: `${t.y}%`, animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }} />)}
      <Layer towers={NEAR} className="near" />
      {SIGNS.map((s, i) => <i key={i} className={`ne-sign c${s.c}`} style={{ left: `${s.x}%`, top: `${s.y}%`, height: `${s.h}cqh`, animationDelay: `${-i * 2.3}s` }} />)}
      <div className="ne-floor">
        <svg className="ne-rays" viewBox="0 0 400 100" preserveAspectRatio="none">
          {Array.from({ length: 21 }, (_, i) => { const x = -600 + i * 80; return <path key={i} d={`M${200 + (x - 200) * 0.04} 0 L${x} 100`} /> })}
        </svg>
        {Array.from({ length: 8 }, (_, i) => <i key={i} className="ne-line" style={{ animationDelay: `${-i * 0.5}s` }} />)}
      </div>
      <div className="ne-vignette" />
    </div>
  )
}
