import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from '../components/icons'
import ThemeScene from '../components/ThemeScene'
import { type Feature, THEMES, THEME_SLOTS, themePrice, setPreview, usePreview, useApplied, useOwnedThemes, applyTheme, canUseTheme } from '../lib/theme'
import { usePlan, atLeast } from '../lib/plan'
import { canPay } from '../lib/billing'
import { sound } from '../lib/sound'
import { TierChip } from '../components/TierChip'
import { t } from '../lib/i18n'

// The theme shop: swipe through the slots like skins in a game. The centred card is big,
// its neighbours shrink away. Each theme can be bought on its own (฿149, kept for good) or
// comes with a plan; "Try on" previews it first.
// under each picture, bottom right: animated, custom sounds, reacts to what you do
const FEATS: { key: Feature; icon: 'sparkle' | 'speaker' | 'hand'; label: string }[] = [
  { key: 'anim', icon: 'sparkle', label: 'Animated' },
  { key: 'sound', icon: 'speaker', label: 'Sound' },
  { key: 'live', icon: 'hand', label: 'Interactive' },
]
function Feats({ has, style }: { has: Feature[]; style: CSSProperties }) {
  const [told, setTold] = useState<Feature | null>(null)
  useEffect(() => { if (!told) return; const tm = setTimeout(() => setTold(null), 2000); return () => clearTimeout(tm) }, [told])
  return (
    <div className="theme-feats" style={style}>
      {told && <span key={told} className="tf-tell">{t(FEATS.find((f) => f.key === told)!.label)}</span>}
      {FEATS.filter((f) => has.includes(f.key)).map((f) => (
        <button key={f.key} className="tf" aria-label={t(f.label)} title={t(f.label)} onClick={() => setTold(f.key)}>
          <Icon name={f.icon} size="14px" strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}

// the grid lists themes cheapest first; the chips narrow it to one price level
type Sort = 'all' | 'basic' | 'premium' | 'exclusive'
const SORTS: { key: Sort; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'basic', label: 'Basic' },
  { key: 'premium', label: 'Premium' },
  { key: 'exclusive', label: 'Exclusive' },
]
const LEVEL: Record<Exclude<Sort, 'all'>, number> = { basic: 75, premium: 149, exclusive: 159 }

export default function ThemesPage({ onViewed }: { onViewed: () => void }) {
  const preview = usePreview()
  const plan = usePlan()
  const applied = useApplied()
  const ownedThemes = useOwnedThemes()
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

  // Only the theme you stop on comes to life (after a moment): the others stay still,
  // and scenes far from the centre aren't drawn at all, so swiping stays smooth.
  const [settled, setSettled] = useState(-1)
  const near = Math.abs(pos - Math.round(pos)) < 0.04
  useEffect(() => {
    setSettled(-1)
    if (!near) return
    const tm = setTimeout(() => setSettled(Math.round(pos)), 1400)
    return () => clearTimeout(tm)
  }, [near, Math.round(pos)])

  // swipe anywhere below the title (not just on the picture) to move between themes;
  // the strip itself still scrolls natively under a finger
  const drag = useRef<{ x: number; y: number; left: number; t: number; on: boolean } | null>(null)
  function swipeDown(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse' && (e.target as Element).closest('.theme-track')) return
    drag.current = { x: e.clientX, y: e.clientY, left: track.current!.scrollLeft, t: performance.now(), on: false }
  }
  function swipeMove(e: React.PointerEvent) {
    const d = drag.current, el = track.current
    if (!d || !el) return
    const dx = e.clientX - d.x
    if (!d.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - d.y)) return
      d.on = true; el.style.scrollSnapType = 'none'
      ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    }
    el.scrollLeft = d.left - dx
  }
  function swipeUp(e: React.PointerEvent) {
    const d = drag.current, el = track.current
    drag.current = null
    if (!d?.on || !el) return
    const card = el.firstElementChild as HTMLElement
    const dx = e.clientX - d.x, fast = Math.abs(dx) / (performance.now() - d.t) > 0.4
    const from = Math.round(d.left / card.offsetWidth)
    const to = fast ? from - Math.sign(dx) : Math.round(el.scrollLeft / card.offsetWidth)
    el.style.scrollSnapType = ''
    goTo(Math.max(0, Math.min(THEME_SLOTS - 1, to)))
    // a swipe that ends on a button doesn't press it
    const stop = (ev: Event) => { ev.stopPropagation(); ev.preventDefault() }
    window.addEventListener('click', stop, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 50)
  }
  const index = Math.min(THEME_SLOTS - 1, Math.max(0, Math.round(pos)))
  const theme = THEMES[index]
  const viewing = theme && preview === theme.key
  const owner = !!theme && canUseTheme(theme.key, plan)
  const bought = !!theme && ownedThemes.includes(theme.key)
  const price = '฿' + (theme ? themePrice(theme.key) : '')
  const has = (key: string) => ownedThemes.includes(key) || atLeast(plan, THEMES.find((x) => x?.key === key)?.tier ?? 'premium')
  const buy = (key: string) => { setPreview(null); sound.tap(); location.hash = 'checkout-theme-' + key }

  // all themes at once, 3 across, with a sort; tapping one jumps the big view to it
  const [grid, setGrid] = useState(false)
  const [sort, setSort] = useState<Sort>('all')
  const listed = THEMES.map((th, i) => ({ th, i })).filter((x): x is { th: NonNullable<typeof x.th>; i: number } => !!x.th)
  const sorted = [...listed]
    .filter((x) => sort === 'all' || themePrice(x.th.key) === LEVEL[sort])
    .sort((a, b) => themePrice(a.th.key) - themePrice(b.th.key))
  function pick(i: number) {
    setGrid(false)
    const el = track.current, card = el?.firstElementChild as HTMLElement | null
    if (el && card) el.scrollTo({ left: i * card.offsetWidth })
  }

  function goTo(i: number) {
    const el = track.current
    const card = el?.firstElementChild as HTMLElement | null
    if (el && card) el.scrollTo({ left: i * card.offsetWidth, behavior: 'smooth' })
  }

  return (
    <main className="page themes" aria-label={t('Themes')}>
      <header className="create-head">
        <h1>{t('Themes')}</h1>
        <span className="themes-head-btns">
          <button className="icon-btn" aria-label={t('All themes')} onClick={() => { setGrid(true); sound.tap() }}><Icon name="grid" size="21px" strokeWidth={1.9} /></button>
          <button className="icon-btn" aria-label={t('Back')} onClick={() => history.back()}><Icon name="back" size="22px" /></button>
        </span>
      </header>
      {/* every theme: buy it once and keep it, or get it free with the plan it belongs to */}
      <div className="themes-body" onPointerDown={swipeDown} onPointerMove={swipeMove} onPointerUp={swipeUp} onPointerCancel={swipeUp}>
      <p className="themes-note">{t('Buy a theme to keep forever, or get them all free with a plan.')}</p>

      <div
        className="theme-track"
        ref={track}
      >
        {THEMES.map((th, i) => {
          const d = Math.min(1.4, Math.abs(i - pos))
          return (
            <div key={i} className="theme-cell">
              <button
                className={`theme-card${th ? '' : ' empty'}${th && preview === th.key ? ' viewing' : ''}${th?.tier === 'exclusive' ? ' exclusive' : ''}`}
                style={{ transform: `scale(${1 - d * 0.16})`, opacity: 1 - d * 0.45 }}
                aria-label={th ? `${th.name} theme` : `Empty slot ${i + 1}`}
                onClick={() => goTo(i)}
              >
                {th && d < 0.5 && <TierChip tier={th.tier} />}
                {th && <span className={`price-pill${has(th.key) ? ' owned' : ''}`}>{has(th.key) ? <><Icon name="check" size="13px" strokeWidth={2.8} />{t('Owned')}</> : '฿' + themePrice(th.key)}</span>}
                {th ? (
                  <div className={`theme-art skin-${th.key}${settled === i ? '' : ' paused'}`} data-skin={th.key}>
                    {Math.abs(i - pos) < 1.6 && <ThemeScene skin={th.key} />}
                    <span className="mini-dot" style={{ left: '58%', top: '57%' }} />
                    <span className="mini-dot" style={{ left: '82%', top: '55%' }} />
                    <span className="mini-dot" style={{ left: '40%', top: '70%' }} />
                    <span className="mini-dot small" style={{ left: '20%', top: '87%' }} />
                  </div>
                ) : (
                  <div className="theme-art blank"><span>{i + 1}</span><small>{t('Coming soon')}</small></div>
                )}
                {/* soft blur at the top and bottom so the text over the picture stays readable */}
                <span className="theme-veil top" aria-hidden="true" />
                <span className="theme-veil bottom" aria-hidden="true" />
              </button>
              {th && <Feats has={th.has} style={{ transform: `scale(${1 - d * 0.16})`, opacity: 1 - d * 0.45 }} />}
            </div>
          )
        })}
      </div>

      <div className="theme-info">
        <p className="theme-count">{index + 1} / {THEME_SLOTS}</p>
        <h2>{theme ? theme.name : t('Empty slot')}</h2>
        <p className="theme-blurb">{theme ? t(theme.blurb) : t('A new theme will land here.')}</p>
        {theme && (owner ? (
          <>
            <span className="owned-tag yes"><Icon name="check" size="12px" strokeWidth={2.8} />{bought ? t('Owned') : t('Included in your plan')}</span>
            {applied === theme.key
              ? <button className="theme-view on" onClick={() => { applyTheme(null); sound.tap() }}>{t('In use · Turn off')}</button>
              : <button className="theme-view" onClick={() => { applyTheme(theme.key); sound.pop(); onViewed() }}>{t('Use')}</button>}
          </>
        ) : (
          <>
            <span className="owned-tag">{t('{price} · yours to keep', { price })}</span>
            <div className="theme-buy">
              {viewing
                ? <button className="theme-view on" onClick={() => setPreview(null)}>{t('Stop trying')}</button>
                : <button className="theme-view on" onClick={() => { setPreview(theme.key); sound.pop(); onViewed() }}>{t('Try on')}</button>}
              {canPay
                ? <button className="theme-view" onClick={() => buy(theme.key)}>{t('Get')}</button>
                : <button className="theme-view" disabled>{t('Coming soon')}</button>}
            </div>
            <button className="theme-plan-link" onClick={() => { setPreview(null); location.hash = 'plans' }}>{t('Or get it free with {plan}', { plan: theme.tier === 'exclusive' ? t('Exclusive') : t('Premium') })}</button>
          </>
        ))}
      </div>

      </div>

      {grid && (
        <div className="theme-grid-sheet" role="dialog" aria-label={t('All themes')}>
          <header className="create-head">
            <h1>{t('All themes')}</h1>
            <button className="icon-btn" aria-label={t('Close')} onClick={() => setGrid(false)}><Icon name="close" size="22px" /></button>
          </header>
          <div className="theme-sort" role="radiogroup" aria-label={t('Sort')}>
            {SORTS.map((o) => (
              <button key={o.key} role="radio" aria-checked={sort === o.key} className={sort === o.key ? 'on' : undefined} onClick={() => { setSort(o.key); sound.tap() }}>{t(o.label)}</button>
            ))}
          </div>
          <div className="theme-grid">
            {sorted.map(({ th, i }) => (
              <button key={th.key} className={`theme-tile${th.tier === 'exclusive' ? ' exclusive' : ''}${applied === th.key ? ' in-use' : ''}`} onClick={() => pick(i)}>
                <span className="tt-art">
                  <span className="theme-art paused" data-skin={th.key}>
                    <ThemeScene skin={th.key} />
                    <span className="mini-dot" style={{ left: '58%', top: '57%' }} />
                    <span className="mini-dot" style={{ left: '82%', top: '55%' }} />
                    <span className="mini-dot small" style={{ left: '20%', top: '87%' }} />
                  </span>
                </span>
                <b>{th.name}</b>
                <small>{has(th.key) ? (applied === th.key ? t('In use') : t('Owned')) : '฿' + themePrice(th.key)}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="theme-pips" aria-hidden="true">
        {THEMES.map((th, i) => <i key={i} className={`${i === index ? 'on' : ''}${th?.tier === 'exclusive' ? ' gold' : ''}`} />)}
      </div>
    </main>
  )
}
