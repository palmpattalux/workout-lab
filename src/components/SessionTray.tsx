import { useState } from 'react'
import { Icon, WorkoutMark } from './icons'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'
import type { Workout } from '../lib/store'

// Page B, once a session holds more than one exercise: a small button stacking their icons.
// Tap it for the list: tap an exercise to go back to it, or × then Remove to take out one
// added by mistake (its sets go too, so nothing of it is saved).
export default function SessionTray({ items, current, onGo, onRemove }: {
  items: Workout[]
  current: string
  onGo: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState<string | null>(null)
  const shown = items.slice(-3)
  function close() { setOpen(false); setAsking(null) }

  return (
    <>
      <button className={`btn circle mid tray${open ? ' holding' : ''}`} style={{ left: '84%', top: '89.2%' }}
        aria-label={t('Exercises in this session')} aria-expanded={open}
        onClick={() => { if (open) close(); else { setOpen(true); sound.pop() } }}>
        <span className={`tray-stack n${shown.length}`}>
          {shown.map((w) => <span key={w.id} className={w.color ? 'tinted tint-' + w.color : undefined}><WorkoutMark icon={w.icon} letter={w.letter} size="1em" /></span>)}
        </span>
        <i className="tray-count">{items.length}</i>
      </button>
      {open && (
        <>
          <div className="menu-scrim" onPointerDown={close} />
          <ul className="menu-list tray-list" role="menu" aria-label={t('Exercises in this session')} style={{ right: '4%', bottom: '19%' }}>
            <li className="tray-head">{t('In this session')}</li>
            {items.map((w) => (
              <li key={w.id} className="tray-row">
                <button role="menuitem" className={w.id === current ? 'current' : undefined} onClick={() => { close(); if (w.id !== current) onGo(w.id) }}>
                  <span className={`ml-mark${w.color ? ' tinted tint-' + w.color : ''}`}><WorkoutMark icon={w.icon} letter={w.letter} size="1em" /></span>
                  <span className="ml-name">{w.exercise || t('Untitled')}</span>
                </button>
                {asking === w.id
                  ? <button className="tray-remove sure" onClick={() => { onRemove(w.id); setAsking(null); sound.pop() }}>{t('Remove')}</button>
                  : <button className="tray-remove" aria-label={t('Remove {name} from this session', { name: w.exercise || t('Untitled') })} onClick={() => setAsking(w.id)}><Icon name="close" size="15px" strokeWidth={2.2} /></button>}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
