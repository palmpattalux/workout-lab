import { useEffect, useState } from 'react'
import { Icon } from '../components/icons'
import { PLANS } from '../lib/plan'
import { THEMES, THEME_PRICE, applyTheme } from '../lib/theme'
import { chargeStatus, getPending, clearPending, refreshSubscription } from '../lib/billing'
import { formatDate } from '../lib/format'
import { t } from '../lib/i18n'

// #pay: waiting for a payment to land. PromptPay shows its QR here; cards and TrueMoney
// come back here from the bank's or wallet's own page. Checks quietly every few seconds.
type View = 'waiting' | 'done' | 'failed' | 'none'

export default function PayPage({ userId }: { userId: string | null }) {
  const [pending] = useState(getPending)
  const [view, setView] = useState<View>(pending ? 'waiting' : 'none')
  const [until, setUntil] = useState<string | null>(null)
  const plan = pending?.tier ? PLANS.find((p) => p.tier === pending.tier) : undefined
  const theme = pending?.theme ? THEMES.find((th) => th?.key === pending.theme) ?? null : null

  useEffect(() => {
    if (!pending) return
    let stop = false
    let timer = 0
    const check = async () => {
      try {
        const s = await chargeStatus(pending.charge)
        if (stop) return
        if (s.status === 'successful') { setUntil(s.paidUntil); setView('done'); clearPending(); refreshSubscription(userId); return }
        if (s.status === 'failed' || s.status === 'expired' || s.status === 'reversed') { setView('failed'); clearPending(); return }
      } catch { /* offline for a moment: keep waiting */ }
      timer = window.setTimeout(check, 3000)
    }
    check()
    return () => { stop = true; clearTimeout(timer) }
  }, [pending, userId])

  return (
    <main className="page scroll pay" aria-label={t('Payment')}>
      <header className="create-head">
        <h1>{view === 'done' ? t('All set') : t('Payment')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => { location.hash = view === 'done' ? '' : 'plans' }}><Icon name="back" size="22px" /></button>
      </header>

      {view === 'waiting' && pending?.method === 'promptpay' && pending.qr && (
        <section className="pay-qr">
          <p className="co-label">{t('Scan to pay {price}', { price: '฿' + (theme ? THEME_PRICE : plan?.price ?? 0).toLocaleString() })}</p>
          <div className="qr-box"><img src={pending.qr} alt={t('PromptPay QR code')} /></div>
          <p className="pay-hint">{t('Open any Thai banking app and scan. On this phone? Save the QR, then pick it from your gallery in the banking app.')}</p>
          <a className="pay-save" href={pending.qr} download="dotset-promptpay.png" target="_blank" rel="noreferrer">{t('Save QR')}</a>
        </section>
      )}

      {view === 'waiting' && (
        <div className="pay-wait" role="status">
          <i className="pay-dot" />
          <p>{pending?.method === 'promptpay' ? t('Waiting for your payment…') : t('Confirming your payment…')}</p>
          <small>{t('This page updates by itself. You can leave it open.')}</small>
        </div>
      )}

      {view === 'done' && (
        <div className="pay-done" role="status">
          <span className="pay-ring"><i /></span>
          <h2>{theme ? t('{theme} is yours', { theme: theme.name }) : t("You're on {plan}", { plan: t(plan?.name ?? '') })}</h2>
          {theme && <p>{t('It stays on your account for good.')}</p>}
          {!theme && until && <p>{pending?.method === 'card' ? t('Renews on {date}', { date: formatDate(new Date(until).getTime()) }) : t('Active until {date}', { date: formatDate(new Date(until).getTime()) })}</p>}
          {theme
            ? <button className="co-pay" onClick={() => { applyTheme(theme.key); location.hash = '' }}>{t('Use it now')}</button>
            : <button className="co-pay" onClick={() => { location.hash = '' }}>{t('Start training')}</button>}
        </div>
      )}

      {view === 'failed' && (
        <div className="pay-done failed" role="alert">
          <h2>{t("Payment didn't go through")}</h2>
          <p>{t('Nothing was charged. You can try again or pick another way to pay.')}</p>
          <button className="co-pay" onClick={() => { location.hash = pending?.theme ? 'checkout-theme-' + pending.theme : 'checkout-' + (pending?.tier ?? 'premium') }}>{t('Try again')}</button>
        </div>
      )}

      {view === 'none' && (
        <div className="pay-done failed">
          <p>{t('No payment in progress.')}</p>
          <button className="co-pay" onClick={() => { location.hash = 'plans' }}>{t('See plans')}</button>
        </div>
      )}
    </main>
  )
}
