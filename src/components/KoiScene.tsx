import '../themes/koi.css'
import { useEffect, useId, useState } from 'react'

// Koi Pond theme backdrop: a calm pond seen from above. Lily pads with a pink lotus are the
// anchor top-right; three flat koi glide slow loops across the water, each trailed by a soft
// shadow on the pond floor, and ripple rings open now and then. By night the water turns
// deep teal, the koi glow softly and a moon reflection shimmers beside the pads.
// One SVG on a 390 x 844 canvas, sliced to fill the page; colours come from theme tokens.

const W = 390, H = 844

// closed swim loops (they leave the page for a while, so the water is sometimes empty)
const SWIMS = [
  { kind: 'kohaku', s: 1, dur: 34, begin: -4, d: 'M-70 300 C40 230 210 250 300 330 C390 410 330 540 210 580 C90 620 -20 560 -70 470 C-120 380 -150 350 -70 300 Z' },
  { kind: 'orange', s: 0.86, dur: 42, begin: -21, d: 'M470 560 C360 500 250 520 170 450 C90 380 110 250 220 220 C330 190 420 260 470 350 C520 440 560 610 470 560 Z' },
  { kind: 'utsuri', s: 0.74, dur: 52, begin: -30, d: 'M150 940 C110 800 220 730 270 640 C320 550 250 470 150 500 C50 530 10 650 50 760 C90 870 190 1060 150 940 Z' },
]

const RIPPLES = [
  { x: 296, y: 262, dur: 13, delay: -2 },
  { x: 86, y: 408, dur: 16, delay: -9 },
  { x: 262, y: 548, dur: 14.5, delay: -5.5 },
  { x: 120, y: 676, dur: 18, delay: -13 },
]

// a lily pad of radius r with its notch facing angle a (degrees)
function pad(r: number, a: number) {
  const n = 0.32, rad = (deg: number) => (deg * Math.PI) / 180
  const p = (deg: number) => `${(Math.cos(rad(deg)) * r).toFixed(1)} ${(Math.sin(rad(deg)) * r).toFixed(1)}`
  return `M0 0 L${p(a + n * 57.3)} A${r} ${r} 0 1 1 ${p(a - n * 57.3 + 360)} Z`
}

const BODY = 'M24 0 C22 -6.5 12 -8.6 1 -8 C-10 -7.2 -16 -3.6 -21 0 C-16 3.6 -10 7.2 1 8 C12 8.6 22 6.5 24 0 Z'
const TAIL = 'M-19 0 C-25 -5 -31 -9.5 -35 -8 C-31 -3.5 -31 3.5 -35 8 C-31 9.5 -25 5 -19 0 Z'

function Koi({ kind, clip }: { kind: string; clip: string }) {
  return (
    <g className={`ko-fish ko-${kind}`}>
      <g className="ko-tail"><path d={TAIL} /></g>
      <ellipse className="ko-fin" cx="6" cy="-9" rx="5.5" ry="2.4" transform="rotate(-38 6 -9)" />
      <ellipse className="ko-fin" cx="6" cy="9" rx="5.5" ry="2.4" transform="rotate(38 6 9)" />
      <path className="ko-body" d={BODY} />
      <g clipPath={`url(#${clip})`} className="ko-patch">
        {kind === 'kohaku' && <><ellipse cx="15" cy="-1" rx="7" ry="6" /><ellipse cx="-4" cy="2" rx="8" ry="5.5" /><ellipse cx="-16" cy="-1" rx="3.5" ry="3" /></>}
        {kind === 'orange' && <><ellipse cx="22" cy="0" rx="4" ry="5" className="ko-pale" /><ellipse cx="-6" cy="-5" rx="6" ry="3" className="ko-pale" /></>}
        {kind === 'utsuri' && <><ellipse cx="8" cy="-5" rx="6" ry="4" /><ellipse cx="-8" cy="4" rx="7" ry="4.5" /><ellipse cx="-17" cy="-1" rx="3" ry="4" /></>}
      </g>
      <path className="ko-sheen" d="M18 -2.5 C10 -5 0 -5 -10 -2" />
    </g>
  )
}

function useReducedMotion() {
  const [r, setR] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!m) return
    const on = () => setR(m.matches)
    m.addEventListener?.('change', on)
    return () => m.removeEventListener?.('change', on)
  }, [])
  return r
}

export default function KoiScene() {
  const gid = useId().replace(/:/g, '')
  const still = useReducedMotion()
  // a resting pose on each loop when motion is reduced
  const REST = ['translate(64 268) rotate(-18)', 'translate(330 240) rotate(160)', 'translate(60 742) rotate(-100)']
  return (
    <div className="koi-scene" aria-hidden="true">
      <svg className="ko-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gid + 'water'} x1="0" y1="0" x2=".35" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ko-w1)' }} />
            <stop offset=".55" style={{ stopColor: 'var(--ko-w2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ko-w3)' }} />
          </linearGradient>
          <radialGradient id={gid + 'moon'}>
            <stop offset="0" style={{ stopColor: 'var(--ko-moon)', stopOpacity: 'var(--ko-moon-o)' }} />
            <stop offset=".35" style={{ stopColor: 'var(--ko-moon)', stopOpacity: 'calc(var(--ko-moon-o) * .45)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ko-moon)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={gid + 'deep'} cx=".5" cy=".55" r=".6">
            <stop offset="0" style={{ stopColor: 'var(--ko-deep)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--ko-deep)', stopOpacity: 'var(--ko-deep-o)' }} />
          </radialGradient>
          <clipPath id={gid + 'body'}><path d={BODY} /></clipPath>
        </defs>
        <rect width={W} height={H} fill={`url(#${gid}water)`} />
        <rect width={W} height={H} fill={`url(#${gid}deep)`} />
        {/* light bands on the pond floor */}
        <g className="ko-caustic">
          <path d="M-20 190 C90 160 200 210 410 150" />
          <path d="M-20 520 C120 480 240 560 410 500" />
        </g>
        <ellipse className="ko-moon" cx="268" cy="104" rx="46" ry="30" fill={`url(#${gid}moon)`} />

        {/* shadows on the floor, offset from each fish */}
        <g className="ko-shadows" transform="translate(7 12)">
          {SWIMS.map((f, i) => (
            <g key={i} transform={still ? REST[i] : undefined}>
              {!still && <animateMotion dur={`${f.dur}s`} begin={`${f.begin}s`} repeatCount="indefinite" rotate="auto" path={f.d} />}
              <g transform={`scale(${f.s})`}>
                <path d={TAIL} /><path d={BODY} />
                <ellipse cx="6" cy="-9" rx="5.5" ry="2.4" transform="rotate(-38 6 -9)" /><ellipse cx="6" cy="9" rx="5.5" ry="2.4" transform="rotate(38 6 9)" />
              </g>
            </g>
          ))}
        </g>
        {SWIMS.map((f, i) => (
          <g key={i} transform={still ? REST[i] : undefined}>
            {!still && <animateMotion dur={`${f.dur}s`} begin={`${f.begin}s`} repeatCount="indefinite" rotate="auto" path={f.d} />}
            <g transform={`scale(${f.s})`} style={{ ['--ko-wag' as string]: `${1.6 + i * 0.35}s` }}>
              <Koi kind={f.kind} clip={gid + 'body'} />
            </g>
          </g>
        ))}

        {RIPPLES.map((r, i) => (
          <g key={i} transform={`translate(${r.x} ${r.y})`}>
            <g className="ko-ripple" style={{ animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s` }}>
              <ellipse rx="30" ry="12" /><ellipse rx="17" ry="6.8" />
            </g>
          </g>
        ))}

        {/* anchor: lily pads and a lotus, top-right */}
        <g className="ko-pads">
          <g transform="translate(318 40)"><g className="ko-bob" style={{ animationDuration: '17s' }}>
            <path className="ko-pad-shadow" d={pad(30, 120)} transform="translate(4 6)" />
            <path className="ko-pad b" d={pad(30, 120)} /><path className="ko-vein" d="M0 0 L-20 -16 M0 0 L22 -14 M0 0 L26 10 M0 0 L4 28 M0 0 L-28 4" />
          </g></g>
          <g transform="translate(372 118)"><g className="ko-bob" style={{ animationDuration: '13s', animationDelay: '-5s' }}>
            <path className="ko-pad-shadow" d={pad(36, 200)} transform="translate(4 6)" />
            <path className="ko-pad" d={pad(36, 200)} /><path className="ko-vein" d="M0 0 L-26 -26 M0 0 L0 -34 M0 0 L-12 32 M0 0 L-34 12" />
          </g></g>
          <g transform="translate(262 22)"><g className="ko-bob" style={{ animationDuration: '19s', animationDelay: '-9s' }}>
            <path className="ko-pad-shadow" d={pad(15, 60)} transform="translate(3 4)" />
            <path className="ko-pad c" d={pad(15, 60)} />
          </g></g>
          <g transform="translate(316 168)"><g className="ko-bob" style={{ animationDuration: '15s', animationDelay: '-2s' }}>
            <path className="ko-pad-shadow" d={pad(12, -40)} transform="translate(3 4)" />
            <path className="ko-pad b" d={pad(12, -40)} />
          </g></g>
          {/* lotus on the big pad */}
          <g transform="translate(352 104)"><g className="ko-lotus">
            <ellipse className="ko-lotus-shadow" cx="5" cy="7" rx="17" ry="15" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={a} className="ko-petal o" cx="0" cy="-11" rx="5.4" ry="11" transform={`rotate(${a + 22})`} />)}
            {[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} className="ko-petal" cx="0" cy="-7.5" rx="4.4" ry="8" transform={`rotate(${a})`} />)}
            {[30, 150, 270].map((a) => <ellipse key={a} className="ko-petal i" cx="0" cy="-4.5" rx="3.2" ry="5.5" transform={`rotate(${a})`} />)}
            <circle className="ko-heart" r="3.2" />
          </g></g>
        </g>
      </svg>
    </div>
  )
}
