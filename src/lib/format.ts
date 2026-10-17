import type { Session, Workout } from './store'
import { t, locale } from './i18n'

export function day(ts: number) {
  return new Date(ts).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' })
}
export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' })
}
export function time(ts: number) {
  return new Date(ts).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' })
}
export function duration(from: number, to: number) {
  const min = Math.max(1, Math.round((to - from) / 60000))
  return min < 60 ? t('{n} min', { n: min }) : t('{h} h {m} min', { h: Math.floor(min / 60), m: min % 60 })
}

// One exercise's sets in a session, as display lines: "20 kg × 8".
export function setLines(s: Session, workoutId: string, current?: Workout) {
  const info = s.snap?.[workoutId] ?? current
  const unit = info?.unit ?? 'kg'
  const progression = info?.mode === 'progression'
  return Object.entries(s.sets[workoutId] ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .filter(([, e]) => e.reps !== null || e.weight !== null)
    .map(([n, e]) => {
      const load = progression ? '' : e.weight !== null ? `${e.weight} ${unit}` : ''
      const reps = e.reps !== null ? (progression && info?.count === 'sec' ? t('{n} sec', { n: e.reps }) : t('{n} reps', { n: e.reps })) : ''
      return { set: Number(n), text: [load, reps].filter(Boolean).join(' × ') }
    })
}
