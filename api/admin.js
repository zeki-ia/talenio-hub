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

  try {
    switch (action) {

      // ── Acceso gratuito / bonificación ──────────────────────────────────
      case 'grantFreeAccess': {
        const { company_id, product } = params
        if (!company_id || !product) return res.status(400).json({ error: 'company_id y product requeridos' })
        const { error } = await supabase.from('subscriptions').upsert(
          { company_id, product, status: 'active', plan: 'gratis' },
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
        const [{ data: users }, { data: companies }, { data: subs }] = await Promise.all([
          supabase.from('users').select('id, email, role, company_id, products'),
          supabase.from('companies').select('id, name, is_active, stripe_customer_id'),
          supabase.from('subscriptions').select('company_id, product, status, plan, stripe_subscription_id'),
        ])
        return res.json({ users: users || [], companies: companies || [], subs: subs || [] })
      }

      // ── Empresas ─────────────────────────────────────────────────────────

      case 'createCompany': {
        const { name, products = [] } = params
        if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' })

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
          const surveyToken = crypto.randomUUID()
          await supabase.from('climia_clients').insert({ name: name.trim(), code, surveyToken })
        }

        if (products.includes('promotia')) {
          // PromotIA usa client_code en la tabla users — no requiere tabla de clientes separada
          // El client_code se asigna al crear usuarios de esa empresa
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

          console.log('[updateCompany] coName:', coName, '| activeAfter:', activeAfter)
          if (activeAfter.includes('nomia')) {
            const { data: exists, error: checkErr } = await supabase.from('nomia_clientes').select('id').eq('nombre', coName).maybeSingle()
            console.log('[nomia_clientes] exists:', exists, '| checkErr:', checkErr?.message)
            if (!exists) {
              const { error: insertErr } = await supabase.from('nomia_clientes').insert({ nombre: coName })
              console.log('[nomia_clientes] insert error:', insertErr?.message || 'OK')
            }
          }
          if (activeAfter.includes('climia')) {
            const { data: exists, error: checkErr } = await supabase.from('climia_clients').select('id').eq('name', coName).maybeSingle()
            console.log('[climia_clients] exists:', exists, '| checkErr:', checkErr?.message)
            if (!exists) {
              const code = coName.slice(0, 3).toUpperCase().replace(/\s/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
              const { error: insertErr } = await supabase.from('climia_clients').insert({ name: coName, code, surveyToken: crypto.randomUUID() })
              console.log('[climia_clients] insert error:', insertErr?.message || 'OK')
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

      // ── Usuarios ─────────────────────────────────────────────────────────

      case 'createUser': {
        const { email, name, role = 'client', company_id, products = [], password } = params
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

        // Tabla core
        await supabase.from('users').upsert(
          { id: userId, email: emailLower, role, company_id: company_id || null, products },
          { onConflict: 'id' }
        )

        // Obtener nombre de empresa para lookup de apps
        let companyName = null
        if (company_id) {
          const { data: co } = await supabase.from('companies').select('name').eq('id', company_id).maybeSingle()
          companyName = co?.name
        }

        // Perfiles en apps según productos seleccionados
        if (products.includes('climia')) {
          await supabase.from('climia_profiles').upsert({
            id: userId, email: emailLower, name: name || emailLower,
            role: role === 'admin' ? 'admin' : 'cliente', client_id: null, status: 'Activo',
          }, { onConflict: 'id' })
        }
        if (products.includes('nomia')) {
          // Buscar el cliente Nomia que corresponde a la empresa
          let nomiaClienteId = null
          if (companyName) {
            const { data: nc } = await supabase.from('nomia_clientes').select('id').eq('nombre', companyName).maybeSingle()
            nomiaClienteId = nc?.id || null
          }
          await supabase.from('nomia_perfiles').upsert({
            id: userId, email: emailLower, nombre: name || emailLower,
            rol: role === 'admin' ? 'admin' : 'cliente',
            cliente_id: role === 'admin' ? null : nomiaClienteId,
          }, { onConflict: 'id' })
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
        const { id, role, company_id, products } = params
        if (!id) return res.status(400).json({ error: 'id requerido' })

        const updates = {}
        if (role !== undefined)      updates.role       = role
        if (company_id !== undefined) updates.company_id = company_id || null
        if (products !== undefined)   updates.products   = products

        if (Object.keys(updates).length) {
          await supabase.from('users').update(updates).eq('id', id)
        }

        // Sincronizar perfiles en apps si cambió products
        if (products !== undefined) {
          const { data: uRow } = await supabase.from('users').select('email, company_id').eq('id', id).maybeSingle()
          const emailLower = uRow?.email || ''
          const effectiveCompanyId = company_id !== undefined ? (company_id || null) : (uRow?.company_id || null)

          // Buscar nombre empresa y cliente Nomia
          let companyName = null
          if (effectiveCompanyId) {
            const { data: co } = await supabase.from('companies').select('name').eq('id', effectiveCompanyId).maybeSingle()
            companyName = co?.name
          }

          if (products.includes('climia')) {
            await supabase.from('climia_profiles').upsert({
              id, email: emailLower, name: emailLower,
              role: role === 'admin' ? 'admin' : 'cliente', client_id: null, status: 'Activo',
            }, { onConflict: 'id' })
          } else {
            await supabase.from('climia_profiles').update({ status: 'Suspendido' }).eq('id', id)
          }
          if (products.includes('nomia')) {
            let nomiaClienteId = null
            if (companyName) {
              const { data: nc } = await supabase.from('nomia_clientes').select('id').eq('nombre', companyName).maybeSingle()
              nomiaClienteId = nc?.id || null
            }
            await supabase.from('nomia_perfiles').upsert({
              id, email: emailLower, nombre: emailLower,
              rol: role === 'admin' ? 'admin' : 'cliente',
              cliente_id: role === 'admin' ? null : nomiaClienteId,
            }, { onConflict: 'id' })
          }
        }

        return res.json({ ok: true })
      }

      case 'suspendUser': {
        const { id, suspended } = params
        if (!id) return res.status(400).json({ error: 'id requerido' })

        // Banear/desbanear en Supabase Auth
        await supabase.auth.admin.updateUserById(id, {
          ban_duration: suspended ? '876600h' : 'none', // 100 años = suspendido permanentemente
        })
        // Marcar en tabla users
        await supabase.from('users').update({ role: suspended ? 'suspended' : 'client' }).eq('id', id)

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
