import { Icon } from '../components/icons'
import { t } from '../lib/i18n'

// Gear > Icon: the app icon on the home screen, picked like a theme. Only the default
// exists for now; the empty slots are where new ones will land.
const SLOTS = 6

export function DotsetIcon({ size = 64 }: { size?: number }) {
  return (
    <svg className="app-icon" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect width="64" height="64" rx="15" className="ai-bg" />
      <circle cx="32" cy="32" r="13" className="ai-ring" />
      <circle cx="32" cy="32" r="6.5" className="ai-dot" />
    </svg>
  )
}

export default function IconsPage() {
  return (
    <main className="page scroll icons-page" aria-label={t('App icon')}>
      <header className="create-head">
        <h1>{t('App icon')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>
      <p className="icons-blurb">{t('The icon on your home screen. More are on the way.')}</p>
      <div className="icon-grid">
        <button className="icon-tile on" aria-pressed="true">
          <DotsetIcon />
          <b>{t('Default')}</b>
          <small><Icon name="check" size="11px" strokeWidth={3} />{t('In use')}</small>
        </button>
        {Array.from({ length: SLOTS - 1 }, (_, i) => (
          <div key={i} className="icon-tile empty" aria-label={t('Coming soon')}>
            <span className="ai-blank" />
            <small>{t('Coming soon')}</small>
          </div>
        ))}
      </div>
    </main>
  )
}
