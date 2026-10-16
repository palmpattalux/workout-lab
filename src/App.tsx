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
import { useWorkouts, setScope } from './lib/store'
import { supabase, useUser, useRecovering } from './lib/auth'
import { switchTo } from './lib/session'
import { getPreview } from './lib/theme'
import { checkOwnerEmail, getPlan, atLeast, FREE_WORKOUTS } from './lib/plan'
import { usePrefs } from './lib/prefs'

// Every screen is swapped in memory, so nothing reloads and switching is instant.
// The hash only mirrors where you are so the back gesture works.
//   ""          page A
//   b-<key>     page B for a workout (or an empty dot)
//   new         create page (only while a draft exists)
//   edit-<id>   edit page for a workout
//   summary-<id> the summary shown right after a session ends
//   themes      themes gallery (gear > Themes)
//   plans       subscription plans (gear > Plan)
//   book        book list, book-<id> one workout, sessions = all sessions
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
    if (user) setScope(user.id)
    // device accounts can't prove an email, so only online accounts are checked for ownership
    if (supabase && user !== undefined) checkOwnerEmail(user?.email)
  }, [user])

  useEffect(() => {
    const onHash = () => setHash(location.hash.slice(1))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (user === undefined) return <main className="page" aria-busy="true" />
  if (!user) return <LoginPage />
  if (recovering) return <NewPasswordPage />

  if (hash === 'plans') return <PlansPage />
  if (hash === 'themes') return <ThemesPage onViewed={() => location.replace('#')} />
  if (hash.startsWith('b-')) {
    const key = hash.slice(2)
    return <PageB key={key} workout={workouts.find((w) => w.id === key) ?? null} workouts={workouts} onGo={(id) => location.replace('#b-' + id)} onHome={() => go('')} onEnded={(sid) => location.replace('#summary-' + sid)} />
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
  if (hash === 'book' || hash === 'sessions' || hash.startsWith('book-')) {
    return (
      <BookPage
        workouts={workouts}
        view={hash === 'sessions' ? 'sessions' : 'exercises'}
        openId={hash.startsWith('book-') ? hash.slice(5) : null}
        onOpen={(id) => go('book-' + id)}
        onView={(v) => location.replace(v === 'sessions' ? '#sessions' : '#book')}
      />
    )
  }
  return (
    <PageA
      workouts={workouts}
      onOpenDot={(id) => { if (!getPreview()) switchTo(id); go('b-' + id) }}
      onEdit={(id) => go('edit-' + id)}
      onOpenBook={() => go('book')}
      onThemes={() => go('themes')}
      onPlans={() => go('plans')}
      onCreate={(icon, letter) => { setDraft({ icon, letter }); go('new') }}
    />
  )
}
