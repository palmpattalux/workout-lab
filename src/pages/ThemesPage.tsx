import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/icons'
import ThemeScene from '../components/ThemeScene'
import { THEMES, THEME_SLOTS, setPreview, usePreview, useApplied, applyTheme, canUseTheme } from '../lib/theme'
import { usePlan, tierName } from '../lib/plan'
import { LockBadge } from '../components/LockNote'
import { sound } from '../lib/sound'
import { t } from '../lib/i18n'

// Swipe through the theme slots like a scenery picker: the centred card is big,
// its neighbours shrink away. Each theme belongs to a plan; "View" tries it on without that plan.
export default function ThemesPage({ onViewed }: { onViewed: () => void }) {
  const preview = usePreview()
  const plan = usePlan()
  const applied = useApplied()
  const track = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(0)
  const last = useRef(0)

  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const read = () => {
      const card = el.firstElementChild as HTMLElement | null
      if (!card) return
      const p = el.scrollLeft / card.offsetWidth
      setPos(p)
      const i = Math.round(p)
      if (i !== last.current) { last.current = i; sound.tick() }
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(read) }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  // mouse users can drag the strip too (touch scrolls natively)
  const drag = useRef<{ x: number; left: number } | null>(null)
  const index = Math.min(THEME_SLOTS - 1, Math.max(0, Math.round(pos)))
  const theme = THEMES[index]
  const viewing = theme && preview === theme.key
  const owner = !!theme && canUseTheme(theme.key, plan)

  function goTo(i: number) {
    const el = track.current
    const card = el?.firstElementChild as HTMLElement | null
    if (el && card) el.scrollTo({ left: i * card.offsetWidth, behavior: 'smooth' })
  }

  return (
    <main className="page themes" aria-label={t('Themes')}>
      <header className="create-head">
        <h1>{t('Themes')}</h1>
        <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>

      <div
        className="theme-track"
        ref={track}
        onPointerDown={(e) => { if (e.pointerType === 'mouse') drag.current = { x: e.clientX, left: track.current!.scrollLeft } }}
        onPointerMove={(e) => { if (drag.current) track.current!.scrollLeft = drag.current.left - (e.clientX - drag.current.x) }}
        onPointerUp={() => { if (drag.current) { drag.current = null; goTo(Math.round(pos)) } }}
        onPointerLeave={() => { if (drag.current) { drag.current = null; goTo(Math.round(pos)) } }}
      >
        {THEMES.map((th, i) => {
          const d = Math.min(1.4, Math.abs(i - pos))
          return (
            <div key={i} className="theme-cell">
              <button
                className={`theme-card${th ? '' : ' empty'}${th && preview === th.key ? ' viewing' : ''}`}
                style={{ transform: `scale(${1 - d * 0.16})`, opacity: 1 - d * 0.45 }}
                aria-label={th ? `${th.name} theme` : `Empty slot ${i + 1}`}
                onClick={() => goTo(i)}
              >
                {th ? (
                  <div className={`theme-art skin-${th.key}`} data-skin={th.key}>
                    <ThemeScene skin={th.key} />
                    <span className="mini-dot" style={{ left: '58%', top: '57%' }} />
                    <span className="mini-dot" style={{ left: '82%', top: '55%' }} />
                    <span className="mini-dot" style={{ left: '40%', top: '70%' }} />
                    <span className="mini-dot small" style={{ left: '20%', top: '87%' }} />
                  </div>
                ) : (
                  <div className="theme-art blank"><span>{i + 1}</span><small>{t('Coming soon')}</small></div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="theme-info">
        <p className="theme-count">{index + 1} / {THEME_SLOTS}</p>
        <h2>{theme ? theme.name : t('Empty slot')}</h2>
        <p className="theme-blurb">{theme ? t(theme.blurb) : t('A new theme will land here.')}</p>
        {theme && (
          <>
            <span className={`owned-tag tier-tag${owner ? ' yes' : ''}`}>{!owner && <LockBadge />}{t(tierName(theme.tier))}</span>
            {owner ? (applied === theme.key
              ? <button className="theme-view on" onClick={() => { applyTheme(null); sound.tap() }}>{t('In use · Turn off')}</button>
              : <button className="theme-view" onClick={() => { applyTheme(theme.key); sound.pop(); onViewed() }}>{t('Use')}</button>)
            : viewing
              ? <button className="theme-view on" onClick={() => setPreview(null)}>{t('Stop viewing')}</button>
              : <button className="theme-view" onClick={() => { setPreview(theme.key); sound.pop(); onViewed() }}>{t('View')}</button>}
          </>
        )}
      </div>

      <div className="theme-pips" aria-hidden="true">
        {THEMES.map((_, i) => <i key={i} className={i === index ? 'on' : undefined} />)}
      </div>
    </main>
  )
}
