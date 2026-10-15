# Turning on real accounts (Supabase)

The app is ready: sign up, email verification, log in, remembered sign-in, log out,
forgot password, and per-account data with row-level security. Supabase just needs a
project. About 10 minutes, all free tier.

1. **Make the project.** supabase.com > New project. Any name and region; save the
   database password somewhere (the app never needs it).
2. **Create the tables.** SQL Editor > New query > paste all of `supabase/schema.sql` > Run.
3. **Keep email verification on.** Authentication > Sign In / Providers > Email:
   "Confirm email" switched on (it is by default).
4. **Point links back to the site.** Authentication > URL Configuration:
   - Site URL: your Vercel address, e.g. `https://workout-lab.vercel.app`
   - Redirect URLs: add the same address (and `http://localhost:5173` for testing).
5. **Send emails to real people.** Supabase's built-in sender only delivers to your own
   project team and only a few per hour, so strangers would never get their link.
   Authentication > Emails > SMTP Settings > enable custom SMTP. Resend (resend.com,
   free 3,000 emails/month) works well: make an API key, then use host `smtp.resend.com`,
   port `465`, user `resend`, password = the API key, sender = an address on a domain
   you've verified in Resend.
6. **Hand over the keys.** Project Settings > API: copy the **Project URL** and the
   **anon public** key. Either send both to Claude (they go into `.env.production`, the
   anon key is meant to be public) or add them in Vercel > Settings > Environment
   Variables as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.

Optional: Authentication > Emails > Templates to restyle the "Confirm your signup"
email (keep the `{{ .ConfirmationURL }}` link in it).

Theme ownership: the account signed up with the owner's email (checked by hash in
`src/lib/theme.ts`) owns every theme once it has verified its email and logged in.
