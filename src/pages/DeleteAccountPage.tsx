import { useState } from 'react'
import { Icon } from '../components/icons'
import { t } from '../lib/i18n'
import { supabase, signOut, type AppUser } from '../lib/auth'
import { deleteAccount, useSubscription } from '../lib/billing'
import { LEGAL } from '../legal/info'

// Gear > Settings > Delete account, also at dotset.app/delete-account (Google Play links
// there). Deletes the account and everything in it for good; nothing is kept but what the
// payment provider must keep by law.
export default function DeleteAccountPage({ user }: { user: AppUser | null }) {
  const sub = useSubscription()
  const [step, setStep] = useState<'ask' | 'sure' | 'busy' | 'done' | 'failed'>('ask')

  async function remove() {
    setStep('busy')
    try {
      await deleteAccount()
      // this browser's copy of the account goes too
      try { for (const k of Object.keys(localStorage)) if (user && k.includes(user.id)) localStorage.removeItem(k) } catch { /* blocked */ }
      await signOut()
      setStep('done')
    } catch { setStep('failed') }
  }

  return (
    <main className="page scroll delete-account" aria-label={t('Delete account')}>
      <header className="create-head">
        <h1>{t('Delete account')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => (history.length > 1 ? history.back() : location.replace('#'))}><Icon name="back" size="22px" /></button>
      </header>
      <div className="del-body">
        {step === 'done' ? (
          <>
            <p className="del-lead">{t('Your account and everything in it has been deleted.')}</p>
            <button className="del-btn quiet" onClick={() => location.replace('#')}>{t('Done')}</button>
          </>
        ) : !supabase ? (
          <p>{t('This version keeps everything on this device only. To remove it, clear this site\'s data in your browser settings.')}</p>
        ) : !user ? (
          <>
            <p className="del-lead">{t('Log in to the account you want to delete, then come back to this page.')}</p>
            <p>{t('You can also email {email} from the address you signed up with, and we will delete it for you within 30 days.', { email: LEGAL.email })}</p>
            <button className="del-btn quiet" onClick={() => { location.hash = 'login' }}>{t('Log in')}</button>
          </>
        ) : (
          <>
            <p className="del-lead">{t('This deletes {email} for good.', { email: user.email ?? '' })}</p>
            <ul>
              <li>{t('All your exercises, sessions, notes and presets are erased.')}</li>
              <li>{t('Themes and icon sets you bought, and any plan time left, are lost and not refunded.')}</li>
              {sub?.renews && <li>{t('Your plan stops renewing and your saved card is removed.')}</li>}
              <li>{t('Plans bought through the App Store or Google Play must also be cancelled there.')}</li>
              <li>{t('Our payment provider keeps a record of past payments, as the law requires.')}</li>
            </ul>
            {step === 'failed' && <p className="form-error" role="alert">{t("That didn't work. Check your connection and try again, or email {email}.", { email: LEGAL.email })}</p>}
            {step === 'sure' || step === 'busy'
              ? <div className="del-confirm">
                  <p>{t("This can't be undone.")}</p>
                  <button className="del-btn danger" disabled={step === 'busy'} onClick={remove}>{step === 'busy' ? t('One moment…') : t('Delete forever')}</button>
                  <button className="del-btn quiet" disabled={step === 'busy'} onClick={() => setStep('ask')}>{t('Keep my account')}</button>
                </div>
              : <button className="del-btn danger" onClick={() => setStep('sure')}>{t('Delete my account')}</button>}
          </>
        )}
      </div>
    </main>
  )
}
