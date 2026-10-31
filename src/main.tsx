import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './lib/prefs'
import { sound } from './lib/sound'
import { t } from './lib/i18n'

// Every button press makes a sound; the kind of button picks which one.
const DANGER = '.danger, .remove, .del-btn, .sb-remove, .cancel-session, .logout'
const CONFIRM = '.primary, .yes, .save-new, .pick-done, .dc-save, .co-pay, .plan-buy, .renew-go, .mark-btn, button[type="submit"]'
const BACK = '.home-back, .login-close, .pv-exit, .renew-skip, .ghost, .plan-quiet, .quiet'
const BACK_LABELS = ['Back', 'Back to home', 'Close', 'Cancel', 'Previous week']
function press(b: HTMLButtonElement) {
  if (b.matches(DANGER)) return sound.danger()
  if (b.matches(CONFIRM)) return sound.confirm()
  const label = b.getAttribute('aria-label')
  if (b.matches(BACK) || (label && BACK_LABELS.some((l) => t(l) === label))) return sound.back()
  if (b.matches('.next, .theme-next-layer')) return sound.forward()
  // a switch or choice: on if it is about to turn on
  const state = b.getAttribute('aria-pressed') ?? b.getAttribute('aria-checked')
  if (state !== null) return state === 'true' && b.getAttribute('role') !== 'radio' ? sound.off() : sound.on()
  sound.tap()
}
document.addEventListener('pointerdown', (e) => {
  const b = (e.target as Element | null)?.closest?.('button')
  if (b && !b.disabled) press(b)
}, { capture: true })

// Opening screen from index.html: let the opening finish, then fade it away.
function hideSplash() {
  const el = document.getElementById('splash')
  if (!el) return
  const wait = Math.max(0, 4300 - performance.now())
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 650) }, wait)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
hideSplash()
