# Workout Lab

Mobile-first web app for experimental workout notes. React + TypeScript on Vite.

## Run it

```bash
npm install
npm run dev        # prints a local address and a network address; open the network one on your phone (same Wi-Fi)
npm run build      # production site goes to dist/
```

## Saving and accounts

Every change saves to the browser first, so nothing waits on the network, then syncs online in the background.

- **Public site** (Supabase keys set): people sign up and log in with email and password. Each account's workouts and sessions are stored in Supabase and only that account can read them (row-level security). See `src/lib/auth.ts`, `src/pages/LoginPage.tsx`, `supabase/schema.sql`.
- **claude.ai link** (no keys): no accounts; data goes to that page's private built-in database.

## Going live (Supabase + GitHub + Vercel)

1. **Supabase** (supabase.com, free): create a project. In SQL Editor, paste `supabase/schema.sql` and Run. In Authentication > URL Configuration, set Site URL to your Vercel address once you have it. Copy Project URL and anon public key from Project Settings > API.
2. **GitHub**: create an empty repo (e.g. `workout-lab`) and push this folder to it.
3. **Vercel** (vercel.com, sign in with GitHub): Add New > Project > pick the repo. Framework: Vite. Under Environment Variables add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Deploy. Every push to the repo redeploys automatically.

## Where things are

- `src/pages/PageA.tsx`: first screen. Workout dots (first tap: dot turns into a pulsing orange fingerprint with a pen above it; tap the fingerprint to open and start/continue the session, pen to edit), A1 home, A2 book, and "+" (hold once for a workout icon, hold again for a body-part letter).
- `src/pages/CreatePage.tsx`: new workout page, also the edit page. Exercise, equipment/progression switch, kg/lbs, specific focus, general notes.
- `src/pages/PageB.tsx`: exercise screen. Focus reminder, B3 load (kg/lbs: hold 1–15, keep holding at the top for up to 30; progression: stairs, tap to add a move), reps, set number and set arrows, switch button (hold: switch exercise), back arrow to home; tap Active to end the session (Yes/No).
- `src/pages/BookPage.tsx`: the book. Exercises tab: one box per workout; tap for general notes, details and past sessions. Sessions tab (`SessionsPage.tsx`): every session, newest first, tap a row for its sets.
- `src/components/HoldPicker.tsx`: the press-and-hold vertical picker used by "+", weights and B4.
- `src/components/HoldMenu.tsx`: the pen's press-and-hold ring of exercises.
- `src/lib/session.ts`: the active session and its sets.
- `src/components/icons.tsx`: the 15 workout icons and the body-part letters.
- `src/lib/store.ts`: saved workouts and sessions (local first, then Supabase or the claude.ai database).
- `src/lib/auth.ts`, `src/pages/LoginPage.tsx`: sign up, log in, forgot password, log out (in the book).

## Later: native app

Wrap the same build with Capacitor (`npm i @capacitor/core @capacitor/cli`, `npx cap init`, `npx cap add ios`/`android`) to ship to the app stores without rewriting.
