import { useEffect, useState } from 'react'
import { WorkoutMark } from './icons'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'
import type { Workout } from '../lib/store'

// Page B, once a session holds more than one exercise: a bar of their icons under Notes,
// the one on screen biggest. Tap another to go back to it (its name flashes, in case you
// forget which is which). Tap the big one for its name and "Remove", to take out an
// exercise added by mistake (its sets go too, so nothing of it is saved).
let lastSeen: string | null = null

export default function SessionBar({ items, current, onGo, onRemove }: {
  items: Workout[]
  current: string
  onGo: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [flash, setFlash] = useState(0)
  const [asking, setAsking] = useState(false)
  useEffect(() => {
    if (lastSeen !== null && lastSeen !== current) setFlash(Date.now())
    lastSeen = current
    setAsking(false)
  }, [current])
  const now = items.find((w) => w.id === current)

  return (
    <div className="session-bar" role="toolbar" aria-label={t('Exercises in this session')}>
      <div className="sb-row">
        {items.map((w) => (
          <button key={w.id}
            className={`sb-mark${w.id === current ? ' on' : ''}${w.color ? ' tinted tint-' + w.color : ''}`}
            aria-label={w.exercise || t('Untitled')} aria-pressed={w.id === current}
            onClick={() => { if (w.id === current) setAsking(!asking); else { sound.tick(); onGo(w.id) } }}>
            <WorkoutMark icon={w.icon} letter={w.letter} size="1em" />
          </button>
        ))}
      </div>
      {asking && now ? (
        <div className="sb-name ask">
          <span>{now.exercise || t('Untitled')}</span>
          <button className="sb-remove" onClick={() => { setAsking(false); sound.pop(); onRemove(now.id) }}>{t('Remove')}</button>
        </div>
      ) : flash > 0 && now ? (
        <div key={flash} className="sb-name flash" aria-live="polite"><span>{now.exercise || t('Untitled')}</span></div>
      ) : null}
    </div>
  )
}
