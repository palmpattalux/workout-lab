import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './lib/prefs'
import { sound } from './lib/sound'

// Hologram guide style mockups (2026-10-25): ?holo=spot|glass|line picks one and remembers it on this device.
try {
  const q = new URLSearchParams(location.search).get('holo')
  if (q !== null) { if (q) localStorage.setItem('dotset:holo', q); else localStorage.removeItem('dotset:holo') }
  const h = localStorage.getItem('dotset:holo')
  if (h) document.documentElement.setAttribute('data-holo', h)
} catch { /* storage blocked */ }

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
