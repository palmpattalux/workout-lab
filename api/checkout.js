// POST { tier | theme, method: 'card' | 'promptpay' | 'truemoney', token?, phone? }
// Starts a payment for the signed-in account and says what the page should do next:
// show a QR code, send the person to their bank/wallet to confirm, or that it's paid.
import { PRICES, NAMES, THEME_PRICE, THEME_NAMES, db, omise, userOf, send, grant } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  try {
    const user = await userOf(req)
    if (!user) return send(res, 401, { error: 'Sign in first' })
    const { tier, theme, method, token, phone } = req.body || {}
    let amount, metadata, description
    if (theme) {
      // one theme, paid once
      if (!THEME_NAMES[theme]) return send(res, 400, { error: 'Unknown theme' })
      const { data: owned } = await db().from('owned_themes').select('theme').eq('user_id', user.id).eq('theme', theme).maybeSingle()
      if (owned) return send(res, 409, { error: 'You already own this theme' })
      amount = THEME_PRICE
      metadata = { user_id: user.id, theme, method }
      description = `Dotset theme: ${THEME_NAMES[theme]}`
    } else {
      amount = PRICES[tier]
      if (!amount) return send(res, 400, { error: 'Unknown plan' })
      // a card plan that already renews itself can't be bought twice
      const { data: sub } = await db().from('subscriptions').select('tier, renews, paid_until').eq('user_id', user.id).maybeSingle()
      if (sub?.renews && sub.tier === tier && new Date(sub.paid_until) > new Date()) return send(res, 409, { error: 'You already have this plan' })
      metadata = { user_id: user.id, tier, method }
      description = `Dotset ${NAMES[tier]}`
    }

    const origin = req.headers.origin || `https://${req.headers.host}`
    const base = { amount, currency: 'thb', description, metadata, return_uri: origin + '/?pay=return' }
    let charge
    if (method === 'card') {
      if (!token) return send(res, 400, { error: 'Card details missing' })
      if (theme) charge = await omise('/charges', 'POST', { ...base, card: token }) // nothing renews, so no saved card
      else {
        const customer = await omise('/customers', 'POST', { email: user.email, description: user.id, card: token })
        charge = await omise('/charges', 'POST', { ...base, customer: customer.id })
      }
    } else if (method === 'promptpay') {
      const source = await omise('/sources', 'POST', { amount, currency: 'thb', type: 'promptpay' })
      charge = await omise('/charges', 'POST', { ...base, source: source.id })
    } else if (method === 'truemoney') {
      const type = process.env.OMISE_TRUEMONEY_TYPE || 'truemoney_jumpapp'
      const source = await omise('/sources', 'POST', { amount, currency: 'thb', type, ...(type === 'truemoney' ? { phone_number: phone } : {}) })
      charge = await omise('/charges', 'POST', { ...base, source: source.id })
    } else return send(res, 400, { error: 'Unknown payment method' })

    if (charge.status === 'successful') await grant(charge)
    send(res, 200, {
      charge: charge.id,
      status: charge.status,
      authorizeUri: charge.status === 'pending' ? charge.authorize_uri || null : null,
      qr: charge.source?.scannable_code?.image?.download_uri || null,
      expiresAt: charge.expires_at || null,
      failure: charge.failure_message || null,
    })
  } catch (e) {
    send(res, e.code ? 402 : 500, { error: e.message })
  }
}
