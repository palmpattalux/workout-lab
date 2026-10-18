import { useEffect, useState } from 'react'
import { t } from '../lib/i18n'
import type { Tier } from '../lib/plan'

// "Free with Premium" on premium themes and icon sets; "Exclusive" with a lock swinging open
// on exclusive ones. Tap it to be told plainly: free access for that plan's members.
export function TierChip({ tier, compact }: { tier: Tier; compact?: boolean }) {
  const [told, setTold] = useState(0)
  useEffect(() => {
    if (!told) return
    const tm = setTimeout(() => setTold(0), 2400)
    return () => clearTimeout(tm)
  }, [told])
  const exclusive = tier === 'exclusive'
  const plan = exclusive ? t('Exclusive') : t('Premium')
  return (
    <span
      className={`tier-chip${exclusive ? ' exclusive' : ''}${compact ? ' compact' : ''}`}
      role="note"
      onClick={(e) => { e.stopPropagation(); setTold(Date.now()) }}
    >
      {exclusive && (
        <svg className="tc-lock" viewBox="0 0 24 24" aria-hidden="true">
          <path className="tc-shackle" d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
          <rect x="5.5" y="10.5" width="13" height="10" rx="2.5" />
        </svg>
      )}
      {exclusive ? t('Exclusive') : t('Free with {plan}', { plan })}
      {told > 0 && <span key={told} className="tc-tell">{t('Free access for {plan} members', { plan })}</span>}
    </span>
  )
}
