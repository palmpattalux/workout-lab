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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
