/**
 * Webhook unificado de Stripe para Talenio Hub
 *
 * Maneja los cambios de estado de suscripción de TODOS los productos
 * (climia, promotia, nomia, bandas) y actualiza la tabla `subscriptions`
 * en Supabase (proyecto delenio-platform: xkcceszgsmtrzakhmawf).
 *
 * Eventos manejados:
 *   checkout.session.completed       → activa suscripción + crea company si no existe
 *   customer.subscription.updated    → sincroniza status
 *   customer.subscription.deleted    → marca como canceled
 *   invoice.payment_succeeded        → reactiva si estaba past_due
 *   invoice.payment_failed           → marca como past_due
 *
 * Variables de entorno requeridas (Vercel → Settings → Environment Variables):
 *   STRIPE_SECRET_KEY           sk_live_... (o sk_test_... en staging)
 *   STRIPE_WEBHOOK_SECRET       whsec_...   (del webhook registrado en Stripe Dashboard)
 *   SUPABASE_URL                https://xkcceszgsmtrzakhmawf.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY   eyJ...      (Project Settings → API → service_role)
 *
 * Mapeo precio → producto (al menos uno por producto):
 *   STRIPE_PRICE_CLIMIA_START       price_...
 *   STRIPE_PRICE_CLIMIA_GROWTH      price_...
 *   STRIPE_PRICE_CLIMIA_SCALE       price_...
 *   STRIPE_PRICE_PROMOTIA_START     price_...
 *   STRIPE_PRICE_PROMOTIA_GROWTH    price_...
 *   STRIPE_PRICE_PROMOTIA_SCALE     price_...
 *   STRIPE_PRICE_NOMIA_BASE         price_...
 *
 * Alternativamente, podés incluir metadata en el Checkout Session:
 *   { metadata: { product: 'climia', plan: 'Growth' } }
 * y el webhook lo usa sin necesidad de mapear price IDs.
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// Construye el mapa price_id → { product, plan } desde las env vars
function buildPriceMap() {
  const map = {}
  const entries = [
    ['STRIPE_PRICE_CLIMIA_START',   'climia',   'Start'],
    ['STRIPE_PRICE_CLIMIA_GROWTH',  'climia',   'Growth'],
    ['STRIPE_PRICE_CLIMIA_SCALE',   'climia',   'Scale'],
    ['STRIPE_PRICE_PROMOTIA_START', 'promotia', 'Start'],
    ['STRIPE_PRICE_PROMOTIA_GROWTH','promotia', 'Growth'],
    ['STRIPE_PRICE_PROMOTIA_SCALE', 'promotia', 'Scale'],
    ['STRIPE_PRICE_NOMIA_BASE',     'nomia',    'Base'],
    ['STRIPE_PRICE_NOMIA_GROWTH',   'nomia',    'Growth'],
  ]
  for (const [envKey, product, plan] of entries) {
    const priceId = process.env[envKey]
    if (priceId) map[priceId] = { product, plan }
  }
  return map
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[webhook] Missing required env vars')
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const PRICE_MAP = buildPriceMap()

  // Verificar firma de Stripe
  const rawBody = await getRawBody(req)
  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Invalid signature:', err.message)
    return res.status(400).json({ error: `Webhook signature error: ${err.message}` })
  }

  // Resolver company_id desde stripe_subscription_id (para eventos de actualización)
  async function getCompanyId(stripeSubId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('company_id')
      .eq('stripe_subscription_id', stripeSubId)
      .maybeSingle()
    return data?.company_id || null
  }

  // Actualizar status en subscriptions
  async function updateSubStatus(stripeSubId, status, extra = {}) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status, updated_at: new Date().toISOString(), ...extra })
      .eq('stripe_subscription_id', stripeSubId)
    if (error) console.error('[webhook] updateSubStatus error:', error.message)
  }

  try {
    switch (event.type) {

      // ── Checkout completado: activar suscripción ───────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription' || !session.subscription) break

        // Recuperar la suscripción completa para obtener el price ID
        const stripeSub = await stripe.subscriptions.retrieve(session.subscription)
        const priceId   = stripeSub.items.data[0]?.price?.id
        const priceInfo = priceId ? PRICE_MAP[priceId] : null

        // Producto y plan: metadata tiene prioridad sobre el mapeo por price
        const product = session.metadata?.product || priceInfo?.product
        const plan    = session.metadata?.plan    || priceInfo?.plan || 'Base'

        if (!product) {
          console.warn('[webhook] checkout.session.completed: no se pudo determinar el producto. priceId:', priceId)
          break
        }

        const email        = session.customer_details?.email
        const customerName = session.customer_details?.name || email?.split('@')[1] || 'Mi empresa'
        const customerId   = session.customer

        // Buscar o crear empresa
        let companyId = null
        const { data: existingCo } = await supabase
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (existingCo) {
          companyId = existingCo.id
          await supabase.from('companies').update({ is_active: true }).eq('id', companyId)
        } else {
          const { data: newCo, error: coErr } = await supabase
            .from('companies')
            .insert({ name: customerName, stripe_customer_id: customerId, is_active: true })
            .select('id')
            .single()
          if (coErr) { console.error('[webhook] company insert error:', coErr.message); break }
          companyId = newCo.id
        }

        // Buscar o crear usuario (si el email viene en el session)
        if (email) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle()

          if (!existingUser) {
            // Buscar en Auth
            const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
            const authUser = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

            let userId = authUser?.id
            if (!userId) {
              // Invitar al usuario → recibirá email para setear contraseña
              const { data: invited } = await supabase.auth.admin.inviteUserByEmail(email, {
                data: { name: customerName },
                redirectTo: `https://hub.talenio.tech`,
              })
              userId = invited?.user?.id
            }
            if (userId) {
              await supabase.from('users').upsert(
                { id: userId, email, company_id: companyId, role: 'admin' },
                { onConflict: 'id' }
              )
            }
          } else {
            // Vincular usuario existente a la empresa si no tiene company_id
            await supabase
              .from('users')
              .update({ company_id: companyId })
              .eq('id', existingUser.id)
              .is('company_id', null)
          }
        }

        // Registrar / actualizar suscripción
        await supabase.from('subscriptions').upsert({
          company_id:              companyId,
          product,
          plan,
          status:                  'active',
          stripe_subscription_id:  stripeSub.id,
          current_period_end:      stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : null,
          updated_at:              new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        console.log(`[webhook] checkout.session.completed → ${product} (${plan}) company:${companyId}`)
        break
      }

      // ── Suscripción actualizada (cambio de plan, pausa, etc.) ──────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const priceId   = sub.items.data[0]?.price?.id
        const priceInfo = priceId ? PRICE_MAP[priceId] : null
        const plan      = sub.metadata?.plan || priceInfo?.plan

        await updateSubStatus(sub.id, sub.status, {
          ...(plan ? { plan } : {}),
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : undefined,
        })
        console.log(`[webhook] subscription.updated → ${sub.id} status:${sub.status}`)
        break
      }

      // ── Suscripción cancelada ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await updateSubStatus(sub.id, 'canceled')
        // Marcar empresa como inactiva si ya no tiene suscripciones activas
        const companyId = await getCompanyId(sub.id)
        if (companyId) {
          const { data: activeSubs } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('company_id', companyId)
            .eq('status', 'active')
          if (!activeSubs?.length) {
            await supabase.from('companies').update({ is_active: false }).eq('id', companyId)
          }
        }
        console.log(`[webhook] subscription.deleted → ${sub.id}`)
        break
      }

      // ── Pago exitoso (renovación mensual/anual) ───────────────────────────
      case 'invoice.payment_succeeded': {
        const inv = event.data.object
        if (!inv.subscription) break
        const stripeSub = await stripe.subscriptions.retrieve(inv.subscription)
        await updateSubStatus(inv.subscription, 'active', {
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        })
        // Reactivar empresa si estaba inactiva
        const companyId = await getCompanyId(inv.subscription)
        if (companyId) await supabase.from('companies').update({ is_active: true }).eq('id', companyId)
        console.log(`[webhook] invoice.payment_succeeded → sub:${inv.subscription}`)
        break
      }

      // ── Pago fallido ──────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const inv = event.data.object
        if (!inv.subscription) break
        await updateSubStatus(inv.subscription, 'past_due')
        console.log(`[webhook] invoice.payment_failed → sub:${inv.subscription}`)
        break
      }

      default:
        // Evento no manejado — lo ignoramos silenciosamente
        break
    }
  } catch (err) {
    console.error('[webhook] Handler error:', err)
    // Respondemos 200 igual para que Stripe no reintente indefinidamente
  }

  return res.status(200).json({ received: true })
}
