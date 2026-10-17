import { useState, type FormEvent } from 'react'
import { Icon, type IconName } from '../components/icons'
import { PLANS, type Tier } from '../lib/plan'
import { startCheckout, cardToken, savePending, loadOmise, useSubscription, type Method } from '../lib/billing'
import { t } from '../lib/i18n'

// #checkout-<plan>: pick how to pay, then pay. Kept as calm and plain as the rest of the
// app; the only page that isn't ours is the bank's or wallet's own confirmation step.
const METHODS: { key: Method; icon: IconName; name: string; note: string }[] = [
  { key: 'promptpay', icon: 'qr', name: 'PromptPay', note: 'Scan with your banking app' },
  { key: 'truemoney', icon: 'wallet', name: 'TrueMoney Wallet', note: 'Pay in the TrueMoney app' },
  { key: 'card', icon: 'card', name: 'Credit or debit card', note: 'Renews monthly · cancel anytime' },
]

export default function CheckoutPage({ tier, guest }: { tier: Tier; guest: boolean }) {
  const plan = PLANS.find((p) => p.tier === tier)!
  const sub = useSubscription()
  const [method, setMethod] = useState<Method>('promptpay')
  const [card, setCard] = useState({ name: '', number: '', exp: '', cvc: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const price = '฿' + plan.price.toLocaleString()

  function pick(m: Method) {
    setMethod(m); setError(null)
    if (m === 'card') loadOmise().catch(() => {}) // get the secure card script ready early
  }
  const setNumber = (v: string) => setCard((c) => ({ ...c, number: v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ') }))
  const setExp = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); setCard((c) => ({ ...c, exp: d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d })) }
  const cardReady = card.name.trim() && card.number.replace(/\s/g, '').length >= 13 && card.exp.replace(/\D/g, '').length === 4 && card.cvc.length >= 3

  async function pay(e: FormEvent) {
    e.preventDefault()
    if (busy || (method === 'card' && !cardReady)) return
    setBusy(true); setError(null)
    try {
      let token: string | undefined
      if (method === 'card') {
        const d = card.exp.replace(/\D/g, '')
        token = await cardToken({ name: card.name.trim(), number: card.number, month: d.slice(0, 2), year: d.slice(2), cvc: card.cvc })
      }
      const r = await startCheckout(tier, method, { token })
      if (r.status === 'failed') throw new Error(r.failure || 'declined')
      savePending({ charge: r.charge, tier, method, qr: r.qr, expiresAt: r.expiresAt })
      if (r.authorizeUri) { location.href = r.authorizeUri; return } // the bank's or wallet's own step
      location.hash = 'pay'
    } catch (err) {
      const m = (err as Error).message
      setError(m === 'network' ? t("Can't reach the server. Check your connection and try again.")
        : m === 'You already have this plan' ? t('You already have this plan.')
        : method === 'card' ? t('Your card was not accepted. Check the details, or try another way to pay.')
        : t('Something went wrong. Nothing was charged. Please try again.'))
      setBusy(false)
    }
  }

  return (
    <main className="page scroll checkout" aria-label={t('Checkout')}>
      <header className="create-head">
        <h1>{t('Checkout')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>

      <section className={`co-plan ${tier}`}>
        <div>
          <h2>{t(plan.name)}</h2>
          <p>{t(plan.perks[0] ?? '')}{plan.perks.length > 1 && <> · {t('and {n} more', { n: plan.perks.length - 1 })}</>}</p>
        </div>
        <span className="plan-price">{price}<small>{t('/ month')}</small></span>
      </section>

      {guest ? (
        <div className="co-guest">
          <p>{t('Make a free account first, so your plan stays with you on every device.')}</p>
          <button className="co-pay" onClick={() => { location.hash = 'signup' }}>{t('Sign up to continue')}</button>
        </div>
      ) : (
        <form onSubmit={pay}>
          <p className="co-label">{t('How would you like to pay?')}</p>
          <div className="co-methods" role="radiogroup">
            {METHODS.map((m) => (
              <button type="button" key={m.key} role="radio" aria-checked={method === m.key} className={`co-method${method === m.key ? ' on' : ''}`} onClick={() => pick(m.key)} disabled={busy}>
                <span className="co-ico"><Icon name={m.icon} size="22px" /></span>
                <span className="co-text"><b>{t(m.name)}</b><small>{t(m.note)}</small></span>
                <span className="co-radio" />
              </button>
            ))}
          </div>

          {method === 'card' && (
            <div className="co-card">
              <label><span>{t('Card number')}</span><input inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={card.number} onChange={(e) => setNumber(e.target.value)} disabled={busy} /></label>
              <div className="co-row">
                <label><span>{t('Expiry')}</span><input inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" value={card.exp} onChange={(e) => setExp(e.target.value)} disabled={busy} /></label>
                <label><span>CVC</span><input inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))} disabled={busy} /></label>
              </div>
              <label><span>{t('Name on card')}</span><input autoComplete="cc-name" value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} disabled={busy} /></label>
            </div>
          )}

          {error && <p className="co-error" role="alert">{error}</p>}
          {sub && sub.tier !== tier && new Date(sub.paid_until) > new Date() && (
            <p className="co-note">{t('Your {plan} plan switches to {next} as soon as this payment goes through.', { plan: t(PLANS.find((p) => p.tier === sub.tier)?.name ?? ''), next: t(plan.name) })}</p>
          )}

          <button type="submit" className={`co-pay${busy ? ' busy' : ''}`} disabled={busy || (method === 'card' && !cardReady)}>
            {busy ? <><i className="co-dot" />{t('Securing your payment…')}</> : t('Pay {price}', { price })}
          </button>
          <p className="co-trust"><Icon name="shield" size="16px" />{t('Secure payment by Opn Payments. Dotset never sees your card or bank details.')}</p>
          <p className="co-fine">{method === 'card' ? t('Charged {price} today, then every month. Turn off renewing anytime in Plan.', { price }) : t('One month of {plan}. Nothing renews by itself: pay again from Plan when it ends.', { plan: t(plan.name) })}</p>
        </form>
      )}
    </main>
  )
}
