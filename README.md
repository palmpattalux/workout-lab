# Dotset

Mobile-first workout tracker. React + TypeScript on Vite, wrapped with Capacitor for the App Store and Google Play.
Live at https://dotset.app (Vercel deploys every push to `main`).

## Run it

```bash
npm install
npm run dev        # open the network address on your phone (same Wi-Fi)
npm run build      # website goes to dist/
npx cap sync       # copy dist/ into the android/ and ios/ apps
```

## Folders

| Folder | What's in it |
| --- | --- |
| `src/pages/` | One file per screen (see the route list at the top of `src/App.tsx`). |
| `src/components/` | Shared pieces: pickers, menus, the session bar, and one `*Scene.tsx` per theme. |
| `src/lib/` | Logic with no UI: saving, login, plans, payments, themes, sounds, languages. |
| `src/styles.css` | All styles. Theme colours are tokens (`--stage`, `--ink`, `--active`, …) set per theme. |
| `api/` | Vercel server functions for Omise payments (checkout, charge, webhook, cancel). |
| `supabase/` | Database setup (`schema.sql`, `payments.sql`), email templates, `SETUP.md`. |
| `android/`, `ios/` | The native app shells (Capacitor). `.github/workflows/android.yml` builds the Android app. |
| `public/` | Files served as-is (open-source licence credits). |
| `scripts/` | `licenses.mjs` regenerates `public/licenses.txt` (`npm run licenses`). |
| `archive/` | Features and designs we took out, kept so they can be added back. Not part of the build. |

## Main files

- Screens: `PageA.tsx` (home dots), `PageB.tsx` (exercise and sets), `CreatePage.tsx` (new or edit), `BookPage.tsx` (exercises, sessions, presets, notes), `ThemesPage.tsx`, `IconsPage.tsx`, `PlansPage.tsx`, `CheckoutPage.tsx` / `PayPage.tsx` (paying).
- Saving: `src/lib/store.ts` saves to the browser first, then to Supabase. `src/lib/session.ts` holds the running session.
- Accounts: `src/lib/auth.ts`, `src/pages/LoginPage.tsx`.
- Plans and payments: `src/lib/plan.ts` (what each plan includes), `src/lib/billing.ts` (subscription state), `src/components/RenewNotice.tsx`.
- Themes: `src/lib/theme.ts` (list, tiers, ownership) and `src/components/ThemeScene.tsx` (which scene to draw).
- Languages: every UI string goes through `t()` in `src/lib/i18n.ts`, with English, Thai, Japanese and Chinese.

## Rules

- Every feature must work in every theme, in light and dark mode.
- Features a plan lacks are hidden, never shown as locked.
- A customer's data is never deleted when a plan runs out; extras are only hidden until they renew.
