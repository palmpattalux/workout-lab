import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/icons'
import ThemeScene from '../components/ThemeScene'
import { THEMES, THEME_SLOTS, setPreview, usePreview } from '../lib/theme'
import { sound } from '../lib/sound'

// Swipe through the theme slots like a scenery picker: the centred card is big,
// its neighbours shrink away. "View" tries the theme on without owning it.
export default function ThemesPage({ onViewed }: { onViewed: () => void }) {
  const preview = usePreview()
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

  function goTo(i: number) {
    const el = track.current
    const card = el?.firstElementChild as HTMLElement | null
    if (el && card) el.scrollTo({ left: i * card.offsetWidth, behavior: 'smooth' })
  }

  return (
    <main className="page themes" aria-label="Themes">
      <header className="create-head">
        <h1>Themes</h1>
        <button className="icon-btn" aria-label="Back" onClick={() => history.back()}><Icon name="back" size="22px" /></button>
      </header>

      <div
        className="theme-track"
        ref={track}
        onPointerDown={(e) => { if (e.pointerType === 'mouse') drag.current = { x: e.clientX, left: track.current!.scrollLeft } }}
        onPointerMove={(e) => { if (drag.current) track.current!.scrollLeft = drag.current.left - (e.clientX - drag.current.x) }}
        onPointerUp={() => { if (drag.current) { drag.current = null; goTo(Math.round(pos)) } }}
        onPointerLeave={() => { if (drag.current) { drag.current = null; goTo(Math.round(pos)) } }}
      >
        {THEMES.map((t, i) => {
          const d = Math.min(1.4, Math.abs(i - pos))
          return (
            <div key={i} className="theme-cell">
              <button
                className={`theme-card${t ? '' : ' empty'}${t && preview === t.key ? ' viewing' : ''}`}
                style={{ transform: `scale(${1 - d * 0.16})`, opacity: 1 - d * 0.45 }}
                aria-label={t ? `${t.name} theme` : `Empty slot ${i + 1}`}
                onClick={() => goTo(i)}
              >
                {t ? (
                  <div className={`theme-art skin-${t.key}`} data-skin={t.key}>
                    <ThemeScene skin={t.key} />
                    <span className="mini-dot" style={{ left: '58%', top: '57%' }} />
                    <span className="mini-dot" style={{ left: '82%', top: '55%' }} />
                    <span className="mini-dot" style={{ left: '40%', top: '70%' }} />
                    <span className="mini-dot small" style={{ left: '20%', top: '87%' }} />
                  </div>
                ) : (
                  <div className="theme-art blank"><span>{i + 1}</span><small>Coming soon</small></div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="theme-info">
        <p className="theme-count">{index + 1} / {THEME_SLOTS}</p>
        <h2>{theme ? theme.name : 'Empty slot'}</h2>
        <p className="theme-blurb">{theme ? theme.blurb : 'A new theme will land here.'}</p>
        {theme && (
          <>
            <span className="owned-tag">Not owned</span>
            {viewing
              ? <button className="theme-view on" onClick={() => setPreview(null)}>Stop viewing</button>
              : <button className="theme-view" onClick={() => { setPreview(theme.key); sound.pop(); onViewed() }}>View</button>}
          </>
        )}
      </div>

      <div className="theme-pips" aria-hidden="true">
        {THEMES.map((_, i) => <i key={i} className={i === index ? 'on' : undefined} />)}
      </div>
    </main>
  )
}
