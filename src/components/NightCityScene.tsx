// Night City theme backdrop, built like Sakura's: a moon with drifting cloud wisps in
// the corner, a low skyline over wet street, and a light drizzle that lands on the
// street in small ripples. Purely decorative.
const DROPS = [
  { x: 10, land: 89, dur: 2.1, delay: 0 }, { x: 24, land: 92, dur: 2.5, delay: -1.3 },
  { x: 37, land: 94, dur: 2.2, delay: -0.6 }, { x: 51, land: 95, dur: 2.7, delay: -2.0 },
  { x: 63, land: 88, dur: 2.0, delay: -1.6 }, { x: 74, land: 90, dur: 2.4, delay: -0.3 },
  { x: 86, land: 92, dur: 2.3, delay: -1.0 }, { x: 95, land: 93, dur: 2.6, delay: -2.3 },
  { x: 45, land: 91, dur: 2.9, delay: -0.9 },
]
// skyline: [x, width, height] in a 400 × 80 box, plus windows that are lit
const TOWERS: [number, number, number][] = [
  [0, 34, 34], [30, 22, 52], [50, 40, 28], [88, 26, 64], [112, 18, 44], [128, 46, 36], [172, 24, 72],
  [194, 30, 48], [222, 44, 30], [264, 20, 58], [282, 36, 40], [316, 26, 66], [340, 34, 34], [372, 28, 50],
]
const LIT: [number, number][] = [[94, 24], [101, 34], [178, 18], [184, 30], [178, 42], [270, 30], [322, 22], [329, 36], [36, 36], [200, 40], [378, 38]]

export default function NightCityScene() {
  return (
    <div className="nightcity-scene" aria-hidden="true">
      <svg className="nc-moon" viewBox="0 0 200 140">
        <circle cx="128" cy="58" r="30" className="nc-moon-disc" />
        <circle cx="140" cy="50" r="27" className="nc-moon-cut" />
        <g className="nc-clouds">
          <rect x="60" y="70" width="110" height="5" rx="2.5" />
          <rect x="96" y="80" width="90" height="4" rx="2" />
          <rect x="44" y="88" width="70" height="3.5" rx="1.75" />
        </g>
      </svg>
      <div className="nc-street">
        <svg className="nc-skyline" viewBox="0 0 400 80" preserveAspectRatio="none">
          {TOWERS.map(([x, w, h], i) => <rect key={i} x={x} y={80 - h} width={w + 1} height={h} className="nc-tower" />)}
          {LIT.map(([x, y], i) => <rect key={i} x={x} y={y} width="3" height="4" className="nc-lit" style={{ animationDelay: `${-i * 1.7}s` }} />)}
        </svg>
        <div className="nc-wet" />
      </div>
      {DROPS.map((d, i) => {
        const vars = { ['--x' as string]: `${d.x}%`, ['--land' as string]: `${d.land}cqh`, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }
        return (
          <span key={i}>
            <i className="nc-drop" style={vars} />
            <i className="nc-ripple" style={vars} />
          </span>
        )
      })}
    </div>
  )
}
