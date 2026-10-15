// Night City: a gothic noir skyline in three depths. Far towers fade into fog, a
// searchlight sweeps the clouds, lightning now and then lights the sky behind the
// spires, rain falls in two depths and lamp light smears across the wet street.
// The layers sway at different speeds, so the city feels deep. Purely decorative.

// small deterministic random, so the city is the same every time
function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
}

type Tower = { d: string; windows: { x: number; y: number; lit: boolean; delay: number }[] }

// One layer of towers across a 400-wide box, `base` tall, with gothic tops.
function city(seed: number, minH: number, maxH: number, withWindows: boolean, litShare: number): Tower[] {
  const r = rng(seed)
  const out: Tower[] = []
  let x = -10
  while (x < 410) {
    const w = 14 + r() * 26
    const h = minH + r() * (maxH - minH)
    const top = 200 - h
    const kind = r()
    let d = `M${x} 200 V${top} `
    if (kind < 0.28) {
      // spire with a narrow shoulder
      const s = w * 0.22
      d += `H${x + s} L${x + w / 2} ${top - 18 - r() * 26} L${x + w - s} ${top} H${x + w} `
    } else if (kind < 0.5) {
      // twin pinnacles
      d += `L${x + w * 0.18} ${top - 10} L${x + w * 0.36} ${top} H${x + w * 0.64} L${x + w * 0.82} ${top - 10} L${x + w} ${top} `
    } else if (kind < 0.68) {
      // stepped crown
      d += `H${x + w * 0.2} V${top - 6} H${x + w * 0.35} V${top - 12} H${x + w * 0.65} V${top - 6} H${x + w * 0.8} V${top} H${x + w} `
    } else if (kind < 0.8) {
      // gable
      d += `L${x + w / 2} ${top - w * 0.45} L${x + w} ${top} `
    } else {
      // flat with a mast
      const m = x + w * (0.3 + r() * 0.4)
      d += `H${m - 0.8} V${top - 14 - r() * 10} H${m + 0.8} V${top} H${x + w} `
    }
    d += 'V200 Z'
    const windows: Tower['windows'] = []
    if (withWindows) {
      for (let wy = top + 8; wy < 196; wy += 9) {
        for (let wx = x + 4; wx < x + w - 5; wx += 6) {
          if (r() < litShare) windows.push({ x: wx, y: wy, lit: r() < 0.85, delay: r() * 20 })
        }
      }
    }
    out.push({ d, windows })
    x += w - 2 + r() * 6
  }
  return out
}

const FAR = city(7, 70, 170, false, 0)
const MID = city(31, 40, 115, true, 0.12)
const NEAR = city(97, 16, 70, true, 0.08)

const RAIN = Array.from({ length: 34 }, (_, i) => {
  const r = rng(i * 7919 + 104729)
  const near = i % 3 === 0
  return { x: r() * 110 - 5, near, dur: near ? 0.55 + r() * 0.2 : 0.9 + r() * 0.4, delay: -r() * 2 }
})
const LAMPS = [12, 34, 58, 81]

function Layer({ towers, className, span }: { towers: Tower[]; className: string; span: number }) {
  return (
    <svg className={`nc-layer ${className}`} viewBox={`${(400 - span) / 2} 0 ${span} 200`} preserveAspectRatio="xMidYMax meet">
      {towers.map((t, i) => <path key={i} d={t.d} />)}
      {towers.flatMap((t, i) => t.windows.map((w, j) => (
        <rect key={`${i}-${j}`} x={w.x} y={w.y} width="2.4" height="3.4" className={w.lit ? 'nc-win' : 'nc-win off'} style={{ animationDelay: `${-w.delay}s` }} />
      )))}
    </svg>
  )
}

export default function NightCityScene() {
  return (
    <div className="nightcity-scene" aria-hidden="true">
      <div className="nc-sky" />
      <div className="nc-moon"><i /></div>
      <div className="nc-veil" />
      <div className="nc-flash" />
      <div className="nc-beam" />
      <Layer towers={FAR} className="far" span={250} />
      <div className="nc-fog one" />
      <Layer towers={MID} className="mid" span={310} />
      <div className="nc-fog two" />
      <Layer towers={NEAR} className="near" span={400} />
      <div className="nc-street">
        {LAMPS.map((x) => <i key={x} style={{ left: `${x}%`, animationDelay: `${-x / 10}s` }} />)}
      </div>
      <div className="nc-rain">
        {RAIN.map((d, i) => (
          <i key={i} className={d.near ? 'near' : undefined} style={{ left: `${d.x}%`, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }} />
        ))}
      </div>
      <div className="nc-vignette" />
    </div>
  )
}
