import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Design tokens (familia Nomia/Bandas) ─────────────────────────────────────
const T = {
  blue:       '#002EE5',
  blueMid:    '#2B3FE0',
  blueSoft:   '#EEF0FF',
  mint:       '#65E3C3',
  mintSoft:   '#E6FBF8',
  navy:       '#10141F',
  ink:        '#0B0B0F',
  inkSoft:    '#4A4A55',
  muted:      '#7B8299',
  paper:      '#FFFFFF',
  bg:         '#F6F7FB',
  surface:    '#FFFFFF',
  border:     '#E4E6EF',
  borderStr:  '#D8DAE8',
  radius:     14,
  font:       "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
}

// Colores de cada producto (sus propias paletas)
const PRODUCTS = {
  climia: {
    name:       'Climia',
    tagline:    'Clima organizacional con IA',
    color:      '#73017B',
    colorSoft:  '#F7F0FA',
    colorMid:   '#9B2DA3',
    url:        import.meta.env.VITE_CLIMIA_URL   || 'https://app.climia.talenio.tech',
    landingUrl: 'https://climia.talenio.tech',
    features:   ['Encuestas de pulso', 'Análisis por área', 'Informe ejecutivo IA'],
  },
  promotia: {
    name:       'PromotIA',
    tagline:    'NPS B2B con inteligencia artificial',
    color:      '#C4006C',
    colorSoft:  '#FDF0F7',
    colorMid:   '#DB2777',
    url:        import.meta.env.VITE_PROMOTIA_URL  || 'https://app.promotia.talenio.tech',
    landingUrl: 'https://promotia.talenio.tech',
    features:   ['Encuestas NPS', 'Análisis de detractores', 'Plan de acción IA'],
  },
  bandas: {
    name:       'Bandas',
    tagline:    'Estudios de mercado salarial',
    color:      '#002EE5',
    colorSoft:  '#EEF0FF',
    colorMid:   '#2B3FE0',
    url:        import.meta.env.VITE_BANDAS_URL    || 'https://bandas.talenio.tech',
    features:   ['Estudios gratuitos de mercado', 'Comparación por sector', 'Rangos por posición'],
    freemium:   true,
  },
  nomia: {
    name:       'Nomia',
    tagline:    'Presupuesto y control de payroll',
    color:      '#0F766E',
    colorSoft:  '#F0FDFA',
    colorMid:   '#0D9488',
    url:        import.meta.env.VITE_NOMIA_URL     || 'https://app.nomia.talenio.tech',
    landingUrl: 'https://nomia.talenio.tech',
    features:   ['Presupuesto de nómina', 'Real vs presupuesto', 'Escenarios y proyecciones'],
  },
}

// ── Iconos SVG ────────────────────────────────────────────────────────────────
// Cada uno refleja la paleta de su app, trazo limpio, mismo grid 40×40

function IconClimia() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="#F7F0FA"/>
      {/* Silueta de personas / equipo */}
      <circle cx="14" cy="15" r="3.5" fill="#73017B" opacity=".25"/>
      <circle cx="26" cy="15" r="3.5" fill="#73017B" opacity=".25"/>
      <circle cx="20" cy="13" r="4" fill="#73017B" opacity=".7"/>
      {/* Pulso / onda */}
      <polyline points="8,27 13,22 17,25 20,19 23,25 27,22 32,27"
        stroke="#73017B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

function IconPromotIA() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="#FDF0F7"/>
      {/* Bocadillo */}
      <path d="M9 13h22a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 31 27h-8l-4.5 3.5V27H9a2.5 2.5 0 0 1-2.5-2.5v-9A2.5 2.5 0 0 1 9 13Z"
        fill="#C4006C" opacity=".1" stroke="#C4006C" strokeWidth="1.4"/>
      {/* Corazón NPS */}
      <path d="M20 25l-3.8-3.6c-1-1-.85-2.6.3-3.35.9-.6 2.1-.35 2.8.5l.7.85.7-.85c.7-.85 1.9-1.1 2.8-.5 1.15.75 1.3 2.35.3 3.35L20 25Z"
        fill="#C4006C"/>
    </svg>
  )
}

function IconBandas() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="#EEF0FF"/>
      {/* Barras de salario */}
      <rect x="8"  y="26" width="5" height="7"  rx="2" fill="#002EE5" opacity=".2"/>
      <rect x="15" y="21" width="5" height="12" rx="2" fill="#002EE5" opacity=".45"/>
      <rect x="22" y="16" width="5" height="17" rx="2" fill="#002EE5" opacity=".7"/>
      <rect x="29" y="11" width="5" height="22" rx="2" fill="#002EE5"/>
      {/* Línea de tendencia mint */}
      <polyline points="10,24 17,19 24,14 31,10"
        stroke="#65E3C3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="31" cy="10" r="2.5" fill="#65E3C3"/>
    </svg>
  )
}

function IconNomia() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="#F0FDFA"/>
      {/* Documento presupuesto */}
      <rect x="9" y="8" width="22" height="26" rx="4" fill="#0F766E" opacity=".1" stroke="#0F766E" strokeWidth="1.4"/>
      {/* Líneas de ítem */}
      <line x1="14" y1="16" x2="27" y2="16" stroke="#0F766E" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="14" y1="20" x2="24" y2="20" stroke="#0F766E" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="14" y1="24" x2="21" y2="24" stroke="#0F766E" strokeWidth="1.6" strokeLinecap="round"/>
      {/* Símbolo $ */}
      <circle cx="29" cy="29" r="7" fill="#0F766E"/>
      <text x="29" y="33" textAnchor="middle" fontSize="9" fill="white" fontWeight="800" fontFamily="system-ui">$</text>
    </svg>
  )
}

const ICONS = { climia: IconClimia, promotia: IconPromotIA, bandas: IconBandas, nomia: IconNomia }

// ── Logo Talenio ─────────────────────────────────────────────────────────────

function TalenioLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill={T.blue}/>
      {/* T geométrica limpia */}
      <rect x="8"  y="11" width="24" height="5.5" rx="2.5" fill="white"/>
      <rect x="17.25" y="16.5" width="5.5" height="14" rx="2.5" fill="white"/>
      {/* Punto mint */}
      <circle cx="32" cy="10" r="4" fill={T.mint}/>
    </svg>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ color = T.blue, size = 14 }) {
  return (
    <span style={{
      width: size, height: size,
      border: `2px solid ${color}30`, borderTopColor: color,
      borderRadius: '50%', display: 'inline-block',
      animation: 'spin .7s linear infinite', flexShrink: 0,
    }}/>
  )
}

// ── Global styles ────────────────────────────────────────────────────────────

const GlobalStyle = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: ${T.bg}; font-family: ${T.font}; color: ${T.ink}; min-height: 100vh; line-height: 1.5; }
    @keyframes spin   { to { transform: rotate(360deg) } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
    input, select, button { font-family: ${T.font}; }
    input { outline: none; }
    input:focus { border-color: ${T.blue} !important; box-shadow: 0 0 0 3px ${T.blueSoft}; }
    a { text-decoration: none; }
    button { cursor: pointer; }
  `}</style>
)

// ── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen({ message = 'Cargando…' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: T.bg }}>
      <div style={{ textAlign: 'center' }}>
        <TalenioLogo size={48}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.inkSoft, fontWeight: 600, marginTop: 20, justifyContent: 'center', fontSize: 14 }}>
          <Spinner/> {message}
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
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 10, background: T.bg,
    border: `1px solid ${T.border}`, fontSize: 14, color: T.ink, transition: 'all .15s',
  }
  const label = { display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24,
      background: `radial-gradient(900px 400px at 20% -10%, rgba(0,46,229,.07), transparent), radial-gradient(700px 300px at 85% 110%, rgba(101,227,195,.14), transparent), ${T.bg}`,
    }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp .4s ease' }}>

        {/* Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <TalenioLogo size={42}/>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: T.navy, letterSpacing: '-0.02em', lineHeight: 1 }}>Talenio</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>by Delenio People</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: T.paper, borderRadius: 18, padding: '28px 28px 24px', border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(11,11,15,.06)' }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, color: T.navy, marginBottom: 4, letterSpacing: '-0.01em' }}>Iniciar sesión</h1>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>Accedé a todos tus productos desde un lugar.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={label}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@empresa.com" style={inputStyle}/>
            </div>

            <div>
              <label style={label}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" style={{ ...inputStyle, paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, fontSize: 14, padding: 2 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 13px', fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
              background: loading ? T.blueSoft : T.blue,
              color: loading ? T.blue : '#fff',
              fontSize: 14.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .15s', marginTop: 4,
            }}>
              {loading && <Spinner color={T.blue} size={13}/>}
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Footer login */}
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: T.muted }}>
          ¿Problemas para ingresar?{' '}
          <a href="mailto:hola@delenio.net" style={{ color: T.blue, fontWeight: 700 }}>hola@delenio.net</a>
        </p>

        {/* Mini producto strip */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 32 }}>
          {Object.entries(PRODUCTS).map(([key, p]) => {
            const Icon = ICONS[key]
            return (
              <div key={key} title={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: .55 }}>
                <Icon/>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '0.04em' }}>{p.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ productKey, active, onSelect }) {
  const p    = PRODUCTS[productKey]
  const Icon = ICONS[productKey]
  const [hover, setHover] = useState(false)
  const canClick = active && !p.comingSoon

  return (
    <div
      onClick={() => canClick && onSelect(productKey)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: T.paper,
        border: `1px solid ${hover && canClick ? p.color : T.border}`,
        borderRadius: T.radius + 4,
        padding: '22px 22px 18px',
        cursor: canClick ? 'pointer' : 'default',
        transition: 'all .18s',
        transform: hover && canClick ? 'translateY(-3px)' : 'none',
        boxShadow: hover && canClick ? `0 8px 28px ${p.color}20` : '0 1px 6px rgba(11,11,15,.05)',
        opacity: p.comingSoon ? .5 : 1,
        position: 'relative',
        animation: 'fadeUp .35s ease',
      }}
    >
      {/* Badge */}
      {p.comingSoon && (
        <span style={{ position: 'absolute', top: 14, right: 14, background: T.blueSoft, color: T.blue, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
          Próximamente
        </span>
      )}
      {!active && !p.comingSoon && (
        <span style={{ position: 'absolute', top: 14, right: 14, background: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
          No contratado
        </span>
      )}
      {active && p.freemium && (
        <span style={{ position: 'absolute', top: 14, right: 14, background: T.mintSoft, color: '#0F766E', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
          Gratis
        </span>
      )}

      <div style={{ marginBottom: 14 }}><Icon/></div>

      <h3 style={{ fontSize: 17, fontWeight: 800, color: p.color, marginBottom: 3, letterSpacing: '-0.01em' }}>{p.name}</h3>
      <p style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>{p.tagline}</p>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
        {p.features.map(f => (
          <li key={f} style={{ fontSize: 12, color: T.muted, display: 'flex', gap: 7, alignItems: 'center' }}>
            <span style={{ color: p.color, fontWeight: 800, fontSize: 10 }}>✓</span>{f}
          </li>
        ))}
      </ul>

      {!p.comingSoon && (
        <div style={{ paddingTop: 14, borderTop: `1px dashed ${T.border}`, display: 'flex', gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); if (active) window.location.href = p.url }}
            disabled={!active}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700,
              background: active ? p.color : T.border,
              color: active ? '#fff' : T.muted,
              cursor: active ? 'pointer' : 'not-allowed',
              transition: 'all .15s',
            }}
          >
            Acceder →
          </button>
          {p.landingUrl && (
            <a
              href={p.landingUrl}
              target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${T.border}`,
                fontSize: 12, fontWeight: 700, color: T.blue, textAlign: 'center',
                background: T.paper, display: 'block',
              }}
            >
              Contratar
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Hub ──────────────────────────────────────────────────────────────────────

function HubPage({ user, subscriptions, onLogout }) {
  const isAdmin = user?.role === 'admin' || user?.email?.endsWith('@delenio.net')
  const allProductKeys = Object.keys(PRODUCTS)
  const subsActive = subscriptions.filter(s => s.status === 'active').map(s => s.product)
  const freemium   = Object.entries(PRODUCTS).filter(([, p]) => p.freemium).map(([k]) => k)
  const activeProducts = isAdmin ? allProductKeys : [...new Set([...subsActive, ...freemium])]
  const paidActive = isAdmin ? allProductKeys.filter(k => !PRODUCTS[k]?.freemium) : subsActive.filter(k => !PRODUCTS[k]?.freemium)

  function handleSelect(key) { window.location.href = PRODUCTS[key].url }

  useEffect(() => {
    // Auto-redirige solo si hay exactamente 1 producto pago activo
    if (paidActive.length === 1) {
      const t = setTimeout(() => handleSelect(paidActive[0]), 1400)
      return () => clearTimeout(t)
    }
  }, [paidActive.join(',')])

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>

      {/* Topbar — igual que Nomia/Bandas */}
      <div style={{ background: T.paper, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TalenioLogo size={30}/>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.navy, letterSpacing: '-0.01em', lineHeight: 1 }}>Talenio</div>
              <div style={{ fontSize: 10.5, color: T.muted }}>by Delenio People</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: T.muted, display: 'none' }}>{user?.email}</span>
            <button onClick={onLogout} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 13px', fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Hero strip — estilo Bandas */}
      <div style={{
        background: `radial-gradient(900px 200px at 5% -20%, rgba(0,46,229,.06), transparent), radial-gradient(600px 180px at 95% -10%, rgba(101,227,195,.12), transparent), ${T.paper}`,
        borderBottom: `1px solid ${T.border}`,
        padding: '32px 0 28px',
      }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', padding: '0 24px' }}>
          {paidActive.length === 1 ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, marginBottom: 6, letterSpacing: '-0.02em' }}>
                Redirigiendo a {PRODUCTS[paidActive[0]]?.name}…
              </h1>
              <p style={{ color: T.muted, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spinner size={13}/> Te llevamos automáticamente.
              </p>
            </>
          ) : activeProducts.length === 0 ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, marginBottom: 6, letterSpacing: '-0.02em' }}>Sin productos activos</h1>
              <p style={{ color: T.muted, fontSize: 14 }}>
                Contactanos para activar tu acceso:{' '}
                <a href="mailto:hola@delenio.net" style={{ color: T.blue, fontWeight: 700 }}>hola@delenio.net</a>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, marginBottom: 6, letterSpacing: '-0.02em' }}>
                Tus productos
              </h1>
              <p style={{ color: T.muted, fontSize: 14 }}>
                Seleccioná el producto al que querés acceder. Los no contratados están disponibles para sumar.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 24px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
          {Object.keys(PRODUCTS).map(key => (
            <ProductCard key={key} productKey={key} active={activeProducts.includes(key)} onSelect={handleSelect}/>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession]             = useState(null)
  const [userRow, setUserRow]             = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserData(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) loadUserData(session.user.id)
      else { setUserRow(null); setSubscriptions([]); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadUserData(userId) {
    setLoading(true)
    try {
      const { data: row } = await supabase.from('users').select('company_id, role').eq('id', userId).maybeSingle()
      setUserRow(row)
      if (row?.company_id) {
        const { data: subs } = await supabase.from('subscriptions').select('product, plan, status').eq('company_id', row.company_id)
        setSubscriptions(subs || [])
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  if (loading)    return <><GlobalStyle/><LoadingScreen message="Cargando tus productos…"/></>
  if (!session)   return <><GlobalStyle/><LoginPage/></>
  return <><GlobalStyle/><HubPage user={{ ...session.user, role: userRow?.role }} subscriptions={subscriptions} onLogout={handleLogout}/></>
}
