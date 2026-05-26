// Landing page pública de Cobraya
// Usa fuentes y variables del design system pero sin el shell de la app

import { useState, useEffect } from 'react'

const C = {
  bg:      '#f5f2ee',
  surface: '#ffffff',
  s2:      '#efebe5',
  s3:      '#e8e3dc',
  border:  'rgba(0,0,0,0.07)',
  border2: 'rgba(0,0,0,0.12)',
  green:   '#15803d',
  greenL:  '#16a34a',
  greenP:  'rgba(22,163,74,0.10)',
  text:    '#1c1917',
  muted:   'rgba(28,25,23,0.50)',
  muted2:  'rgba(28,25,23,0.28)',
  amber:   '#b45309',
  red:     '#dc2626',
  blue:    '#2563eb',
}

const FEATURES = [
  {
    icon: '📲',
    title: 'WhatsApp con IA',
    desc:  'El agente escribe mensajes personalizados para cada cliente, en el tono que elijas. Profesional, amigable o firme.',
    color: C.greenL,
  },
  {
    icon: '📅',
    title: 'Recordatorios automáticos',
    desc:  'Avisos antes del vencimiento, primer recordatorio tras la fecha, seguimientos cada N días — sin que muevas un dedo.',
    color: C.blue,
  },
  {
    icon: '💳',
    title: 'Página de pago instantánea',
    desc:  'Cada factura tiene su link de pago con MercadoPago, Stripe (Apple Pay, Google Pay) o transferencia bancaria.',
    color: C.amber,
  },
  {
    icon: '📊',
    title: 'Dashboard de cobros',
    desc:  'Ves todo de un vistazo: cobrado este mes, pendiente, vencido, DSO y score de riesgo de cada cliente.',
    color: C.greenL,
  },
]

const STEPS = [
  { n: '01', title: 'Cargás tus facturas', desc: 'Individualmente, por CSV masivo o con el asistente de configuración. Tardás menos de 2 minutos.' },
  { n: '02', title: 'El agente trabaja solo', desc: 'Envía recordatorios por WhatsApp en el momento exacto, con mensajes generados por IA y tu firma.' },
  { n: '03', title: 'El cliente paga online', desc: 'Recibe el link de pago, elige su método favorito y la factura se marca como pagada automáticamente.' },
]

const STATS = [
  { value: '−72%', label: 'Tiempo en gestión de cobros' },
  { value: '2 min', label: 'Para configurar la primera factura' },
  { value: '3×',   label: 'Tasa de respuesta vs. email' },
  { value: '100%', label: 'Automatizable' },
]

// Mockup visual del dashboard (solo CSS, no datos reales)
function DashboardMockup() {
  return (
    <div style={{
      background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`,
      overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.10)',
      width: '100%', maxWidth: 560,
    }}>
      {/* Barra superior */}
      <div style={{ height: 44, background: C.s2, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 6 }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
        ))}
        <div style={{ flex: 1, marginLeft: 8, height: 20, background: C.s3, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', height: 280 }}>
        {/* Sidebar */}
        <div style={{ width: 52, background: C.s2, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 10 }}>
          {['▦','◧','◉','◈','◎'].map((icon, i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? C.greenP : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: i === 0 ? C.greenL : C.muted }}>
              {icon}
            </div>
          ))}
        </div>
        {/* Contenido */}
        <div style={{ flex: 1, padding: 14, overflow: 'hidden' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Cobrado', val: '$284K', color: C.greenL },
              { label: 'Pendiente', val: '$91K', color: C.amber },
              { label: 'Vencido', val: '$23K', color: C.red },
              { label: 'DSO', val: '18d', color: C.text },
            ].map(k => (
              <div key={k.label} style={{ background: C.s2, borderRadius: 6, padding: '7px 8px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{k.label}</div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: k.color }}>{k.val}</div>
              </div>
            ))}
          </div>
          {/* Filas de facturas */}
          {[
            { client: 'Supermercado El Sol', amount: '$18.500', status: 'reminded', bar: 0.7 },
            { client: 'Distribuidora Norte', amount: '$42.000', status: 'pending',  bar: 0.4 },
            { client: 'Ferretería Central', amount: '$7.800',  status: 'paid',    bar: 1.0 },
            { client: 'Constructora Paz',   amount: '$55.000', status: 'overdue',  bar: 0.2 },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, fontSize: 9, fontFamily: 'var(--font-ui)', fontWeight: 600, color: C.text, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{row.client}</div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, color: C.text, flexShrink: 0 }}>{row.amount}</div>
              <div style={{ width: 40, height: 3, background: C.s3, borderRadius: 2, flexShrink: 0 }}>
                <div style={{ width: `${row.bar * 100}%`, height: '100%', background: row.status === 'paid' ? C.greenL : row.status === 'overdue' ? C.red : row.status === 'reminded' ? C.amber : C.muted, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 7, padding: '2px 6px', borderRadius: 100, background: row.status === 'paid' ? 'rgba(22,163,74,0.1)' : row.status === 'overdue' ? 'rgba(220,38,38,0.1)' : row.status === 'reminded' ? 'rgba(180,83,9,0.1)' : C.greenP, color: row.status === 'paid' ? C.greenL : row.status === 'overdue' ? C.red : row.status === 'reminded' ? C.amber : C.muted, fontFamily: 'var(--font-ui)', fontWeight: 700, flexShrink: 0 }}>
                {row.status === 'paid' ? 'Pagada' : row.status === 'overdue' ? 'Vencida' : row.status === 'reminded' ? 'Recordada' : 'Pendiente'}
              </div>
            </div>
          ))}
          {/* Chat bubble */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.greenP, border: `1px solid ${C.greenL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>🤖</div>
            <div style={{ background: C.greenP, border: `1px solid rgba(22,163,74,0.2)`, borderRadius: '0 8px 8px 8px', padding: '5px 8px', fontSize: 8, color: C.text, lineHeight: 1.4, maxWidth: 200 }}>
              Le envié el recordatorio a Supermercado El Sol. La factura A0247 vence el viernes 🟡
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goRegister = () => { window.location.href = '/entrar' }
  const goLogin    = () => { window.location.href = '/entrar' }
  const goDemo     = () => { window.location.href = '/pagar/demo' }

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'var(--font-mono)', minHeight: '100vh' }}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: 60, padding: '0 clamp(20px, 5vw, 80px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(245,242,238,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all .3s',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: C.text }}>
          Cobraya
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goLogin} style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 8, padding: '7px 16px', color: C.muted, fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer' }}>
            Iniciar sesión
          </button>
          <button onClick={goRegister} style={{ background: C.green, border: 'none', borderRadius: 8, padding: '7px 16px', color: '#fff', fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer' }}>
            Empezar gratis →
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px, 10vh, 120px) clamp(20px, 5vw, 80px) 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.greenP, border: `1px solid rgba(22,163,74,0.25)`, borderRadius: 100, padding: '5px 14px', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.greenL, animation: 'pulse 2s ease infinite' }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: C.greenL, letterSpacing: '.04em' }}>
            Para PYMEs uruguayas
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 6vw, 72px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, maxWidth: 800, margin: '0 0 20px', color: C.text }}>
          Cobrá lo que te deben,{' '}
          <span style={{ color: C.greenL }}>sin perseguir.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: C.muted, maxWidth: 560, lineHeight: 1.6, margin: '0 0 36px' }}>
          Tu agente de cobros inteligente que envía recordatorios por WhatsApp, acepta pagos online y negocia con los clientes — todo solo.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
          <button onClick={goRegister} style={{ background: C.green, border: 'none', borderRadius: 10, padding: '13px 28px', color: '#fff', fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(21,128,61,0.3)', transition: 'transform .15s, box-shadow .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(21,128,61,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(21,128,61,0.3)' }}
          >
            Empezar gratis →
          </button>
          <button onClick={goDemo} style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 10, padding: '13px 24px', color: C.muted, fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.s2}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Ver página de pago demo
          </button>
        </div>

        {/* Mockup */}
        <div style={{ width: '100%', maxWidth: 620, animation: 'fadeUp .6s ease both .2s' }}>
          <DashboardMockup />
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section style={{ background: C.text, padding: '32px clamp(20px, 5vw, 80px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-ui)', letterSpacing: '.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: C.greenL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Qué hace Cobraya</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Todo lo que necesitás para cobrar mejor
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 22px', transition: 'box-shadow .2s, transform .2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, marginBottom: 8, color: C.text }}>{f.title}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: C.s2, padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: C.greenL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Cómo funciona</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              De la factura al pago en 3 pasos
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', paddingBottom: i < STEPS.length - 1 ? 36 : 0, position: 'relative' }}>
                {/* Línea vertical */}
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', left: 23, top: 48, width: 1, height: 'calc(100% - 12px)', background: `linear-gradient(${C.greenL}, ${C.border})` }} />
                )}
                {/* Número */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: i === 0 ? C.greenL : C.surface, border: `1px solid ${i === 0 ? C.greenL : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: i === 0 ? '#fff' : C.muted, flexShrink: 0 }}>
                  {step.n}
                </div>
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, marginBottom: 6, color: C.text }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MENSAJE IA PREVIEW ────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: C.greenL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Agente IA</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.15 }}>
              Mensajes que suenan humanos, enviados solos
            </h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
              Cobraya usa Claude (Anthropic) para redactar cada recordatorio en el tono que configures. Tus clientes reciben mensajes naturales, no genéricos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Tono profesional, amigable o firme', 'Firma con el nombre de tu empresa', 'Link de pago incluido en cada mensaje', 'Responde preguntas del cliente automáticamente'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.text }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: C.greenP, border: `1px solid rgba(22,163,74,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: C.greenL, flexShrink: 0 }}>✓</div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          {/* Chat mockup */}
          <div style={{ background: '#0f0f0f', borderRadius: 20, padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginBottom: 4 }}>WhatsApp Business · Agente Cobraya</div>
            {[
              { from: 'agent', text: 'Hola Marcelo 👋 Te recuerdo que la factura A-0247 por $18.500 UYU vence el próximo viernes. Podés pagarla aquí: cobraya.app/pagar/a247', time: '09:03' },
              { from: 'client', text: 'Gracias! La pago el jueves, ¿hay algún problema?', time: '09:41' },
              { from: 'agent', text: 'Perfecto Marcelo, sin problema! Te espero el jueves. Cualquier consulta estoy disponible 😊', time: '09:42' },
            ].map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'agent' ? 'flex-start' : 'flex-end' }}>
                <div style={{ maxWidth: '80%', background: msg.from === 'agent' ? '#1a1a1a' : '#005c4b', borderRadius: msg.from === 'agent' ? '4px 12px 12px 12px' : '12px 4px 12px 12px', padding: '8px 12px' }}>
                  <div style={{ fontSize: 12, color: msg.from === 'agent' ? '#e5e5e5' : '#e9ffec', lineHeight: 1.5 }}>{msg.text}</div>
                  <div style={{ fontSize: 9, color: msg.from === 'agent' ? '#555' : 'rgba(233,255,236,0.5)', marginTop: 4, textAlign: 'right' }}>{msg.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section style={{ background: C.text, padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 80px)', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Empezá hoy</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1 }}>
          Menos horas persiguiendo,<br />más plata cobrada.
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
          Configurá tu primer factura en menos de 2 minutos. Sin tarjeta de crédito.
        </p>
        <button onClick={goRegister} style={{ background: C.greenL, border: 'none', borderRadius: 12, padding: '15px 36px', color: '#fff', fontSize: 15, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(22,163,74,0.4)', transition: 'transform .15s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          Crear cuenta gratis →
        </button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>Para empresas uruguayas · Soporte en español</p>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: '#0d0d0d', padding: '28px clamp(20px, 5vw, 80px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>Cobraya</div>
        <div style={{ fontSize: 11, color: '#444', display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>© 2026 · Hecho en Uruguay 🇺🇾</span>
          <a href="/privacidad" style={{ color: '#555', textDecoration: 'none' }}>Privacidad</a>
          <a href="/terminos"   style={{ color: '#555', textDecoration: 'none' }}>Términos</a>
        </div>
        <button onClick={goLogin} style={{ background: 'none', border: '1px solid #333', borderRadius: 6, padding: '6px 14px', color: '#666', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer' }}>
          Iniciar sesión
        </button>
      </footer>

    </div>
  )
}
