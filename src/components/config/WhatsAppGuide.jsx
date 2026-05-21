// WhatsAppGuide — guía paso a paso para configurar WhatsApp Business
// Muestra: estado de conexión + pasos numerados por proveedor + campos + test

import { useState } from 'react'
import { toast } from '@/components/ui/Toast'

// ─── Helpers ───────────────────────────────────────────────────
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
        transition: 'all .15s', whiteSpace: 'nowrap',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,158,95,0.1)'; e.currentTarget.style.color = 'var(--green-l)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--muted)' }}
      >
        Copiar
      </button>
    </div>
  )
}

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      color: 'var(--green-l)', textDecoration: 'none', fontWeight: 600,
    }}
      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
    >{children} ↗</a>
  )
}

// ─── Paso numerado ──────────────────────────────────────────────
function Step({ n, title, children, done }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: done ? '#dcfce7' : 'var(--surface2)',
        border: `2px solid ${done ? 'var(--green)' : 'var(--border2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 800,
        color: done ? 'var(--green)' : 'var(--muted)',
        transition: 'all .3s',
      }}>
        {done ? '✓' : n}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Badge de estado ────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    connected:   { label: 'Conectado',         color: '#15803d', bg: '#dcfce7', icon: '✓' },
    partial:     { label: 'Incompleto',        color: '#b45309', bg: '#fef3c7', icon: '⚠' },
    disconnected:{ label: 'Sin configurar',    color: '#6b7280', bg: 'var(--surface2)', icon: '○' },
  }
  const c = config[status]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 100,
      background: c.bg, color: c.color,
      fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700,
    }}>
      <span>{c.icon}</span> {c.label}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// GUÍA TWILIO
// ══════════════════════════════════════════════════════════════
function TwilioGuide({ webhookUrl, profile }) {
  const hasSid    = !!profile?.twilioAccountSid
  const hasToken  = !!profile?.twilioAuthToken
  const hasNumber = !!profile?.twilioWaNumber

  const status = (hasSid && hasToken && hasNumber) ? 'connected'
    : (hasSid || hasToken || hasNumber) ? 'partial'
    : 'disconnected'

  const [open, setOpen] = useState(status !== 'connected')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Estado + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusBadge status={status} />
        <button onClick={() => setOpen(o => !o)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-ui)',
        }}>
          {open ? '▲ Ocultar guía' : '▼ Ver instrucciones paso a paso'}
        </button>
      </div>

      {/* Guía desplegable */}
      {open && (
        <div style={{
          padding: '20px', borderRadius: 10,
          background: 'var(--surface2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)', marginBottom: 16 }}>
            Cómo conectar Twilio WhatsApp Sandbox (ideal para pruebas)
          </div>

          <Step n={1} title="Crear cuenta Twilio" done={hasSid}>
            Entrá a <ExternalLink href="https://www.twilio.com/try-twilio">twilio.com</ExternalLink> y
            registrarte gratis. No necesitás tarjeta de crédito para el sandbox.
          </Step>

          <Step n={2} title="Activar WhatsApp Sandbox" done={hasSid}>
            En la consola de Twilio: <strong style={{ color: 'var(--white)' }}>Messaging → Try it out → Send a WhatsApp message</strong>.
            Seguí las instrucciones para unirte al sandbox desde tu celular.
          </Step>

          <Step n={3} title="Copiar Account SID y Auth Token" done={hasSid && hasToken}>
            En la <ExternalLink href="https://console.twilio.com">consola de Twilio</ExternalLink> (página principal),
            encontrás el <strong style={{ color: 'var(--white)' }}>Account SID</strong> (empieza con <code>AC</code>) y
            el <strong style={{ color: 'var(--white)' }}>Auth Token</strong>. Copiá ambos y pegálos en los campos de abajo.
          </Step>

          <Step n={4} title="Copiar el número de sandbox" done={hasNumber}>
            En <strong style={{ color: 'var(--white)' }}>Messaging → Sandbox for WhatsApp</strong> vas a ver
            el número del sandbox (generalmente <code>+14155238886</code>). Copialo tal cual, con el <code>+</code>.
          </Step>

          <Step n={5} title="Configurar el webhook" done={hasSid && hasNumber}>
            En esa misma pantalla del Sandbox, en el campo
            {' '}<strong style={{ color: 'var(--white)' }}>"WHEN A MESSAGE COMES IN"</strong>, pegá esta URL:
            <div style={{ marginTop: 8 }}>
              <CopyBox value={webhookUrl} label="URL del webhook" />
            </div>
          </Step>

          <div style={{
            marginTop: 4, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            fontSize: 11, color: 'var(--muted)',
          }}>
            💡 <strong style={{ color: 'var(--white)' }}>Nota:</strong> el sandbox es para probar.
            Para producción real necesitás un número de Twilio con WhatsApp habilitado (hay un costo mensual).
            O bien pasate a <strong style={{ color: 'var(--white)' }}>Meta WhatsApp Cloud API</strong> arriba.
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// GUÍA META
// ══════════════════════════════════════════════════════════════
function MetaGuide({ webhookUrl, profile }) {
  const hasPhoneId = !!profile?.metaPhoneNumberId
  const hasToken   = !!profile?.metaAccessToken
  const hasWaba    = !!profile?.metaWabaId
  const hasVerify  = !!profile?.metaVerifyToken

  const status = (hasPhoneId && hasToken && hasVerify) ? 'connected'
    : (hasPhoneId || hasToken) ? 'partial'
    : 'disconnected'

  const [open, setOpen] = useState(status !== 'connected')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Estado + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusBadge status={status} />
        <button onClick={() => setOpen(o => !o)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-ui)',
        }}>
          {open ? '▲ Ocultar guía' : '▼ Ver instrucciones paso a paso'}
        </button>
      </div>

      {/* Guía desplegable */}
      {open && (
        <div style={{
          padding: '20px', borderRadius: 10,
          background: 'var(--surface2)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}>
              Cómo conectar Meta WhatsApp Cloud API (producción)
            </div>
            <a
              href="https://www.youtube.com/results?search_query=meta+whatsapp+cloud+api+setup+tutorial"
              target="_blank" rel="noreferrer"
              style={{ fontSize: 10, color: '#9b8cff', textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: 12 }}
            >▶ Ver tutorial en YouTube</a>
          </div>

          <Step n={1} title="Crear app en Meta for Developers" done={hasPhoneId}>
            Entrá a <ExternalLink href="https://developers.facebook.com/apps">developers.facebook.com/apps</ExternalLink>,
            hacé clic en <strong style={{ color: 'var(--white)' }}>Crear app</strong>,
            seleccioná tipo <strong style={{ color: 'var(--white)' }}>Empresa (Business)</strong> y seguí el wizard.
          </Step>

          <Step n={2} title="Agregar el producto WhatsApp" done={hasPhoneId}>
            Dentro de tu app, hacé clic en <strong style={{ color: 'var(--white)' }}>Agregar producto</strong>
            {' '}→ <strong style={{ color: 'var(--white)' }}>WhatsApp</strong> → Configurar.
            Asociala a tu cuenta de Meta Business.
          </Step>

          <Step n={3} title="Obtener Phone Number ID y WABA ID" done={hasPhoneId && hasWaba}>
            En el panel izquierdo: <strong style={{ color: 'var(--white)' }}>WhatsApp → Configuración API</strong>.
            Ahí vas a ver:
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, listStyle: 'disc' }}>
              <li><strong style={{ color: 'var(--white)' }}>Phone Number ID</strong> — número largo debajo del teléfono de prueba</li>
              <li><strong style={{ color: 'var(--white)' }}>WhatsApp Business Account ID (WABA ID)</strong> — también en esa misma pantalla</li>
            </ul>
            Copiá ambos en los campos de abajo.
          </Step>

          <Step n={4} title="Generar Access Token permanente" done={hasToken}>
            Ve a <ExternalLink href="https://business.facebook.com/settings/system-users">Meta Business Manager → Usuarios del sistema</ExternalLink>.
            <br />Creá un usuario del sistema → asignale tu app → generá un token con permisos
            {' '}<code>whatsapp_business_messaging</code> y <code>whatsapp_business_management</code>.
            <br /><strong style={{ color: '#f87171' }}>Importante:</strong> guardá el token en el momento — no se puede ver de nuevo.
          </Step>

          <Step n={5} title="Definir tu Verify Token" done={hasVerify}>
            Elegí cualquier texto secreto (ej: <code>cobraya-webhook-2025</code>) y ponelo en el campo
            {' '}<strong style={{ color: 'var(--white)' }}>Verify Token</strong> de abajo. Lo vas a necesitar en el siguiente paso.
          </Step>

          <Step n={6} title="Configurar el webhook en Meta" done={hasPhoneId && hasVerify}>
            En <strong style={{ color: 'var(--white)' }}>WhatsApp → Configuración → Webhooks</strong>, hacé clic en
            {' '}<strong style={{ color: 'var(--white)' }}>Editar</strong> y pegá:
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>URL de devolución de llamada</div>
                <CopyBox value={webhookUrl} label="Webhook URL" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Token de verificación</div>
                <CopyBox value={profile?.metaVerifyToken || '← completá el campo Verify Token primero'} label="Verify Token" />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              Luego hacé clic en <strong style={{ color: 'var(--white)' }}>Verificar y guardar</strong>,
              después en <strong style={{ color: 'var(--white)' }}>Suscribirse a los campos</strong> y activá
              {' '}<code>messages</code>.
            </div>
          </Step>

          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)',
            fontSize: 11, color: 'var(--muted)',
          }}>
            ✅ <strong style={{ color: 'var(--white)' }}>¿Todo listo?</strong> Guardá los cambios arriba y
            enviá un mensaje de WhatsApp al número que configuraste. Deberías ver la respuesta automática del agente.
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export function WhatsAppGuide({ provider, profile, webhookTwilio, webhookMeta }) {
  return (
    <div>
      {provider === 'twilio'
        ? <TwilioGuide webhookUrl={webhookTwilio} profile={profile} />
        : <MetaGuide   webhookUrl={webhookMeta}   profile={profile} />
      }
    </div>
  )
}
