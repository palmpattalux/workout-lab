import { useEffect, useState } from 'react'
import PageA from './pages/PageA'
import PageB from './pages/PageB'
import CreatePage from './pages/CreatePage'
import BookPage from './pages/BookPage'
import SummaryPage from './pages/SummaryPage'
import LoginPage, { NewPasswordPage } from './pages/LoginPage'
import ThemesPage from './pages/ThemesPage'
import PreviewBar from './components/PreviewBar'
import LockNote from './components/LockNote'
import PlansPage from './pages/PlansPage'
import NotePage from './pages/NotePage'
import WeekPage from './pages/WeekPage'
import { useWorkouts, setScope } from './lib/store'
import { supabase, useUser, useRecovering, arrivedFromEmailLink } from './lib/auth'
import { switchTo } from './lib/session'
import { getPreview } from './lib/theme'
import { checkOwnerEmail, getPlan, atLeast, FREE_WORKOUTS } from './lib/plan'
import { usePrefs } from './lib/prefs'
import { t } from './lib/i18n'

// Every screen is swapped in memory, so nothing reloads and switching is instant.
// The hash only mirrors where you are so the back gesture works.
//   ""          page A
//   b-<key>     page B for a workout (or an empty dot)
//   new         create page (only while a draft exists)
//   edit-<id>   edit page for a workout
//   summary-<id> the summary shown right after a session ends
//   themes      themes gallery (gear > Themes)
//   login, signup  log in / sign up (anyone not signed in can use the app as a guest first)
//   save        sign up after a guest's first session: "Sign in to save your workout"
//   plans       subscription plans (gear > Plan)
//   note-<id>   one note (page B Notes, Book > Notes)
//   week        weekly summary (Book > This week, Exclusive)
//   book        book list, book-<id> one workout, sessions = all sessions,
//               presets = preset list, preset-<id> one preset's sessions, notes = all notes
function go(hash: string) {
  location.hash = hash
}

export default function App() {
  usePrefs() // re-render everything when the language changes
  return <><PreviewBar /><Screen /><LockNote /></>
}

function Screen() {
  const [hash, setHash] = useState(() => location.hash.slice(1))
  const [draft, setDraft] = useState<{ icon: string; letter: string } | null>(null)
  const workouts = useWorkouts()
  const user = useUser()
  const recovering = useRecovering()

  // load the signed-in person's data (or this browser's, where there are no accounts)
  useEffect(() => {
    // signed out = guest: the app works on this browser's own copy until they sign up
    if (user !== undefined) setScope(user?.id ?? null)
    if (user && ['login', 'signup', 'save'].includes(location.hash.slice(1))) location.replace('#')
    // device accounts can't prove an email, so only online accounts are checked for ownership
    if (supabase && user !== undefined) checkOwnerEmail(user?.email)
  }, [user])

  useEffect(() => {
    const onHash = () => setHash(location.hash.slice(1))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (user === undefined) return <main className="page" aria-busy="true" />
  if (!user && (hash === 'login' || hash === 'signup' || hash === 'save' || arrivedFromEmailLink)) {
    return <LoginPage key={hash} start={hash === 'login' ? 'login' : hash ? 'signup' : undefined} note={hash === 'save' ? t('Sign in to save your workout') : undefined} />
  }
  if (recovering) return <NewPasswordPage />
  const guest = !user

  if (hash === 'plans') return <PlansPage />
  if (hash.startsWith('note-')) return <NotePage key={hash} id={hash.slice(5)} workouts={workouts} />
  if (hash === 'week') return <WeekPage workouts={workouts} />
  if (hash === 'themes') return <ThemesPage onViewed={() => location.replace('#')} />
  if (hash.startsWith('b-')) {
    const key = hash.slice(2)
    return <PageB key={key} guest={guest} workout={workouts.find((w) => w.id === key) ?? null} workouts={workouts} onGo={(id) => location.replace('#b-' + id)} onHome={() => go('')} onEnded={(sid) => location.replace(guest ? '#save' : '#summary-' + sid)} />
  }
  if (hash.startsWith('summary-')) {
    return <SummaryPage key={hash} id={hash.slice(8)} workouts={workouts} onDone={() => location.replace('#')} />
  }
  if (hash === 'new' && draft && (atLeast(getPlan(), 'premium') || workouts.length < FREE_WORKOUTS)) {
    return (
      <CreatePage
        icon={draft.icon}
        letter={draft.letter}
        onClose={() => { setDraft(null); history.back() }}
      />
    )
  }
  if (hash.startsWith('edit-')) {
    const w = workouts.find((x) => x.id === hash.slice(5))
    if (w) return <CreatePage key={w.id} editing={w} icon={w.icon} letter={w.letter} onClose={() => history.back()} />
  }
  if (hash === 'book' || hash === 'sessions' || hash === 'presets' || hash === 'notes' || hash.startsWith('book-') || hash.startsWith('preset-')) {
    return (
      <BookPage
        workouts={workouts}
        view={hash === 'sessions' ? 'sessions' : hash === 'notes' ? 'notes' : hash === 'presets' || hash.startsWith('preset-') ? 'presets' : 'exercises'}
        openId={hash.startsWith('book-') ? hash.slice(5) : null}
        presetId={hash.startsWith('preset-') ? hash.slice(7) : null}
        onOpen={(id) => go('book-' + id)}
        onOpenPreset={(id) => go('preset-' + id)}
        onView={(v) => location.replace(v === 'exercises' ? '#book' : '#' + v)}
      />
    )
  }
  return (
    <PageA
      guest={guest}
      workouts={workouts}
      onOpenDot={(id) => { if (!getPreview()) switchTo(id); go('b-' + id) }}
      onStartPreset={(id, preset) => { if (!getPreview()) switchTo(id, preset); go('b-' + id) }}
      onEdit={(id) => go('edit-' + id)}
      onOpenBook={() => go('book')}
      onThemes={() => go('themes')}
      onPlans={() => go('plans')}
      onCreate={(icon, letter) => { setDraft({ icon, letter }); go('new') }}
    />
  )
}
