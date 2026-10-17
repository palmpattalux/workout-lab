// POST { action: 'cancel' } : stop a card plan from renewing. The plan stays on until the
// end of what was already paid for.
import { db, omise, userOf, send } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    const user = await userOf(req)
    if (!user) return send(res, 401, { error: 'Sign in first' })
    if ((req.body || {}).action !== 'cancel') return send(res, 400, { error: 'Unknown action' })
    const { data: sub } = await db().from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
    if (sub?.omise_schedule) await omise('/schedules/' + sub.omise_schedule, 'DELETE').catch(() => {})
    if (sub) await db().from('subscriptions').update({ renews: false, omise_schedule: null, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    send(res, 200, { ok: true })
  } catch (e) {
    send(res, 500, { error: e.message })
  }
}
