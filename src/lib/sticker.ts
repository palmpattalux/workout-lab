import type { Session, Workout } from './store'
import { duration } from './format'
import { t } from './i18n'

// A see-through stats sticker for a finished session (like Strava's), drawn on a canvas
// as a PNG people can lay over their own photo or story.
export type StickerStats = { time: string; sets: number; reps: number; lifted: number }

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

const W = 1080, H = 1200
const ORANGE = '#ff6a1a'

export async function drawSticker(st: StickerStats): Promise<Blob> {
  await document.fonts?.load?.('800 100px Manrope').catch(() => {})
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')!
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'
  // a soft shadow keeps white text readable over bright photos
  g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 18; g.shadowOffsetY = 2

  const rows: [string, string][] = [
    [t('Time'), st.time],
    [t('Sets'), String(st.sets)],
    st.lifted > 0 ? [t('Lifted'), `${st.lifted.toLocaleString()} kg`] : [t('Reps'), String(st.reps)],
  ]
  let y = 190
  for (const [label, value] of rows) {
    g.fillStyle = '#fff'
    g.font = '700 44px Manrope, system-ui, sans-serif'
    g.fillText(label, W / 2, y)
    g.font = '800 128px Manrope, system-ui, sans-serif'
    g.fillText(value, W / 2, y + 140)
    y += 250
  }

  // the Dotset wordmark, its "o" drawn as the ring around the orange dot
  const size = 84, base = y + 120
  g.font = `800 ${size}px Manrope, system-ui, sans-serif`
  g.textAlign = 'left'
  const wD = g.measureText('D').width, wRest = g.measureText('tset').width
  const ring = size * 0.56, gap = size * 0.04
  const total = wD + gap + ring + gap + wRest
  let x = W / 2 - total / 2
  g.fillStyle = '#fff'
  g.fillText('D', x, base); x += wD + gap
  const cx = x + ring / 2, cy = base - size * 0.3
  g.lineWidth = size * 0.085; g.strokeStyle = '#fff'
  g.beginPath(); g.arc(cx, cy, ring / 2 - g.lineWidth / 2, 0, Math.PI * 2); g.stroke()
  g.fillStyle = ORANGE
  g.beginPath(); g.arc(cx, cy, ring * 0.2, 0, Math.PI * 2); g.fill()
  x += ring + gap
  g.fillStyle = '#fff'
  g.fillText('tset', x, base)

  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'))
}
