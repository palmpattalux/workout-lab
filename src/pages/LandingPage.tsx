import { useEffect, useState } from 'react'
import { Icon } from '../components/icons'
import ThemeScene from '../components/ThemeScene'
import { THEMES, type Theme, type Feature } from '../lib/theme'
import { usePrefs, setPrefs } from '../lib/prefs'
import { LANGS, t } from '../lib/i18n'
import { LEGAL } from '../legal/info'

// dotset.app on a computer: Dotset is a phone app, so the desktop site introduces it.
// A first-time visitor should get how it works in a glance (real screens, three steps), then see
// the themes. No prices or selling here for now (store review period). Phones never see this page.
const themes = THEMES.filter((x): x is Theme => !!x)
const FEATS: { key: Feature; icon: 'sparkle' | 'speaker' | 'hand'; label: string }[] = [
  { key: 'anim', icon: 'sparkle', label: 'Animated' },
  { key: 'sound', icon: 'speaker', label: 'Custom sounds' },
  { key: 'live', icon: 'hand', label: 'Interactive' },
]
// screenshots of the real app (public/landing/<shot>-<light|dark>.webp)
const STEPS = [
  { shot: 'home', title: 'Add your exercises', text: 'Tap + and give each exercise a name and an icon. It becomes a dot on your home screen.' },
  { shot: 'log', title: 'Tap a dot, log your sets', text: 'Weight and reps sit right under your thumb. The arrows move to the next set.' },
  { shot: 'book', title: 'Look back anytime', text: 'Every set is saved in your book, so you always know what you lifted last time.' },
]

// Leave the landing page for a screen of the app (log in, policies); back comes here again.
const open = (hash: string) => { location.hash = hash }
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

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

  return (
    <div className="landing">
      <header className="ld-top">
        <Wordmark />
        <nav>
          <a href="#ld-how" onClick={(e) => { e.preventDefault(); scrollTo('ld-how') }}>{t('How it works')}</a>
          <a href="#ld-themes" onClick={(e) => { e.preventDefault(); scrollTo('ld-themes') }}>{t('Themes')}</a>
          <div className="ld-mode" role="group" aria-label={t('Appearance')}>
            <button className={!dark ? 'on' : ''} onClick={() => setPrefs({ theme: 'light' })}>{t('Day')}</button>
            <button className={dark ? 'on' : ''} onClick={() => setPrefs({ theme: 'dark' })}>{t('Night')}</button>
          </div>
          <button className="ld-btn ghost" onClick={onOpenApp}>{t('Open Dotset')}</button>
        </nav>
      </header>

      <section className="ld-hero">
        <div className="ld-copy">
          <span className="ld-badge"><i />{t('Coming soon to the App Store and Google Play.')}</span>
          <h1>{t('Simple workouts.')}<br /><em>{t('Beautiful themes.')}</em></h1>
          <p>{t('Dotset is a calm workout tracker for your phone. Tap a dot, log your set, done. No clutter and no ads, just your training.')}</p>
          <div className="ld-cta">
            <button className="ld-btn" onClick={() => scrollTo('ld-how')}>{t('See how it works')}</button>
            <button className="ld-link ld-try" onClick={onOpenApp}>{t('Try it in your browser')}</button>
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

      <section className="ld-how" id="ld-how">
        <div className="ld-head">
          <h2>{t('How it works')}</h2>
          <p>{t('Three steps, and you are training.')}</p>
        </div>
        <ol className="ld-steps">
          {STEPS.map((s, i) => (
            <li key={s.shot}>
              <div className="ld-shot"><img src={`landing/${s.shot}-${dark ? 'dark' : 'light'}.webp`} alt="" loading="lazy" width="585" height="1266" /></div>
              <div className="ld-step-text">
                <b>{i + 1}</b>
                <h3>{t(s.title)}</h3>
                <p>{t(s.text)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ld-values">
        <div><h3>{t('Simple')}</h3><p>{t('One dot per exercise. No menus to dig through, nothing in your way.')}</p></div>
        <div><h3>{t('Made for one hand')}</h3><p>{t('Everything sits within reach of your thumb, even in the middle of a set.')}</p></div>
        <div><h3>{t('Private')}</h3><p>{t('No ads and no tracking. Delete your account and your data anytime.')}</p></div>
      </section>

      <section className="ld-themes" id="ld-themes">
        <div className="ld-head">
          <h2>{t('Make it yours')}</h2>
          <p>{t('A theme changes the whole app: colours, scenery, motion and sound. Try any of them on in the app.')}</p>
        </div>
        <div className="ld-grid">
          {themes.map((th) => (
            <article key={th.key} className={`ld-card${th.tier === 'exclusive' ? ' exclusive' : ''}`}>
              <div className="ld-art"><Phone skin={th.key} /></div>
              <div className="ld-info">
                <div className="ld-name">
                  <h3>{th.name}</h3>
                  <span className="ld-feats">
                    {FEATS.filter((f) => th.has.includes(f.key)).map((f) => <span key={f.key} title={t(f.label)} aria-label={t(f.label)}><Icon name={f.icon} size="15px" strokeWidth={2} /></span>)}
                  </span>
                </div>
                <p>{t(th.blurb)}</p>
              </div>
            </article>
          ))}
          <article className="ld-card soon">
            <div className="ld-art blank"><span>+</span></div>
            <div className="ld-info"><h3>{t('More on the way')}</h3><p>{t('New themes arrive regularly.')}</p></div>
          </article>
        </div>
      </section>

      <section className="ld-end">
        <h2>{t('Start with one dot.')}</h2>
        <p>{t('Dotset is free to use. Coming soon to the App Store and Google Play.')}</p>
        <button className="ld-btn" onClick={onOpenApp}>{t('Try it in your browser')}</button>
      </section>

      <footer className="ld-foot">
        <Wordmark />
        <select value={prefs.lang} onChange={(e) => setPrefs({ lang: e.target.value as typeof prefs.lang })} aria-label={t('Language')}>
          {LANGS.map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}
        </select>
        <button className="ld-link" onClick={() => open('login')}>{t('Log in')}</button>
        <a href="/terms" onClick={(e) => { e.preventDefault(); open('terms') }}>{t('Terms')}</a>
        <a href="/privacy" onClick={(e) => { e.preventDefault(); open('privacy') }}>{t('Privacy')}</a>
        <a href="/refunds" onClick={(e) => { e.preventDefault(); open('refunds') }}>{t('Refunds')}</a>
        <button className="ld-link" onClick={() => open('licenses')}>{t('Open-source licences')}</button>
      </footer>
      <p className="ld-contact">
        {prefs.lang === 'th' ? LEGAL.ownerTh : LEGAL.owner} · {prefs.lang === 'th' ? LEGAL.addressTh : LEGAL.address} · <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        {LEGAL.phone && <> · <a href={`tel:${LEGAL.phone.replace(/\s/g, '')}`}>{LEGAL.phone}</a></>}
      </p>
    </div>
  )
}
