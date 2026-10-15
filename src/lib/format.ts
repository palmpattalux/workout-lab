import type { Session, Workout } from './store'

export function day(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
export function time(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
export function duration(from: number, to: number) {
  const min = Math.max(1, Math.round((to - from) / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`
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
      const reps = e.reps !== null ? (progression && info?.count === 'sec' ? `${e.reps} sec` : `${e.reps} reps`) : ''
      return { set: Number(n), text: [load, reps].filter(Boolean).join(' × ') }
    })
}
