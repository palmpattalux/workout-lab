import { Icon } from '../components/icons'
import { PLANS, FREE_WORKOUTS, FREE_SETS, usePlan, atLeast, tierName } from '../lib/plan'
import { t } from '../lib/i18n'

// Gear > Plan. Free, then the three paid plans. Payment isn't in yet, so plans you
// don't have say "Coming soon" instead of offering a purchase.
export default function PlansPage() {
  const plan = usePlan()
  const price = (n: number) => '฿' + n.toLocaleString()
  const action = (tier: typeof plan) =>
    tier === plan ? <span className="plan-state on">{t('Current plan')}</span>
    : atLeast(plan, tier) ? <span className="plan-state">{t('Included')}</span>
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
          {action(p.tier)}
        </section>
      ))}
    </main>
  )
}
