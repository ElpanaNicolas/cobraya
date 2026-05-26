// Landing page pública de Cobraya — versión 2
// Secciones: Nav · Hero · Stats · Features · How it works · AI preview · Pricing · FAQ · CTA · Footer

import { useState } from 'react'

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
  muted:   'rgba(28,25,23,0.52)',
  muted2:  'rgba(28,25,23,0.28)',
  amber:   '#b45309',
  red:     '#dc2626',
  blue:    '#2563eb',
}

// ── Tipografía ────────────────────────────────────────────────────────────────
const T = {
  label: { fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: C.greenL, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 },
  h2:    { fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: C.text },
  body:  { fontSize: 14, color: C.muted, lineHeight: 1.7 },
}

const FEATURES = [
  { icon: '📲', title: 'WhatsApp con IA', desc: 'El agente redacta mensajes personalizados para cada deudor — profesional, amigable o firme según configurés.' },
  { icon: '⏰', title: 'Recordatorios automáticos', desc: 'Aviso previo al vencimiento, primer recordatorio, seguimientos cada N días. Sin que muevas un dedo.' },
  { icon: '💳', title: 'Pago en 2 clicks', desc: 'Cada factura tiene su link de pago con MercadoPago (Face ID / huella) y transferencia bancaria.' },
  { icon: '🤝', title: 'Negocia por vos', desc: 'Si el cliente pide tiempo, el agente ofrece plan de cuotas y registra el acuerdo automáticamente.' },
  { icon: '📊', title: 'Dashboard en tiempo real', desc: 'Cobrado, pendiente, vencido, DSO y score de riesgo. Todo de un vistazo, sin planillas.' },
  { icon: '📎', title: 'Comprobantes con IA', desc: 'El cliente sube la foto de la transferencia, la IA la verifica y la factura se marca como pagada sola.' },
]

const STEPS = [
  { n: '01', title: 'Cargás tus facturas', desc: 'Individualmente o en bloque. Con nombre, teléfono, monto y fecha de vencimiento. Tardás menos de 2 minutos.' },
  { n: '02', title: 'El agente trabaja solo', desc: 'Envía recordatorios por WhatsApp en el momento exacto, generados por IA con tu tono y firma.' },
  { n: '03', title: 'El cliente paga online', desc: 'Recibe el link, elige MercadoPago o transferencia, y la factura se marca como pagada automáticamente.' },
]

const STATS = [
  { value: '−72%', label: 'Tiempo en gestión de cobros' },
  { value: '2 min', label: 'Para cargar tu primera factura' },
  { value: '3×', label: 'Tasa de respuesta vs email' },
  { value: '100%', label: 'Automatizable' },
]

const FOR_WHO = [
  { icon: '🏪', label: 'Distribuidoras' },
  { icon: '🏗️', label: 'Constructoras' },
  { icon: '⚕️', label: 'Clínicas y estudios' },
  { icon: '📦', label: 'Importadoras' },
  { icon: '🔧', label: 'Talleres y servicios' },
  { icon: '📐', label: 'Estudios contables' },
  { icon: '🧹', label: 'Empresas de limpieza' },
  { icon: '🚚', label: 'Transporte y logística' },
]

const FAQS = [
  {
    q: '¿Mis clientes tienen que instalar algo?',
    a: 'No. Reciben un WhatsApp normal y pueden pagar desde cualquier celular o computadora. Sin registro, sin apps adicionales.',
  },
  {
    q: '¿Qué pasa si el cliente no responde?',
    a: 'El agente hace seguimientos automáticos según la frecuencia que configures. Podés definir hasta cuántos mensajes enviar antes de marcarla como incobrable.',
  },
  {
    q: '¿Funciona con mi número de WhatsApp actual?',
    a: 'Cobraya usa WhatsApp Cloud API (Meta). Necesitás conectar un número de WhatsApp Business — te guiamos paso a paso en la configuración.',
  },
  {
    q: '¿Es legal usar IA para cobrar?',
    a: 'Sí. Cobraya envía mensajes de gestión de cobro en nombre de tu empresa, lo que es completamente legal en Uruguay. Los mensajes son transparentes y respetuosos.',
  },
  {
    q: '¿Puedo cancelar cuando quiero?',
    a: 'Sí. No hay contratos. Cancelás el plan Pro desde la configuración en cualquier momento y quedás en el plan Free sin perder tus datos.',
  },
  {
    q: '¿Qué tan segura es mi información?',
    a: 'Usamos Supabase con cifrado en reposo y en tránsito. Las credenciales de MercadoPago se guardan cifradas y nunca se exponen al frontend.',
  },
]

// ── Componentes ──────────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.10)', width: '100%', maxWidth: 560 }}>
      <div style={{ height: 40, background: C.s2, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6 }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => (
          <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
        ))}
        <div style={{ flex: 1, marginLeft: 6, height: 18, background: C.s3, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', height: 280 }}>
        <div style={{ width: 48, background: C.s2, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 10 }}>
          {['▦','◧','◉','◈','◎'].map((icon, i) => (
            <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: i === 0 ? C.greenP : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: i === 0 ? C.greenL : C.muted }}>{icon}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 10 }}>
            {[
              { label: 'Cobrado', val: '$284K', color: C.greenL },
              { label: 'Pendiente', val: '$91K', color: C.amber },
              { label: 'Vencido', val: '$23K', color: C.red },
              { label: 'DSO', val: '18d', color: C.text },
            ].map(k => (
              <div key={k.label} style={{ background: C.s2, borderRadius: 6, padding: '6px 7px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{k.label}</div>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: k.color }}>{k.val}</div>
              </div>
            ))}
          </div>
          {[
            { client: 'Supermercado El Sol', amount: '$18.500', status: 'reminded' },
            { client: 'Distribuidora Norte',  amount: '$42.000', status: 'pending'  },
            { client: 'Ferretería Central',   amount: '$7.800',  status: 'paid'     },
            { client: 'Constructora Paz',     amount: '$55.000', status: 'overdue'  },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, fontSize: 9, fontWeight: 600, color: C.text, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{row.client}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.text, flexShrink: 0 }}>{row.amount}</div>
              <div style={{ fontSize: 7, padding: '2px 6px', borderRadius: 100, flexShrink: 0,
                background: row.status === 'paid' ? 'rgba(22,163,74,0.1)' : row.status === 'overdue' ? 'rgba(220,38,38,0.1)' : row.status === 'reminded' ? 'rgba(180,83,9,0.1)' : C.greenP,
                color: row.status === 'paid' ? C.greenL : row.status === 'overdue' ? C.red : row.status === 'reminded' ? C.amber : C.muted,
                fontWeight: 700 }}>
                {row.status === 'paid' ? 'Pagada' : row.status === 'overdue' ? 'Vencida' : row.status === 'reminded' ? 'Recordada' : 'Pendiente'}
              </div>
            </div>
          ))}
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

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16, textAlign: 'left' }}
      >
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, color: C.text }}>{q}</span>
        <span style={{ fontSize: 18, color: C.muted, flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 18, marginTop: 0 }}>{a}</p>
      )}
    </div>
  )
}

// ── Landing principal ─────────────────────────────────────────────────────────
export function Landing() {
  const [scrolled, setScrolled] = useState(false)

  // Scroll listener
  import('react').then(({ useEffect: ue }) => {}).catch(() => {})

  const goRegister = () => { window.location.href = '/entrar' }
  const goLogin    = () => { window.location.href = '/entrar' }
  const goDemo     = () => { window.location.href = '/pagar/demo' }

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'var(--font-mono)', minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── NAV ────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: 60, padding: '0 clamp(16px, 4vw, 72px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(245,242,238,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', color: C.text }}>
          cobra<span style={{ color: C.greenL }}>ya</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goLogin} style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 8, padding: '7px 14px', color: C.muted, fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer' }}>
            Iniciar sesión
          </button>
          <button onClick={goRegister} style={{ background: C.green, border: 'none', borderRadius: 8, padding: '7px 16px', color: '#fff', fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer' }}>
            Empezar gratis →
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 10vh, 110px) clamp(16px, 4vw, 72px) 72px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.greenP, border: `1px solid rgba(22,163,74,0.25)`, borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.greenL, animation: 'pulse 2s ease infinite' }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: C.greenL, letterSpacing: '.05em' }}>
            Hecho para PYMEs uruguayas
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 6vw, 70px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.06, maxWidth: 820, marginBottom: 20, color: C.text }}>
          Tu agente de cobros que{' '}
          <span style={{ color: C.greenL }}>trabaja solo.</span>
        </h1>

        <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: C.muted, maxWidth: 540, lineHeight: 1.65, marginBottom: 12 }}>
          Cobraya envía recordatorios por WhatsApp, negocia con los deudores y acepta pagos online — sin que toques nada.
        </p>
        <p style={{ fontSize: 13, color: C.muted2, marginBottom: 36 }}>
          Gratis para empezar · Sin tarjeta de crédito · Configuración en 5 minutos
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56 }}>
          <button onClick={goRegister}
            style={{ background: C.green, border: 'none', borderRadius: 10, padding: '13px 28px', color: '#fff', fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(21,128,61,0.30)' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.greenL; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = C.green; e.currentTarget.style.transform = 'none' }}
          >
            Crear cuenta gratis →
          </button>
          <button onClick={goDemo}
            style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 10, padding: '13px 22px', color: C.muted, fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.s2}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Ver página de pago demo
          </button>
        </div>

        <div style={{ width: '100%', maxWidth: 600, animation: 'fadeUp .5s ease both .15s' }}>
          <DashboardMockup />
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section style={{ background: C.text, padding: '32px clamp(16px, 4vw, 72px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 28, maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-ui)', letterSpacing: '.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARA QUIÉN ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(52px, 7vw, 80px) clamp(16px, 4vw, 72px)', textAlign: 'center' }}>
        <p style={T.label}>¿Para quién es Cobraya?</p>
        <h2 style={{ ...T.h2, marginBottom: 8 }}>Para cualquier PYME que vende a crédito</h2>
        <p style={{ ...T.body, maxWidth: 480, margin: '0 auto 36px' }}>
          Si tenés clientes que te deben plata y pasás tiempo llamando o mandando mensajes manualmente, Cobraya es para vos.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 640, margin: '0 auto' }}>
          {FOR_WHO.map(w => (
            <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 100, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 600, color: C.text }}>
              <span>{w.icon}</span>
              <span>{w.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section style={{ background: C.s2, padding: 'clamp(52px, 7vw, 80px) clamp(16px, 4vw, 72px)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <p style={T.label}>Todo incluido</p>
            <h2 style={T.h2}>Una sola herramienta para todo el proceso de cobro</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 20px', transition: 'box-shadow .2s, transform .2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: 26, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, marginBottom: 7, color: C.text }}>{f.title}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section style={{ padding: 'clamp(52px, 7vw, 80px) clamp(16px, 4vw, 72px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={T.label}>Cómo funciona</p>
            <h2 style={T.h2}>De la factura al pago en 3 pasos</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', paddingBottom: i < STEPS.length - 1 ? 36 : 0, position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', left: 23, top: 48, width: 1, height: 'calc(100% - 12px)', background: `linear-gradient(${C.greenL}, transparent)` }} />
                )}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: i === 0 ? C.greenL : C.surface, border: `1px solid ${i === 0 ? C.greenL : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: i === 0 ? '#fff' : C.muted, flexShrink: 0 }}>
                  {step.n}
                </div>
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, marginBottom: 6, color: C.text }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IA CHAT PREVIEW ────────────────────────────────────── */}
      <section style={{ background: C.s2, padding: 'clamp(52px, 7vw, 80px) clamp(16px, 4vw, 72px)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <p style={T.label}>Agente IA</p>
            <h2 style={{ ...T.h2, marginBottom: 16, lineHeight: 1.15, fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
              Mensajes que parecen humanos, enviados solos
            </h2>
            <p style={{ ...T.body, marginBottom: 20 }}>
              Usamos Claude (Anthropic) para redactar cada mensaje con el tono de tu empresa. Tus clientes nunca van a saber que es un bot.
            </p>
            {['Tono a elección: profesional, amigable o firme', 'Firma con el nombre de tu empresa', 'Link de pago en cada mensaje', 'Responde preguntas y negocia cuotas'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.text, marginBottom: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.greenP, border: `1px solid rgba(22,163,74,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: C.greenL, flexShrink: 0 }}>✓</div>
                {item}
              </div>
            ))}
          </div>
          <div style={{ background: '#0f0f0f', borderRadius: 20, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, color: '#555', textAlign: 'center', marginBottom: 2 }}>WhatsApp Business · Agente Cobraya</div>
            {[
              { from: 'agent',  text: 'Hola Marcelo 👋 Te recuerdo que la factura A-0247 por $18.500 UYU vence el próximo viernes. Podés pagarla aquí: cobraya.app/pagar/a247', time: '09:03' },
              { from: 'client', text: 'Gracias! La pago el jueves, ¿hay algún problema?', time: '09:41' },
              { from: 'agent',  text: 'Perfecto Marcelo, sin problema. Anotado para el jueves. Cualquier consulta estoy disponible 😊', time: '09:42' },
            ].map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'agent' ? 'flex-start' : 'flex-end' }}>
                <div style={{ maxWidth: '80%', background: msg.from === 'agent' ? '#1a1a1a' : '#005c4b', borderRadius: msg.from === 'agent' ? '4px 12px 12px 12px' : '12px 4px 12px 12px', padding: '8px 12px' }}>
                  <div style={{ fontSize: 12, color: msg.from === 'agent' ? '#e5e5e5' : '#e9ffec', lineHeight: 1.5 }}>{msg.text}</div>
                  <div style={{ fontSize: 9, color: msg.from === 'agent' ? '#444' : 'rgba(233,255,236,0.5)', marginTop: 3, textAlign: 'right' }}>{msg.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────── */}
      <section id="precios" style={{ padding: 'clamp(52px, 7vw, 88px) clamp(16px, 4vw, 72px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <p style={T.label}>Precios simples</p>
            <h2 style={T.h2}>Empezá gratis, escalá cuando lo necesites</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Free */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Free</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', color: C.text, marginBottom: 4 }}>$0</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Para siempre · Sin tarjeta</div>
              {['10 clientes', '50 facturas', 'WhatsApp + Email', 'Página de pago', 'Dashboard básico'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13, color: C.text }}>
                  <span style={{ color: C.greenL, fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
              <button onClick={goRegister} style={{ width: '100%', marginTop: 24, background: 'transparent', border: `1.5px solid ${C.border2}`, borderRadius: 10, padding: '11px', color: C.text, fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = C.s2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Empezar gratis
              </button>
            </div>

            {/* Pro */}
            <div style={{ background: C.text, border: `1px solid ${C.text}`, borderRadius: 16, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, background: C.greenL, borderRadius: 100, padding: '3px 10px', fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, color: '#fff', letterSpacing: '.04em' }}>
                POPULAR
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Pro</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>$1.490</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>UYU / mes</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>≈ USD 36 · Cancelás cuando quieras</div>
              {['Clientes ilimitados', 'Facturas ilimitadas', 'WhatsApp + Email', 'IA con negociación de cuotas', 'Multi-usuario (equipo)', 'Verificación de comprobantes con IA', 'Soporte prioritario'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ color: C.greenL, fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
              <button onClick={goRegister} style={{ width: '100%', marginTop: 24, background: C.greenL, border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Empezar con Pro →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section style={{ background: C.s2, padding: 'clamp(52px, 7vw, 80px) clamp(16px, 4vw, 72px)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <p style={T.label}>Preguntas frecuentes</p>
            <h2 style={T.h2}>Todo lo que necesitás saber</h2>
          </div>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────── */}
      <section style={{ background: C.text, padding: 'clamp(64px, 9vw, 100px) clamp(16px, 4vw, 72px)', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Empezá hoy</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1 }}>
          Menos horas persiguiendo,<br />más plata cobrada.
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, maxWidth: 420, margin: '0 auto 36px' }}>
          Tu primer factura en menos de 2 minutos. Gratis para empezar.
        </p>
        <button onClick={goRegister}
          style={{ background: C.greenL, border: 'none', borderRadius: 12, padding: '15px 36px', color: '#fff', fontSize: 15, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(22,163,74,0.4)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,163,74,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(22,163,74,0.4)' }}
        >
          Crear cuenta gratis →
        </button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 16 }}>Para empresas uruguayas · Soporte en español · Sin tarjeta de crédito</p>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ background: '#0d0d0d', padding: '24px clamp(16px, 4vw, 72px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#fff' }}>cobra</span><span style={{ color: C.greenL }}>ya</span>
        </div>
        <div style={{ fontSize: 11, color: '#444', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>© 2026 · Hecho en Uruguay 🇺🇾</span>
          <a href="/privacidad" style={{ color: '#555', textDecoration: 'none' }}>Privacidad</a>
          <a href="/terminos"   style={{ color: '#555', textDecoration: 'none' }}>Términos</a>
          <a href="mailto:nico@cobraya.app" style={{ color: '#555', textDecoration: 'none' }}>Contacto</a>
        </div>
        <button onClick={goLogin} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 14px', color: '#555', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer' }}>
          Iniciar sesión
        </button>
      </footer>
    </div>
  )
}
