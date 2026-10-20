import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Icon } from '../components/icons'
import ThemeScene from '../components/ThemeScene'
import DemoPhone, { DEMOS } from '../components/DemoPhone'
import DesktopCreate from '../components/DesktopCreate'
import ViewPage from './ViewPage'
import { THEMES, THEME_PRICE, canUseTheme, ownsTheme, useOwnedThemes, type Theme, type Feature } from '../lib/theme'
import { PLANS, FREE_WORKOUTS, FREE_SETS, usePlan, tierName } from '../lib/plan'
import { useSubscription } from '../lib/billing'
import { signOut, type AppUser } from '../lib/auth'
import { usePrefs, setPrefs } from '../lib/prefs'
import { LANGS, t, locale } from '../lib/i18n'
import { LEGAL } from '../legal/info'

// dotset.app on a computer. Dotset is logged on the phone, so the desktop site never shows the
// phone app. People come here for three things:
//  1. new: what Dotset is, how it works (animated real screens), and making a first exercise
//     that then waits for them in the phone app
//  2. regulars: View, their progress on a big screen (ViewPage)
//  3. buyers: themes and plans at the website price (cheaper than in the store apps)
// Phones never see these pages.
const themes = THEMES.filter((x): x is Theme => !!x)
const APP_PRICE: Record<string, number> = { theme: 179, premium: 179, exclusive: 399 }
const FEATS: { key: Feature; icon: 'sparkle' | 'speaker' | 'hand'; label: string }[] = [
  { key: 'anim', icon: 'sparkle', label: 'Animated' },
  { key: 'sound', icon: 'speaker', label: 'Custom sounds' },
  { key: 'live', icon: 'hand', label: 'Interactive' },
]

const open = (hash: string) => { location.hash = hash }
// sections live on the landing page: from another desktop page, go there first, then scroll
function toSection(id: string) {
  if (location.hash) { location.hash = ''; setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60) }
  else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

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

export const useDark = () => {
  const prefs = usePrefs()
  return prefs.theme === 'dark' || (prefs.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
}

// The top bar on every desktop page: View on the left, the rest on the right.
// ("View" in English; other languages say "Your progress", since their word for View means a preview)
function TopBar({ user, here }: { user: AppUser | null | undefined; here: 'home' | 'view' | 'other' }) {
  const dark = useDark()
  return (
    <header className="ld-top">
      <div className="ld-left">
        <button className="ld-link ld-home" onClick={() => open('')} aria-label={t('Home')}><Wordmark /></button>
        <button className={`ld-view${here === 'view' ? ' on' : ''}`} onClick={() => open('view')}><Icon name="book" size="18px" strokeWidth={2} />{usePrefs().lang === 'en' ? 'View' : t('Your progress')}</button>
      </div>
      <nav>
        <a href="#ld-how" onClick={(e) => { e.preventDefault(); toSection('ld-how') }}>{t('How it works')}</a>
        <a href="#ld-plans" onClick={(e) => { e.preventDefault(); toSection('ld-plans') }}>{t('Plans')}</a>
        <a href="#ld-themes" onClick={(e) => { e.preventDefault(); toSection('ld-themes') }}>{t('Themes')}</a>
        <div className="ld-mode" role="group" aria-label={t('Appearance')}>
          <button className={!dark ? 'on' : ''} onClick={() => setPrefs({ theme: 'light' })}>{t('Day')}</button>
          <button className={dark ? 'on' : ''} onClick={() => setPrefs({ theme: 'dark' })}>{t('Night')}</button>
        </div>
        {user
          ? <span className="ld-me"><span className="ld-email">{user.email}</span><button className="ld-btn ghost" onClick={() => signOut()}>{t('Log out')}</button></span>
          : user === null && <span className="ld-me"><button className="ld-link" onClick={() => open('signup')}>{t('Sign up')}</button><button className="ld-btn" onClick={() => open('login')}>{t('Log in')}</button></span>}
      </nav>
    </header>
  )
}

function Footer() {
  const prefs = usePrefs()
  return (
    <>
      <footer className="ld-foot">
        <Wordmark />
        <select value={prefs.lang} onChange={(e) => setPrefs({ lang: e.target.value as typeof prefs.lang })} aria-label={t('Language')}>
          {LANGS.map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}
        </select>
        <a href="/terms" onClick={(e) => { e.preventDefault(); open('terms') }}>{t('Terms')}</a>
        <a href="/privacy" onClick={(e) => { e.preventDefault(); open('privacy') }}>{t('Privacy')}</a>
        <a href="/refunds" onClick={(e) => { e.preventDefault(); open('refunds') }}>{t('Refunds')}</a>
        <button className="ld-link" onClick={() => open('licenses')}>{t('Open-source licences')}</button>
      </footer>
      <p className="ld-contact">
        {prefs.lang === 'th' ? LEGAL.ownerTh : LEGAL.owner} · {prefs.lang === 'th' ? LEGAL.addressTh : LEGAL.address} · <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        {LEGAL.phone && <> · <a href={`tel:${LEGAL.phone.replace(/\s/g, '')}`}>{LEGAL.phone}</a></>}
      </p>
    </>
  )
}

// Any desktop page: the top bar, the page, the footer. App screens that also open on a computer
// (log in, checkout, payment, policies) sit in a card in the middle instead of filling the window.
export function DesktopFrame({ user, here = 'other', card, children }: { user: AppUser | null | undefined; here?: 'home' | 'view' | 'other'; card?: boolean; children: ReactNode }) {
  return (
    <div className="landing">
      <TopBar user={user} here={here} />
      {card ? <div className="dk-card-wrap"><div className="dk-card">{children}</div></div> : children}
      <Footer />
    </div>
  )
}

export function DesktopView({ user }: { user: AppUser | null | undefined }) {
  return <DesktopFrame user={user} here="view"><ViewPage signedIn={!!user} /></DesktopFrame>
}

export default function LandingPage({ user }: { user: AppUser | null | undefined }) {
  const dark = useDark()
  // the hero phone shows each theme in turn
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setShown((n) => (n + 1) % themes.length), 6000)
    return () => clearInterval(iv)
  }, [])
  const [demo, setDemo] = useState(0)
  const nextDemo = useCallback(() => setDemo((d) => (d + 1) % DEMOS.length), [])
  const plan = usePlan()
  const sub = useSubscription()
  useOwnedThemes() // re-render when purchases load
  const price = '฿' + THEME_PRICE

  return (
    <DesktopFrame user={user} here="home">
      <section className="ld-hero">
        <div className="ld-copy">
          <span className="ld-badge"><i />{t('Coming soon to the App Store and Google Play.')}</span>
          <h1>{t('Simple logging.')}<br /><em>{t('Zero friction.')}</em></h1>
          <p>{t("Logging a set should take less effort than lifting it. Dotset keeps only what matters: a few buttons, right where your thumb rests. Every set is sorted for you, so after a long day you can stay focused on training and see your whole journey clearly.")}</p>
          <div className="ld-cta">
            <button className="ld-btn" onClick={() => toSection('ld-how')}>{t('See how it works')}</button>
            <button className="ld-link ld-try" onClick={() => toSection('ld-try')}>{t('Create your first exercise')}</button>
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
        <div><h3>{t('Fewer buttons')}</h3><p>{t('Only what you need in the middle of a set. Every extra button is one more thing to think about.')}</p></div>
        <div><h3>{t('Natural hand placement')}</h3><p>{t('Everything sits where your thumb already rests, so you log without looking for anything.')}</p></div>
        <div><h3>{t('Sorts itself')}</h3><p>{t('Every set is filed by exercise and date for you. Your progress is measured, not guessed.')}</p></div>
      </section>

      <section className="ld-how" id="ld-how">
        <div className="ld-head">
          <h2>{t('How it works')}</h2>
          <p>{t('Three things to learn, and you are training.')}</p>
        </div>
        <div className="ld-demo">
          <DemoPhone demo={demo} dark={dark} onEnd={nextDemo} />
          <ol className="ld-demo-steps">
            {DEMOS.map((d, i) => (
              <li key={d.title}>
                <button className={i === demo ? 'on' : undefined} onClick={() => setDemo(i)} aria-pressed={i === demo}>
                  <b>{i + 1}</b>
                  <span><strong>{t(d.title)}</strong><em>{t(d.text)}</em></span>
                  {i === demo && <i key={demo} className="ld-demo-bar" style={{ animationDuration: `${d.frames.reduce((n, f) => n + f.ms, 0)}ms` }} />}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ld-make" id="ld-try">
        <div className="ld-head">
          <h2>{t('Create your first exercise')}</h2>
          <p>{t('Set it up here on your computer. It waits for you in the phone app, ready for your next session.')}</p>
        </div>
        <DesktopCreate signedIn={!!user} />
      </section>

      <section className="ld-plans" id="ld-plans">
        <div className="ld-head">
          <h2>{t('Plans')}</h2>
          <p>{t('Start free. Plans cost less here than in the app, because there is no app store cut.')}</p>
        </div>
        <div className="ld-plan-row">
          <div className={`ld-plan free${plan === 'free' && user ? ' mine' : ''}`}>
            <h3>{t('Free')}</h3>
            <p className="ld-price"><b>฿0</b></p>
            <p className="ld-was">&nbsp;</p>
            <ul>
              <li><Icon name="check" size="16px" strokeWidth={2.6} />{t('Up to {n} exercises', { n: FREE_WORKOUTS })}</li>
              <li><Icon name="check" size="16px" strokeWidth={2.6} />{t('Up to {n} sets per exercise', { n: FREE_SETS })}</li>
              <li><Icon name="check" size="16px" strokeWidth={2.6} />{t('Notes and your full history')}</li>
            </ul>
            {plan === 'free' && user && <span className="ld-mine">{t('Your plan')}</span>}
          </div>
          {PLANS.filter((p) => p.perks.length).map((p) => {
            const mine = plan === p.tier
            return (
              <div key={p.tier} className={`ld-plan ${p.tier}${mine ? ' mine' : ''}`}>
                <h3>{t(p.name)}</h3>
                <p className="ld-price"><b>฿{p.price}</b><small>{t('/ month')}</small></p>
                <p className="ld-was">{t('In the app {price}', { price: '฿' + APP_PRICE[p.tier] })}</p>
                <ul>{p.perks.map((perk) => <li key={perk}><Icon name="check" size="16px" strokeWidth={2.6} />{t(perk)}</li>)}</ul>
                {mine && sub && <p className="ld-renew">{sub.renews ? t('Renews {date}', { date: new Date(sub.paid_until).toLocaleDateString(locale()) }) : t('Paid until {date}', { date: new Date(sub.paid_until).toLocaleDateString(locale()) })}</p>}
                <button className={`ld-btn${mine ? ' ghost' : ''}`} onClick={() => open('checkout-' + p.tier)}>
                  {mine ? (sub && !sub.renews ? t('Renew') : t('Your plan')) : t('Get {plan}', { plan: t(p.name) })}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="ld-themes" id="ld-themes">
        <div className="ld-head">
          <h2>{t('Make it yours')}</h2>
          <p>{t('A theme changes the whole app: colours, scenery, motion and sound. Buy one once and keep it, or get them all with a plan.')}</p>
        </div>
        <div className="ld-grid">
          {themes.map((th) => {
            const have = canUseTheme(th.key)
            return (
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
                  <div className="ld-buy">
                    {have
                      ? <span className="ld-owned"><Icon name="check" size="15px" strokeWidth={2.6} />{ownsTheme(th.key) ? t('Owned') : t('Included in your plan')}</span>
                      : <>
                        <button className="ld-btn" onClick={() => open('checkout-theme-' + th.key)}>{t('Get {price}', { price })}</button>
                        <span className="ld-was">{t('In the app {price}', { price: '฿' + APP_PRICE.theme })}</span>
                      </>}
                  </div>
                  {!have && <p className="ld-free-with">{t('Free with {plan}', { plan: tierName(th.tier) })}</p>}
                </div>
              </article>
            )
          })}
          <article className="ld-card soon">
            <div className="ld-art blank"><span>+</span></div>
            <div className="ld-info"><h3>{t('More on the way')}</h3><p>{t('New themes arrive regularly.')}</p></div>
          </article>
        </div>
      </section>

      <section className="ld-end">
        <h2>{t('Start with one dot.')}</h2>
        <p>{t('Dotset is free to start. Coming soon to the App Store and Google Play.')}</p>
        <button className="ld-btn" onClick={() => toSection('ld-try')}>{t('Create your first exercise')}</button>
      </section>
    </DesktopFrame>
  )
}
