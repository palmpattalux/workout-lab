// POST { action: 'delete' } : delete the signed-in account and everything in it (App Store,
// Google Play and PDPA all require this). A renewing card plan is stopped and the saved card
// removed from Omise first. Workouts, sessions, notes, plans and owned themes go with the
// account (their tables cascade on auth.users). Omise keeps its own record of past charges,
// which is the payment record the law asks us to keep.
import { db, omise, userOf, send } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    const user = await userOf(req)
    if (!user) return send(res, 401, { error: 'Sign in first' })
    if ((req.body || {}).action !== 'delete') return send(res, 400, { error: 'Unknown action' })
    const { data: sub } = await db().from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
    if (sub?.omise_schedule) await omise('/schedules/' + sub.omise_schedule, 'DELETE').catch(() => {})
    if (sub?.omise_customer) await omise('/customers/' + sub.omise_customer, 'DELETE').catch(() => {})
    const { error } = await db().auth.admin.deleteUser(user.id)
    if (error) throw error
    send(res, 200, { ok: true })
  } catch (e) {
    send(res, 500, { error: e.message })
  }
}
