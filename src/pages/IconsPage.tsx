import { Icon, WorkoutIcon, packIcons, packLetters, type IconPack } from '../components/icons'
import { usePrefs, setPrefs } from '../lib/prefs'
import { getPreview, previewBlocked } from '../lib/theme'
import { t } from '../lib/i18n'

// Gear > Icon: the set of icons and letters exercises are marked with, picked like a theme.
// Workouts keep the marks they were made with; a new set only changes what's offered next.
const SLOTS = 6
const PACKS: { key: IconPack; name: string }[] = [
  { key: 'default', name: 'Default' },
  { key: 'tokyo', name: 'Tokyo' },
]

export function DotsetIcon({ size = 64 }: { size?: number }) {
  return (
    <svg className="app-icon" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect width="64" height="64" rx="15" className="ai-bg" />
      <circle cx="32" cy="32" r="13" className="ai-ring" />
      <circle cx="32" cy="32" r="6.5" className="ai-dot" />
    </svg>
  )
}

// Tokyo's tile: a katana over a red sun, with ア in the corner
function TokyoIcon() {
  return (
    <span className="app-icon tokyo" aria-hidden="true">
      <i className="tk-sun" />
      <WorkoutIcon k="katana" size="40px" strokeWidth={2.2} />
      <b>ア</b>
    </span>
  )
}

export default function IconsPage() {
  const { pack } = usePrefs()
  function use(p: IconPack) {
    if (p === pack) return
    if (getPreview()) { previewBlocked(); return }
    setPrefs({ pack: p })
  }
  return (
    <main className="page scroll icons-page" aria-label={t('Icons')}>
      <header className="create-head">
        <h1>{t('Icons')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>
      <p className="icons-blurb">{t('The icons and letters you mark your exercises with.')}</p>
      <div className="icon-grid">
        {PACKS.map((p) => (
          <button key={p.key} className={`icon-tile${p.key === pack ? ' on' : ''}`} aria-pressed={p.key === pack} onClick={() => use(p.key)}>
            {p.key === 'tokyo' ? <TokyoIcon /> : <DotsetIcon />}
            <b>{t(p.name)}</b>
            {p.key === pack
              ? <small><Icon name="check" size="11px" strokeWidth={3} />{t('In use')}</small>
              : <small className="use">{t('Use')}</small>}
          </button>
        ))}
        {Array.from({ length: SLOTS - PACKS.length }, (_, i) => (
          <div key={i} className="icon-tile empty" aria-label={t('Coming soon')}>
            <span className="ai-blank" />
            <small>{t('Coming soon')}</small>
          </div>
        ))}
      </div>
      <section className="pack-peek" aria-label={t(PACKS.find((p) => p.key === pack)!.name)}>
        <div className="peek-row">
          {packIcons(pack).map((i) => <span key={i.key} title={t(i.name)}><WorkoutIcon k={i.key} size="22px" strokeWidth={1.9} /></span>)}
        </div>
        <div className="peek-row letters">
          {packLetters(pack).map((l) => <span key={l.key}>{l.key}</span>)}
        </div>
      </section>
    </main>
  )
}
