import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './lib/prefs'
import { sound } from './lib/sound'

// a soft tap on every button press
document.addEventListener('pointerdown', (e) => {
  if ((e.target as Element | null)?.closest?.('button')) sound.tap()
}, { capture: true })

// Opening screen from index.html: let the flower finish blooming, then fade it away.
function hideSplash() {
  const el = document.getElementById('splash')
  if (!el) return
  const wait = Math.max(0, 4000 - performance.now())
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 650) }, wait)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
hideSplash()
