import { useEffect, useState, type FormEvent } from 'react'
import { signIn, signUp, resetPassword, resendVerification, setNewPassword, canResetPassword, verifiesEmail, arrivedFromEmailLink } from '../lib/auth'
import { t } from '../lib/i18n'
import { LangPicker } from '../components/Flag'
import { Icon } from '../components/icons'

// Log in / sign up: the first screen for anyone not signed in. Once signed in,
// the account is remembered until Log out (gear on page A).
// With online accounts, a new account must verify its email before it can log in.
export default function LoginPage({ start, note }: { start?: 'login' | 'signup'; note?: string }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'sent'>(() => {
    if (arrivedFromEmailLink) return 'login'
    if (start) return start
    try { return localStorage.getItem('workout-lab:accounts') || localStorage.getItem('workout-lab:has-account') ? 'login' : 'signup' } catch { return 'signup' }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(arrivedFromEmailLink ? t('Your email is verified. Log in to continue.') : null)
  const [cooldown, setCooldown] = useState(0)
  const unverified = error === t('Verify your email first: open the link we sent you, then log in.')

  useEffect(() => {
    if (!cooldown) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setInfo(null)
    if (mode === 'login') {
      setError(await signIn(email.trim(), password))
    } else {
      const r = await signUp(email.trim(), password)
      setError(r.error)
      if (!r.error) { try { localStorage.setItem('workout-lab:has-account', '1') } catch { /* fine */ } }
      if (r.confirm) { setMode('sent'); setCooldown(60) }
    }
    setBusy(false)
  }

  async function resend() {
    if (!email.trim() || cooldown) return
    setBusy(true); setError(null)
    const err = await resendVerification(email.trim())
    setError(err)
    if (!err) { setInfo(t('Sent a new link to {email}.', { email: email.trim() })); setCooldown(60) }
    setBusy(false)
  }

  async function forgot() {
    if (!email.trim()) { setError(t('Type your email first, then tap "Forgot password".')); return }
    setBusy(true); setError(null)
    const err = await resetPassword(email.trim())
    setError(err)
    if (!err) setInfo(t('We sent a password reset link to {email}.', { email: email.trim() }))
    setBusy(false)
  }

  if (mode === 'sent') {
    return (
      <main className="page scroll login" aria-label={t('Verify your email')}>
        <div className="login-form">
          <h1>{t('Check your email')}</h1>
          <p className="muted">{t("We sent a link to {email}. Open it to verify your email, and you'll be logged in.").split('{email}')[0]}<b>{email.trim()}</b>{t("We sent a link to {email}. Open it to verify your email, and you'll be logged in.").split('{email}')[1]}</p>
          <p className="muted small">{t('Not there? Check spam, or send it again.')}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          {info && <p className="form-info" role="status">{info}</p>}
          <button className="primary" type="button" onClick={resend} disabled={busy || cooldown > 0}>
            {cooldown > 0 ? t('Send again in {n}s', { n: cooldown }) : t('Send again')}
          </button>
          <div className="login-links">
            <button type="button" onClick={() => { setMode('login'); setError(null); setInfo(null) }}>{t('Back to log in')}</button>
          </div>
        </div>
      </main>
    )
  }

  const isLogin = mode === 'login'

  return (
    <main className="page scroll login" aria-label={isLogin ? t('Log in') : t('Sign up')}>
      <div className="login-lang"><LangPicker /></div>
      {!arrivedFromEmailLink && <button className="icon-btn login-close" aria-label={t('Back')} onClick={() => { if (history.length > 1) history.back(); else location.replace('#') }}><Icon name="close" size="22px" /></button>}
      <form className="login-form" onSubmit={submit}>
        {note && <p className="login-note"><Icon name="check" size="16px" strokeWidth={2.6} />{note}</p>}
        <h1>Sidekick</h1>
        <p className="muted">{isLogin ? t('Log in to your notes.') : t('Make an account to keep your notes.')}</p>

        <input id="email" className="field" type="email" autoComplete="email" placeholder={t('Email')} required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input id="password" className="field" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'}
          placeholder={t('Password')} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        {!isLogin && verifiesEmail && <p className="muted small">{t("We'll email you a link to verify your address.")}</p>}

        {error && <p className="form-error" role="alert">{error}</p>}
        {unverified && (
          <button type="button" className="link-btn" onClick={resend} disabled={busy || cooldown > 0}>
            {cooldown > 0 ? t('Verification email sent (again in {n}s)', { n: cooldown }) : t('Send the verification email again')}
          </button>
        )}
        {info && <p className="form-info" role="status">{info}</p>}

        <button className="primary" type="submit" disabled={busy}>{busy ? t('One moment…') : isLogin ? t('Log in') : t('Sign up')}</button>

        <div className="login-links">
          <button type="button" onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(null); setInfo(null) }}>
            {isLogin ? t('New here? Sign up') : t('Have an account? Log in')}
          </button>
          {isLogin && canResetPassword && <button type="button" onClick={forgot}>{t('Forgot password')}</button>}
        </div>
      </form>
    </main>
  )
}

// Opened from a password reset link: choose a new password, then carry on into the app.
export function NewPasswordPage() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(await setNewPassword(password)); setBusy(false)
  }
  return (
    <main className="page scroll login" aria-label={t('New password')}>
      <form className="login-form" onSubmit={submit}>
        <h1>{t('New password')}</h1>
        <p className="muted">{t('Choose a new password for your account.')}</p>
        <input id="password" className="field" type="password" autoComplete="new-password" placeholder={t('New password')} required minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy}>{busy ? t('One moment…') : t('Save password')}</button>
      </form>
    </main>
  )
}
