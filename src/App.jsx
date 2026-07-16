import { useState, useEffect, useRef, useMemo } from 'react'
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
    color:      '#13B0AC',
    colorSoft:  '#E6F8F7',
    colorMid:   '#0E8F8B',
    url:        'https://app.climia.talenio.tech',
    landingUrl: 'https://climia.talenio.tech',
    features:   ['Encuestas de pulso', 'Análisis por área', 'Informe ejecutivo IA'],
  },
  promotia: {
    name:       'PromotIA',
    tagline:    'NPS B2B con inteligencia artificial',
    color:      '#73017B',
    colorSoft:  '#F7F0FA',
    colorMid:   '#9B2DA3',
    url:        'https://app.promotia.talenio.tech',
    landingUrl: 'https://promotia.talenio.tech',
    features:   ['Encuestas NPS', 'Análisis de detractores', 'Plan de acción IA'],
  },
  bandas: {
    name:       'Bandas',
    tagline:    'Estudios de mercado salarial',
    color:      '#002EE5',
    colorSoft:  '#EEF0FF',
    colorMid:   '#2B3FE0',
    url:        'https://bandas.talenio.tech',
    features:   ['Estudios gratuitos de mercado', 'Comparación por sector', 'Rangos por posición'],
    freemium:   true,
  },
  nomia: {
    name:       'Nomia',
    tagline:    'Presupuesto y control de payroll',
    color:      '#2B3FE0',
    colorSoft:  '#EEF0FF',
    colorMid:   '#002EE5',
    url:        'https://app.nomia.talenio.tech',
    landingUrl: 'https://nomia.talenio.tech',
    features:   ['Presupuesto de nómina', 'Real vs presupuesto', 'Escenarios y proyecciones'],
  },
}

// ── Iconos SVG ────────────────────────────────────────────────────────────────
// Cada uno refleja la paleta de su app, trazo limpio, mismo grid 40×40

function IconClimia() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="#E6F8F7"/>
      <polyline points="6,26 12,20 17,23 20,16 23,23 28,18 34,26"
        stroke="#13B0AC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="20" cy="16" r="2.8" fill="#13B0AC"/>
    </svg>
  )
}

function IconPromotIA() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="#F7F0FA"/>
      <path d="M8 12h24a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9l-5 4v-4H8a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2Z"
        fill="#73017B" opacity=".12" stroke="#73017B" strokeWidth="1.5"/>
      <path d="M20 24l-4-3.8c-1.05-1-.9-2.7.32-3.5.94-.6 2.2-.35 2.9.52l.78.9.78-.9c.7-.87 1.96-1.12 2.9-.52 1.22.8 1.37 2.5.32 3.5L20 24Z"
        fill="#73017B"/>
    </svg>
  )
}

function IconBandas() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="#EEF0FF"/>
      <rect x="8"  y="26" width="5" height="7"  rx="2" fill="#002EE5" opacity=".2"/>
      <rect x="15" y="21" width="5" height="12" rx="2" fill="#002EE5" opacity=".45"/>
      <rect x="22" y="16" width="5" height="17" rx="2" fill="#002EE5" opacity=".7"/>
      <rect x="29" y="11" width="5" height="22" rx="2" fill="#002EE5"/>
      <polyline points="10,24 17,19 24,14 31,10"
        stroke="#65E3C3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="31" cy="10" r="2.5" fill="#65E3C3"/>
    </svg>
  )
}

function IconNomia() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="#EEF0FF"/>
      <rect x="9" y="8" width="22" height="26" rx="4" fill="#2B3FE0" opacity=".1" stroke="#2B3FE0" strokeWidth="1.4"/>
      <line x1="14" y1="16" x2="27" y2="16" stroke="#2B3FE0" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="14" y1="20" x2="24" y2="20" stroke="#2B3FE0" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="14" y1="24" x2="21" y2="24" stroke="#2B3FE0" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="29" cy="29" r="7" fill="#2B3FE0"/>
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
  const [tab, setTab]           = useState('login') // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message)
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault(); setError(''); setInfo(''); setLoading(true)
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); setLoading(false); return }
    const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    // Crear fila en users (sin empresa, pendiente de activación)
    if (data.user) {
      await supabase.from('users').upsert({ id: data.user.id, email: email.trim().toLowerCase(), role: 'client' }, { onConflict: 'id' })
    }
    setInfo('Cuenta creada. Revisá tu email para confirmarla. Un administrador asignará tu empresa.')
    setLoading(false)
  }

  async function handleGoogle() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  async function handleForgot(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    })
    if (error) setError(error.message)
    else { setInfo('Te enviamos un email para restablecer tu contraseña.'); setForgotMode(false) }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 10, background: T.bg,
    border: `1px solid ${T.border}`, fontSize: 14, color: T.ink, transition: 'all .15s',
  }
  const label = { display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* Panel izquierdo — gradiente teal como Climia */}
      <div style={{
        flex: '0 0 45%', minHeight: '100vh',
        background: 'linear-gradient(145deg, #13B0AC 0%, #0E8F8B 40%, #002EE5 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 48px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }}/>
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }}/>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <TalenioLogo size={36}/>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>Talenio</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>by Delenio People</div>
          </div>
        </div>

        {/* Tagline central */}
        <div style={{ position: 'relative' }}>
          {/* Onda decorativa estilo Climia */}
          <svg width="220" height="50" viewBox="0 0 220 50" fill="none" style={{ marginBottom: 28, opacity: .5 }}>
            <polyline points="0,35 40,15 80,28 110,8 140,28 180,12 220,35"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Tus herramientas de People, en un solo lugar.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>
            Clima, NPS, bandas salariales y payroll — todo integrado con IA.
          </p>
        </div>

        {/* Productos strip */}
        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
          {Object.entries(PRODUCTS).map(([key, p]) => (
            <div key={key} style={{ background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '7px 12px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px', background: '#fff' }}>
        <div style={{ maxWidth: 360, width: '100%', animation: 'fadeUp .4s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Bienvenido</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, marginBottom: 24, letterSpacing: '-0.02em' }}>
            {tab === 'login' ? 'Ingresá a Talenio' : 'Crear cuenta'}
          </h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: T.bg, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[['login','Iniciar sesión'],['register','Registrarse']].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); setInfo('') }} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? T.navy : T.muted,
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                cursor: 'pointer', transition: 'all .15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Modo recuperar contraseña */}
          {forgotMode && (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: T.inkSoft, marginBottom: 4 }}>
                Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
              </p>
              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 13px', fontSize: 13, color: '#DC2626' }}>{error}</div>}
              {info && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#166534' }}>{info}</div>}
              <div>
                <label style={label}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@empresa.com" style={inputStyle}/>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#13B0AC', color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading && <Spinner color="#fff" size={13}/>}
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
              <button type="button" onClick={() => { setForgotMode(false); setError('') }} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer' }}>
                ← Volver al login
              </button>
            </form>
          )}

          {/* Google + formulario login/registro */}
          {!forgotMode && (<>
            <button type="button" onClick={handleGoogle} style={{
              width: '100%', padding: '11px 0', borderRadius: 10, border: `1px solid ${T.border}`,
              background: '#fff', color: T.navy, fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', marginBottom: 18,
            }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continuar con Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: T.border }}/>
              <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>o con email</span>
              <div style={{ flex: 1, height: 1, background: T.border }}/>
            </div>

            {info && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#166534', marginBottom: 14 }}>{info}</div>}
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 13px', fontSize: 13, color: '#DC2626', marginBottom: 14 }}>{error}</div>}

            <form onSubmit={tab === 'login' ? handleSubmit : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tab === 'register' && (
                <div>
                  <label style={label}>Nombre completo</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Juan Pérez" style={inputStyle}/>
                </div>
              )}
              <div>
                <label style={label}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@empresa.com" style={inputStyle}/>
              </div>
              <div>
                <label style={label}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••" style={{ ...inputStyle, paddingRight: 42 }}/>
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, padding: 2, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                    {showPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: loading ? T.border : '#13B0AC', color: '#fff', fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .15s', marginTop: 4, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading && <Spinner color="#fff" size={13}/>}
                {loading ? (tab === 'login' ? 'Ingresando…' : 'Creando cuenta…') : (tab === 'login' ? 'Ingresar' : 'Crear cuenta')}
              </button>
            </form>

            {tab === 'login' && (
              <button type="button" onClick={() => { setForgotMode(true); setError(''); setInfo('') }} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 12.5, cursor: 'pointer', marginTop: 12, padding: 0 }}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </>)}

          <p style={{ marginTop: 18, fontSize: 12, color: T.muted }}>
            ¿Problemas? <a href="mailto:hola@delenio.net" style={{ color: '#13B0AC', fontWeight: 700 }}>hola@delenio.net</a>
          </p>
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
            onClick={e => { e.stopPropagation(); if (active) onSelect(productKey) }}
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
          {p.landingUrl && !p.freemium && (
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

function HubPage({ user, subscriptions, companyId, onLogout }) {
  const isAdmin = user?.role === 'admin' || user?.email?.endsWith('@delenio.net')
  const allProductKeys = Object.keys(PRODUCTS)
  const subsActive = subscriptions.filter(s => s.status === 'active').map(s => s.product)
  const freemium   = Object.entries(PRODUCTS).filter(([, p]) => p.freemium).map(([k]) => k)
  const activeProducts = isAdmin ? allProductKeys : [...new Set([...subsActive, ...freemium])]
  const paidActive = isAdmin ? allProductKeys.filter(k => !PRODUCTS[k]?.freemium) : subsActive.filter(k => !PRODUCTS[k]?.freemium)
  const [subError, setSubError] = useState(null)

  async function handleSelect(key) {
    setSubError(null)
    const p = PRODUCTS[key]

    // Admins siempre pasan
    if (!isAdmin && !p.freemium) {
      // Re-chequear suscripción en tiempo real contra la DB (sincronizada con Stripe)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('company_id', companyId)
        .eq('product', key)
        .maybeSingle()

      if (!sub || sub.status !== 'active') {
        setSubError({ product: p.name, status: sub?.status || 'none' })
        return
      }
    }

    // SSO via hash fragment — Supabase JS lo detecta y procesa automáticamente al cargar la app
    const { data: { session: s } } = await supabase.auth.getSession()
    if (!s?.access_token) { setSubError({ product: p.name, status: 'link_error' }); return }
    const hash = `#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer`
    window.open(`${p.url}/${hash}`, '_blank')
  }

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

      {/* Banner error de suscripción */}
      {subError && (
        <div style={{ maxWidth: 1020, margin: '16px auto 0', padding: '0 24px' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#991B1B', marginBottom: 2 }}>
                Suscripción inactiva — {subError.product}
              </div>
              <div style={{ fontSize: 12.5, color: '#B91C1C' }}>
                {subError.status === 'canceled' ? 'La suscripción fue cancelada.' :
                 subError.status === 'past_due'  ? 'El pago está vencido. Regularizá tu suscripción para acceder.' :
                 subError.status === 'unpaid'    ? 'Pago pendiente. Revisá tu método de pago.' :
                 'Tu empresa no tiene una suscripción activa para este producto.'}
                {' '}<a href="mailto:hola@delenio.net" style={{ color: '#991B1B', fontWeight: 700 }}>Contactanos</a> para solucionarlo.
              </div>
            </div>
            <button onClick={() => setSubError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#B91C1C', lineHeight: 1, padding: 4 }}>×</button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 24px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
          {Object.keys(PRODUCTS).map(key => (
            <ProductCard key={key} productKey={key} active={activeProducts.includes(key)} onSelect={handleSelect}/>
          ))}
        </div>
      </div>

      {/* Panel admin */}
      {isAdmin && <AdminPanel />}
    </div>
  )
}

// ── Admin Panel ───────────────────────────────────────────────────────────────

// ── Admin helpers ─────────────────────────────────────────────────────────────

async function adminCall(action, params = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ action, ...params }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error del servidor')
  return json
}

// ── Modal genérico ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: T.paper, borderRadius: 18, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,.22)', position: 'relative' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.navy, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: T.muted, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── AdminPanel ────────────────────────────────────────────────────────────────

function AdminPanel() {
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }

  const [tab, setTab]             = useState('companies')
  const [searchQ, setSearchQ]     = useState('')
  const [users, setUsers]         = useState([])
  const [companies, setCompanies] = useState([])
  const [subs, setSubs]           = useState([])
  const [nomiaClientes, setNomiaClientes] = useState([])
  const [climiaClients, setClimiaClients] = useState([])
  const [nomiaPerfiles, setNomiaPerfiles] = useState([])
  const [climiaProfiles, setClimiaProfiles] = useState([])
  const [metrics, setMetrics]     = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [revenue, setRevenue]     = useState(null)
  const [revLoading, setRevLoading] = useState(false)
  // costs config per product (monthly, same currency as Stripe prices / 100)
  const [costs, setCosts]         = useState({})
  const [crossSellModal, setCrossSellModal] = useState(null) // { company, suggestion, loading }
  const [showNotifs, setShowNotifs] = useState(false)
  const [wizard, setWizard]       = useState(null) // null | { step:0|1|2, companyId:null, companyName:'' }
  const [wizCoName, setWizCoName] = useState('')
  const [wizCoProds, setWizCoProds] = useState([])
  const [wizUEmail, setWizUEmail] = useState('')
  const [wizUName, setWizUName]   = useState('')
  const [wizUPass, setWizUPass]   = useState('')
  const [wizUProds, setWizUProds] = useState([])
  const [wizLoading, setWizLoading] = useState(false)
  const [wizErr, setWizErr]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [err, setErr]             = useState('')

  // Crear usuario
  const [uEmail, setUEmail]             = useState('')
  const [uName, setUName]               = useState('')
  const [uRole, setURole]               = useState('client')
  const [uCompany, setUCompany]         = useState('')
  const [uProducts, setUProducts]       = useState([])
  const [uPassword, setUPassword]       = useState('')
  const [uNomiaCliente, setUNomiaCliente] = useState('')
  const [uClimiaClient, setUClimiaClient] = useState('')

  // Crear empresa
  const [cName, setCName]         = useState('')
  const [cProducts, setCProducts] = useState([])

  // Editar empresa
  const [editCo, setEditCo]     = useState(null) // { id, name, is_active }
  const [editCoName, setEditCoName]       = useState('')
  const [editCoProds, setEditCoProds]     = useState([])
  const [editCoActive, setEditCoActive]   = useState(true)

  // Editar usuario
  const [editUser, setEditUser]               = useState(null)
  const [editUserName, setEditUserName]       = useState('')
  const [editUserEmail, setEditUserEmail]     = useState('')
  const [editUserRole, setEditUserRole]       = useState('client')
  const [editUserCompany, setEditUserCompany] = useState('')
  const [editUserProds, setEditUserProds]     = useState([])
  const [editNomiaCliente, setEditNomiaCliente] = useState('')
  const [editClimiaClient, setEditClimiaClient] = useState('')

  // Suscripciones Stripe
  const [checkoutModal, setCheckoutModal]   = useState(null) // { company, product, plan, url }
  const [subAction, setSubAction]           = useState(null) // 'activar' | 'portal'
  const PLANS = { climia: ['Start','Growth','Scale'], promotia: ['Start','Growth','Scale'], nomia: ['Base','Growth'] }

  async function generarCheckout(company, product, plan) {
    setSaving(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, plan, companyName: company.name,
          ...(company.stripe_customer_id ? { stripeCustomerId: company.stripe_customer_id } : {}),
          successUrl: `https://hub.talenio.tech?checkout=success&product=${product}`,
          cancelUrl: 'https://hub.talenio.tech',
        })
      })
      const data = await res.json()
      if (data.url) setCheckoutModal({ company, product, plan, url: data.url })
      else flash(false, data.error || 'Error al generar link de Stripe')
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  async function grantFreeAccess(company, product) {
    setSaving(true)
    try {
      await adminCall('grantFreeAccess', { company_id: company.id, product })
      flash(true, `Acceso gratuito a ${PRODUCTS[product]?.name} otorgado a "${company.name}".`)
      loadData()
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  async function revokeAccess(company, product) {
    if (!confirm(`¿Revocar acceso de "${company.name}" a ${PRODUCTS[product]?.name}?`)) return
    setSaving(true)
    try {
      await adminCall('revokeAccess', { company_id: company.id, product })
      flash(true, `Acceso a ${PRODUCTS[product]?.name} revocado.`)
      loadData()
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  async function abrirPortal(company) {
    if (!company.stripe_customer_id) { flash(false, 'Esta empresa no tiene un cliente Stripe asignado todavía.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal', stripeCustomerId: company.stripe_customer_id })
      })
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
      else flash(false, data.error || 'Error al abrir portal de Stripe')
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (tab === 'dashboard') { loadMetrics(); loadRevenue() } }, [tab])

  async function loadMetrics() {
    setMetricsLoading(true)
    try {
      const data = await adminCall('getMetrics')
      setMetrics(data)
    } catch(e) {
      setErr(e.message)
    }
    setMetricsLoading(false)
  }

  async function loadRevenue() {
    setRevLoading(true)
    try {
      const data = await adminCall('getRevenue')
      setRevenue(data)
    } catch(e) {
      setErr(e.message)
    }
    setRevLoading(false)
  }

  async function triggerCrossSell(company) {
    const activeProducts = companyProducts(company.id)
    setCrossSellModal({ company, suggestion: null, loading: true })
    try {
      const data = await adminCall('crossSell', { companyName: company.name, activeProducts })
      setCrossSellModal({ company, suggestion: data.suggestion, loading: false })
    } catch(e) {
      setCrossSellModal({ company, suggestion: 'Error al generar sugerencia: ' + e.message, loading: false })
    }
  }

  async function saveCosts(updated) {
    setCosts(updated)
    try { await adminCall('setSettings', { key: 'costs', value: updated }) } catch(e) { console.warn('saveCosts:', e.message) }
  }

  async function loadData() {
    setLoading(true)
    try {
      const [data, settingsRes] = await Promise.all([
        adminCall('getData'),
        adminCall('getSettings', { key: 'costs' }),
      ])
      setUsers(data.users || [])
      setCompanies(data.companies || [])
      setSubs(data.subs || [])
      setNomiaClientes(data.nomiaClientes || [])
      setClimiaClients(data.climiaClients || [])
      setNomiaPerfiles(data.nomiaPerfiles || [])
      setClimiaProfiles(data.climiaProfiles || [])
      if (settingsRes?.value) setCosts(settingsRes.value)
    } catch(e) {
      setErr(e.message)
    }
    setLoading(false)
  }

  function companyProducts(companyId) {
    return subs.filter(s => s.company_id === companyId && s.status === 'active').map(s => s.product)
  }

  function flash(ok, text) {
    if (ok) setMsg(text); else setErr(text)
    setTimeout(() => { setMsg(''); setErr('') }, 4000)
  }

  // ── Notificaciones ───────────────────────────────────────────────────────────
  const notifications = useMemo(() => {
    const alerts = []
    users.filter(u => u.role !== 'admin' && !u.company_id).forEach(u =>
      alerts.push({ level: 'warn', text: `${u.name || u.email} sin empresa asignada`, action: () => { setShowNotifs(false); openEditUser(u) } })
    )
    users.filter(u => u.role !== 'admin' && u.company_id && (!u.products || u.products.length === 0)).forEach(u =>
      alerts.push({ level: 'warn', text: `${u.name || u.email} sin acceso a ningún producto`, action: () => { setShowNotifs(false); openEditUser(u) } })
    )
    companies.filter(c => c.is_active === false).forEach(c =>
      alerts.push({ level: 'error', text: `Empresa "${c.name}" suspendida`, action: () => { setShowNotifs(false); openEditCo(c) } })
    )
    const activeCoIds = new Set(subs.filter(s => s.status === 'active').map(s => s.company_id))
    companies.filter(c => c.is_active !== false && !activeCoIds.has(c.id)).forEach(c =>
      alerts.push({ level: 'info', text: `"${c.name}" sin suscripción activa`, action: () => { setShowNotifs(false); setTab('subscriptions') } })
    )
    return alerts
  }, [users, companies, subs])

  // ── Wizard onboarding ────────────────────────────────────────────────────────
  function openWizard() {
    setWizard({ step: 0, companyId: null, companyName: '' })
    setWizCoName(''); setWizCoProds([]); setWizUEmail(''); setWizUName(''); setWizUPass(''); setWizUProds([]); setWizErr('')
  }

  async function wizStep0(e) {
    e.preventDefault(); setWizLoading(true); setWizErr('')
    try {
      await adminCall('createCompany', { name: wizCoName, products: wizCoProds })
      await loadData()
      setWizard(w => ({ ...w, step: 1, companyName: wizCoName }))
    } catch(e) { setWizErr(e.message) }
    setWizLoading(false)
  }

  async function wizStep1(e) {
    e.preventDefault(); setWizLoading(true); setWizErr('')
    try {
      const freshData = await adminCall('getData')
      const co = (freshData.companies || []).find(c => c.name === wizCoName)
      if (!co) throw new Error('Empresa no encontrada tras crearla')
      await adminCall('createUser', {
        email: wizUEmail, name: wizUName, role: 'client',
        company_id: co.id, products: wizUProds,
        password: wizUPass || undefined,
      })
      setWizard(w => ({ ...w, step: 2 }))
      await loadData()
    } catch(e) { setWizErr(e.message) }
    setWizLoading(false)
  }

  async function createUser(e) {
    e.preventDefault(); setSaving(true)
    try {
      await adminCall('createUser', {
        email: uEmail, name: uName, role: uRole,
        company_id: uCompany || null, products: uProducts, password: uPassword || undefined,
        nomia_cliente_id: uProducts.includes('nomia') && uNomiaCliente ? Number(uNomiaCliente) : undefined,
        climia_client_id: uProducts.includes('climia') && uClimiaClient ? Number(uClimiaClient) : undefined,
      })
      flash(true, uPassword ? `Usuario ${uEmail} creado con contraseña.` : `Usuario ${uEmail} creado. Recibirá un email de invitación.`)
      setUEmail(''); setUName(''); setURole('client'); setUCompany(''); setUProducts([]); setUPassword('')
      setUNomiaCliente(''); setUClimiaClient('')
      loadData()
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  async function createCompany(e) {
    e.preventDefault(); setSaving(true)
    try {
      await adminCall('createCompany', { name: cName, products: cProducts })
      flash(true, `Empresa "${cName}" creada.`)
      setCName(''); setCProducts([])
      loadData()
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  function openEditCo(c) {
    setEditCo(c)
    setEditCoName(c.name)
    setEditCoProds(companyProducts(c.id))
    setEditCoActive(c.is_active !== false)
  }

  async function saveEditCo(e) {
    e.preventDefault(); setSaving(true)
    try {
      await adminCall('updateCompany', { id: editCo.id, name: editCoName, products: editCoProds, is_active: editCoActive })
      flash(true, `Empresa actualizada.`)
      setEditCo(null)
      loadData()
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  async function toggleSuspendCo(c) {
    const newActive = c.is_active === false ? true : false
    setSaving(true)
    try {
      await adminCall('updateCompany', { id: c.id, is_active: newActive })
      flash(true, newActive ? `Empresa "${c.name}" reactivada.` : `Empresa "${c.name}" suspendida.`)
      loadData()
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  function openEditUser(u) {
    setEditUser(u)
    setEditUserName(u.name || '')
    setEditUserEmail(u.email || '')
    setEditUserRole(u.role)
    setEditUserCompany(u.company_id || '')
    setEditUserProds(u.products || [])
    // Pre-cargar asignaciones actuales de apps
    const nomPerfil = nomiaPerfiles.find(p => p.id === u.id)
    const climPerfil = climiaProfiles.find(p => p.id === u.id)
    setEditNomiaCliente(nomPerfil?.cliente_id != null ? String(nomPerfil.cliente_id) : '')
    setEditClimiaClient(climPerfil?.client_id != null ? String(climPerfil.client_id) : '')
  }

  async function saveEditUser(e) {
    e.preventDefault(); setSaving(true)
    try {
      await adminCall('updateUser', {
        id: editUser.id,
        name: editUserName,
        email: editUserEmail !== editUser.email ? editUserEmail : undefined,
        role: editUserRole,
        company_id: editUserCompany || null,
        products: editUserProds,
        nomia_cliente_id: editUserProds.includes('nomia') ? (editNomiaCliente ? Number(editNomiaCliente) : null) : undefined,
        climia_client_id: editUserProds.includes('climia') ? (editClimiaClient ? Number(editClimiaClient) : null) : undefined,
      })
      flash(true, 'Usuario actualizado.')
      setEditUser(null)
      loadData()
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  async function toggleSuspendUser(u) {
    const suspend = u.role !== 'suspended'
    setSaving(true)
    try {
      await adminCall('suspendUser', { id: u.id, suspended: suspend })
      flash(true, suspend ? `${u.email} suspendido.` : `${u.email} reactivado.`)
      loadData()
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  async function sendPasswordReset(u) {
    setSaving(true)
    try {
      await adminCall('sendPasswordReset', { email: u.email })
      flash(true, `Email de recuperación enviado a ${u.email}.`)
    } catch(e) { flash(false, e.message) }
    setSaving(false)
  }

  const StatusBadge = ({ active }) => (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
      background: active ? '#DCFCE7' : '#FEF2F2', color: active ? '#166534' : '#DC2626' }}>
      {active ? 'Activo' : 'Suspendido'}
    </span>
  )

  const IconBtn = ({ label, color, onClick }) => (
    <button onClick={onClick} title={label} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, color, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )

  return (
    <div style={{ borderTop: `2px solid ${T.border}`, background: T.bg, padding: '40px 0 72px' }}>
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '0 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blue, display: 'grid', placeItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: T.navy }}>Administración</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Campana de notificaciones */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifs(v => !v)} style={{
                position: 'relative', background: showNotifs ? T.blueSoft : 'none', border: `1px solid ${T.border}`,
                borderRadius: 8, width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={notifications.length > 0 ? T.blue : T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: '#E5564B', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', lineHeight: 1 }}>
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div style={{ position: 'absolute', right: 0, top: 40, width: 320, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.13)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>Alertas</span>
                    <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: T.muted, cursor: 'pointer', lineHeight: 1, padding: 2 }}>×</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Sin alertas pendientes ✓</div>
                  ) : (
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.map((n, i) => (
                        <button key={i} onClick={n.action} style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`,
                          padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{n.level === 'error' ? '🔴' : n.level === 'warn' ? '🟡' : '🔵'}</span>
                          <span style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.4 }}>{n.text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Wizard nuevo cliente */}
            <button onClick={openWizard} style={{ background: T.blue, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Nuevo cliente
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, background: T.border, borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 24 }}>
          {[['dashboard','Dashboard'],['companies','Empresas'],['users','Usuarios'],['subscriptions','Suscripciones']].map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); setErr(''); setSearchQ('') }} style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
              background: tab === t ? '#fff' : 'transparent', color: tab === t ? T.navy : T.muted,
              cursor: 'pointer', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
            }}>{l}</button>
          ))}
        </div>

        {msg && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 16 }}>{msg}</div>}
        {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>{err}</div>}

        {/* ── Tab Dashboard ── */}
        {tab === 'dashboard' && (
          <div>
            {metricsLoading || !metrics ? <Spinner/> : (() => {
              const { global: g, subs: subsProd, nomia, climia, promotia } = metrics
              const MetCard = ({ label, value, sub, color }) => (
                <div style={{ background: T.paper, borderRadius: 14, border: `1px solid ${T.border}`, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: color || T.navy, lineHeight: 1 }}>{value ?? '—'}</div>
                  {sub && <div style={{ fontSize: 12, color: T.muted }}>{sub}</div>}
                </div>
              )
              const Section = ({ title, color, children }) => (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: color || T.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>{title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>{children}</div>
                </div>
              )
              const TrendChart = ({ data }) => {
                if (!data || data.length === 0) return null
                const W = 560, H = 140, pad = { t: 16, r: 12, b: 28, l: 32 }
                const maxV = Math.max(...data.flatMap(d => [d.companies, d.users]), 1)
                const xStep = (W - pad.l - pad.r) / (data.length - 1)
                const yScale = v => pad.t + (H - pad.t - pad.b) * (1 - v / maxV)
                const pts = (key) => data.map((d, i) => `${pad.l + i * xStep},${yScale(d[key])}`).join(' ')
                const area = (key) => {
                  const coords = data.map((d, i) => ({ x: pad.l + i * xStep, y: yScale(d[key]) }))
                  return `M${coords[0].x},${yScale(0)} ` + coords.map(c => `L${c.x},${c.y}`).join(' ') + ` L${coords[coords.length-1].x},${yScale(0)} Z`
                }
                const monthLabel = m => { const [,mo] = m.split('-'); return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+mo-1] }
                return (
                  <div style={{ background: T.paper, borderRadius: 14, border: `1px solid ${T.border}`, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>Crecimiento mensual (últimos 6 meses)</div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                        <span style={{ color: T.blue, fontWeight: 700 }}>— Usuarios</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>— Empresas</span>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', minWidth: W }}>
                        {/* Y grid lines */}
                        {[0, 0.5, 1].map(f => (
                          <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + (H - pad.t - pad.b) * (1 - f)} y2={pad.t + (H - pad.t - pad.b) * (1 - f)}
                            stroke="#E5E7EB" strokeWidth="1"/>
                        ))}
                        {/* Area fills */}
                        <path d={area('users')} fill={T.blue} opacity="0.08"/>
                        <path d={area('companies')} fill="#10B981" opacity="0.08"/>
                        {/* Lines */}
                        <polyline points={pts('users')} fill="none" stroke={T.blue} strokeWidth="2.5" strokeLinejoin="round"/>
                        <polyline points={pts('companies')} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round"/>
                        {/* Dots */}
                        {data.map((d, i) => (
                          <g key={i}>
                            <circle cx={pad.l + i * xStep} cy={yScale(d.users)} r="4" fill="#fff" stroke={T.blue} strokeWidth="2"/>
                            <circle cx={pad.l + i * xStep} cy={yScale(d.companies)} r="4" fill="#fff" stroke="#10B981" strokeWidth="2"/>
                          </g>
                        ))}
                        {/* X labels */}
                        {data.map((d, i) => (
                          <text key={i} x={pad.l + i * xStep} y={H - 4} textAnchor="middle" fontSize="10" fill="#9CA3AF">{monthLabel(d.month)}</text>
                        ))}
                      </svg>
                    </div>
                  </div>
                )
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <Section title="Global">
                    <MetCard label="Empresas activas" value={g.activeCompanies} sub={`${g.totalCompanies} total`}/>
                    <MetCard label="Usuarios" value={g.totalUsers}/>
                    <MetCard label="Nuevas empresas" value={g.newCompanies} sub="últimos 30 días" color={T.blue}/>
                    <MetCard label="Nuevos usuarios" value={g.newUsers} sub="últimos 30 días" color={T.blue}/>
                  </Section>
                  <TrendChart data={metrics.trend}/>

                  <Section title="Nomia" color={PRODUCTS.nomia.color}>
                    <MetCard label="Clientes" value={nomia.clientes} sub={`${subsProd.nomia || 0} suscripciones activas`}/>
                    <MetCard label="Empleados" value={nomia.empleados}/>
                    <MetCard label="Escenarios" value={nomia.escenarios}/>
                  </Section>

                  <Section title="Climia" color={PRODUCTS.climia.color}>
                    <MetCard label="Clientes" value={climia.clients} sub={`${subsProd.climia || 0} suscripciones activas`}/>
                    <MetCard label="Usuarios activos" value={climia.profiles}/>
                  </Section>

                  <Section title="PromotIA" color={PRODUCTS.promotia.color}>
                    <MetCard label="Respuestas NPS" value={promotia.surveyResponses} sub={`${subsProd.promotia || 0} suscripciones activas`}/>
                  </Section>

                  {/* ── Rentabilidad ── */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Rentabilidad</div>
                    {revLoading ? <Spinner/> : revenue ? (() => {
                      const PRODS = ['nomia', 'climia', 'promotia']
                      const totalMRR = PRODS.reduce((s, p) => s + (revenue.mrrByProduct[p] || 0), 0)
                      const totalCost = PRODS.reduce((s, p) => s + (costs[p] || 0) * 100, 0)
                      const margin = totalMRR - totalCost
                      const fmt = (cents) => `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                            <div style={{ background: T.paper, borderRadius: 14, border: `1px solid ${T.border}`, padding: '20px 24px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>MRR Total</div>
                              <div style={{ fontSize: 28, fontWeight: 800, color: '#166534' }}>{fmt(totalMRR)}</div>
                            </div>
                            <div style={{ background: T.paper, borderRadius: 14, border: `1px solid ${T.border}`, padding: '20px 24px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Costos Mensuales</div>
                              <div style={{ fontSize: 28, fontWeight: 800, color: '#DC2626' }}>{fmt(totalCost)}</div>
                            </div>
                            <div style={{ background: margin >= 0 ? '#F0FDF4' : '#FEF2F2', borderRadius: 14, border: `1px solid ${margin >= 0 ? '#BBF7D0' : '#FECACA'}`, padding: '20px 24px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Margen</div>
                              <div style={{ fontSize: 28, fontWeight: 800, color: margin >= 0 ? '#166534' : '#DC2626' }}>{fmt(margin)}</div>
                            </div>
                          </div>
                          <div style={{ background: T.paper, borderRadius: 14, border: `1px solid ${T.border}`, padding: '16px 20px' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 12 }}>Costos por producto (mensual)</div>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                              {PRODS.map(p => (
                                <div key={p} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
                                  <label style={{ fontSize: 11, fontWeight: 700, color: PRODUCTS[p]?.color || T.muted, textTransform: 'uppercase' }}>{p}</label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 13, color: T.muted }}>$</span>
                                    <input type="number" min="0" value={costs[p] || ''} placeholder="0"
                                      onChange={e => saveCosts({ ...costs, [p]: Number(e.target.value) })}
                                      style={{ width: 90, padding: '6px 8px', borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, color: T.ink, background: T.bg }}/>
                                  </div>
                                  <div style={{ fontSize: 11, color: T.muted }}>MRR: {fmt(revenue.mrrByProduct[p] || 0)}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 10 }}>Los costos se guardan localmente en este navegador.</div>
                          </div>
                        </div>
                      )
                    })() : (
                      <button onClick={loadRevenue} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Cargar datos de Stripe
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={() => { loadMetrics(); loadRevenue() }} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Actualizar métricas
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Tab Suscripciones ── */}
        {tab === 'subscriptions' && (
          <div>
            {loading ? <Spinner/> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {companies.filter(c => c.is_active !== false).map(c => {
                  const cSubs = subs.filter(s => s.company_id === c.id)
                  return (
                    <div key={c.id} style={{ background: T.paper, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: T.navy }}>{c.name}</div>
                          {c.stripe_customer_id && (
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                              Stripe: {c.stripe_customer_id}
                            </div>
                          )}
                        </div>
                        {c.stripe_customer_id && (
                          <button onClick={() => abrirPortal(c)} disabled={saving}
                            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, fontSize: 12, fontWeight: 600, color: T.ink, cursor: saving ? 'not-allowed' : 'pointer' }}>
                            Portal Stripe ↗
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                        {Object.entries(PRODUCTS).filter(([,p]) => !p.freemium).map(([key, p]) => {
                          const sub = cSubs.find(s => s.product === key)
                          const isActive = sub?.status === 'active'
                          const plans = PLANS[key] || ['Start']

                          return (
                            <div key={key} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${isActive ? p.color + '40' : T.border}`, background: isActive ? (p.colorSoft || T.blueSoft) : T.bg }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{p.name}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                                  background: isActive ? '#DCFCE7' : '#F3F4F6', color: isActive ? '#166534' : T.muted }}>
                                  {isActive ? (sub?.plan ? `${sub.plan} ✓` : 'Activo') : sub?.status === 'past_due' ? 'Vencido' : sub?.status === 'canceled' ? 'Cancelado' : 'Sin suscripción'}
                                </span>
                              </div>

                              {isActive && c.stripe_customer_id ? (
                                // Suscripción Stripe activa → portal + revocar
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  <button onClick={() => abrirPortal(c)} disabled={saving}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: `1px solid ${p.color}40`, background: '#fff', fontSize: 11.5, fontWeight: 600, color: p.color, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    Gestionar plan ↗
                                  </button>
                                  <button onClick={() => revokeAccess(c, key)} disabled={saving}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 11.5, fontWeight: 600, color: '#DC2626', cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    Revocar acceso
                                  </button>
                                </div>
                              ) : !c.stripe_customer_id ? (
                                // Sin Stripe (sin suscripción o manual) → bonificar o activar con Stripe
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  <button onClick={() => grantFreeAccess(c, key)} disabled={saving}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: 12, fontWeight: 700, color: '#166534', cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    {saving ? 'Guardando…' : '🎁 Bonificar acceso'}
                                  </button>
                                  <div style={{ fontSize: 10, color: T.muted, textAlign: 'center' }}>— o activar con Stripe —</div>
                                  {plans.map(plan => (
                                    <button key={plan} onClick={() => generarCheckout(c, key, plan)} disabled={saving}
                                      style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${p.color}40`, background: '#fff', fontSize: 11.5, fontWeight: 600, color: p.color, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                      {saving ? 'Generando…' : isActive ? `Migrar a plan ${plan}` : `Activar plan ${plan}`}
                                    </button>
                                  ))}
                                  {isActive && (
                                    <button onClick={() => revokeAccess(c, key)} disabled={saving}
                                      style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 11.5, fontWeight: 600, color: '#DC2626', cursor: saving ? 'not-allowed' : 'pointer' }}>
                                      Revocar acceso
                                    </button>
                                  )}
                                </div>
                              ) : (
                                // Sin suscripción activa pero tiene Stripe → activar con Stripe
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  <button onClick={() => grantFreeAccess(c, key)} disabled={saving}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: 12, fontWeight: 700, color: '#166534', cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    🎁 Bonificar acceso
                                  </button>
                                  {plans.map(plan => (
                                    <button key={plan} onClick={() => generarCheckout(c, key, plan)} disabled={saving}
                                      style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${p.color}40`, background: '#fff', fontSize: 11.5, fontWeight: 600, color: p.color, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                      {saving ? 'Generando…' : `Activar plan ${plan}`}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tabs Empresas / Usuarios ── */}
        {tab !== 'subscriptions' && tab !== 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Formulario crear ── */}
          <div style={{ background: T.paper, borderRadius: 14, padding: 24, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: T.navy, marginBottom: 18 }}>
              {tab === 'companies' ? 'Nueva empresa' : 'Nuevo usuario'}
            </h3>

            {tab === 'companies' ? (
              <form onSubmit={createCompany} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={lbl}>Nombre</label><input style={inp} required value={cName} onChange={e => setCName(e.target.value)} placeholder="Empresa S.A."/></div>
                <div>
                  <label style={lbl}>Productos</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {Object.entries(PRODUCTS).filter(([,p]) => !p.freemium).map(([key, p]) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, background: cProducts.includes(key) ? (p.colorSoft || T.blueSoft) : T.bg }}>
                        <input type="checkbox" checked={cProducts.includes(key)} onChange={e => setCProducts(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}/>
                        <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ padding: '10px', borderRadius: 9, border: 'none', background: T.blue, color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Creando…' : 'Crear empresa'}
                </button>
              </form>
            ) : (
              <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={lbl}>Nombre completo</label><input style={inp} value={uName} onChange={e => setUName(e.target.value)} placeholder="Juan Pérez"/></div>
                <div><label style={lbl}>Email</label><input style={inp} type="email" required value={uEmail} onChange={e => setUEmail(e.target.value)} placeholder="usuario@empresa.com"/></div>
                <div>
                  <label style={lbl}>Contraseña <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(opcional — si no se ingresa, se envía invitación por email)</span></label>
                  <input style={inp} type="password" value={uPassword} onChange={e => setUPassword(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password"/>
                </div>
                <div>
                  <label style={lbl}>Rol</label>
                  <select style={inp} value={uRole} onChange={e => setURole(e.target.value)}>
                    <option value="client">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Empresa</label>
                  <select style={inp} value={uCompany} onChange={e => { setUCompany(e.target.value); setUProducts([]) }}>
                    <option value="">Sin empresa</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {uCompany && (() => {
                  const available = companyProducts(uCompany).filter(p => !PRODUCTS[p]?.freemium)
                  return available.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={lbl}>Acceso a productos y cliente por app</label>
                      {available.map(key => {
                        const p = PRODUCTS[key]
                        const checked = uProducts.includes(key)
                        return (
                          <div key={key} style={{ borderRadius: 10, border: `1px solid ${checked ? p.color + '50' : T.border}`, background: checked ? (p.colorSoft || T.blueSoft) : T.bg, overflow: 'hidden' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '9px 12px' }}>
                              <input type="checkbox" checked={checked} onChange={e => setUProducts(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}/>
                              <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                            </label>
                            {checked && uRole !== 'admin' && key === 'nomia' && (
                              <div style={{ padding: '0 12px 10px' }}>
                                <label style={{ ...lbl, marginBottom: 4 }}>Cliente en Nomia <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(opcional — se auto-asigna por empresa)</span></label>
                                <select style={inp} value={uNomiaCliente} onChange={e => setUNomiaCliente(e.target.value)}>
                                  <option value="">— Auto por empresa —</option>
                                  {nomiaClientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                              </div>
                            )}
                            {checked && uRole !== 'admin' && key === 'climia' && (
                              <div style={{ padding: '0 12px 10px' }}>
                                <label style={{ ...lbl, marginBottom: 4 }}>Cliente en Climia <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(opcional — se auto-asigna por empresa)</span></label>
                                <select style={inp} value={uClimiaClient} onChange={e => setUClimiaClient(e.target.value)}>
                                  <option value="">— Auto por empresa —</option>
                                  {climiaClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : <div style={{ fontSize: 12, color: T.muted, padding: '6px 0' }}>Esta empresa no tiene productos activos aún.</div>
                })()}
                <button type="submit" disabled={saving} style={{ padding: '10px', borderRadius: 9, border: 'none', background: T.blue, color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Creando…' : 'Crear usuario'}
                </button>
              </form>
            )}
          </div>

          {/* ── Lista ── */}
          <div style={{ background: T.paper, borderRadius: 14, padding: 24, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.navy, margin: 0 }}>
                {tab === 'companies' ? `Empresas (${companies.length})` : `Usuarios (${users.length})`}
              </h3>
              <button onClick={loadData} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 10px', fontSize: 11, color: T.muted, cursor: 'pointer' }}>
                ↺ Actualizar
              </button>
            </div>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={tab === 'companies' ? 'Buscar empresa…' : 'Buscar por nombre o email…'}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.ink, background: T.bg, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />

            {loading ? <Spinner/> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>

                {tab === 'companies' ? companies.filter(c => !searchQ || c.name?.toLowerCase().includes(searchQ.toLowerCase())).map(c => {
                  const prods   = companyProducts(c.id)
                  const active  = c.is_active !== false
                  const cUsers  = users.filter(u => u.company_id === c.id)
                  const hasNomia = nomiaPerfiles.some(p => cUsers.some(u => u.id === p.id))
                  const hasClimia = climiaProfiles.some(p => cUsers.some(u => u.id === p.id))
                  const score = (active ? 20 : 0) + (prods.length > 0 ? 25 : 0) + (cUsers.length > 0 ? 20 : 0) + (hasNomia ? 20 : 0) + (hasClimia ? 15 : 0)
                  const scoreColor = score >= 70 ? '#16A34A' : score >= 40 ? '#B45309' : '#DC2626'
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: active ? T.bg : '#FEF2F2', border: `1px solid ${active ? T.border : '#FECACA'}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: active ? T.blueSoft : '#FEE2E2', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: active ? T.blue : '#DC2626', flexShrink: 0 }}>
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{c.name}</span>
                          <StatusBadge active={active}/>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {prods.length ? prods.map(p => (
                            <span key={p} style={{ fontSize: 10, fontWeight: 700, color: PRODUCTS[p]?.color || T.muted, background: PRODUCTS[p]?.colorSoft || T.blueSoft, padding: '1px 6px', borderRadius: 4 }}>
                              {PRODUCTS[p]?.name || p}
                            </span>
                          )) : <span style={{ fontSize: 10, color: T.muted }}>Sin productos</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, minWidth: 38 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
                        <div style={{ width: 32, height: 4, borderRadius: 2, background: T.border, overflow: 'hidden' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 2, transition: 'width .3s' }}/>
                        </div>
                        <span style={{ fontSize: 9, color: T.muted, fontWeight: 600 }}>ENG</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {active && (
                          <IconBtn label="Cross-sell IA" color="#73017B" onClick={() => triggerCrossSell(c)}/>
                        )}
                        <IconBtn label="Editar" color={T.blue} onClick={() => openEditCo(c)}/>
                        <IconBtn label={active ? 'Suspender' : 'Reactivar'} color={active ? '#DC2626' : '#166534'} onClick={() => toggleSuspendCo(c)}/>
                      </div>
                    </div>
                  )
                }) : users.filter(u => !searchQ || (u.name + ' ' + u.email).toLowerCase().includes(searchQ.toLowerCase())).map(u => {
                  const suspended = u.role === 'suspended'
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: suspended ? '#FEF2F2' : T.bg, border: `1px solid ${suspended ? '#FECACA' : T.border}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: suspended ? '#FEE2E2' : T.blueSoft, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: suspended ? '#DC2626' : T.blue, flexShrink: 0 }}>
                        {(u.name || u.email)?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{u.name || '—'}</span>
                          <StatusBadge active={!suspended}/>
                        </div>
                        <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.email} · {u.role} · {companies.find(c => c.id === u.company_id)?.name || 'Sin empresa'}
                        </div>
                        {u.products?.length > 0 && (
                          <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                            {u.products.map(p => {
                              const prod = PRODUCTS[p]
                              // Buscar cliente asignado en la app
                              let appClientLabel = null
                              if (p === 'nomia') {
                                const perf = nomiaPerfiles.find(x => x.id === u.id)
                                const cli = perf?.cliente_id != null ? nomiaClientes.find(c => c.id === perf.cliente_id) : null
                                if (cli) appClientLabel = cli.nombre
                              } else if (p === 'climia') {
                                const perf = climiaProfiles.find(x => x.id === u.id)
                                const cli = perf?.client_id != null ? climiaClients.find(c => c.id === perf.client_id) : null
                                if (cli) appClientLabel = cli.name
                              }
                              return (
                                <span key={p} title={appClientLabel ? `Cliente: ${appClientLabel}` : undefined}
                                  style={{ fontSize: 9, fontWeight: 700, color: prod?.color || T.muted, background: prod?.colorSoft || T.blueSoft, padding: '1px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  {prod?.name || p}{appClientLabel ? ` · ${appClientLabel}` : ''}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        <IconBtn label="Editar" color={T.blue} onClick={() => openEditUser(u)}/>
                        <IconBtn label="Reset pwd" color={T.inkSoft} onClick={() => sendPasswordReset(u)}/>
                        <IconBtn label={suspended ? 'Reactivar' : 'Suspender'} color={suspended ? '#166534' : '#DC2626'} onClick={() => toggleSuspendUser(u)}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        )} {/* fin tab !== subscriptions */}
      </div>

      {/* ── Modal cross-sell IA ── */}
      {crossSellModal && (
        <Modal title={`Cross-sell IA — ${crossSellModal.company.name}`} onClose={() => setCrossSellModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {crossSellModal.loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', color: T.muted, fontSize: 13 }}>
                <Spinner/> Generando sugerencia con IA…
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#73017B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sugerencia generada</div>
                <p style={{ fontSize: 14, color: T.ink, margin: 0, lineHeight: 1.65, background: '#F7F0FA', borderRadius: 10, padding: '14px 16px' }}>
                  {crossSellModal.suggestion}
                </p>
                <button onClick={() => { navigator.clipboard.writeText(crossSellModal.suggestion); flash(true, 'Sugerencia copiada.') }}
                  style={{ padding: '9px', borderRadius: 9, border: 'none', background: '#73017B', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Copiar texto
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ── Modal checkout Stripe ── */}
      {checkoutModal && (
        <Modal title={`Link de pago — ${PRODUCTS[checkoutModal.product]?.name} ${checkoutModal.plan}`} onClose={() => setCheckoutModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: T.ink, margin: 0, lineHeight: 1.6 }}>
              Copiá este link y enviáselo a <b>{checkoutModal.company.name}</b> para que complete el pago en Stripe.
            </p>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 14px', fontSize: 12, color: T.muted, wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {checkoutModal.url}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(checkoutModal.url); flash(true, 'Link copiado al portapapeles.'); setCheckoutModal(null) }}
              style={{ padding: '10px', borderRadius: 9, border: 'none', background: T.blue, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Copiar link
            </button>
            <button onClick={() => window.open(checkoutModal.url, '_blank')}
              style={{ padding: '10px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Abrir en Stripe ↗
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal editar empresa ── */}
      {editCo && (
        <Modal title={`Editar empresa: ${editCo.name}`} onClose={() => setEditCo(null)}>
          <form onSubmit={saveEditCo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={lbl}>Nombre</label><input style={inp} required value={editCoName} onChange={e => setEditCoName(e.target.value)}/></div>
            <div>
              <label style={lbl}>Productos activos</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {Object.entries(PRODUCTS).filter(([,p]) => !p.freemium).map(([key, p]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '7px 10px', borderRadius: 8, background: editCoProds.includes(key) ? (p.colorSoft || T.blueSoft) : T.bg }}>
                    <input type="checkbox" checked={editCoProds.includes(key)} onChange={e => setEditCoProds(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}/>
                    <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={editCoActive} onChange={e => setEditCoActive(e.target.checked)}/>
              <span style={{ fontWeight: 600, color: T.navy }}>Empresa activa</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setEditCo(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: T.blue, color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Wizard onboarding nuevo cliente ── */}
      {wizard && (
        <Modal title={`Nuevo cliente — Paso ${wizard.step + 1} de 3`} onClose={() => setWizard(null)}>
          {/* Stepper */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderRadius: 9, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            {['Empresa', 'Usuario', 'Listo'].map((label, i) => (
              <div key={i} style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 700,
                background: wizard.step === i ? T.blue : wizard.step > i ? T.blueSoft : T.bg,
                color: wizard.step === i ? '#fff' : wizard.step > i ? T.blue : T.muted,
                borderRight: i < 2 ? `1px solid ${T.border}` : 'none',
              }}>{label}</div>
            ))}
          </div>

          {wizErr && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 13px', fontSize: 13, color: '#DC2626', marginBottom: 14 }}>{wizErr}</div>}

          {wizard.step === 0 && (
            <form onSubmit={wizStep0} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre de la empresa</label>
                <input style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                  required value={wizCoName} onChange={e => setWizCoName(e.target.value)} placeholder="Acme S.A."/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos a activar</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(PRODUCTS).filter(([, p]) => !p.freemium).map(([key, p]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: wizCoProds.includes(key) ? (p.colorSoft || T.blueSoft) : T.bg, border: `1px solid ${wizCoProds.includes(key) ? p.color + '50' : T.border}` }}>
                      <input type="checkbox" checked={wizCoProds.includes(key)} onChange={e => setWizCoProds(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}/>
                      <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                      <span style={{ color: T.muted, fontSize: 11 }}>— {p.tagline}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={wizLoading} style={{ padding: '10px', borderRadius: 9, border: 'none', background: T.blue, color: '#fff', fontWeight: 700, fontSize: 13, cursor: wizLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {wizLoading && <Spinner color="#fff" size={12}/>} {wizLoading ? 'Creando empresa…' : 'Continuar →'}
              </button>
            </form>
          )}

          {wizard.step === 1 && (
            <form onSubmit={wizStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: T.blueSoft, borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: T.blue, fontWeight: 600 }}>
                Empresa <b>{wizard.companyName}</b> creada. Ahora creá el primer usuario.
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input type="email" required style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                  value={wizUEmail} onChange={e => setWizUEmail(e.target.value)} placeholder="usuario@empresa.com"/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre completo</label>
                <input style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                  value={wizUName} onChange={e => setWizUName(e.target.value)} placeholder="Juan Pérez"/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña (opcional)</label>
                <input type="password" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                  value={wizUPass} onChange={e => setWizUPass(e.target.value)} placeholder="Dejar vacío → enviará invitación por email"/>
              </div>
              {wizCoProds.length > 0 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dar acceso a</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {wizCoProds.map(key => {
                      const p = PRODUCTS[key]
                      const on = wizUProds.includes(key)
                      return (
                        <button key={key} type="button" onClick={() => setWizUProds(prev => on ? prev.filter(k => k !== key) : [...prev, key])}
                          style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${on ? p.color : T.border}`, background: on ? (p.colorSoft || T.blueSoft) : T.bg, color: on ? p.color : T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {p.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <button type="submit" disabled={wizLoading} style={{ padding: '10px', borderRadius: 9, border: 'none', background: T.blue, color: '#fff', fontWeight: 700, fontSize: 13, cursor: wizLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {wizLoading && <Spinner color="#fff" size={12}/>} {wizLoading ? 'Creando usuario…' : 'Crear usuario y enviar acceso →'}
              </button>
            </form>
          )}

          {wizard.step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.navy }}>¡Cliente onboarded!</div>
              <div style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6 }}>
                <b>{wizard.companyName}</b> fue creada con acceso a {wizCoProds.map(k => PRODUCTS[k]?.name).join(' y ')}.<br/>
                {wizUPass ? 'El usuario puede ingresar con la contraseña configurada.' : `Se envió un email de invitación a ${wizUEmail}.`}
              </div>
              <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
                <button onClick={openWizard} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Agregar otro
                </button>
                <button onClick={() => setWizard(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: T.blue, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal editar usuario ── */}
      {editUser && (
        <Modal title={`Editar usuario`} onClose={() => setEditUser(null)}>
          <form onSubmit={saveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={lbl}>Nombre completo</label><input style={inp} value={editUserName} onChange={e => setEditUserName(e.target.value)} placeholder="Juan Pérez"/></div>
            <div>
              <label style={lbl}>Email</label>
              <input style={inp} type="email" required value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)}/>
              {editUserEmail !== editUser.email && <div style={{ fontSize: 11, color: '#B45309', marginTop: 4 }}>⚠ El email de login cambiará. El usuario recibirá un mail de confirmación.</div>}
            </div>
            <div>
              <label style={lbl}>Rol</label>
              <select style={inp} value={editUserRole} onChange={e => setEditUserRole(e.target.value)}>
                <option value="client">Cliente</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Empresa</label>
              <select style={inp} value={editUserCompany} onChange={e => { setEditUserCompany(e.target.value); setEditUserProds([]) }}>
                <option value="">Sin empresa</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {editUserCompany && (() => {
              const available = companyProducts(editUserCompany).filter(p => !PRODUCTS[p]?.freemium)
              return available.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={lbl}>Acceso a productos y cliente por app</label>
                  {available.map(key => {
                    const p = PRODUCTS[key]
                    const checked = editUserProds.includes(key)
                    return (
                      <div key={key} style={{ borderRadius: 10, border: `1px solid ${checked ? p.color + '50' : T.border}`, background: checked ? (p.colorSoft || T.blueSoft) : T.bg, overflow: 'hidden' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '9px 12px' }}>
                          <input type="checkbox" checked={checked} onChange={e => setEditUserProds(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}/>
                          <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                        </label>
                        {checked && editUserRole !== 'admin' && key === 'nomia' && (
                          <div style={{ padding: '0 12px 10px' }}>
                            <label style={{ ...lbl, marginBottom: 4 }}>Cliente en Nomia</label>
                            <select style={inp} value={editNomiaCliente} onChange={e => setEditNomiaCliente(e.target.value)}>
                              <option value="">— Sin asignar —</option>
                              {nomiaClientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                          </div>
                        )}
                        {checked && editUserRole !== 'admin' && key === 'climia' && (
                          <div style={{ padding: '0 12px 10px' }}>
                            <label style={{ ...lbl, marginBottom: 4 }}>Cliente en Climia</label>
                            <select style={inp} value={editClimiaClient} onChange={e => setEditClimiaClient(e.target.value)}>
                              <option value="">— Sin asignar —</option>
                              {climiaClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null
            })()}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={() => setEditUser(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: T.blue, color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession]             = useState(null)
  const [userRow, setUserRow]             = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading]             = useState(true)

  // Leer redirect param una sola vez al montar (persiste aunque cambie la URL)
  const redirectTarget = useRef(new URLSearchParams(window.location.search).get('redirect'))

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
      const { data: row } = await supabase.from('users').select('company_id, role, email').eq('id', userId).maybeSingle()
      setUserRow(row)

      // Sincronizar perfiles de admin en todas las apps via service role (bypasa RLS)
      const { data: { session: s } } = await supabase.auth.getSession()
      const email = s?.user?.email || row?.email || ''
      if (email.endsWith('@delenio.net') || row?.role === 'admin') {
        fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s?.access_token}` },
          body: JSON.stringify({ action: 'syncAdminProfiles', adminUserId: userId, adminEmail: email }),
        }).catch(() => {})
      }
      if (row?.company_id) {
        const { data: subs } = await supabase.from('subscriptions').select('product, plan, status').eq('company_id', row.company_id)
        setSubscriptions(subs || [])
      }
      // SSO redirect: si hay ?redirect= en la URL, mandamos al usuario de vuelta con tokens en hash
      if (redirectTarget.current) {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (s?.access_token) {
          try {
            const hash = `#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer`
            window.location.href = `${redirectTarget.current}/${hash}`
            return
          } catch { /* URL inválida */ }
        }
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  if (loading)    return <><GlobalStyle/><LoadingScreen message="Cargando tus productos…"/></>
  if (!session)   return <><GlobalStyle/><LoginPage/></>
  return <><GlobalStyle/><HubPage user={{ ...session.user, role: userRow?.role }} subscriptions={subscriptions} companyId={userRow?.company_id} onLogout={handleLogout}/></>
}
