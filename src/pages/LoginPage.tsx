import { useEffect, useState, type FormEvent } from 'react'
import { signIn, signUp, resetPassword, resendVerification, setNewPassword, endRecovery, canResetPassword, verifiesEmail, arrivedFromEmailLink, resetLink, emailLinkFailed } from '../lib/auth'
import { t } from '../lib/i18n'
import { LangPicker } from '../components/Flag'
import { Icon } from '../components/icons'

// Log in / sign up / forgot password: the first screen for anyone not signed in. Once
// signed in, the account is remembered until Log out (gear on page A).
// With online accounts, a new account must verify its email before it can log in.
type Mode = 'login' | 'signup' | 'sent' | 'forgot' | 'reset-sent'
const unverifiedMsg = () => t('Verify your email first: open the link we sent you, then log in.')
const noMatchMsg = () => t("That email and password don't match an account.")

// "…{email}…" with the address in bold
function WithEmail({ text, email }: { text: string; email: string }) {
  const [a, b = ''] = text.split('{email}')
  return <>{a}<b>{email}</b>{b}</>
}

function PasswordField({ value, onChange, autoComplete, placeholder }: { value: string; onChange: (v: string) => void; autoComplete: string; placeholder: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw-field">
      <input id="password" className="field" type={show ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder}
        required minLength={6} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="pw-eye" aria-label={show ? t('Hide password') : t('Show password')} aria-pressed={show} onClick={() => setShow((s) => !s)}>
        <Icon name={show ? 'eyeOff' : 'eye'} size="20px" />
      </button>
    </div>
  )
}

function firstMessage(): { error: string | null; info: string | null } {
  if (!arrivedFromEmailLink) return { error: null, info: null }
  if (resetLink) return { error: t('That reset link has expired or was already used. Type your email and tap "Forgot password" to get a new one.'), info: null }
  if (emailLinkFailed) return { error: t("That link has expired or was already used. If you already confirmed your email, just log in. If not, log in and we'll send you a fresh link."), info: null }
  return { error: null, info: t('Your email is verified. Log in to continue.') }
}

export default function LoginPage({ start, note }: { start?: 'login' | 'signup'; note?: string }) {
  const [mode, setMode] = useState<Mode>(() => {
    if (arrivedFromEmailLink) return 'login'
    if (start) return start
    try { return localStorage.getItem('workout-lab:accounts') || localStorage.getItem('workout-lab:has-account') ? 'login' : 'signup' } catch { return 'signup' }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(() => firstMessage().error)
  const [info, setInfo] = useState<string | null>(() => firstMessage().info)
  const [cooldown, setCooldown] = useState(0)
  const unverified = error === unverifiedMsg()
  const wrongPassword = mode === 'login' && !!error && error.startsWith(noMatchMsg())
  const mail = email.trim()

  useEffect(() => {
    if (!cooldown) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Waiting for the email to be confirmed: when they come back to this page (or every
  // so often), quietly try to log in, so it carries on by itself once they've tapped the link.
  useEffect(() => {
    if (mode !== 'sent' || !password) return
    let busyTry = false
    const tryIn = async () => {
      if (busyTry || document.visibilityState !== 'visible') return
      busyTry = true; await signIn(mail, password); busyTry = false
    }
    const timer = setInterval(tryIn, 10000)
    document.addEventListener('visibilitychange', tryIn)
    window.addEventListener('focus', tryIn)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tryIn); window.removeEventListener('focus', tryIn) }
  }, [mode, mail, password])

  function go(m: Mode) { setMode(m); setError(null); setInfo(null) }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setInfo(null)
    if (mode === 'login') {
      setError(await signIn(mail, password))
    } else if (mode === 'forgot') {
      const err = await resetPassword(mail)
      setError(err)
      if (!err) { setMode('reset-sent'); setCooldown(60) }
    } else {
      const r = await signUp(mail, password)
      if (r.exists) {
        // Already has an account: try logging straight in with what they typed;
        // otherwise move to Log in and say plainly what to do.
        const err = await signIn(mail, password)
        if (err) {
          setMode('login')
          setInfo(t('You already have an account with {email}. Enter your password to log in, or tap "Forgot password".', { email: mail }))
          if (err === unverifiedMsg()) setError(err)
        }
        setBusy(false)
        return
      }
      setError(r.error)
      if (!r.error) { try { localStorage.setItem('workout-lab:has-account', '1') } catch { /* fine */ } }
      if (r.confirm) { setMode('sent'); setCooldown(60) }
    }
    setBusy(false)
  }

  async function resend() {
    if (!mail || cooldown) return
    setBusy(true); setError(null)
    const err = mode === 'reset-sent' ? await resetPassword(mail) : await resendVerification(mail)
    setError(err)
    if (!err) { setInfo(t('Sent a new link to {email}.', { email: mail })); setCooldown(60) }
    setBusy(false)
  }

  if (mode === 'sent' || mode === 'reset-sent') {
    const reset = mode === 'reset-sent'
    return (
      <main className="page scroll login" aria-label={t('Check your email')}>
        <div className="login-form">
          <h1>{t('Check your email')}</h1>
          <p className="muted">
            {reset
              ? <WithEmail text={t("If there's an account for {email}, we sent it a link to choose a new password.")} email={mail} />
              : <WithEmail text={t("We sent a link to {email}. Open it to verify your email, and you'll be logged in.")} email={mail} />}
          </p>
          <p className="muted small">{reset ? t('The link works once, on any device, and expires after an hour.') : t("Once you've confirmed, this page carries on by itself.")}</p>
          <p className="muted small">{t('It comes from hello@dotset.app. Not there after a minute? Check spam or Promotions, or send it again.')}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          {info && <p className="form-info" role="status">{info}</p>}
          <button className="primary" type="button" onClick={resend} disabled={busy || cooldown > 0}>
            {cooldown > 0 ? t('Send again in {n}s', { n: cooldown }) : t('Send again')}
          </button>
          <div className="login-links">
            <button type="button" onClick={() => go(reset ? 'forgot' : 'signup')}>{t('Wrong email? Change it')}</button>
            <button type="button" onClick={() => go('login')}>{t('Back to log in')}</button>
          </div>
        </div>
      </main>
    )
  }

  const isLogin = mode === 'login'
  const forgot = mode === 'forgot'

  return (
    <main className="page scroll login" aria-label={forgot ? t('Reset your password') : isLogin ? t('Log in') : t('Sign up')}>
      <div className="login-lang"><LangPicker /></div>
      {!arrivedFromEmailLink && <button className="icon-btn login-close" aria-label={t('Back')} onClick={() => { if (history.length > 1) history.back(); else location.replace('#') }}><Icon name="close" size="22px" /></button>}
      <form className="login-form" onSubmit={submit}>
        {note && !forgot && <p className="login-note"><Icon name="check" size="16px" strokeWidth={2.6} />{note}</p>}
        <h1>{forgot ? t('Reset your password') : 'Dotset'}</h1>
        <p className="muted">{forgot ? t("Type your account email and we'll send you a link to choose a new password.") : isLogin ? t('Log in to your notes.') : t('Make an account to keep your notes.')}</p>

        <input id="email" className="field" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder={t('Email')} required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        {!forgot && <PasswordField value={password} onChange={setPassword} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={t('Password')} />}
        {!isLogin && !forgot && <p className="muted small">{t('At least 6 characters.')}{verifiesEmail && <> {t("We'll email you a link to verify your address.")}</>}</p>}

        {error && <p className="form-error" role="alert">{error}</p>}
        {unverified && (
          <button type="button" className="link-btn" onClick={resend} disabled={busy || cooldown > 0}>
            {cooldown > 0 ? t('Verification email sent (again in {n}s)', { n: cooldown }) : t('Send the verification email again')}
          </button>
        )}
        {wrongPassword && canResetPassword && <button type="button" className="link-btn" onClick={() => go('forgot')}>{t('Forgot your password?')}</button>}
        {info && <p className="form-info" role="status">{info}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? t('One moment…') : forgot ? t('Send reset link') : isLogin ? t('Log in') : t('Sign up')}
        </button>
        {!isLogin && !forgot && (
          <p className="legal-consent">{t('By signing up you agree to the')} <a href="#terms">{t('Terms')}</a> {t('and')} <a href="#privacy">{t('Privacy Policy')}</a>{t(', and confirm you are 13 or older (under 20s with a parent\'s permission).')}</p>
        )}

        <div className="login-links">
          {forgot
            ? <button type="button" onClick={() => go('login')}>{t('Back to log in')}</button>
            : <button type="button" onClick={() => go(isLogin ? 'signup' : 'login')}>{isLogin ? t('New here? Sign up') : t('Have an account? Log in')}</button>}
          {isLogin && canResetPassword && <button type="button" onClick={() => go('forgot')}>{t('Forgot password')}</button>}
        </div>
      </form>
    </main>
  )
}

// Choose a new password: opened from a reset link (then carries on into the app), or
// from the gear menu's "Change password" while logged in.
export function NewPasswordPage({ change }: { change?: boolean }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const leave = () => { endRecovery(); if (change) location.replace('#') }
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const err = await setNewPassword(password)
    setError(err); setDone(!err); setBusy(false)
  }
  if (done) {
    return (
      <main className="page scroll login" aria-label={t('Password changed')}>
        <div className="login-form">
          <h1>{t('Password changed')}</h1>
          <p className="muted">{t('Use your new password next time you log in.')}</p>
          <button className="primary" type="button" onClick={leave}>{t('Continue')}</button>
        </div>
      </main>
    )
  }
  return (
    <main className="page scroll login" aria-label={change ? t('Change password') : t('New password')}>
      {change && <button className="icon-btn login-close" aria-label={t('Back')} onClick={leave}><Icon name="close" size="22px" /></button>}
      <form className="login-form" onSubmit={submit}>
        <h1>{change ? t('Change password') : t('New password')}</h1>
        <p className="muted">{t('Choose a new password for your account.')}</p>
        <PasswordField value={password} onChange={setPassword} autoComplete="new-password" placeholder={t('New password')} />
        <p className="muted small">{t('At least 6 characters.')}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy}>{busy ? t('One moment…') : t('Save password')}</button>
        {!change && <div className="login-links"><button type="button" onClick={leave}>{t('Skip for now')}</button></div>}
      </form>
    </main>
  )
}
