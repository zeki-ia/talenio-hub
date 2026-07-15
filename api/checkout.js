/**
 * Checkout unificado para todos los productos Talenio.
 *
 * POST /api/checkout
 * {
 *   product: 'climia' | 'promotia' | 'nomia',
 *   plan: 'Start' | 'Growth' | 'Scale' | 'Base',
 *   email?: string,         // pre-llenar email en Stripe
 *   companyName?: string,   // nombre de empresa para metadata
 *   successUrl?: string,    // default: hub.talenio.tech?checkout=success
 *   cancelUrl?: string,     // default: hub.talenio.tech?checkout=cancel
 *   stripeCustomerId?: string, // cliente existente
 * }
 *
 * Variables requeridas en Vercel:
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_CLIMIA_START / GROWTH / SCALE
 *   STRIPE_PRICE_PROMOTIA_START / GROWTH / SCALE
 *   STRIPE_PRICE_NOMIA_BASE / GROWTH
 */

import Stripe from 'stripe'

const PRICE_KEYS = {
  climia:   { Start: 'STRIPE_PRICE_CLIMIA_START',    Growth: 'STRIPE_PRICE_CLIMIA_GROWTH',   Scale: 'STRIPE_PRICE_CLIMIA_SCALE'   },
  promotia: { Start: 'STRIPE_PRICE_PROMOTIA_START',  Growth: 'STRIPE_PRICE_PROMOTIA_GROWTH', Scale: 'STRIPE_PRICE_PROMOTIA_SCALE' },
  nomia:    { Base:  'STRIPE_PRICE_NOMIA_BASE',       Growth: 'STRIPE_PRICE_NOMIA_GROWTH'    },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { STRIPE_SECRET_KEY } = process.env
  if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: 'STRIPE_SECRET_KEY no configurada' })

  const {
    action, product, plan, email, companyName,
    successUrl, cancelUrl, stripeCustomerId,
  } = req.body || {}

  // Billing portal para cliente existente
  if (action === 'portal') {
    if (!stripeCustomerId) return res.status(400).json({ error: 'stripeCustomerId requerido para portal' })
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY)
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: 'https://hub.talenio.tech',
      })
      return res.status(200).json({ url: session.url })
    } catch (e) {
      console.error('[checkout/portal]', e)
      return res.status(500).json({ error: e.message })
    }
  }

  if (!product || !PRICE_KEYS[product]) return res.status(400).json({ error: `Producto inválido: ${product}` })
  if (!plan)   return res.status(400).json({ error: 'Plan requerido' })

  const priceEnvKey = PRICE_KEYS[product][plan]
  const priceId     = priceEnvKey ? process.env[priceEnvKey] : null
  if (!priceId) return res.status(400).json({ error: `Price ID no configurado para ${product} ${plan}. Agregá ${priceEnvKey} en las variables de entorno.` })

  const hubBase  = 'https://hub.talenio.tech'
  const appUrls  = {
    climia:   'https://app.climia.talenio.tech',
    promotia: 'https://app.promotia.talenio.tech',
    nomia:    'https://app.nomia.talenio.tech',
  }

  try {
    const stripe  = new Stripe(STRIPE_SECRET_KEY)
    const params  = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${hubBase}?checkout=success&product=${product}`,
      cancel_url:  cancelUrl  || `${hubBase}?checkout=cancel`,
      metadata: {
        product,
        plan,
        ...(companyName ? { company_name: companyName } : {}),
      },
      custom_fields: [
        {
          key:   'company_name',
          label: { type: 'custom', custom: 'Nombre de la empresa' },
          type:  'text',
        },
      ],
      custom_text: {
        submit: { message: `Al completar el pago recibirás un email para acceder a ${product === 'climia' ? 'ClimIA' : product === 'promotia' ? 'PromotIA' : 'Nomia'}.` },
      },
    }

    if (email)             params.customer_email    = email
    if (stripeCustomerId)  params.customer          = stripeCustomerId

    const session = await stripe.checkout.sessions.create(params)
    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('[checkout]', e)
    return res.status(500).json({ error: e.message })
  }
}
