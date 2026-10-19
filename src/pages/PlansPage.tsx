import { Icon } from '../components/icons'
import { useState } from 'react'
import { PLANS, FREE_WORKOUTS, FREE_SETS, usePlan, atLeast, tierName } from '../lib/plan'
import { canPay, useSubscription, cancelRenewal, refreshSubscription } from '../lib/billing'
import { formatDate } from '../lib/format'
import { t } from '../lib/i18n'

// Gear > Plan. Free, then the three paid plans, each with a way to get it (website
// checkout). Unlimited has no perks yet, so it still says "Coming soon".
export default function PlansPage({ userId }: { userId: string | null }) {
  const plan = usePlan()
  const sub = useSubscription()
  const [stopping, setStopping] = useState(false)
  const price = (n: number) => '฿' + n.toLocaleString()
  const mine = sub && sub.tier === plan ? sub : null
  const until = mine ? formatDate(new Date(mine.paid_until).getTime()) : ''
  async function stopRenewing() {
    setStopping(true)
    try { await cancelRenewal(); await refreshSubscription(userId) } catch { /* stays as it was */ }
    setStopping(false)
  }
  const action = (tier: typeof plan, unlimited = false) =>
    tier === plan ? (
      <div className="plan-manage">
        <span className="plan-state on">{t('Current plan')}</span>
        {mine && <small>{mine.renews ? t('Renews on {date}', { date: until }) : t('Active until {date}', { date: until })}</small>}
        {mine?.renews && <button className="plan-quiet" disabled={stopping} onClick={stopRenewing}>{t('Turn off renewing')}</button>}
        {mine && !mine.renews && <button className="plan-quiet" onClick={() => { location.hash = 'checkout-' + tier }}>{t('Add another month')}</button>}
      </div>
    )
    : atLeast(plan, tier) ? <span className="plan-state">{t('Included')}</span>
    : canPay && !unlimited ? <button className="plan-buy" onClick={() => { location.hash = 'checkout-' + tier }}>{t('Get {plan}', { plan: t(tierName(tier)) })}</button>
    : <span className="plan-state soon">{t('Coming soon')}</span>

  return (
    <main className="page scroll plans" aria-label={t('Plans')}>
      <header className="create-head">
        <h1>{t('Plans')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>

      <p className="plan-now">{t('Your plan')}<b>{t(tierName(plan))}</b></p>

      <section className={`plan-card free${plan === 'free' ? ' current' : ''}`}>
        <div className="plan-top">
          <h2>{t('Free')}</h2>
          <span className="plan-price">฿0</span>
        </div>
        <ul>
          <li>{t('Up to {n} workouts', { n: FREE_WORKOUTS })}</li>
          <li>{t('Up to {n} sets per exercise', { n: FREE_SETS })}</li>
          <li>{t('Try on any theme')}</li>
        </ul>
        {plan === 'free' && action('free')}
      </section>

      {PLANS.map((p) => (
        <section key={p.tier} className={`plan-card ${p.tier}${plan === p.tier ? ' current' : ''}`}>
          <div className="plan-top">
            <h2>{t(p.name)}</h2>
            <span className="plan-price">{price(p.price)}<small>{t('/ month')}</small></span>
          </div>
          {p.perks.length > 0
            ? <ul className="perks">{p.perks.map((k) => <li key={k}><Icon name="check" size="16px" strokeWidth={2.4} />{t(k)}</li>)}</ul>
            : <p className="plan-later">{t('Details coming soon')}</p>}
          {action(p.tier, p.tier === 'unlimited')}
        </section>
      ))}
      {/* what a subscription means, in plain words (App Store, Google Play and card rules ask for this) */}
      <p className="plan-legal">
        {t('Plans paid by card renew every month at the price shown until you turn off renewing, which you can do here anytime. PromptPay and TrueMoney pay for one month and never renew.')}{' '}
        <a href="#terms">{t('Terms')}</a> · <a href="#privacy">{t('Privacy')}</a> · <a href="#refunds">{t('Refunds')}</a>
      </p>
    </main>
  )
}
