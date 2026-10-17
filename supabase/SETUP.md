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

# Turning on payments (Omise / Opn Payments)

Website checkout for Premium and Exclusive: PromptPay QR, TrueMoney Wallet and cards
(cards renew monthly; PromptPay and TrueMoney pay for one month). Until the keys below
are set, Plan just says "Coming soon", so nothing changes on the live site.

1. **Make the Omise account.** omise.co (Opn Payments) > sign up. Test keys work right
   away; live keys come after Omise checks your business. In the dashboard turn on
   PromptPay and TrueMoney (Payment methods).
2. **Create the payment tables.** Supabase > SQL Editor > New query > paste all of
   `supabase/payments.sql` > Run.
3. **Add the keys to Vercel.** Vercel > the project > Settings > Environment Variables:
   - `VITE_OMISE_PUBLIC_KEY` = Omise public key (`pkey_…`)
   - `OMISE_SECRET_KEY` = Omise secret key (`skey_…`), keep it secret
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase > Project Settings > API > service_role key, keep it secret
   Then Deployments > ⋯ > Redeploy.
4. **Tell Omise where to report payments.** Omise dashboard > Webhooks > endpoint
   `https://<your site>/api/omise-webhook`.

Test with Omise's test cards (e.g. 4242 4242 4242 4242, any future date, any CVC) and
the test PromptPay QR (mark it paid from the Omise dashboard). Switch to live keys when ready.
TrueMoney uses the app-jump flow (`truemoney_jumpapp`); set `OMISE_TRUEMONEY_TYPE=truemoney`
in Vercel for the older phone-number flow if your account only has that.

## Email templates (links that work on any phone or browser)

Supabase > Authentication > Emails > Templates. Paste `supabase/email/confirm-signup.html` into **Confirm signup** and `supabase/email/reset-password.html` into **Reset password** (Subject: "Confirm your Dotset email" / "Reset your Dotset password"). Site URL must be https://dotset.app.
