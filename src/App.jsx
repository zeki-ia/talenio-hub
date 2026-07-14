import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const PRODUCTS = {
  climia: {
    name: 'Climia',
    tagline: 'Clima organizacional con IA',
    color: '#059669',
    bg: '#ECFDF5',
    url: import.meta.env.VITE_CLIMIA_URL || 'https://climia.vercel.app',
    icon: '🌡️',
    features: ['Encuestas de pulso', 'Análisis por área', 'Informe ejecutivo IA'],
  },
  promotia: {
    name: 'PromotIA',
    tagline: 'NPS B2B con inteligencia artificial',
    color: '#DB2777',
    bg: '#FDF2F8',
    url: import.meta.env.VITE_PROMOTIA_URL || 'https://app.promotia.talenio.tech',
    icon: '📊',
    features: ['Encuestas NPS', 'Análisis de detractores', 'Plan de acción IA'],
  },
  ats: {
    name: 'ATS',
    tagline: 'Reclutamiento inteligente',
    color: '#4F46E5',
    bg: '#EEF2FF',
    url: '#',
    icon: '🎯',
    features: ['Pipeline de candidatos', 'Screening con IA', 'Reportes de proceso'],
    comingSoon: true,
  },
}

const C = {
  bg: '#F5F3FF',
  surface: '#FFFFFF',
  border: '#E5E0F8',
  text: '#0C0A1A',
  text2: '#4A3F6B',
  text3: '#8B7DB0',
  accent: '#6D28D9',
  accentDim: '#EDE9FE',
}

const FONT = "'system-ui','-apple-system','sans-serif'"

const GlobalStyle = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.bg}; font-family: ${FONT}; color: ${C.text}; min-height: 100vh; }
    @keyframes spin { to { transform: rotate(360deg) } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
    input { outline: none; }
    input:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentDim}; }
    button { cursor: pointer; }
  `}</style>
)

function LoadingScreen({ message = 'Cargando…' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🧩</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text2, fontWeight: 600 }}>
          <span style={{ width: 16, height: 16, border: `2px solid ${C.accent}44`, borderTopColor: C.accent, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
          {message}
        </div>
      </div>
    </div>
  )
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: C.bg }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeIn .4s ease' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧩</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 4 }}>Delenio Hub</h1>
          <p style={{ color: C.text3, fontSize: 14 }}>Accedé a todos tus productos desde un solo lugar</p>
        </div>

        {/* Card */}
        <div style={{ background: C.surface, borderRadius: 20, padding: 32, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px #6D28D910' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: C.text }}>Iniciar sesión</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6, letterSpacing: '0.04em' }}>EMAIL</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@empresa.com"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT, color: C.text, background: C.bg, transition: 'all .2s' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6, letterSpacing: '0.04em' }}>CONTRASEÑA</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 42px 11px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT, color: C.text, background: C.bg, transition: 'all .2s' }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.text3, fontSize: 16, padding: 0 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: loading ? C.accentDim : C.accent, color: loading ? C.accent : '#fff', fontSize: 15, fontWeight: 800, fontFamily: FONT, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <span style={{ width: 14, height: 14, border: '2px solid #fff4', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: C.text3 }}>
          ¿Problemas para ingresar? Contactá a{' '}
          <a href="mailto:hola@delenio.net" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>hola@delenio.net</a>
        </p>
      </div>
    </div>
  )
}

function ProductCard({ product, active, onSelect }) {
  const p = PRODUCTS[product]
  const [hover, setHover] = useState(false)

  return (
    <div
      onClick={() => active && !p.comingSoon && onSelect(product)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface,
        border: `1.5px solid ${hover && active && !p.comingSoon ? p.color : C.border}`,
        borderRadius: 20,
        padding: 28,
        cursor: active && !p.comingSoon ? 'pointer' : 'default',
        transition: 'all .2s',
        transform: hover && active && !p.comingSoon ? 'translateY(-3px)' : 'none',
        boxShadow: hover && active && !p.comingSoon ? `0 8px 32px ${p.color}22` : '0 2px 8px #0001',
        opacity: p.comingSoon ? 0.6 : 1,
        position: 'relative',
        animation: 'fadeIn .4s ease',
      }}
    >
      {p.comingSoon && (
        <div style={{ position: 'absolute', top: 16, right: 16, background: C.accentDim, color: C.accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
          Próximamente
        </div>
      )}
      {!active && !p.comingSoon && (
        <div style={{ position: 'absolute', top: 16, right: 16, background: '#FEF3C7', color: '#D97706', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
          No contratado
        </div>
      )}

      <div style={{ fontSize: 36, marginBottom: 14 }}>{p.icon}</div>
      <h3 style={{ fontSize: 20, fontWeight: 900, color: p.color, marginBottom: 4 }}>{p.name}</h3>
      <p style={{ fontSize: 13, color: C.text2, marginBottom: 16, lineHeight: 1.5 }}>{p.tagline}</p>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {p.features.map(f => (
          <li key={f} style={{ fontSize: 12, color: C.text3, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: p.color, fontWeight: 700 }}>✓</span> {f}
          </li>
        ))}
      </ul>

      {active && !p.comingSoon && (
        <div style={{ marginTop: 20, padding: '10px 0 0', borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
            Abrir {p.name} →
          </span>
        </div>
      )}

      {!active && !p.comingSoon && (
        <div style={{ marginTop: 20, padding: '10px 0 0', borderTop: `1px solid ${C.border}` }}>
          <a href="mailto:hola@delenio.net" style={{ fontSize: 13, fontWeight: 700, color: C.accent, textDecoration: 'none' }}>
            Contratar →
          </a>
        </div>
      )}
    </div>
  )
}

function HubPage({ user, subscriptions, onLogout }) {
  const activeProducts = subscriptions.filter(s => s.status === 'active').map(s => s.product)

  function handleSelect(product) {
    const p = PRODUCTS[product]
    // Pasar el token de Supabase via query param para SSO futuro
    window.location.href = p.url
  }

  // Si tiene exactamente 1 producto activo, redirigir automáticamente
  useEffect(() => {
    if (activeProducts.length === 1) {
      const timer = setTimeout(() => handleSelect(activeProducts[0]), 1200)
      return () => clearTimeout(timer)
    }
  }, [activeProducts.join(',')])

  const allProductKeys = Object.keys(PRODUCTS)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '0 0 64px' }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🧩</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.text, lineHeight: 1 }}>Delenio Hub</div>
              <div style={{ fontSize: 11, color: C.text3 }}>by Delenio People</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: C.text2 }}>{user?.email}</span>
            <button onClick={onLogout} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, color: C.text2, fontFamily: FONT, fontWeight: 600 }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 0' }}>
        {/* Heading */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 8 }}>
            {activeProducts.length === 1
              ? `Redirigiendo a ${PRODUCTS[activeProducts[0]]?.name}…`
              : 'Tus productos'}
          </h1>
          <p style={{ color: C.text2, fontSize: 15 }}>
            {activeProducts.length === 0
              ? 'No tenés productos activos aún. Contactanos para comenzar.'
              : activeProducts.length === 1
              ? 'Te llevamos automáticamente a tu app.'
              : 'Seleccioná el producto al que querés acceder.'}
          </p>
        </div>

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {allProductKeys.map(key => (
            <ProductCard
              key={key}
              product={key}
              active={activeProducts.includes(key)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadSubscriptions(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) loadSubscriptions(session.user.id)
      else { setSubscriptions([]); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadSubscriptions(userId) {
    setLoading(true)
    try {
      // Obtener company_id del usuario
      const { data: userRow } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', userId)
        .maybeSingle()

      if (userRow?.company_id) {
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('product, plan, status')
          .eq('company_id', userRow.company_id)
        setSubscriptions(subs || [])
      }
    } catch (e) {
      console.error('Error loading subscriptions:', e)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return <><GlobalStyle /><LoadingScreen message="Cargando tus productos…" /></>
  if (!session) return <><GlobalStyle /><LoginPage /></>

  return (
    <>
      <GlobalStyle />
      <HubPage
        user={session.user}
        subscriptions={subscriptions}
        onLogout={handleLogout}
      />
    </>
  )
}
