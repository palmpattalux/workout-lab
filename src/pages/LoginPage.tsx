import { useEffect, useState, type FormEvent } from 'react'
import { signIn, signUp, resetPassword, resendVerification, setNewPassword, canResetPassword, verifiesEmail, arrivedFromEmailLink } from '../lib/auth'

// Log in / sign up: the first screen for anyone not signed in. Once signed in,
// the account is remembered until Log out (gear on page A).
// With online accounts, a new account must verify its email before it can log in.
export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'sent'>(() => {
    if (arrivedFromEmailLink) return 'login'
    try { return localStorage.getItem('workout-lab:accounts') || localStorage.getItem('workout-lab:has-account') ? 'login' : 'signup' } catch { return 'signup' }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(arrivedFromEmailLink ? 'Your email is verified. Log in to continue.' : null)
  const [cooldown, setCooldown] = useState(0)
  const unverified = !!error && /verify your email/i.test(error)

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
    if (!err) { setInfo(`Sent a new link to ${email.trim()}.`); setCooldown(60) }
    setBusy(false)
  }

  async function forgot() {
    if (!email.trim()) { setError('Type your email first, then tap "Forgot password".'); return }
    setBusy(true); setError(null)
    const err = await resetPassword(email.trim())
    setError(err)
    if (!err) setInfo(`We sent a password reset link to ${email.trim()}.`)
    setBusy(false)
  }

  if (mode === 'sent') {
    return (
      <main className="page scroll login" aria-label="Verify your email">
        <div className="login-form">
          <h1>Check your email</h1>
          <p className="muted">We sent a link to <b>{email.trim()}</b>. Open it to verify your email, and you'll be logged in.</p>
          <p className="muted small">Not there? Check spam, or send it again.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          {info && <p className="form-info" role="status">{info}</p>}
          <button className="primary" type="button" onClick={resend} disabled={busy || cooldown > 0}>
            {cooldown > 0 ? `Send again in ${cooldown}s` : 'Send again'}
          </button>
          <div className="login-links">
            <button type="button" onClick={() => { setMode('login'); setError(null); setInfo(null) }}>Back to log in</button>
          </div>
        </div>
      </main>
    )
  }

  const isLogin = mode === 'login'

  return (
    <main className="page scroll login" aria-label={isLogin ? 'Log in' : 'Sign up'}>
      <form className="login-form" onSubmit={submit}>
        <h1>Sidekick</h1>
        <p className="muted">{isLogin ? 'Log in to your notes.' : 'Make an account to keep your notes.'}</p>

        <input id="email" className="field" type="email" autoComplete="email" placeholder="Email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input id="password" className="field" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'}
          placeholder="Password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        {!isLogin && verifiesEmail && <p className="muted small">We'll email you a link to verify your address.</p>}

        {error && <p className="form-error" role="alert">{error}</p>}
        {unverified && (
          <button type="button" className="link-btn" onClick={resend} disabled={busy || cooldown > 0}>
            {cooldown > 0 ? `Verification email sent (again in ${cooldown}s)` : 'Send the verification email again'}
          </button>
        )}
        {info && <p className="form-info" role="status">{info}</p>}

        <button className="primary" type="submit" disabled={busy}>{busy ? 'One moment…' : isLogin ? 'Log in' : 'Sign up'}</button>

        <div className="login-links">
          <button type="button" onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(null); setInfo(null) }}>
            {isLogin ? 'New here? Sign up' : 'Have an account? Log in'}
          </button>
          {isLogin && canResetPassword && <button type="button" onClick={forgot}>Forgot password</button>}
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
    <main className="page scroll login" aria-label="New password">
      <form className="login-form" onSubmit={submit}>
        <h1>New password</h1>
        <p className="muted">Choose a new password for your account.</p>
        <input id="password" className="field" type="password" autoComplete="new-password" placeholder="New password" required minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy}>{busy ? 'One moment…' : 'Save password'}</button>
      </form>
    </main>
  )
}
