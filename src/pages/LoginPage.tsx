import { useState, type FormEvent } from 'react'
import { signIn, signUp, resetPassword, canResetPassword } from '../lib/auth'

// Log in / sign up: the first screen for anyone not signed in. Once signed in,
// the account is remembered until Log out (gear on page A).
export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>(() => { try { return localStorage.getItem('workout-lab:accounts') ? 'login' : 'signup' } catch { return 'signup' } })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setInfo(null)
    if (mode === 'login') {
      setError(await signIn(email.trim(), password))
    } else {
      const r = await signUp(email.trim(), password)
      setError(r.error)
      if (r.confirm) setInfo(`We sent a link to ${email.trim()}. Open it to finish signing up, then log in.`)
    }
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

        {error && <p className="form-error" role="alert">{error}</p>}
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
