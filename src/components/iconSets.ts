// Exercise icon sets (gear > Icons), picked 2026-11-01. Every set draws the same 9 icons on a
// 100 x 100 box as an SVG string. Two "colours" only: currentColor is ink, var(--bg) is a cut-out.
// WorkoutIcon draws them through a mask so cut-outs are see-through on any theme.
// Mock-ups: archive/icons/sets-2026-11-01.html. Old Glass set: archive/icons/glass-2026-10-25/.
const R = (x: number, y: number, w: number, h: number, r = 0) => r
  ? `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`
  : `M${x} ${y} H${x + w} V${y + h} H${x} Z`
// chamfered rectangle (corners cut off) for the angular style
const C = (x: number, y: number, w: number, h: number, c = 3) => `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`
// flared post: narrow at top, wider at bottom
const F = (x: number, y: number, w: number, h: number, f: number) => `M${x} ${y} H${x + w} L${x + w + f} ${y + h} H${x - f} Z`
const circ = (cx: number, cy: number, r: number) => `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
const poly = (n: number, cx: number, cy: number, r: number, rot = 0) => 'M' + Array.from({ length: n }, (_, i) => { const a = rot + i * 2 * Math.PI / n; return `${(cx + r * Math.sin(a)).toFixed(2)} ${(cy - r * Math.cos(a)).toFixed(2)}` }).join(' L') + ' Z'
// tapered spike from (x1,y1) to a sharp point at (x2,y2)
function taper(x1: number, y1: number, x2: number, y2: number, w: number) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * w / 2, ny = dx / L * w / 2
  const mx = x1 + dx * .45, my = y1 + dy * .45
  return `M${x1 + nx} ${y1 + ny} Q${mx + nx} ${my + ny} ${x2} ${y2} Q${mx - nx} ${my - ny} ${x1 - nx} ${y1 - ny} A${w / 2} ${w / 2} 0 0 1 ${x1 + nx} ${y1 + ny} Z`
}
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`
function spiral(turns = 2.2, grow = .72) {
  const pts: string[] = []
  for (let i = 0; i <= 140; i++) { const t = i / 140 * turns * 2 * Math.PI, r = .4 + t * grow; pts.push(`${(r * Math.cos(t)).toFixed(2)} ${(r * Math.sin(t)).toFixed(2)}`) }
  return 'M' + pts.join(' L')
}
const bolt = (x: number, y: number, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M3 -14 L-8 3 L0 3 L-4 15 L9 -3 L1 -3 L5 -14 Z" fill="currentColor"/>`

// ---- base shapes ----
const T = 'M42 5 L58 5 L58 12 L76 19 C83 21 88 26 89 33 L80 48 L72 86 C71 89 69 90 66 90 L34 90 C31 90 29 89 28 86 L20 48 L11 33 C12 26 17 21 24 19 L42 12 Z'
const A = 'M8 60 C10 46 24 34 40 36 C50 37 56 42 60 50 L64 33 C58 31 53 26 54 18 C55 10 62 6 72 6 C82 6 88 14 86 24 C85 30 82 34 80 37 C86 50 88 64 84 74 C80 82 74 86 64 86 L8 86 Z'
const L = 'M30 4 H64 C65 18 63 32 60 42 C63 46 63 50 61 54 C60 64 59 72 58 80 L82 84 C90 85 94 88 94 94 H50 C46 94 45 92 45 89 L46 82 C40 76 33 66 35 56 C36 51 39 48 40 46 C35 34 31 20 30 4 Z'
export const SET_ICONS: { key: string; name: string; o: string; d: string; hole?: string }[] = [
  { key: 'arm', name: 'Arm', o: A, d: 'M24 62 C30 56 40 56 44 62 M57 17 H66 M58 25 H66' },
  { key: 'leg', name: 'Leg', o: L, d: 'M41 50 C48 53 55 52 61 50 M47 10 C51 20 51 30 48 40' },
  { key: 'torso', name: 'Torso front', o: T, d: 'M24 40 C30 50 44 52 50 43 C56 52 70 50 76 40 M50 46 V82 M41 64 H59' },
  { key: 'back', name: 'Torso back', o: T, d: 'M50 14 V86 M30 30 C33 42 41 47 46 45 M70 30 C67 42 59 47 54 45 M28 54 L42 72 M72 54 L58 72' },
  { key: 'plate', name: 'Weight plate', o: circ(50, 50, 43), d: 'M50 22 A28 28 0 1 1 49.99 22 Z', hole: circ(50, 50, 8) },
  { key: 'dumbbell', name: 'Dumbbell', o: [R(15, 24, 13, 52, 4), R(72, 24, 13, 52, 4), R(5, 35, 10, 30, 3), R(85, 35, 10, 30, 3), R(28, 45, 44, 10, 1)].join(' '), d: 'M38 50 H62' },
  { key: 'barbell', name: 'Barbell', o: [R(18, 14, 9, 72, 3), R(73, 14, 9, 72, 3), R(27, 26, 7, 48, 2.5), R(66, 26, 7, 48, 2.5), R(2, 46, 16, 8, 2), R(82, 46, 16, 8, 2), R(34, 46.5, 32, 7, 1)].join(' '), d: 'M40 50 H60' },
  { key: 'pullbar', name: 'Pull-up bar', o: [R(5, 12, 90, 10, 5), R(15, 22, 9, 66, 1), R(76, 22, 9, 66, 1), R(6, 86, 27, 8, 3), R(67, 86, 27, 8, 3)].join(' '), d: 'M30 17 H70' },
  { key: 'dipbar', name: 'Dip bar', o: [R(6, 28, 36, 9, 4.5), R(58, 28, 36, 9, 4.5), R(19, 37, 8, 51, 1), R(73, 37, 8, 51, 1), R(9, 86, 28, 8, 3), R(63, 86, 28, 8, 3)].join(' '), d: '' },
]
const byKey = Object.fromEntries(SET_ICONS.map((i) => [i.key, i]))

// ---- sets ----
export type IconSet = { key: string; name: string; bg: string; fg: string; draw: (k: string, id: string) => string }
export const ICON_SETS: IconSet[] = []
const STYLES = ICON_SETS

// 1 Chunky 3D
STYLES.push({
  key: 'electric', name: 'Electric', bg: '#FFD829', fg: '#000',
  draw(k: string) {
    const ic = byKey[k]
    let ext = ''; for (let i = 1; i <= 7; i++) ext += `<path d="${ic.o}" transform="translate(${i} ${i})" fill="currentColor"/>`
    let face = `<path d="${ic.o}${ic.hole ? ' ' + ic.hole : ''}" fill-rule="evenodd" fill="var(--bg)" stroke="currentColor" stroke-width="5.5" stroke-linejoin="round"/>`
    let det = ic.d ? `<path d="${ic.d}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` : ''
    let extra = ''
    if (k === 'torso') { det = `<path d="M24 40 C30 50 44 52 50 43 C56 52 70 50 76 40" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`; extra = [[40, 58], [52, 58], [40.5, 68], [52, 68], [41, 78], [52, 78]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7.5" height="6.5" rx="1.5" fill="currentColor"/>`).join('') }
    if (k === 'arm') det = `<path d="M57 17 H66 M58 25 H66" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`, extra = bolt(36, 62, 1.15)
    if (k === 'leg') extra = bolt(48, 24, .85), det = `<path d="M41 50 C48 53 55 52 61 50" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`
    if (k === 'plate') { face = `<path d="${ic.o}" fill="var(--bg)" stroke="currentColor" stroke-width="5.5"/>`; extra = bolt(50, 50, 1.25) }
    if (k === 'dumbbell' || k === 'barbell') extra = bolt(50, 50, .45).replace('fill="currentColor"', 'fill="var(--bg)"') , det = ''
    if (k === 'pullbar') det = ''
    return `<g transform="rotate(-6 50 50) translate(-3 -3)">${ext}${face}${det}${extra}</g>`
  },
})

// 2 Y2K
STYLES.push({
  key: 'sparks', name: 'Sparks', bg: '#EFEFEF', fg: '#000',
  draw(k: string) {
    const ic = byKey[k], bg = 'var(--bg)'
    const solid = `<path fill="currentColor" fill-rule="evenodd" d="${ic.o}${ic.hole ? ' ' + ic.hole : ''}"/>`
    const cut = (d: string, w = 3.4) => `<path d="${d}" fill="none" stroke="${bg}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
    const sp = (x: number, y: number, r: number, c = 'currentColor') => `<path d="${sparkle(x, y, r)}" fill="${c}"/>`
    const bead = (x: number, y: number, r = 4.5, c = 'currentColor') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`
    const orbit = (cx: number, cy: number, rx: number, ry: number, rot: number) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="currentColor" stroke-width="2.5"/>`
    switch (k) {
      case 'arm': return orbit(50, 50, 50, 14, -28) + bead(94, 27) + bead(6, 73) + solid + cut('M57 17 H66 M58 25 H66', 3.2) + bead(30, 62, 4.5, bg) + bead(42, 56, 3, bg) + bead(20, 70, 3, bg) + sp(22, 14, 10)
      case 'leg': return solid + `<path d="${sparkle(47, 24, 9)}" fill="${bg}"/>` + cut('M41 50 C48 53 55 52 61 50') + bead(49, 64, 3, bg) + bead(51, 73, 2.2, bg) + sp(84, 18, 9)
      case 'torso': return orbit(50, 62, 48, 10, -14) + solid + `<path fill="${bg}" d="${sparkle(50, 34, 10)}"/>` + cut('M50 56 V78', 4) + bead(4, 74) + bead(96, 50) + sp(88, 8, 8)
      case 'back': return solid + cut('M50 14 V40 M50 52 V86', 4) + bead(50, 46, 4, bg) + cut('M30 30 C33 42 41 47 46 45 M70 30 C67 42 58 47 54 45') + sp(12, 84, 8) + sp(90, 80, 5)
      case 'plate': return solid + `<circle cx="50" cy="50" r="28" fill="none" stroke="${bg}" stroke-width="3"/>` + [0, 1, 2, 3, 4, 5].map((i) => { const a = i * Math.PI / 3; return bead(50 + 28 * Math.sin(a), 50 - 28 * Math.cos(a), 4, bg) }).join('') + sp(90, 10, 9)
      case 'dumbbell': return orbit(50, 50, 50, 20, -12) + bead(1.5, 60) + bead(98.5, 40) + solid + `<path d="${sparkle(21.5, 50, 6)} ${sparkle(78.5, 50, 6)}" fill="${bg}"/>`
      case 'barbell': return solid + bead(22.5, 50, 3, bg) + bead(77.5, 50, 3, bg) + sp(50, 26, 10) + sp(50, 76, 6)
      case 'pullbar': return solid + bead(20, 17, 3, bg) + bead(80, 17, 3, bg) + sp(50, 50, 12) + bead(50, 72, 3)
      default: return solid + bead(12, 32.5, 2.6, bg) + bead(88, 32.5, 2.6, bg) + sp(50, 58, 12) + bead(50, 14, 3)
    }
  },
})

// 3 Ink-trap line
STYLES.push({
  key: 'rock', name: 'Rock', bg: '#FF1028', fg: '#000',
  draw(k: string) {
    const st = (d: string) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
    const tp = (...a: [number, number, number, number, number]) => `<path d="${taper(...a)}" fill="currentColor"/>`
    const pinch = (x1: number, x2: number, y: number) => tp(x1, y, (x1 + x2) / 2, y, 7) + tp(x2, y, (x1 + x2) / 2, y, 7)
    const feet = (x: number, y: number) => tp(x, y - 2, x - 13, y + 5, 7) + tp(x, y - 2, x + 13, y + 5, 7)
    switch (k) {
      case 'arm': return st('M60 86 H16 C11 86 8 83 8 78 V62 C10 46 24 34 40 36 C50 37 56 42 60 50 L63 39') + st('M60 29 C54 26 52 18 56 12 C60 7 66 6 72 6 C82 6 88 14 86 24 C85 28 83 31 81 33') + st('M82 43 C86 54 87 61 85 69 M24 62 C30 56 40 56 44 62 M58 18 H65') + `<path d="M81.5 69 L88.5 69 Q90 80 97 92 Q84 88 68 89.5 L68 82.5 Q80 82 81.5 69 Z" fill="currentColor"/>`
      case 'leg': return st('M33 6 H41 M51 6 H61 C62 18 60 31 57 41 C59 46 59 50 58 54 C57 62 57 68 58 73 Q60 80 69 80 L78 81') + tp(77, 81, 91, 93, 7) + st('M84 93 H52 C47.5 93 45 90.5 45 86.5 L46 82 C40 76 36 66 38 56 C39 51 41 48 43 46 C38 34 34 22 33 16') + tp(47, 12, 48.5, 38, 6) + tp(44, 52, 51.5, 53.5, 5) + tp(57.5, 51, 51.5, 53.5, 5)
      case 'torso': return st('M42 5 V12 L24 19 C17 21 12 26 11 33 L20 48 L28 86 C29 89 31 90 34 90 L44 90') + st('M58 5 V12 L76 19 C83 21 88 26 89 33 L80 48 L72 86 C71 89 69 90 66 90 L56 90') + st('M26 40 C32 50 42 52 47 46 M74 40 C68 50 58 52 53 46 M39 67 H45 M55 67 H61') + `<path d="M43 18 Q47 21 50 27 Q53 21 57 18 Q53 24 50 32 Q47 24 43 18 Z" fill="currentColor"/>` + tp(50, 44, 50, 82, 6.5)
      case 'back': return st('M42 5 V12 L24 19 C17 21 12 26 11 33 L20 48 L28 86 C29 89 31 90 34 90 L44 90') + st('M58 5 V12 L76 19 C83 21 88 26 89 33 L80 48 L72 86 C71 89 69 90 66 90 L56 90') + st('M31 31 C34 41 40 45 44 44 M69 31 C66 41 60 45 56 44') + tp(50, 18, 50, 52, 6.5) + tp(50, 84, 50, 56, 6.5)
      case 'plate': return `<circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray="44 6" stroke-dashoffset="-3"/>` + `<circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray="40 10" stroke-dashoffset="-30"/>` + `<path d="${sparkle(50, 50, 10)}" fill="currentColor"/>`
      case 'dumbbell': return st('M10 36 V64 M90 36 V64 M21 22 V78 M79 22 V78') + pinch(30, 70, 50)
      case 'barbell': return st('M4 50 H12 M88 50 H96 M21 16 V84 M79 16 V84 M31 28 V72 M69 28 V72') + pinch(39, 61, 50)
      case 'pullbar': return st('M8 16 H40 M50 16 H92 M19 28 V86 M81 28 V86') + feet(19, 90) + feet(81, 90)
      default: return st('M8 32 H38 M62 32 H92 M24 42 V86 M76 42 V86') + feet(24, 90) + feet(76, 90) + tp(42, 32, 49, 32, 5) + tp(58, 32, 51, 32, 5)
    }
  },
})

// 4 Thin line
STYLES.push({
  key: 'standard', name: 'Standard', bg: '#EEF1F5', fg: '#3A4150',
  draw(k: string) {
    const ic = byKey[k]
    return `<g fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="square"><path d="${ic.o}"/>${ic.hole ? `<path d="${ic.hole}"/>` : ''}${ic.d ? `<path d="${ic.d}"/>` : ''}</g>`
  },
})

// 5 Brush ink
STYLES.push({
  key: 'brush', name: 'Brush Ink', bg: '#F3F2EE', fg: '#111',
  draw(k: string, id: string) {
    const ic = byKey[k]
    const seeds: Record<string, number> = { arm: 9, leg: 3, torso: 4, back: 6, plate: 2, dumbbell: 7, barbell: 5, pullbar: 8, dipbar: 1 }
    const rot = ({ arm: 6, leg: -5, torso: -4, back: 4, plate: 0, dumbbell: -7, barbell: 5, pullbar: -3, dipbar: 3 } as Record<string, number>)[k]
    const f = `<defs><filter id="r${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="${seeds[k]}"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter></defs>`
    const slash = (d: string) => `<path d="${d}" stroke="var(--bg)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    const dots = (a: number[], b: number[]) => `<circle cx="${a[0]}" cy="${a[1]}" r="1.7" fill="currentColor"/><circle cx="${b[0]}" cy="${b[1]}" r="1" fill="currentColor"/>`
    let body: string
    switch (k) {
      case 'arm': body = `<path fill="currentColor" d="M6 64 C9 48 22 32 40 34 C51 35 57 41 60 49 L63 34 C57 32 52 26 53 18 C54 9 62 4 73 5 C84 6 89 15 86 25 C85 31 82 35 80 38 C87 51 89 66 84 76 C79 84 72 88 62 88 L4 90 Z"/>` + slash('M24 60 Q34 52 45 59 M57 17 L66 16 M58 25 L66 25') + dots([94, 40], [96, 48]); break
      case 'torso': body = `<ellipse cx="51" cy="15" rx="8" ry="9" transform="rotate(12 51 15)" fill="currentColor"/><path fill="currentColor" d="M26 32 C38 28 62 28 75 31 C84 33 89 40 87 49 L73 51 C69 63 66 74 62 86 C58 90 44 90 40 86 C36 74 33 63 29 51 L14 48 C12 39 17 33 26 32 Z"/>` + slash('M41 50 Q48 55 56 49 M47 64 L52 63') + dots([26, 92], [72, 94]); break
      case 'back': body = `<ellipse cx="49" cy="15" rx="8" ry="9" transform="rotate(-10 49 15)" fill="currentColor"/><path fill="currentColor" d="M25 31 C38 28 62 28 74 32 C84 34 88 40 86 49 L72 51 C69 63 66 74 62 86 C58 90 44 90 40 86 C36 74 33 63 28 51 L13 48 C11 40 16 33 25 31 Z"/>` + slash('M50 34 L49 60 M34 40 Q40 48 45 45 M66 40 Q60 48 55 45') + dots([18, 90], [80, 92]); break
      case 'leg': body = `<path fill="currentColor" d="${L}"/>` + slash('M42 50 Q50 54 59 50 M47 12 Q51 24 48 38') + dots([22, 70], [18, 78]); break
      case 'plate': body = `<path fill="currentColor" fill-rule="evenodd" d="${ic.o} ${circ(50, 50, 9)}"/>` + `<path d="M50 23 A27 27 0 1 1 26 37" stroke="var(--bg)" stroke-width="2.6" fill="none" stroke-linecap="round"/>` + dots([90, 88], [95, 82]); break
      default: body = `<path fill="currentColor" d="${ic.o}"/>` + (ic.d ? slash(ic.d) : '') + dots([50, 92], [56, 96])
    }
    return f + `<g filter="url(#r${id})" transform="rotate(${rot} 50 50)">${body}</g>`
  },
})

// 6 Bubbly blue
STYLES.push({
  key: 'bubbly', name: 'Bubbly', bg: '#F3F3EC', fg: '#1E36D6',
  draw(k: string) {
    const ic = byKey[k], bg = 'var(--bg)'
    const sw = spiral()
    const swirl = (x: number, y: number, flip?: boolean, c = 'currentColor', w = 3) => `<path d="${sw}" transform="translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
    const solid = `<path fill="currentColor" fill-rule="evenodd" stroke="currentColor" stroke-width="4" stroke-linejoin="round" d="${ic.o}"/>`
    const shine = (d: string) => `<path d="${d}" fill="none" stroke="${bg}" stroke-width="3.5" stroke-linecap="round"/>`
    const star = (x: number, y: number, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -8 L2.6 -2.4 L8.6 -1.8 L4 2.2 L5.4 8 L0 5 L-5.4 8 L-4 2.2 L-8.6 -1.8 L-2.6 -2.4 Z" fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>`
    const motion = (x: number, y: number) => `<path d="M${x} ${y - 8} Q${x + 4} ${y} ${x} ${y + 8} M${x + 6} ${y - 12} Q${x + 11} ${y} ${x + 6} ${y + 12}" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`
    switch (k) {
      case 'arm': return solid + swirl(39, 61, false, bg, 4.2) + shine('M58 17 H65 M59 25 H65') + motion(93, 52)
      case 'leg': return solid + swirl(47, 24, false, bg, 3.6) + shine('M43 51 C49 53 54 53 58 51') + star(84, 20)
      case 'torso': return `<path d="${T}" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>` + swirl(34, 52) + swirl(66, 52, true) + star(88, 8)
      case 'back': return `<path d="${T}" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/><path d="M50 26 V80 M31 34 C34 44 40 48 44 46 M69 34 C66 44 60 48 56 46" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>` + star(10, 84, .8)
      case 'plate': return `<path fill="currentColor" d="${ic.o}"/>` + swirl(50, 50, false, bg, 4) + shine('M24 34 A30 30 0 0 1 36 22') + star(90, 90, .9)
      case 'dumbbell': return solid + shine('M19 30 V40 M76 30 V40') + star(50, 30, .8) + star(50, 72, .55)
      case 'barbell': return solid + shine('M21.5 20 V32 M76.5 20 V32') + star(50, 28, .9) + star(50, 74, .6)
      case 'pullbar': return solid + shine('M12 17 H22') + star(50, 46, 1) + star(50, 68, .6)
      default: return solid + shine('M12 32.5 H18 M64 32.5 H70') + star(50, 58, 1) + star(50, 14, .7)
    }
  },
})

// 7 Angular figures
STYLES.push({
  key: 'solid', name: 'Solid', bg: '#FFFFFF', fg: '#000',
  draw(k: string) {
    const cut = (d: string) => `<path d="${d}" stroke="var(--bg)" stroke-width="2.6" fill="none"/>`
    const p = (d: string) => `<path fill="currentColor" fill-rule="evenodd" d="${d}"/>`
    const head = 'M44 5 L55 3 L57 11 L53.5 12 L54 19 L46 19.5 Z'
    const body = 'M36 22 L64 22 L84 28 L88 47 L72 45 L65 62 L70 93 L30 93 L35 62 L28 45 L12 47 L16 28 Z'
    switch (k) {
      case 'arm': return p('M5 60 L14 43 L37 34 L53 39 L60 49 L63 34 L55 29 L53 13 L62 5 L81 5 L89 19 L82 36 L89 56 L84 75 L71 86 L5 87 Z') + cut('M54 17 L66 15.5 M55 25 L66 24.5 M21 59 L37 52 L46 57')
      case 'leg': return p('M30 4 L65 4 L63 30 L60 42 L63 52 L59 80 L86 84 L95 94 L45 94 L45 82 L34 64 L36 54 L41 46 L31 26 Z') + cut('M41 50 L52 52.5 L61 49')
      case 'torso': return p(head) + p(body)
      case 'back': return p('M45 4 L55 4 L56.5 12 L54 19 L46 19 L43.5 12 Z') + p(body) + cut('M50 24 V60 M31 32 L44 44 M69 32 L56 44')
      case 'plate': return p(poly(10, 50, 50, 45, Math.PI / 10) + ' ' + poly(6, 50, 50, 9)) + `<path d="${poly(10, 50, 50, 30, Math.PI / 10)}" stroke="var(--bg)" stroke-width="2.6" fill="none"/>`
      case 'dumbbell': return p([C(15, 22, 14, 56, 4), C(71, 22, 14, 56, 4), C(4, 34, 11, 32, 3), C(85, 34, 11, 32, 3), 'M29 44 L71 44 L68 56 L32 56 Z'].join(' '))
      case 'barbell': return p([C(17, 12, 10, 76, 3), C(73, 12, 10, 76, 3), C(27, 25, 8, 50, 3), C(65, 25, 8, 50, 3), 'M2 46 L17 45 L17 55 L2 54 Z', 'M83 45 L98 46 L98 54 L83 55 Z', 'M35 46 H65 V54 H35 Z'].join(' '))
      case 'pullbar': return p(['M4 10 L96 10 L92 22 L8 22 Z', F(16, 22, 8, 64, 4), F(76, 22, 8, 64, 4), 'M8 86 L32 86 L36 95 L4 95 Z', 'M68 86 L92 86 L96 95 L64 95 Z'].join(' '))
      default: return p(['M4 27 L42 27 L39 37 L7 37 Z', 'M58 27 L96 27 L93 37 L61 37 Z', F(19, 37, 8, 49, 4), F(73, 37, 8, 49, 4), 'M8 86 L38 86 L41 95 L5 95 Z', 'M62 86 L92 86 L95 95 L59 95 Z'].join(' '))
    }
  },
})

export type IconSetKey = 'electric' | 'sparks' | 'rock' | 'standard' | 'brush' | 'bubbly' | 'solid'
export const DEFAULT_SET: IconSetKey = 'standard'
export const iconSet = (k: string) => ICON_SETS.find((s) => s.key === k) ?? ICON_SETS.find((s) => s.key === DEFAULT_SET)!
export const isSetIcon = (k: string) => k in byKey
