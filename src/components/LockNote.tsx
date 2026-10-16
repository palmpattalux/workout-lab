import { useLocked, hideLocked, tierName } from '../lib/plan'
import { Icon } from './icons'
import { t } from '../lib/i18n'

// Slides up when a free account reaches a plan feature: what's locked, which plan has it,
// and a quiet way to see the plans. Fades by itself.
export default function LockNote() {
  const locked = useLocked()
  if (!locked) return null
  return (
    <div className="lock-note" role="status" key={locked.text}>
      <span className="lock-ic"><Icon name="lock" size="15px" strokeWidth={2} /></span>
      <span className="ln-text">{locked.text}<small>{t('Included with {plan}', { plan: t(tierName(locked.tier)) })}</small></span>
      <button className="ln-plans" onClick={() => { hideLocked(); location.hash = 'plans' }}>{t('Plans')}</button>
    </div>
  )
}

// Small lock mark for buttons and menu items that need a plan.
export function LockBadge() {
  return <span className="lock-badge" aria-hidden="true"><Icon name="lock" size="62%" strokeWidth={2.2} /></span>
}
