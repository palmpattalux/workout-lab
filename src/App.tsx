import { useEffect, useState } from 'react'
import PageA from './pages/PageA'
import PageB from './pages/PageB'
import CreatePage from './pages/CreatePage'
import BookPage from './pages/BookPage'
import LoginPage from './pages/LoginPage'
import { useWorkouts, setScope } from './lib/store'
import { supabase, useUser } from './lib/auth'
import { switchTo } from './lib/session'

// Every screen is swapped in memory, so nothing reloads and switching is instant.
// The hash only mirrors where you are so the back gesture works.
//   ""          page A
//   b-<key>     page B for a workout (or an empty dot)
//   new         create page (only while a draft exists)
//   edit-<id>   edit page for a workout
//   book        book list, book-<id> one workout, sessions = all sessions
function go(hash: string) {
  location.hash = hash
}

export default function App() {
  const [hash, setHash] = useState(() => location.hash.slice(1))
  const [draft, setDraft] = useState<{ icon: string; letter: string } | null>(null)
  const workouts = useWorkouts()
  const user = useUser()

  // load the signed-in person's data (or this browser's, where there are no accounts)
  useEffect(() => {
    if (user !== undefined) setScope(user?.id ?? null)
  }, [user])

  useEffect(() => {
    const onHash = () => setHash(location.hash.slice(1))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (supabase && user === undefined) return <main className="page" aria-busy="true" />
  if (supabase && !user) return <LoginPage />

  if (hash.startsWith('b-')) {
    const key = hash.slice(2)
    return <PageB key={key} workout={workouts.find((w) => w.id === key) ?? null} workouts={workouts} onGo={(id) => location.replace('#b-' + id)} onHome={() => go('')} />
  }
  if (hash === 'new' && draft) {
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
      onOpenDot={(id) => { switchTo(id); go('b-' + id) }}
      onEdit={(id) => go('edit-' + id)}
      onOpenBook={() => go('book')}
      onCreate={(icon, letter) => { setDraft({ icon, letter }); go('new') }}
    />
  )
}
