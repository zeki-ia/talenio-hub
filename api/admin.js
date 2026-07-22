/**
 * API de administración del hub — usa service role key para bypassear RLS.
 * Solo accesible desde el frontend autenticado como admin (@delenio.net o role=admin).
 *
 * POST /api/admin  { action, ...params }
 *
 * Variables requeridas en Vercel:
 *   SUPABASE_URL              https://xkcceszgsmtrzakhmawf.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY eyJ...
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const STRIPE_PRICE_KEYS = {
  climia:   { Start: 'STRIPE_PRICE_CLIMIA_START',   Growth: 'STRIPE_PRICE_CLIMIA_GROWTH',   Scale: 'STRIPE_PRICE_CLIMIA_SCALE'   },
  promotia: { Start: 'STRIPE_PRICE_PROMOTIA_START', Growth: 'STRIPE_PRICE_PROMOTIA_GROWTH', Scale: 'STRIPE_PRICE_PROMOTIA_SCALE' },
  nomia:    { Base:  'STRIPE_PRICE_NOMIA_BASE',      Growth: 'STRIPE_PRICE_NOMIA_GROWTH'    },
}

function adminClient() {
  // Acepta tanto SUPABASE_URL (server) como VITE_SUPABASE_URL (ya configurado en Vercel para el SPA)
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars — agregá SUPABASE_SERVICE_ROLE_KEY en Vercel → Settings → Environment Variables')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const auth = req.headers.authorization?.replace('Bearer ', '')
  if (!auth) return res.status(401).json({ error: 'No autorizado' })

  let supabase
  try { supabase = adminClient() } catch (e) { return res.status(500).json({ error: e.message }) }

  // Decodificar JWT localmente para obtener user_id y email sin roundtrip
  let userId, userEmail
  try {
    const payload = JSON.parse(Buffer.from(auth.split('.')[1], 'base64').toString())
    userId    = payload.sub
    userEmail = payload.email
    if (!userId) throw new Error('no sub')
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // Verificar que es admin (email @delenio.net O role=admin en DB)
  const isAdminEmail = userEmail?.endsWith('@delenio.net')
  if (!isAdminEmail) {
    const { data: userRow } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
    if (userRow?.role !== 'admin') return res.status(403).json({ error: 'Sin permisos de administrador' })
  }

  const { action, ...params } = req.body || {}

  // Helper compartido: busca o crea registro de cliente en la tabla de la app
  async function findOrCreateAppClient(table, nameField, compName) {
    const { data: found } = await supabase.from(table).select('id').ilike(nameField, compName.trim()).maybeSingle()
    if (found) return found.id
    const extra = table === 'climia_clients'
      ? { code: compName.slice(0,3).toUpperCase()+'-'+Math.random().toString(36).slice(2,5).toUpperCase(), survey_token: crypto.randomUUID() }
      : {}
    const { data: created } = await supabase.from(table).insert({ [nameField]: compName, ...extra }).select('id').single()
    if (created?.id && table === 'nomia_clientes') {
      await supabase.from('nomia_configuracion').insert({ cliente_id: created.id, parametros: {}, macro: {}, bonos: [] })
    }
    return created?.id || null
  }

  try {
    switch (action) {

      // ── Datos de apps bypasando RLS (para admins @delenio.net) ──────────
      case 'getNomiaClientes': {
        const { data, error } = await supabase.from('nomia_clientes').select('*').order('nombre')
        if (error) return res.status(400).json({ error: error.message })
        return res.json({ clientes: data || [] })
      }

      // ── Acceso gratuito / bonificación ──────────────────────────────────
      // ── Sincronizar perfiles de admin en todas las apps ──────────────────
      case 'syncAdminProfiles': {
        const { adminUserId, adminEmail } = params
        if (!adminUserId || !adminEmail) return res.status(400).json({ error: 'adminUserId y adminEmail requeridos' })
        const nombre = adminEmail.split('@')[0]

        await supabase.from('nomia_perfiles').upsert(
          { id: adminUserId, email: adminEmail, nombre, rol: 'admin', cliente_id: null },
          { onConflict: 'id' }
        )
        await supabase.from('climia_profiles').upsert(
          { id: adminUserId, email: adminEmail, name: nombre, role: 'admin', client_id: null, status: 'Activo' },
          { onConflict: 'id' }
        )
        await supabase.from('users').upsert(
          { id: adminUserId, email: adminEmail, role: 'admin' },
          { onConflict: 'id' }
        )
        return res.json({ ok: true })
      }

      // ── Acceso gratuito / bonificación ──────────────────────────────────
      case 'grantFreeAccess': {
        const { company_id, product, plan = 'start' } = params
        if (!company_id || !product) return res.status(400).json({ error: 'company_id y product requeridos' })
        const validPlans = ['start', 'plus_ia']
        const safePlan = validPlans.includes(plan) ? plan : 'start'
        const { error } = await supabase.from('subscriptions').upsert(
          { company_id, product, status: 'active', plan: safePlan },
          { onConflict: 'company_id,product' }
        )
        if (error) return res.status(400).json({ error: error.message })
        return res.json({ ok: true })
      }

      case 'revokeAccess': {
        const { company_id, product } = params
        if (!company_id || !product) return res.status(400).json({ error: 'company_id y product requeridos' })
        const { error } = await supabase.from('subscriptions')
          .update({ status: 'canceled' })
          .eq('company_id', company_id).eq('product', product)
        if (error) return res.status(400).json({ error: error.message })
        return res.json({ ok: true })
      }

      // ── SSO: genera magic link para login en otra app ───────────────────
      case 'generateLoginLink': {
        const { email, redirectTo } = params
        if (!email || !redirectTo) return res.status(400).json({ error: 'email y redirectTo requeridos' })
        const { data, error } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: email.trim().toLowerCase(),
          options: { redirectTo },
        })
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ url: data.properties.action_link })
      }

      // ── Lectura de datos (bypasa RLS con service role) ────────────────────
      case 'getData': {
        const [
          { data: users }, { data: companies }, { data: subs },
          { data: nomiaClientes }, { data: climiaClients },
          { data: nomiaPerfiles }, { data: climiaProfiles },
        ] = await Promise.all([
          supabase.from('users').select('id, email, name, role, company_id, products'),
          supabase.from('companies').select('id, name, is_active, stripe_customer_id'),
          supabase.from('subscriptions').select('company_id, product, status, plan, stripe_subscription_id'),
          supabase.from('nomia_clientes').select('id, nombre').order('nombre'),
          supabase.from('climia_clients').select('id, name').order('name'),
          supabase.from('nomia_perfiles').select('id, cliente_id, rol'),
          supabase.from('climia_profiles').select('id, client_id, role, status'),
        ])
        return res.json({
          users: users || [], companies: companies || [], subs: subs || [],
          nomiaClientes: nomiaClientes || [], climiaClients: climiaClients || [],
          nomiaPerfiles: nomiaPerfiles || [], climiaProfiles: climiaProfiles || [],
        })
      }

      // ── Métricas de uso ──────────────────────────────────────────────────
      case 'getMetrics': {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const [
          { count: totalCompanies },
          { count: activeCompanies },
          { count: totalUsers },
          { count: newCompanies },
          { count: newUsers },
          { data: activeSubs },
          { count: nomiaClientes },
          { count: nomiaEmpleados },
          { count: nomiaEscenarios },
          { count: climiaClients },
          { count: climiaProfiles },
          { count: surveyResponses },
        ] = await Promise.all([
          supabase.from('companies').select('*', { count: 'exact', head: true }),
          supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('companies').select('*', { count: 'exact', head: true }).gte('created_at', since),
          supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', since),
          supabase.from('subscriptions').select('product, status').eq('status', 'active'),
          supabase.from('nomia_clientes').select('*', { count: 'exact', head: true }),
          supabase.from('nomia_empleados').select('*', { count: 'exact', head: true }),
          supabase.from('nomia_escenarios').select('*', { count: 'exact', head: true }),
          supabase.from('climia_clients').select('*', { count: 'exact', head: true }),
          supabase.from('climia_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('survey_responses').select('*', { count: 'exact', head: true }),
        ])

        const subsByProduct = {}
        for (const s of activeSubs || []) {
          subsByProduct[s.product] = (subsByProduct[s.product] || 0) + 1
        }

        // Monthly trend — last 6 months
        const trendMonths = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
          const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
          const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
          trendMonths.push({ label: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, start, end })
        }
        const trendData = await Promise.all(trendMonths.map(async m => {
          const [compR, userR] = await Promise.all([
            supabase.from('companies').select('*', { count: 'exact', head: true }).gte('created_at', m.start).lte('created_at', m.end),
            supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', m.start).lte('created_at', m.end),
          ])
          return { month: m.label, companies: compR.count ?? 0, users: userR.count ?? 0 }
        }))

        return res.json({
          global: { totalCompanies, activeCompanies, totalUsers, newCompanies, newUsers },
          subs: subsByProduct,
          nomia: { clientes: nomiaClientes, empleados: nomiaEmpleados, escenarios: nomiaEscenarios },
          climia: { clients: climiaClients, profiles: climiaProfiles },
          promotia: { surveyResponses },
          trend: trendData,
        })
      }

      // ── Rentabilidad Stripe ───────────────────────────────────────────────
      case 'getRevenue': {
        const stripeKey = process.env.STRIPE_SECRET_KEY
        if (!stripeKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY no configurada' })
        const stripe = new Stripe(stripeKey)

        // Fetch all price amounts in parallel
        const priceEntries = Object.entries(STRIPE_PRICE_KEYS).flatMap(([prod, plans]) =>
          Object.entries(plans).map(([plan, envKey]) => ({ prod, plan, priceId: process.env[envKey] }))
        ).filter(x => x.priceId)

        const priceAmounts = await Promise.all(priceEntries.map(async ({ prod, plan, priceId }) => {
          try {
            const price = await stripe.prices.retrieve(priceId)
            return { prod, plan, unitAmount: price.unit_amount ?? 0, currency: price.currency ?? 'ars' }
          } catch { return { prod, plan, unitAmount: 0, currency: 'ars' } }
        }))

        const priceLookup = {}
        for (const p of priceAmounts) priceLookup[`${p.prod}:${p.plan}`] = { amount: p.unitAmount, currency: p.currency }

        // Active subscriptions from our DB
        const { data: activeSubs } = await supabase.from('subscriptions').select('product, plan, status, company_id').eq('status', 'active')

        // MRR per product (unit_amount is in cents)
        const mrrByProduct = {}
        const subCountByProduct = {}
        for (const s of activeSubs || []) {
          const key = `${s.product}:${s.plan}`
          const entry = priceLookup[key]
          mrrByProduct[s.product] = (mrrByProduct[s.product] || 0) + (entry?.amount || 0)
          subCountByProduct[s.product] = (subCountByProduct[s.product] || 0) + 1
        }

        return res.json({ mrrByProduct, subCountByProduct, priceLookup })
      }

      // ── Cross-sell IA ─────────────────────────────────────────────────────
      case 'crossSell': {
        const { companyName, activeProducts } = params
        if (!companyName) return res.status(400).json({ error: 'companyName requerido' })

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en Vercel' })

        const ECOSISTEMA = `
## Plataforma SaaS (Talenio)
- Nomia: presupuesto y control de payroll, escenarios y proyecciones salariales
- Climia: clima organizacional con encuestas de pulso mensuales e informes ejecutivos con IA
- PromotIA: NPS B2B con análisis de detractores y planes de acción generados por IA
- Lyrion: coaching comercial con IA — observa conversaciones de ventas y detecta oportunidades en riesgo
- Wiggins: account intelligence — investiga empresas, decisores y stack tecnológico en un click
- Wiru Catálogo: ventas por WhatsApp sin perder pedidos (catálogo + pedidos integrados)
- Wiru Radar: detecta clientes en riesgo mediante segmentación RFM automática y alertas semanales

## Consultoría y servicios (Delenio)

### Ingeniería Comercial
Diseño de sistemas de ventas con previsibilidad: diagnóstico comercial integral, plan estratégico de ventas, modelo de ventas y ciclos, gestión comercial y forecast, esquemas de compensación, kit comercial y manual de ventas.

### Growth
Crecimiento con foco en demanda real: generación de leads B2B, diseño de canales escalables, control de performance y ROI, optimización del CAC.

### Marketing & Customer Success
Marketing estratégico, customer success y experiencia de cliente, estrategia de contenidos, métricas de satisfacción (NPS/churn), marca y web, CRM y automation.

### People (consultoría HR)
Diagnóstico de madurez organizacional, diseño organizacional, procesos ágiles, transformación digital HR, conexión de talento (búsqueda especializada), aceleración de equipos comerciales, socio estratégico continuo.

### Asistencia Artificial
Agentes de IA comerciales, implementación de CRM, atención automatizada (chatbots), automatización de procesos y workflows.`

        const appsActivas = (activeProducts || []).join(', ') || 'ninguna'

        const prompt = `Sos un consultor senior de Delenio, empresa de consultoría y tecnología B2B para PyMEs.

Empresa cliente: "${companyName}"
Apps/productos activos: ${appsActivas}

Ecosistema completo de Delenio disponible para ofrecer:
${ECOSISTEMA}

Tu tarea: generá UNA sugerencia de cross-sell o upsell concreta y personalizada para esta empresa, de 3 a 5 oraciones. Puede ser otro producto SaaS, un servicio de consultoría, o una combinación. Elegí lo más complementario con lo que ya usan y lo que típicamente necesita una empresa en esa etapa. Tono comercial, directo, sin emojis, en español rioplatense.`

        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
        })
        const ai = await resp.json()
        const suggestion = ai.content?.[0]?.text?.trim() || 'No se pudo generar la sugerencia.'
        return res.json({ suggestion })
      }

      // ── Empresas ─────────────────────────────────────────────────────────

      case 'createCompany': {
        const { name, products = [] } = params
        if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' })

        const { data: existing } = await supabase.from('companies').select('id').ilike('name', name.trim()).maybeSingle()
        if (existing) return res.status(400).json({ error: `Ya existe una empresa con el nombre "${name.trim()}"` })

        const { data: company, error } = await supabase
          .from('companies')
          .insert({ name: name.trim(), is_active: true })
          .select('id')
          .single()
        if (error) return res.status(400).json({ error: error.message })

        if (products.length > 0) {
          await supabase.from('subscriptions').insert(
            products.map(p => ({ company_id: company.id, product: p, status: 'active', plan: 'base' }))
          )
        }

        // Crear registros en cada app según los productos seleccionados
        if (products.includes('nomia')) {
          await supabase.from('nomia_clientes').insert({ nombre: name.trim() })
        }

        if (products.includes('climia')) {
          const code = name.trim().slice(0, 3).toUpperCase().replace(/\s/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
          await supabase.from('climia_clients').insert({
            id: company.id,
            company_id: company.id,
            name: name.trim(),
            code,
            status: 'active',
            plan: 'base',
          })
        }



        return res.json({ ok: true, company })
      }

      case 'updateCompany': {
        const { id, name, products, is_active } = params
        if (!id) return res.status(400).json({ error: 'id requerido' })

        const updates = {}
        if (name !== undefined) updates.name = name.trim()
        if (is_active !== undefined) updates.is_active = is_active

        if (Object.keys(updates).length) {
          await supabase.from('companies').update(updates).eq('id', id)
        }

        // Sincronizar productos si se envían
        if (products !== undefined) {
          const { data: currentSubs } = await supabase
            .from('subscriptions').select('product, status').eq('company_id', id)

          const currentActive = (currentSubs || []).filter(s => s.status === 'active').map(s => s.product)
          const toAdd    = products.filter(p => !currentActive.includes(p))
          const toRemove = currentActive.filter(p => !products.includes(p))

          if (toAdd.length) {
            await supabase.from('subscriptions').upsert(
              toAdd.map(p => ({ company_id: id, product: p, status: 'active', plan: 'base' })),
              { onConflict: 'company_id,product' }
            )
          }
          if (toRemove.length) {
            await supabase.from('subscriptions')
              .update({ status: 'canceled', updated_at: new Date().toISOString() })
              .eq('company_id', id).in('product', toRemove)
          }

          // Sincronizar registros en apps para TODOS los productos activos (idempotente)
          const { data: coRow } = await supabase.from('companies').select('name').eq('id', id).maybeSingle()
          const coName = coRow?.name || name?.trim() || ''
          const activeAfter = products // los que el usuario envió son los que deben quedar activos

          if (activeAfter.includes('nomia')) {
            const { data: exists } = await supabase.from('nomia_clientes').select('id').eq('nombre', coName).maybeSingle()
            if (!exists) await supabase.from('nomia_clientes').insert({ nombre: coName })
          }
          if (activeAfter.includes('climia')) {
            const { data: exists } = await supabase.from('climia_clients').select('id').eq('id', id).maybeSingle()
            if (!exists) {
              const code = coName.slice(0, 3).toUpperCase().replace(/\s/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
              await supabase.from('climia_clients').insert({
                id,
                company_id: id,
                name: coName,
                code,
                status: 'active',
                plan: 'base',
              })
            }
          }
        }

        // Suspender empresa: cancelar todas las suscripciones activas
        if (is_active === false) {
          await supabase.from('subscriptions')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('company_id', id)
            .eq('status', 'active')
        }
        // Reactivar empresa
        if (is_active === true) {
          await supabase.from('subscriptions')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('company_id', id)
            .eq('status', 'suspended')
        }

        return res.json({ ok: true })
      }

      case 'deleteCompany': {
        const { id } = params
        if (!id) return res.status(400).json({ error: 'id requerido' })

        // Obtener nombre para lookup de Nomia (no tiene company_id)
        const { data: coRow } = await supabase.from('companies').select('name').eq('id', id).maybeSingle()
        const coName = coRow?.name

        // 1. Desvincular usuarios — limpiar company_id y client_code (PromotIA)
        const { error: unlinkErr } = await supabase.from('users').update({ company_id: null }).eq('company_id', id)
        if (unlinkErr) return res.status(400).json({ error: 'No se pudo desvincular usuarios: ' + unlinkErr.message })

        // 2. Eliminar suscripciones
        await supabase.from('subscriptions').delete().eq('company_id', id)

        // 3. Climia — perfiles primero, luego cliente
        await supabase.from('climia_profiles').delete().eq('client_id', id)
        await supabase.from('climia_clients').delete().eq('company_id', id)

        // 4. Nomia — buscar cliente por nombre, borrar perfiles y cliente
        if (coName) {
          const { data: nomiaClient } = await supabase.from('nomia_clientes').select('id').eq('nombre', coName).maybeSingle()
          if (nomiaClient) {
            await supabase.from('nomia_perfiles').delete().eq('cliente_id', nomiaClient.id)
            await supabase.from('nomia_clientes').delete().eq('id', nomiaClient.id)
          }
        }

        // 5. Eliminar la empresa
        const { error } = await supabase.from('companies').delete().eq('id', id)
        if (error) return res.status(400).json({ error: error.message })

        return res.json({ ok: true })
      }

      // ── Usuarios ─────────────────────────────────────────────────────────

      case 'createUser': {
        const { email, name, role = 'client', company_id, products = [], password, nomia_cliente_id, climia_client_id, consultor_companies = [] } = params
        if (!email?.trim()) return res.status(400).json({ error: 'Email requerido' })

        const emailLower = email.trim().toLowerCase()

        let userId
        if (password) {
          // Crear con contraseña directa (sin email de invitación)
          const { data: created, error: createErr } = await supabase.auth.admin.createUser({
            email: emailLower, password, email_confirm: true,
            user_metadata: { full_name: name },
          })
          if (createErr) {
            // Si ya existe, buscarlo
            const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
            const found = list?.users?.find(u => u.email?.toLowerCase() === emailLower)
            if (!found) return res.status(400).json({ error: createErr.message })
            userId = found.id
            // Actualizar contraseña del existente
            await supabase.auth.admin.updateUserById(userId, { password })
          } else {
            userId = created?.user?.id
          }
        } else {
          // Invitar (crea cuenta + envía email para setear contraseña)
          const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(emailLower, {
            data: { full_name: name },
            redirectTo: 'https://hub.talenio.tech',
          })
          userId = invited?.user?.id
          if (inviteErr) {
            const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
            const found = list?.users?.find(u => u.email?.toLowerCase() === emailLower)
            if (!found) return res.status(400).json({ error: inviteErr.message })
            userId = found.id
          }
        }

        const isConsultor = role === 'consultor'
        const isAdmin = role === 'admin'

        // Tabla core
        await supabase.from('users').upsert(
          { id: userId, email: emailLower, name: name || null, role, company_id: company_id || null, products,
            ...(consultor_companies.length ? { consultor_companies } : {}) },
          { onConflict: 'id' }
        )

        if (isConsultor && consultor_companies.length) {
          // Crear perfiles en cada app para cada empresa asignada
          for (const coId of consultor_companies) {
            const { data: co } = await supabase.from('companies').select('name').eq('id', coId).maybeSingle()
            const coName = co?.name
            if (!coName) continue
            const climiaId = await findOrCreateAppClient('climia_clients', 'name', coName)
            await supabase.from('climia_profiles').upsert({
              id: userId, email: emailLower, name: name || emailLower,
              role: 'consultor', client_id: climiaId, status: 'Activo',
            }, { onConflict: 'id' })
            const nomiaId = await findOrCreateAppClient('nomia_clientes', 'nombre', coName)
            await supabase.from('nomia_perfiles').upsert({
              id: userId, email: emailLower, nombre: name || emailLower,
              rol: 'consultor', cliente_id: nomiaId,
            }, { onConflict: 'id' })
          }
        } else {
          // Obtener nombre de empresa para lookup de apps
          let companyName = null
          if (company_id) {
            const { data: co } = await supabase.from('companies').select('name').eq('id', company_id).maybeSingle()
            companyName = co?.name
          }
          // Perfiles en apps según productos seleccionados
          if (products.includes('climia')) {
            let clientId = climia_client_id != null ? climia_client_id : null
            if (clientId === null && !isAdmin && companyName) clientId = await findOrCreateAppClient('climia_clients', 'name', companyName)
            await supabase.from('climia_profiles').upsert({
              id: userId, email: emailLower, name: name || emailLower,
              role: isAdmin ? 'admin' : 'cliente', client_id: isAdmin ? null : clientId, status: 'Activo',
            }, { onConflict: 'id' })
          }
          if (products.includes('nomia')) {
            let clienteId = nomia_cliente_id != null ? nomia_cliente_id : null
            if (clienteId === null && !isAdmin && companyName) clienteId = await findOrCreateAppClient('nomia_clientes', 'nombre', companyName)
            await supabase.from('nomia_perfiles').upsert({
              id: userId, email: emailLower, nombre: name || emailLower,
              rol: isAdmin ? 'admin' : 'cliente', cliente_id: isAdmin ? null : clienteId,
            }, { onConflict: 'id' })
          }
          if (products.includes('promotia')) {
            const clientCode = companyName ? companyName.slice(0,6).toUpperCase().replace(/\s/g,'') : null
            await supabase.from('users').update({ client_code: isAdmin ? null : clientCode }).eq('id', userId)
          }
        }

        return res.json({ ok: true, userId })
      }

      case 'setPassword': {
        const { id, password: newPass } = params
        if (!id || !newPass) return res.status(400).json({ error: 'id y password requeridos' })
        const { error } = await supabase.auth.admin.updateUserById(id, { password: newPass })
        if (error) return res.status(400).json({ error: error.message })
        return res.json({ ok: true })
      }

      case 'sendPasswordReset': {
        const { email: resetEmail } = params
        if (!resetEmail) return res.status(400).json({ error: 'email requerido' })
        const { error } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: resetEmail.trim().toLowerCase(),
          options: { redirectTo: 'https://hub.talenio.tech' },
        })
        if (error) return res.status(400).json({ error: error.message })
        return res.json({ ok: true })
      }

      case 'updateUser': {
        const { id, role, company_id, products, name: newName, email: newEmail, nomia_cliente_id, climia_client_id, consultor_companies } = params
        if (!id) return res.status(400).json({ error: 'id requerido' })

        const updates = {}
        if (role !== undefined)       updates.role       = role
        if (company_id !== undefined) updates.company_id = company_id || null
        if (products !== undefined)   updates.products   = products
        if (newName !== undefined)    updates.name       = newName || null
        if (consultor_companies !== undefined) updates.consultor_companies = consultor_companies || []

        if (Object.keys(updates).length) {
          await supabase.from('users').update(updates).eq('id', id)
        }

        // Actualizar email y nombre en Auth si se envían
        const authUpdates = {}
        if (newEmail?.trim()) authUpdates.email = newEmail.trim().toLowerCase()
        if (newName?.trim()) authUpdates.user_metadata = { full_name: newName.trim() }
        if (Object.keys(authUpdates).length) {
          await supabase.auth.admin.updateUserById(id, authUpdates)
          if (newEmail?.trim()) {
            await supabase.from('users').update({ email: newEmail.trim().toLowerCase() }).eq('id', id)
          }
        }

        // Sincronizar perfiles en apps si cambió role, products o consultor_companies
        if (products !== undefined || consultor_companies !== undefined || role !== undefined) {
          const { data: uRow } = await supabase.from('users').select('email, company_id, role, products, consultor_companies').eq('id', id).maybeSingle()
          const emailLower = uRow?.email || ''
          const effectiveRole = role !== undefined ? role : uRow?.role
          const isConsultorRole = effectiveRole === 'consultor'
          const isAdminRole = effectiveRole === 'admin'
          const effectiveProducts = products !== undefined ? products : (uRow?.products || [])
          const effectiveConsultorCompanies = consultor_companies !== undefined ? consultor_companies : (uRow?.consultor_companies || [])

          if (isConsultorRole && effectiveConsultorCompanies.length) {
            // Consultor: crear perfil por cada empresa asignada
            for (const coId of effectiveConsultorCompanies) {
              const { data: co } = await supabase.from('companies').select('name').eq('id', coId).maybeSingle()
              if (!co?.name) continue
              const climiaId = await findOrCreateAppClient('climia_clients', 'name', co.name)
              await supabase.from('climia_profiles').upsert({
                id, email: emailLower, name: newName || emailLower,
                role: 'consultor', client_id: climiaId, status: 'Activo',
              }, { onConflict: 'id' })
              const nomiaId = await findOrCreateAppClient('nomia_clientes', 'nombre', co.name)
              await supabase.from('nomia_perfiles').upsert({
                id, email: emailLower, nombre: newName || emailLower,
                rol: 'consultor', cliente_id: nomiaId,
              }, { onConflict: 'id' })
            }
            return res.json({ ok: true })
          }

          const effectiveCompanyId = company_id !== undefined ? (company_id || null) : (uRow?.company_id || null)

          // Buscar nombre empresa
          let companyName = null
          if (effectiveCompanyId) {
            const { data: co } = await supabase.from('companies').select('name').eq('id', effectiveCompanyId).maybeSingle()
            companyName = co?.name
          }

          if (effectiveProducts.includes('climia')) {
            let climiaClientId = climia_client_id !== undefined ? (climia_client_id || null) : null
            if (climiaClientId === null && !isAdminRole && companyName) {
              climiaClientId = await findOrCreateAppClient('climia_clients', 'name', companyName)
            }
            const displayName = newName || emailLower
            await supabase.from('climia_profiles').upsert({
              id, email: emailLower, name: displayName,
              role: isAdminRole ? 'admin' : 'cliente', client_id: isAdminRole ? null : climiaClientId, status: 'Activo',
            }, { onConflict: 'id' })
          } else {
            // Sin acceso a Climia — suspender perfil si existe
            await supabase.from('climia_profiles').update({ status: 'Suspendido' }).eq('id', id)
          }

          if (effectiveProducts.includes('nomia')) {
            let nomiaClienteId = nomia_cliente_id !== undefined ? (nomia_cliente_id || null) : null
            if (nomiaClienteId === null && !isAdminRole && companyName) {
              nomiaClienteId = await findOrCreateAppClient('nomia_clientes', 'nombre', companyName)
            }
            const displayName = newName || emailLower
            await supabase.from('nomia_perfiles').upsert({
              id, email: emailLower, nombre: displayName,
              rol: isAdminRole ? 'admin' : 'cliente',
              cliente_id: isAdminRole ? null : nomiaClienteId,
            }, { onConflict: 'id' })
          } else {
            // Sin acceso a Nomia — eliminar perfil si existe
            await supabase.from('nomia_perfiles').delete().eq('id', id)
          }

          // PromotIA — sincronizar client_code siempre (null si no tiene acceso)
          const clientCode = effectiveProducts.includes('promotia') && !isAdminRole && companyName
            ? companyName.slice(0, 6).toUpperCase().replace(/\s/g, '')
            : null
          await supabase.from('users').update({ client_code: clientCode }).eq('id', id)
        }

        return res.json({ ok: true })
      }

      case 'suspendUser': {
        const { id, suspended } = params
        if (!id) return res.status(400).json({ error: 'id requerido' })

        // Banear/desbanear en Supabase Auth
        await supabase.auth.admin.updateUserById(id, {
          ban_duration: suspended ? '876600h' : 'none',
        })
        // Marcar en tabla users
        await supabase.from('users').update({ role: suspended ? 'suspended' : 'client' }).eq('id', id)
        // Sincronizar estado en Climia
        await supabase.from('climia_profiles').update({ status: suspended ? 'Suspendido' : 'Activo' }).eq('id', id)

        return res.json({ ok: true })
      }

      case 'getSettings': {
        const { key } = params
        if (!key) return res.status(400).json({ error: 'key requerido' })
        const { data } = await supabase.from('hub_settings').select('value').eq('key', key).maybeSingle()
        return res.json({ value: data?.value ?? null })
      }

      case 'setSettings': {
        const { key, value } = params
        if (!key) return res.status(400).json({ error: 'key requerido' })
        await supabase.from('hub_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        return res.json({ ok: true })
      }

      default:
        return res.status(400).json({ error: `Acción desconocida: ${action}` })
    }
  } catch (e) {
    console.error('[admin]', action, e)
    return res.status(500).json({ error: e.message })
  }
}
