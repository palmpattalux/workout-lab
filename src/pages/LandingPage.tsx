import { useEffect, useState } from 'react'
import { Icon } from '../components/icons'
import ThemeScene from '../components/ThemeScene'
import { TierChip } from '../components/TierChip'
import { THEMES, THEME_PRICE, type Theme, type Feature } from '../lib/theme'
import { PLANS } from '../lib/plan'
import { usePrefs, setPrefs } from '../lib/prefs'
import { LANGS, t } from '../lib/i18n'

// dotset.app on a computer: Dotset is a phone app, so the desktop site is a calm shop window.
// Its job is the themes (and plans) at the best price; phones never see this page.
// Store prices are about 20% higher (Apple and Google take a cut), so the website is cheapest.
const APP_PRICE: Record<string, number> = { theme: 179, premium: 179, exclusive: 399 }
const themes = THEMES.filter((x): x is Theme => !!x)
const FEATS: { key: Feature; icon: 'sparkle' | 'speaker' | 'hand'; label: string }[] = [
  { key: 'anim', icon: 'sparkle', label: 'Animated' },
  { key: 'sound', icon: 'speaker', label: 'Custom sounds' },
  { key: 'live', icon: 'hand', label: 'Interactive' },
]

// Leave the landing page for a screen of the app (checkout, plans, log in); back comes here again.
const open = (hash: string) => { location.hash = hash }

// A phone-shaped picture of the home screen in a theme: the scene plus a few workout dots.
function Phone({ skin, still }: { skin: string; still?: boolean }) {
  return (
    <div className={`theme-art skin-${skin}${still ? ' paused' : ''}`} data-skin={skin}>
      <ThemeScene skin={skin} />
      <span className="mini-dot" style={{ left: '58%', top: '57%' }} />
      <span className="mini-dot" style={{ left: '82%', top: '55%' }} />
      <span className="mini-dot" style={{ left: '40%', top: '70%' }} />
      <span className="mini-dot small" style={{ left: '20%', top: '87%' }} />
    </div>
  )
}

function Wordmark() {
  return <span className="ld-word" aria-label="Dotset">D<i aria-hidden="true" />tset</span>
}

export default function LandingPage({ onOpenApp }: { onOpenApp: () => void }) {
  const prefs = usePrefs()
  // the hero phone shows each theme in turn
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setShown((n) => (n + 1) % themes.length), 6000)
    return () => clearInterval(iv)
  }, [])
  const dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  const price = '฿' + THEME_PRICE

  return (
    <div className="landing">
      <header className="ld-top">
        <Wordmark />
        <nav>
          <a href="#ld-themes" onClick={(e) => { e.preventDefault(); document.getElementById('ld-themes')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('Themes')}</a>
          <a href="#ld-plans" onClick={(e) => { e.preventDefault(); document.getElementById('ld-plans')?.scrollIntoView({ behavior: 'smooth' }) }}>{t('Plans')}</a>
          <button className="ld-link" onClick={() => open('login')}>{t('Log in')}</button>
          <button className="ld-btn ghost" onClick={onOpenApp}>{t('Open Dotset')}</button>
        </nav>
      </header>

      <section className="ld-hero">
        <div className="ld-copy">
          <span className="ld-badge"><i />{t('Best price, only on dotset.app')}</span>
          <h1>{t('Simple workouts.')}<br /><em>{t('Beautiful themes.')}</em></h1>
          <p>{t('Dotset is a calm workout tracker for your phone. Tap a dot, log your set, done. Get your themes here, for less than in the app.')}</p>
          <div className="ld-cta">
            <button className="ld-btn" onClick={() => document.getElementById('ld-themes')?.scrollIntoView({ behavior: 'smooth' })}>{t('See the themes')}</button>
            <span className="ld-from">{t('From {price}, yours to keep', { price })}</span>
          </div>
        </div>
        <div className="ld-stage" aria-hidden="true">
          <div className="ld-phone">
            {themes.map((th, i) => (
              <div key={th.key} className={`ld-screen${i === shown ? ' on' : ''}`}>{Math.abs(i - shown) <= 1 || (shown === 0 && i === themes.length - 1) ? <Phone skin={th.key} still={i !== shown} /> : null}</div>
            ))}
            <span className="ld-notch" />
          </div>
          <p className="ld-caption">{themes[shown].name}</p>
        </div>
      </section>

      <section className="ld-values">
        <div><h3>{t('Simple')}</h3><p>{t('One dot per exercise. No menus to dig through, nothing in your way.')}</p></div>
        <div><h3>{t('Convenient')}</h3><p>{t('Buy here, then log in on your phone. It is already there.')}</p></div>
        <div><h3>{t('Best price')}</h3><p>{t('No app store cut, so everything costs less on the website.')}</p></div>
      </section>

      <section className="ld-themes" id="ld-themes">
        <div className="ld-head">
          <h2>{t('Themes')}</h2>
          <p>{t('Each one changes the whole app: colours, scenery and motion. Buy once, keep it forever.')}</p>
          <div className="ld-mode" role="group" aria-label={t('Appearance')}>
            <button className={!dark ? 'on' : ''} onClick={() => setPrefs({ theme: 'light' })}>{t('Day')}</button>
            <button className={dark ? 'on' : ''} onClick={() => setPrefs({ theme: 'dark' })}>{t('Night')}</button>
          </div>
        </div>
        <div className="ld-grid">
          {themes.map((th) => (
            <article key={th.key} className={`ld-card${th.tier === 'exclusive' ? ' exclusive' : ''}`}>
              <div className="ld-art">
                <Phone skin={th.key} />
                <TierChip tier={th.tier} />
              </div>
              <div className="ld-info">
                <div className="ld-name">
                  <h3>{th.name}</h3>
                  <span className="ld-feats">
                    {FEATS.filter((f) => th.has.includes(f.key)).map((f) => <span key={f.key} title={t(f.label)} aria-label={t(f.label)}><Icon name={f.icon} size="15px" strokeWidth={2} /></span>)}
                  </span>
                </div>
                <p>{t(th.blurb)}</p>
                <div className="ld-buy">
                  <button className="ld-btn" onClick={() => open('checkout-theme-' + th.key)}>{t('Get {price}', { price })}</button>
                  <span className="ld-was">{t('In the app {price}', { price: '฿' + APP_PRICE.theme })}</span>
                </div>
              </div>
            </article>
          ))}
          <article className="ld-card soon">
            <div className="ld-art blank"><span>+</span></div>
            <div className="ld-info"><h3>{t('More on the way')}</h3><p>{t('New themes land regularly. Exclusive members get them all.')}</p></div>
          </article>
        </div>
      </section>

      <section className="ld-plans" id="ld-plans">
        <div className="ld-head">
          <h2>{t('Or get every theme with a plan')}</h2>
          <p>{t('A plan unlocks all the themes and every feature. Cancel any time, and your data always stays yours.')}</p>
        </div>
        <div className="ld-plan-row">
          {PLANS.filter((p) => p.tier !== 'unlimited').map((p) => (
            <div key={p.tier} className={`ld-plan ${p.tier}`}>
              <h3>{t(p.name)}</h3>
              <p className="ld-price"><b>฿{p.price}</b><small>{t('/ month')}</small></p>
              <p className="ld-was">{t('In the app {price}', { price: '฿' + APP_PRICE[p.tier] })}</p>
              <ul>{p.perks.map((k) => <li key={k}><Icon name="check" size="15px" strokeWidth={2.6} />{t(k)}</li>)}</ul>
              <button className="ld-btn" onClick={() => open('checkout-' + p.tier)}>{t('Get {plan}', { plan: t(p.name) })}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="ld-how">
        <h2>{t('How it works')}</h2>
        <ol>
          <li><b>1</b><span>{t('Log in or make an account here.')}</span></li>
          <li><b>2</b><span>{t('Get a theme or a plan.')}</span></li>
          <li><b>3</b><span>{t('Open Dotset on your phone with the same account. It is all there.')}</span></li>
        </ol>
      </section>

      <footer className="ld-foot">
        <Wordmark />
        <span>{t('Coming soon to the App Store and Google Play.')}</span>
        <select value={prefs.lang} onChange={(e) => setPrefs({ lang: e.target.value as typeof prefs.lang })} aria-label={t('Language')}>
          {LANGS.map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}
        </select>
        <button className="ld-link" onClick={() => open('licenses')}>{t('Open-source licences')}</button>
      </footer>
    </div>
  )
}
