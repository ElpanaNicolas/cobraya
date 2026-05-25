// WhatsAppSetupWizard — guía paso a paso para conectar Meta WhatsApp Cloud API
// Flujo: explainer → crear app → credenciales → webhook → test
// Twilio queda como opción "avanzada" para quienes ya lo tienen configurado.

import { useState } from 'react'
import { toast } from '@/components/ui/Toast'

// ─── Utilidades ────────────────────────────────────────────────────────────────

function CopyBox({ value, label }) {
  const copy = () => {
    navigator.clipboard.writeText(value)
    toast.success(label ? `${label} copiado` : 'Copiado')
  }
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border2)' }}>
      <div style={{
        flex: 1, padding: '8px 12px', background: 'var(--surface3)',
        fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
        wordBreak: 'break-all', lineHeight: 1.4,
      }}>{value}</div>
      <button onClick={copy} style={{
        padding: '0 14px', background: 'var(--surface2)', border: 'none',
        borderLeft: '1px solid var(--border2)', cursor: 'pointer',
        fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,158,95,0.1)'; e.currentTarget.style.color = 'var(--green-l)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--muted)' }}
      >
        Copiar
      </button>
    </div>
  )
}

function ExtLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--green-l)', textDecoration: 'none', fontWeight: 600 }}
      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
    >{children} ↗</a>
  )
}

// ─── Tarjeta de paso ───────────────────────────────────────────────────────────
function StepCard({ n, total, title, subtitle, done, open, onToggle, children }) {
  return (
    <div style={{
      border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : open ? 'rgba(45,158,95,0.4)' : 'var(--border)'}`,
      borderRadius: 10,
      background: done ? 'rgba(34,197,94,0.03)' : 'var(--surface2)',
      overflow: 'hidden',
      transition: 'border-color .2s',
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        {/* Número */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: done ? 'rgba(34,197,94,0.15)' : 'var(--surface3)',
          border: `2px solid ${done ? 'var(--green)' : 'var(--border2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: done ? 14 : 11, fontFamily: 'var(--font-ui)', fontWeight: 800,
          color: done ? 'var(--green)' : 'var(--muted)',
        }}>
          {done ? '✓' : n}
        </div>

        {/* Texto */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--green-l)' : 'var(--white)', fontFamily: 'var(--font-ui)' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{subtitle}</div>
          )}
        </div>

        {/* Arrow */}
        <div style={{ fontSize: 10, color: 'var(--muted)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</div>
      </button>

      {/* Contenido */}
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 16, fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Barra de progreso ─────────────────────────────────────────────────────────
function ProgressBar({ steps, current }) {
  const done = steps.filter(s => s.done).length
  const pct  = Math.round((done / steps.length) * 100)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Configuración WhatsApp
        </span>
        <span style={{ fontSize: 10, color: done === steps.length ? 'var(--green-l)' : 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
          {done === steps.length ? '✓ Completo' : `${done} / ${steps.length} pasos`}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--surface3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: done === steps.length ? 'var(--green)' : 'var(--green-l)',
          width: `${pct}%`, transition: 'width .4s ease',
        }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// WIZARD PRINCIPAL — Meta Cloud API
// ══════════════════════════════════════════════════════════════════════════════
export function WhatsAppGuide({ provider, profile, webhookMeta, webhookTwilio }) {
  const [openStep, setOpenStep] = useState(null)

  const hasPhoneId  = !!profile?.metaPhoneNumberId
  const hasToken    = !!profile?.metaAccessToken
  const hasVerify   = !!profile?.metaVerifyToken
  const hasWebhook  = hasPhoneId && hasVerify  // proxy: si tiene todo, el webhook probablemente está configurado

  const isTwilio = provider === 'twilio'

  // Para Twilio — estado simple
  const hasTwilioSid    = !!profile?.twilioAccountSid
  const hasTwilioToken  = !!profile?.twilioAuthToken
  const hasTwilioNumber = !!profile?.twilioWaNumber
  const twilioConnected = hasTwilioSid && hasTwilioToken && hasTwilioNumber

  const steps = [
    { id: 'app',    title: 'Crear app en Meta for Developers',  done: hasPhoneId },
    { id: 'creds',  title: 'Obtener credenciales',              done: hasPhoneId && hasToken },
    { id: 'verify', title: 'Definir Verify Token',              done: hasVerify },
    { id: 'webhook',title: 'Configurar webhook en Meta',        done: hasWebhook && hasToken },
  ]

  const toggle = (id) => setOpenStep(s => s === id ? null : id)

  // ─── Vista Twilio (legacy/avanzado) ────────────────────────────────────────
  if (isTwilio) {
    return (
      <div style={{
        padding: '14px 16px', borderRadius: 8,
        background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)',
        fontSize: 11, color: 'var(--muted)', lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>⚠️ Twilio Sandbox — solo para pruebas</div>
        <p style={{ margin: '0 0 8px' }}>
          El sandbox de Twilio requiere que cada destinatario envíe primero <code>join [palabra]</code> al número. Esto
          <strong style={{ color: 'var(--white)' }}> no es viable en producción</strong> — tus clientes (deudores) no van a hacer eso.
        </p>
        <p style={{ margin: 0 }}>
          Para producción real usá <strong style={{ color: 'var(--white)' }}>Meta WhatsApp Cloud API</strong> (opción de arriba). Es gratis hasta 1.000 conversaciones/mes.
        </p>
        {twilioConnected && (
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 10, color: 'var(--green-l)', fontWeight: 700 }}>
            ✓ Twilio configurado — podés probar el agente pero tus clientes deberán hacer opt-in primero.
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 10, color: 'var(--muted2)' }}>
          Webhook URL: <code style={{ color: 'var(--muted)', userSelect: 'all' }}>{webhookTwilio}</code>
        </div>
      </div>
    )
  }

  // ─── Vista Meta (principal) ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Explicación de cómo funciona para los clientes */}
      <div style={{
        padding: '14px 16px', borderRadius: 8,
        background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>📲</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-l)', marginBottom: 4 }}>
            Tus clientes no necesitan hacer nada
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            Una vez que conectes tu número, Cobraya le manda WhatsApp a cada deudor directamente.
            Ellos reciben el mensaje y responden como con cualquier contacto — sin registrarse, sin códigos, sin apps nuevas.
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <ProgressBar steps={steps} />

      {/* Pasos */}
      <StepCard
        n={1} total={4}
        title="Crear una app en Meta for Developers"
        subtitle="Una vez — tarda ~3 minutos"
        done={hasPhoneId}
        open={openStep === 'app'}
        onToggle={() => toggle('app')}
      >
        <ol style={{ margin: '0 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>Entrá a <ExtLink href="https://developers.facebook.com/apps">developers.facebook.com/apps</ExtLink></li>
          <li>Hacé clic en <Chip>Crear app</Chip></li>
          <li>Tipo de app: <Chip>Empresa (Business)</Chip> → Siguiente</li>
          <li>Ponele cualquier nombre (ej: "Cobraya"), vinculate a tu cuenta de Facebook y creá la app</li>
        </ol>
        <Note>Si ya tenés una app de Meta con WhatsApp, podés usarla directamente.</Note>
      </StepCard>

      <StepCard
        n={2} total={4}
        title="Obtener Phone Number ID y Access Token"
        subtitle="Los datos que conectan Cobraya con tu número"
        done={hasPhoneId && hasToken}
        open={openStep === 'creds'}
        onToggle={() => toggle('creds')}
      >
        <ol style={{ margin: '0 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>Dentro de tu app en Meta: panel izquierdo → <Chip>WhatsApp</Chip> → <Chip>Agregar producto</Chip></li>
          <li>Asociala a tu cuenta de <strong style={{ color: 'var(--white)' }}>Meta Business</strong> (la creás en el momento si no tenés)</li>
          <li>
            En <strong style={{ color: 'var(--white)' }}>WhatsApp → Configuración API</strong> vas a ver:
            <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong style={{ color: 'var(--white)' }}>Phone Number ID</strong> — número largo bajo el teléfono de prueba → copialo en el campo de abajo</li>
              <li><strong style={{ color: 'var(--white)' }}>WhatsApp Business Account ID</strong> — también en esa pantalla → campo WABA ID</li>
            </ul>
          </li>
          <li>
            Para el <strong style={{ color: 'var(--white)' }}>Access Token permanente</strong>: ir a{' '}
            <ExtLink href="https://business.facebook.com/settings/system-users">Meta Business Manager → Usuarios del sistema</ExtLink>
            {' '}→ Crear usuario de sistema → asignar tu app → generar token con permisos{' '}
            <code>whatsapp_business_messaging</code> y <code>whatsapp_business_management</code>
          </li>
        </ol>
        <Note color="amber">Guardá el Access Token apenas lo generás — Meta no te lo muestra de nuevo.</Note>
      </StepCard>

      <StepCard
        n={3} total={4}
        title="Definir tu Verify Token"
        subtitle="Una contraseña que vos elegís para asegurar el webhook"
        done={hasVerify}
        open={openStep === 'verify'}
        onToggle={() => toggle('verify')}
      >
        <p style={{ margin: '0 0 10px' }}>
          El Verify Token es un texto secreto que vos elegís (cualquier cosa, como una contraseña).{' '}
          Escrib&iacute;lo en el campo <strong style={{ color: 'var(--white)' }}>Verify Token</strong> de abajo y guardá los cambios.
          Lo vas a necesitar en el siguiente paso.
        </p>
        <p style={{ margin: 0, fontSize: 11 }}>Ejemplo: <code style={{ color: 'var(--green-l)' }}>mi-empresa-cobraya-2025</code></p>
      </StepCard>

      <StepCard
        n={4} total={4}
        title="Configurar el webhook en Meta"
        subtitle="Le decís a Meta a dónde mandar los mensajes de tus clientes"
        done={hasWebhook && hasToken}
        open={openStep === 'webhook'}
        onToggle={() => toggle('webhook')}
      >
        <ol style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>En tu app de Meta: <Chip>WhatsApp</Chip> → <Chip>Configuración</Chip> → <Chip>Webhooks</Chip></li>
          <li>Hacé clic en <Chip>Editar</Chip> y pegá esta URL:</li>
        </ol>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>URL de devolución de llamada</div>
          <CopyBox value={webhookMeta} label="Webhook URL" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Token de verificación {!hasVerify && <span style={{ color: '#f87171', textTransform: 'none', fontWeight: 400 }}>— completá el Verify Token en el paso 3 primero</span>}
          </div>
          <CopyBox
            value={profile?.metaVerifyToken || '← completá el Verify Token en el paso 3'}
            label="Verify Token"
          />
        </div>

        <ol style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>Hacé clic en <Chip>Verificar y guardar</Chip></li>
          <li>Luego en <Chip>Suscribirse a los campos</Chip> → activá <code>messages</code></li>
        </ol>

        <Note color="green">
          ¡Listo! Guardá los cambios de arriba y enviá un WhatsApp al número que configuraste — el agente debería responder automáticamente.
        </Note>
      </StepCard>

      {/* Link a tutorial de YouTube */}
      <div style={{ textAlign: 'center', paddingTop: 4 }}>
        <a
          href="https://www.youtube.com/results?search_query=meta+whatsapp+cloud+api+setup+2024"
          target="_blank" rel="noreferrer"
          style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
          ▶ ¿Preferís ver un video? Buscá "Meta WhatsApp Cloud API setup" en YouTube — hay tutoriales de 10 minutos
        </a>
      </div>
    </div>
  )
}

// ─── Helpers de UI menores ─────────────────────────────────────────────────────
function Chip({ children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 4,
      background: 'var(--surface3)', border: '1px solid var(--border2)',
      fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700,
      color: 'var(--white)', verticalAlign: 'baseline',
    }}>{children}</span>
  )
}

function Note({ children, color = 'blue' }) {
  const colors = {
    blue:  { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  text: '#93c5fd' },
    green: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   text: 'var(--green-l)' },
    amber: { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  text: '#fbbf24' },
  }
  const c = colors[color] || colors.blue
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 7,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 11, color: c.text, lineHeight: 1.6,
    }}>
      {children}
    </div>
  )
}
