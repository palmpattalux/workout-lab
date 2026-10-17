import type { Session, Workout } from './store'
import { day, duration } from './format'
import { t } from './i18n'

// Shareable images for a finished session (like Strava's): two see-through stickers to lay
// over a photo or story (the session's numbers, and progress since last time) and one full
// card that looks like the "Session complete" page. Drawn on a canvas as PNGs.
export type StickerStats = { time: string; sets: number; reps: number; lifted: number }
export type Gain = { name: string; text: string }
export type StickerProgress = { first: boolean; lifted: number; reps: number; gains: Gain[] }
export type CardRow = { name: string; detail: string; gain: string | null }
export type StickerCard = { num: number; when: string; sets: number; reps: number; exercises: number; rows: CardRow[] }

export function statsOf(s: Session, workouts: Workout[]): StickerStats {
  let sets = 0, reps = 0, lifted = 0
  for (const [wid, bySet] of Object.entries(s.sets ?? {})) {
    const info = s.snap?.[wid] ?? workouts.find((w) => w.id === wid)
    const timed = info?.mode === 'progression' && info?.count === 'sec'
    const toKg = info?.unit === 'lbs' ? 0.4536 : 1
    for (const e of Object.values(bySet)) {
      if (!e || e.reps == null) continue
      sets++
      if (!timed) reps += e.reps
      if (info?.mode !== 'progression' && e.weight) lifted += e.reps * e.weight * toKg
    }
  }
  return { time: duration(s.startedAt, s.endedAt ?? s.startedAt), sets, reps, lifted: Math.round(lifted) }
}

export const whenOf = (s: Session) => `${day(s.startedAt)} · ${duration(s.startedAt, s.endedAt ?? s.startedAt)}`

const W = 1080
const ORANGE = '#ff6a1a'
const FONT = 'Manrope, system-ui, sans-serif'

function canvas(h: number) {
  const c = document.createElement('canvas')
  c.width = W; c.height = h
  return [c, c.getContext('2d')!] as const
}
const png = (c: HTMLCanvasElement) => new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'))
async function fonts() { await document.fonts?.load?.(`800 100px ${FONT}`).catch(() => {}) }

// the Dotset wordmark, its "o" drawn as a ring around the orange dot
function wordmark(g: CanvasRenderingContext2D, cx: number, base: number, size: number, ink: string) {
  g.save()
  g.font = `800 ${size}px ${FONT}`
  g.textAlign = 'left'
  const wD = g.measureText('D').width, wRest = g.measureText('tset').width
  const ring = size * 0.56, gap = size * 0.04
  let x = cx - (wD + gap + ring + gap + wRest) / 2
  g.fillStyle = ink
  g.fillText('D', x, base); x += wD + gap
  const rx = x + ring / 2, ry = base - size * 0.3
  g.lineWidth = size * 0.085; g.strokeStyle = ink
  g.beginPath(); g.arc(rx, ry, ring / 2 - g.lineWidth / 2, 0, Math.PI * 2); g.stroke()
  g.fillStyle = ORANGE
  g.beginPath(); g.arc(rx, ry, ring * 0.2, 0, Math.PI * 2); g.fill()
  g.fillStyle = ink
  g.fillText('tset', x + ring + gap, base)
  g.restore()
}

// white text with a soft shadow, so it reads over bright photos
function seeThrough(g: CanvasRenderingContext2D) {
  g.textAlign = 'center'
  g.fillStyle = '#fff'
  g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 18; g.shadowOffsetY = 2
}
function fit(g: CanvasRenderingContext2D, text: string, weight: number, size: number, max: number) {
  let s = size
  g.font = `${weight} ${s}px ${FONT}`
  while (g.measureText(text).width > max && s > 20) { s -= 4; g.font = `${weight} ${s}px ${FONT}` }
}

export async function drawSticker(st: StickerStats): Promise<Blob> {
  await fonts()
  const [c, g] = canvas(1200)
  seeThrough(g)
  const rows: [string, string][] = [
    [t('Time'), st.time],
    [t('Sets'), String(st.sets)],
    st.lifted > 0 ? [t('Lifted'), `${st.lifted.toLocaleString()} kg`] : [t('Reps'), String(st.reps)],
  ]
  let y = 190
  for (const [label, value] of rows) {
    g.font = `700 44px ${FONT}`
    g.fillText(label, W / 2, y)
    fit(g, value, 800, 128, W - 120)
    g.fillText(value, W / 2, y + 140)
    y += 250
  }
  wordmark(g, W / 2, y + 120, 84, '#fff')
  return png(c)
}

// Progress since the last session: the headline gain, then up to three exercises that went up.
export async function drawProgress(p: StickerProgress): Promise<Blob> {
  await fonts()
  const [c, g] = canvas(1200)
  seeThrough(g)
  let y = 200
  let label: string, big: string
  if (p.first) { label = t('First session'); big = t('Day one') }
  else if (p.lifted > 0) { label = t('more lifted than last time'); big = `+${p.lifted.toLocaleString()} kg` }
  else if (p.reps > 0) { label = t('more reps than last time'); big = `+${p.reps}` }
  else if (p.gains.length) { label = t('vs last session'); big = t('Stronger') }
  else { label = t('vs last session'); big = t('Showed up') }
  g.font = `700 44px ${FONT}`
  g.fillText(t('Progress'), W / 2, y)
  fit(g, big, 800, 150, W - 120)
  g.fillText(big, W / 2, y + 170)
  g.font = `600 42px ${FONT}`
  g.fillText(label, W / 2, y + 240)
  y += 370
  for (const gain of p.gains.slice(0, 3)) {
    fit(g, gain.name, 700, 46, W - 200)
    g.fillText(gain.name, W / 2, y)
    g.font = `800 64px ${FONT}`
    g.fillText(`▲ ${gain.text}`, W / 2, y + 78)
    y += 150
  }
  if (!p.gains.length) y += 40
  wordmark(g, W / 2, Math.max(y + 90, 980), 84, '#fff')
  return png(c)
}

// The "Session complete" page as a card, in the colours of the theme in use.
function rounded(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath()
}
export async function drawCard(card: StickerCard): Promise<Blob> {
  await fonts()
  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  const rows = card.rows.slice(0, 5)
  const H = 760 + rows.length * 150 + (card.rows.length > 5 ? 60 : 0) + 200
  const [c, g] = canvas(Math.max(1350, H))
  const bg = v('--stage', '#f4f4f2'), surface = v('--surface', '#ffffff'), ink = v('--ink', '#151515'), muted = v('--muted', '#8a8a8a'), active = v('--active', '#2a9d58')
  g.fillStyle = '#f4f4f2'; g.fillStyle = bg; g.fillRect(0, 0, W, c.height)
  const P = 80
  g.textAlign = 'left'
  g.fillStyle = active; g.font = `800 34px ${FONT}`
  g.fillText(t('Session complete').toUpperCase(), P, 150)
  g.fillStyle = ink; g.font = `800 200px ${FONT}`
  g.fillText('#' + card.num, P - 6, 340)
  g.fillStyle = muted; g.font = `500 40px ${FONT}`
  g.fillText(card.when, P, 410)
  // totals
  const totals: [number, string][] = [[card.sets, t('sets')], [card.reps, t('reps')], [card.exercises, card.exercises === 1 ? t('exercise') : t('exercises')]]
  const bw = (W - P * 2 - 40) / 3
  totals.forEach(([n, l], i) => {
    const x = P + i * (bw + 20)
    g.fillStyle = surface; rounded(g, x, 460, bw, 170, 36); g.fill()
    g.fillStyle = ink; g.font = `800 72px ${FONT}`; g.fillText(String(n), x + 34, 560)
    g.fillStyle = muted; g.font = `500 34px ${FONT}`; g.fillText(l, x + 34, 606)
  })
  // exercises
  let y = 680
  for (const r of rows) {
    g.fillStyle = surface; rounded(g, P, y, W - P * 2, 126, 34); g.fill()
    g.fillStyle = ink; fit(g, r.name, 700, 42, r.gain ? 470 : 560); g.textAlign = 'left'; g.fillText(r.name, P + 36, y + 58)
    g.fillStyle = muted; g.font = `500 32px ${FONT}`; g.fillText(r.detail, P + 36, y + 100)
    if (r.gain) {
      g.font = `800 34px ${FONT}`
      const tw = g.measureText(r.gain).width
      const gx = W - P - 36 - tw - 36
      g.fillStyle = active; g.globalAlpha = 0.14; rounded(g, gx, y + 38, tw + 36, 52, 26); g.fill(); g.globalAlpha = 1
      g.fillStyle = active; g.fillText(r.gain, gx + 18, y + 76)
    }
    y += 150
  }
  if (card.rows.length > 5) { g.fillStyle = muted; g.font = `600 34px ${FONT}`; g.fillText(t('+{n} more', { n: card.rows.length - 5 }), P + 6, y + 20); y += 60 }
  wordmark(g, W / 2, c.height - 90, 64, ink)
  return png(c)
}
