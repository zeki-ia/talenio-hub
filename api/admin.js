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

  // Validar que el caller es admin (verificar JWT con service role)
  const auth = req.headers.authorization?.replace('Bearer ', '')
  if (!auth) return res.status(401).json({ error: 'No autorizado' })

  let supabase
  try { supabase = adminClient() } catch (e) { return res.status(500).json({ error: e.message }) }

  // Verificar que el JWT pertenece a un usuario admin
  const { data: { user }, error: authErr } = await supabase.auth.getUser(auth)
  if (authErr || !user) return res.status(401).json({ error: 'Token inválido' })

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
  const isAdmin = userRow?.role === 'admin' || user.email?.endsWith('@delenio.net')
  if (!isAdmin) return res.status(403).json({ error: 'Sin permisos de administrador' })

  const { action, ...params } = req.body || {}

  try {
    switch (action) {

      // ── Lectura de datos (bypasa RLS con service role) ────────────────────
      case 'getData': {
        const [{ data: users }, { data: companies }, { data: subs }] = await Promise.all([
          supabase.from('users').select('id, email, role, company_id'),
          supabase.from('companies').select('id, name, is_active'),
          supabase.from('subscriptions').select('company_id, product, status'),
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

        // Crear entrada en nomia_clientes si corresponde
        if (products.includes('nomia')) {
          await supabase.from('nomia_clientes').insert({ nombre: name.trim() })
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
          // Obtener subs actuales
          const { data: currentSubs } = await supabase
            .from('subscriptions')
            .select('product, status')
            .eq('company_id', id)

          const currentActive = (currentSubs || []).filter(s => s.status === 'active').map(s => s.product)
          const toAdd    = products.filter(p => !currentActive.includes(p))
          const toRemove = currentActive.filter(p => !products.includes(p))

          if (toAdd.length) {
            await supabase.from('subscriptions').insert(
              toAdd.map(p => ({ company_id: id, product: p, status: 'active', plan: 'base' }))
            )
          }
          if (toRemove.length) {
            await supabase.from('subscriptions')
              .update({ status: 'canceled', updated_at: new Date().toISOString() })
              .eq('company_id', id)
              .in('product', toRemove)
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
        const { email, name, role = 'client', company_id } = params
        if (!email?.trim()) return res.status(400).json({ error: 'Email requerido' })

        const emailLower = email.trim().toLowerCase()

        // Invitar usuario (crea cuenta + envía email para setear contraseña)
        const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(emailLower, {
          data: { full_name: name },
          redirectTo: 'https://hub.talenio.tech',
        })

        let userId = invited?.user?.id
        if (inviteErr) {
          // El usuario ya existe en Auth — buscarlo
          const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
          const found = list?.users?.find(u => u.email?.toLowerCase() === emailLower)
          if (!found) return res.status(400).json({ error: inviteErr.message })
          userId = found.id
        }

        // Tabla core
        await supabase.from('users').upsert(
          { id: userId, email: emailLower, role, company_id: company_id || null },
          { onConflict: 'id' }
        )

        // Perfiles en apps según productos de la empresa
        if (company_id) {
          const { data: subs } = await supabase
            .from('subscriptions')
            .select('product')
            .eq('company_id', company_id)
            .eq('status', 'active')
          const prods = (subs || []).map(s => s.product)

          if (prods.includes('climia')) {
            await supabase.from('climia_profiles').upsert({
              id: userId, email: emailLower, name: name || emailLower,
              role: role === 'admin' ? 'admin' : 'cliente', client_id: null, status: 'Activo',
            }, { onConflict: 'id' })
          }
          if (prods.includes('nomia')) {
            await supabase.from('nomia_perfiles').upsert({
              id: userId, email: emailLower, nombre: name || emailLower,
              rol: role === 'admin' ? 'admin' : 'cliente', cliente_id: null,
            }, { onConflict: 'id' })
          }
        }

        return res.json({ ok: true, userId })
      }

      case 'updateUser': {
        const { id, role, company_id } = params
        if (!id) return res.status(400).json({ error: 'id requerido' })

        const updates = {}
        if (role !== undefined)      updates.role       = role
        if (company_id !== undefined) updates.company_id = company_id || null

        if (Object.keys(updates).length) {
          await supabase.from('users').update(updates).eq('id', id)
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
