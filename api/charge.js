// GET ?id=chrg_… : where a payment stands. The page asks every few seconds while it waits.
import { omise, userOf, send, grant } from './_lib.js'

export default async function handler(req, res) {
  try {
    const user = await userOf(req)
    if (!user) return send(res, 401, { error: 'Sign in first' })
    const id = String(req.query.id || '')
    if (!/^chrg_[\w]+$/.test(id)) return send(res, 400, { error: 'Bad id' })
    const charge = await omise('/charges/' + id)
    if (charge.metadata?.user_id !== user.id) return send(res, 404, { error: 'Not found' })
    const sub = await grant(charge)
    send(res, 200, { status: charge.status, tier: charge.metadata.tier, paidUntil: sub?.paid_until ?? null, failure: charge.failure_message || null })
  } catch (e) {
    send(res, 500, { error: e.message })
  }
}
