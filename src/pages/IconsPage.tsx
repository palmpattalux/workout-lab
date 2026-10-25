import { Icon, WorkoutIcon, packIcons, packLetters, type IconPack } from '../components/icons'
import { useState } from 'react'
import { usePrefs, setPrefs } from '../lib/prefs'
import { getPreview, previewBlocked, THEME_PRICE } from '../lib/theme'
import { useCanUsePack, useIconPack, PACK_ITEM } from '../lib/iconpack'
import { canPay } from '../lib/billing'
import { useOwnedThemes } from '../lib/theme'
import { TierChip } from '../components/TierChip'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'

// Gear > Icon: the set of icons and letters exercises are marked with, picked like a theme.
// Workouts keep the marks they were made with; a new set only changes what's offered next.
// Sets other than the default are bought once (kept for good) or come free with Premium.
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
export function TokyoIcon() {
  return (
    <span className="app-icon tokyo" aria-hidden="true">
      <i className="tk-sun" />
      <WorkoutIcon k="katana" size="40px" />
      <b>ア</b>
    </span>
  )
}

export default function IconsPage() {
  usePrefs()
  const pack = useIconPack()
  const canUse = useCanUsePack()
  const owned = useOwnedThemes()
  // the set being looked at: tap a tile to see its icons; one you have is put to use straight away
  const [look, setLook] = useState<IconPack>(pack)
  const price = '฿' + THEME_PRICE
  function tap(p: IconPack) {
    setLook(p)
    if (!canUse(p) || p === pack) return
    if (getPreview()) { previewBlocked(); return }
    setPrefs({ pack: p })
    sound.pop()
  }
  const lookName = PACKS.find((p) => p.key === look)!.name
  const locked = !canUse(look)
  return (
    <main className="page scroll icons-page" aria-label={t('Icons')}>
      <header className="create-head">
        <h1>{t('Icons')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>
      <p className="icons-blurb">{t('The icons and letters you mark your exercises with.')}</p>
      <div className="icon-grid">
        {PACKS.map((p) => (
          <button key={p.key} className={`icon-tile${p.key === pack ? ' on' : ''}${p.key === look && p.key !== pack ? ' look' : ''}`} aria-pressed={p.key === pack} onClick={() => tap(p.key)}>
            {p.key !== 'default' && <TierChip tier="premium" compact />}
            {p.key === 'tokyo' ? <TokyoIcon /> : <DotsetIcon />}
            <b>{t(p.name)}</b>
            {p.key === pack
              ? <small><Icon name="check" size="11px" strokeWidth={3} />{t('In use')}</small>
              : canUse(p.key)
                ? <small className="use">{p.key !== 'default' && owned.includes(PACK_ITEM[p.key as 'tokyo']) ? t('Owned') : t('Use')}</small>
                : <small className="use price">{price}</small>}
          </button>
        ))}
        {Array.from({ length: SLOTS - PACKS.length }, (_, i) => (
          <div key={i} className="icon-tile empty" aria-label={t('Coming soon')}>
            <span className="ai-blank" />
            <small>{t('Coming soon')}</small>
          </div>
        ))}
      </div>
      <section className="pack-peek" aria-label={t(lookName)}>
        <div className="peek-row">
          {packIcons(look).map((i) => <span key={i.key} title={t(i.name)}><WorkoutIcon k={i.key} size="22px" /></span>)}
        </div>
        <div className="peek-row letters">
          {packLetters(look).map((l) => <span key={l.key}>{l.key}</span>)}
        </div>
      </section>
      {locked && look !== 'default' && (
        <div className="pack-buy">
          <span className="owned-tag">{t('{price} · yours to keep', { price })}</span>
          {canPay
            ? <button className="theme-view" onClick={() => { sound.tap(); location.hash = 'checkout-theme-' + PACK_ITEM[look as 'tokyo'] }}>{t('Get {price}', { price })}</button>
            : <button className="theme-view" disabled>{t('Coming soon')}</button>}
          <button className="theme-plan-link" onClick={() => { location.hash = 'plans' }}>{t('Or get it free with {plan}', { plan: t('Premium') })}</button>
        </div>
      )}
    </main>
  )
}
