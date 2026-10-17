// Shared server code for the payment endpoints (Vercel functions).
// Omise (Opn Payments) takes the money; Supabase keeps who is on which plan.
// Env (Vercel > Settings > Environment Variables): OMISE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from '@supabase/supabase-js'

// Prices live here, on the server, so a page can't be edited to pay less. Satang (฿1 = 100).
export const PRICES = { premium: 14900, exclusive: 32900 }
export const NAMES = { premium: 'Premium', exclusive: 'Exclusive' }
// Single themes, bought once and kept for good (keys match src/lib/theme.ts).
export const THEME_PRICE = 14900
export const THEME_NAMES = { sakura: 'Sakura', nightcity: 'Night City', neon: 'Neon', manga: 'Manga' }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://cafxkuokunjgtvexqaar.supabase.co'
let admin = null
export function db() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  admin ??= createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  return admin
}

export async function omise(path, method = 'GET', body) {
  if (!process.env.OMISE_SECRET_KEY) throw new Error('OMISE_SECRET_KEY is not set')
  const r = await fetch('https://api.omise.co' + path, {
    method,
    headers: { Authorization: 'Basic ' + Buffer.from(process.env.OMISE_SECRET_KEY + ':').toString('base64'), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await r.json()
  if (json.object === 'error') { const e = new Error(json.message || 'Payment error'); e.code = json.code; throw e }
  return json
}

// The signed-in account, from the Supabase access token the app sends.
export async function userOf(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!token) return null
  const { data } = await db().auth.getUser(token)
  return data?.user ?? null
}

export function send(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store')
  res.json(body)
}

const addMonth = (from) => { const d = new Date(from); const day = d.getUTCDate(); d.setUTCMonth(d.getUTCMonth() + 1); if (d.getUTCDate() < day) d.setUTCDate(0); return d }
const ymd = (d) => d.toISOString().slice(0, 10)

// A successful charge adds one month to the account's plan. Safe to call more than once
// for the same charge (the webhook and the app's status check both do).
export async function grant(charge) {
  if (!charge || charge.status !== 'successful') return null
  const meta = charge.metadata || {}
  if (meta.theme) return grantTheme(charge, meta)
  let { data: sub } = meta.user_id
    ? await db().from('subscriptions').select('*').eq('user_id', meta.user_id).maybeSingle()
    : await db().from('subscriptions').select('*').eq('omise_customer', charge.customer || '-').maybeSingle()
  const userId = meta.user_id || sub?.user_id
  const tier = meta.tier || sub?.tier
  if (!userId || !PRICES[tier]) return null
  const method = meta.method || sub?.method || 'card'

  const { error: dup } = await db().from('payments').insert({ charge_id: charge.id, user_id: userId, tier, amount: charge.amount, method })
  if (dup) return sub // already counted

  const now = new Date()
  const base = sub && sub.tier === tier && new Date(sub.paid_until) > now ? new Date(sub.paid_until) : now
  const paidUntil = addMonth(base)
  const next = { user_id: userId, tier, paid_until: paidUntil.toISOString(), method, renews: method === 'card', updated_at: now.toISOString(),
    omise_customer: charge.customer || sub?.omise_customer || null, omise_schedule: sub?.omise_schedule || null }

  // a card plan renews by itself every month from now on
  if (method === 'card' && charge.customer && !(sub?.omise_schedule && sub.tier === tier)) {
    if (sub?.omise_schedule) await omise('/schedules/' + sub.omise_schedule, 'DELETE').catch(() => {})
    const end = new Date(now); end.setUTCFullYear(end.getUTCFullYear() + 5)
    const schedule = await omise('/schedules', 'POST', {
      every: 1, period: 'month', on: { days_of_month: [Math.min(paidUntil.getUTCDate(), 28)] },
      start_date: ymd(paidUntil), end_date: ymd(end),
      charge: { customer: charge.customer, amount: PRICES[tier], currency: 'thb', description: `Dotset ${NAMES[tier]} (monthly)`, metadata: { user_id: userId, tier, method: 'card' } },
    })
    next.omise_schedule = schedule.id
  }
  if (method !== 'card' && sub?.omise_schedule) {
    await omise('/schedules/' + sub.omise_schedule, 'DELETE').catch(() => {})
    next.omise_schedule = null
  }
  await db().from('subscriptions').upsert(next)
  return next
}

// A theme bought on its own: recorded once, owned for good.
async function grantTheme(charge, meta) {
  if (!meta.user_id || !THEME_NAMES[meta.theme]) return null
  const { error: dup } = await db().from('payments').insert({ charge_id: charge.id, user_id: meta.user_id, tier: 'theme:' + meta.theme, amount: charge.amount, method: meta.method || 'card' })
  if (!dup) await db().from('owned_themes').upsert({ user_id: meta.user_id, theme: meta.theme, charge_id: charge.id })
  return { theme: meta.theme }
}
