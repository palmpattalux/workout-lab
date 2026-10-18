import { useState } from 'react'
import { useSubscription, GRACE, canPay } from '../lib/billing'
import { tierName } from '../lib/plan'
import { getPreview } from '../lib/theme'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'

// Home page, when a plan is about to run out or has run out (a card that couldn't be
// charged, or PromptPay/TrueMoney that isn't paid again): a calm card with Renew, and a
// quieter Skip. Nothing is ever deleted when a plan ends; extras just wait for a renewal.
const DAY = 86400000
const SKIP_KEY = 'dotset:renew-skip'
type Phase = 'soon' | 'grace' | 'ended'

export default function RenewNotice() {
  const sub = useSubscription()
  const [skipped, setSkipped] = useState(() => { try { return localStorage.getItem(SKIP_KEY) } catch { return null } })
  if (!sub || !canPay || getPreview()) return null
  const until = new Date(sub.paid_until).getTime()
  const now = Date.now()
  const phase: Phase | null = now > until + GRACE ? 'ended' : now > until ? 'grace' : !sub.renews && until - now < 3 * DAY ? 'soon' : null
  if (!phase) return null
  // Skip hides this notice until the next stage (ending soon, ran out, ended)
  const key = `${sub.paid_until}|${phase}`
  if (skipped === key) return null
  const plan = t(tierName(sub.tier))
  const days = Math.max(1, Math.ceil(((phase === 'soon' ? until : until + GRACE) - now) / DAY))
  const title = phase === 'soon' ? t('Your {plan} ends in {n} days', { plan, n: days })
    : phase === 'grace' ? t('Your {plan} has run out', { plan })
    : t('Your {plan} has ended', { plan })
  const body = phase === 'soon' ? t('Renew now so nothing changes. Your exercises and themes stay just as they are.')
    : phase === 'grace' ? t("We couldn't renew it. Renew within {n} days to keep everything as it is.", { n: days })
    : t("You're on Free for now. Everything you made is still saved and comes back as soon as you renew.")
  function skip() {
    try { localStorage.setItem(SKIP_KEY, key) } catch { /* fine */ }
    setSkipped(key); sound.tap()
  }
  return (
    <div className="renew-scrim" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <section className="renew-card" role="alertdialog" aria-label={title}>
        <span className={`renew-badge ${phase}`}>{plan}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <button className="renew-go" onClick={() => { sound.pop(); location.hash = 'checkout-' + sub.tier }}>{t('Renew {plan}', { plan })}</button>
        <button className="renew-skip" onClick={skip}>{t('Skip')}</button>
      </section>
    </div>
  )
}
