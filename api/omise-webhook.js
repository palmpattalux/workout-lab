// Omise calls this when a payment finishes (Omise dashboard > Webhooks > this URL).
// The event body isn't trusted: the charge is fetched again from Omise before anything changes.
import { omise, send, grant } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    const ev = req.body || {}
    const id = ev.data?.object === 'charge' ? ev.data.id : null
    if (id) await grant(await omise('/charges/' + id))
    send(res, 200, { ok: true })
  } catch (e) {
    send(res, 500, { error: e.message })
  }
}
