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
    colorSoft: '#ECFDF5',
    url: import.meta.env.VITE_CLIMIA_URL || 'https://climia.vercel.app',
    landingUrl: 'https://climia.talenium.tech',
    features: ['Encuestas de pulso', 'Análisis por área', 'Informe ejecutivo IA'],
    icon: ClimiaIcon,
  },
  promotia: {
    name: 'PromotIA',
    tagline: 'NPS B2B con inteligencia artificial',
    color: '#DB2777',
    colorSoft: '#FDF2F8',
    url: import.meta.env.VITE_PROMOTIA_URL || 'https://app.promotia.talenio.tech',
    landingUrl: 'https://promotia.talenium.tech',
    features: ['Encuestas NPS', 'Análisis de detractores', 'Plan de acción IA'],
    icon: PromotiaIcon,
  },
  bandas: {
    name: 'Bandas',
    tagline: 'Estudios de mercado salarial',
    color: '#002EE5',
    colorSoft: '#EEF0FF',
    url: import.meta.env.VITE_BANDAS_URL || 'https://bandas.talenio.tech',
    features: ['Estudios gratuitos de mercado', 'Comparación por sector', 'Rangos por posición'],
    icon: BandasIcon,
    freemium: true,
  },
  nomia: {
    name: 'Nomia',
    tagline: 'Presupuesto y control de payroll',
    color: '#0F766E',
    colorSoft: '#F0FDFA',
    url: import.meta.env.VITE_NOMIA_URL || 'https://nomia.talenio.tech',
    features: ['Presupuesto de nómina', 'Real vs presupuesto', 'Escenarios y proyecciones'],
    icon: NomiaIcon,
    landingUrl: 'https://nomia.talenium.tech',
  },
}

// ── Iconos SVG por producto ──────────────────────────────────────────────────

function ClimiaIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#ECFDF5"/>
      <path d="M10 14h20a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-9l-5 4v-4h-6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" fill="#059669" opacity=".15"/>
      <path d="M10 14h20a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-9l-5 4v-4h-6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" stroke="#059669" strokeWidth="1.5" fill="none"/>
      <polyline points="13,22 17,18 21,21 27,16" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PromotiaIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#FDF2F8"/>
      <path d="M10 14h20a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-9l-5 4v-4h-6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" fill="#DB2777" opacity=".12"/>
      <path d="M10 14h20a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-9l-5 4v-4h-6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" stroke="#DB2777" strokeWidth="1.5" fill="none"/>
      <path d="M20 26l-3.5-3.3c-1-1-.9-2.5.2-3.3.87-.6 2.04-.37 2.7.42l.6.72.6-.72c.67-.79 1.84-1.02 2.71-.42 1.08.75 1.17 2.3.17 3.3L20 26Z" fill="#DB2777"/>
    </svg>
  )
}

function BandasIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#EEF0FF"/>
      <rect x="10" y="24" width="4" height="7" rx="1.5" fill="#002EE5" opacity=".3"/>
      <rect x="16" y="19" width="4" height="12" rx="1.5" fill="#002EE5" opacity=".55"/>
      <rect x="22" y="14" width="4" height="17" rx="1.5" fill="#002EE5" opacity=".8"/>
      <rect x="28" y="10" width="4" height="21" rx="1.5" fill="#002EE5"/>
      <polyline points="10,22 18,17 24,13 32,10" stroke="#65E3C3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function NomiaIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#F0FDFA"/>
      <rect x="9" y="12" width="22" height="17" rx="3" stroke="#0F766E" strokeWidth="1.5" fill="#0F766E" opacity=".08"/>
      <line x1="14" y1="18" x2="26" y2="18" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="22" x2="22" y2="22" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="28" cy="29" r="6" fill="#0F766E"/>
      <text x="28" y="33" textAnchor="middle" fontSize="8" fill="white" fontWeight="700">$</text>
    </svg>
  )
}

// ── Logo Talenio ─────────────────────────────────────────────────────────────

function TalenioLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="tg" x1="0" y1="48" x2="48" y2="0">
          <stop offset="0%" stopColor="#059669"/>
          <stop offset="50%" stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#DB2777"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#tg)"/>
      {/* T geométrica */}
      <rect x="10" y="13" width="28" height="6" rx="3" fill="white"/>
      <rect x="21" y="19" width="6" height="17" rx="3" fill="white"/>
    </svg>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────

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
const FONT = "system-ui,-apple-system,sans-serif"

const GlobalStyle = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.bg}; font-family: ${FONT}; color: ${C.text}; min-height: 100vh; }
    @keyframes spin    { to { transform: rotate(360deg) } }
    @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
    input { outline: none; font-family: ${FONT}; }
    input:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentDim}; }
    button { cursor: pointer; font-family: ${FONT}; }
    a { text-decoration: none; }
  `}</style>
)

// ── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ color = '#fff', size = 14 }) {
  return <span style={{ width: size, height: size, border: `2px solid ${color}44`, borderTopColor: color, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
}

// ── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen({ message = 'Cargando…' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <TalenioLogo size={52} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text2, fontWeight: 600, marginTop: 20, justifyContent: 'center' }}>
          <Spinner color={C.accent} size={16} />
          {message}
        </div>
      </div>
    </div>
  )
}

// ── Login ────────────────────────────────────────────────────────────────────

function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text,
    background: '#FAFAFF', transition: 'all .2s',
  }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: C.text3, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: `linear-gradient(160deg, #F5F3FF 0%, #FDF2F8 100%)` }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp .5s ease' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <TalenioLogo size={56} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginTop: 16, marginBottom: 6, letterSpacing: '-0.02em' }}>Talenio</h1>
          <p style={{ color: C.text3, fontSize: 14, lineHeight: 1.5 }}>Tu plataforma de People Analytics.<br/>Un solo acceso para todos tus productos.</p>
        </div>

        {/* Card */}
        <div style={{ background: C.surface, borderRadius: 22, padding: 32, border: `1px solid ${C.border}`, boxShadow: '0 8px 40px #6D28D914' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24, color: C.text }}>Iniciar sesión</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@empresa.com" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.text3, fontSize: 15, padding: 4 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: loading ? C.accentDim : `linear-gradient(135deg, #7C3AED, #6D28D9)`, color: loading ? C.accent : '#fff', fontSize: 15, fontWeight: 800, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 16px #6D28D940' }}>
              {loading && <Spinner />}
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: C.text3 }}>
          ¿Problemas? <a href="mailto:hola@delenio.net" style={{ color: C.accent, fontWeight: 600 }}>hola@delenio.net</a>
        </p>
      </div>
    </div>
  )
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ productKey, active, onSelect }) {
  const p   = PRODUCTS[productKey]
  const Icon = p.icon
  const [hover, setHover] = useState(false)
  const canClick = active && !p.comingSoon

  return (
    <div
      onClick={() => canClick && onSelect(productKey)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface,
        border: `1.5px solid ${hover && canClick ? p.color : C.border}`,
        borderRadius: 20,
        padding: 28,
        cursor: canClick ? 'pointer' : 'default',
        transition: 'all .22s',
        transform: hover && canClick ? 'translateY(-4px)' : 'none',
        boxShadow: hover && canClick ? `0 12px 36px ${p.color}28` : '0 2px 10px #0001',
        animation: 'fadeUp .4s ease',
        position: 'relative',
        opacity: p.comingSoon ? 0.55 : 1,
      }}
    >
      {/* Status badge */}
      {p.comingSoon && (
        <span style={{ position: 'absolute', top: 16, right: 16, background: C.accentDim, color: C.accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Próximamente</span>
      )}
      {!active && !p.comingSoon && (
        <span style={{ position: 'absolute', top: 16, right: 16, background: '#FEF3C7', color: '#B45309', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>No contratado</span>
      )}

      <div style={{ marginBottom: 16 }}>
        <Icon size={40} />
      </div>
      <h3 style={{ fontSize: 19, fontWeight: 900, color: p.color, marginBottom: 4, letterSpacing: '-0.01em' }}>{p.name}</h3>
      <p style={{ fontSize: 13, color: C.text2, marginBottom: 16, lineHeight: 1.55 }}>{p.tagline}</p>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {p.features.map(f => (
          <li key={f} style={{ fontSize: 12, color: C.text3, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: p.color, fontWeight: 800, fontSize: 11 }}>✓</span> {f}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        {active && !p.comingSoon && (
          <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>Abrir {p.name} →</span>
        )}
        {!active && !p.comingSoon && (
          <a href={p.landingUrl || 'mailto:hola@delenio.net'} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>
            {p.landingUrl ? 'Ver más →' : 'Contratar →'}
          </a>
        )}
      </div>
    </div>
  )
}

// ── Hub ──────────────────────────────────────────────────────────────────────

function HubPage({ user, subscriptions, onLogout }) {
  const subsActive = subscriptions.filter(s => s.status === 'active').map(s => s.product)
  // Productos freemium siempre activos para usuarios logueados
  const freemiumProducts = Object.entries(PRODUCTS).filter(([, p]) => p.freemium).map(([k]) => k)
  const activeProducts = [...new Set([...subsActive, ...freemiumProducts])]

  function handleSelect(productKey) {
    window.location.href = PRODUCTS[productKey].url
  }

  // Auto-redirect si tiene exactamente 1 producto activo
  useEffect(() => {
    if (activeProducts.length === 1) {
      const t = setTimeout(() => handleSelect(activeProducts[0]), 1400)
      return () => clearTimeout(t)
    }
  }, [activeProducts.join(',')])

  const productKeys = Object.keys(PRODUCTS)

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TalenioLogo size={32} />
            <span style={{ fontSize: 17, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Talenio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: C.text3, display: 'none' }}>{user?.email}</span>
            <button onClick={onLogout} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 13, color: C.text2, fontWeight: 600 }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Heading */}
        <div style={{ marginBottom: 40, animation: 'fadeUp .4s ease' }}>
          {activeProducts.length === 1 ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 8 }}>
                Redirigiendo a {PRODUCTS[activeProducts[0]]?.name}…
              </h1>
              <p style={{ color: C.text2, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spinner color={C.accent} size={14} /> Te llevamos automáticamente.
              </p>
            </>
          ) : activeProducts.length === 0 ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 8 }}>Sin productos activos</h1>
              <p style={{ color: C.text2, fontSize: 15 }}>Contactanos para activar tu acceso: <a href="mailto:hola@delenio.net" style={{ color: C.accent, fontWeight: 600 }}>hola@delenio.net</a></p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 8 }}>Tus productos</h1>
              <p style={{ color: C.text2, fontSize: 15 }}>Seleccioná el producto al que querés acceder.</p>
            </>
          )}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {productKeys.map(key => (
            <ProductCard key={key} productKey={key} active={activeProducts.includes(key)} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession]           = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading]           = useState(true)

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
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', userId).maybeSingle()
      if (userRow?.company_id) {
        const { data: subs } = await supabase.from('subscriptions').select('product, plan, status').eq('company_id', userRow.company_id)
        setSubscriptions(subs || [])
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  if (loading) return <><GlobalStyle /><LoadingScreen message="Cargando tus productos…" /></>
  if (!session) return <><GlobalStyle /><LoginPage /></>
  return <><GlobalStyle /><HubPage user={session.user} subscriptions={subscriptions} onLogout={handleLogout} /></>
}
