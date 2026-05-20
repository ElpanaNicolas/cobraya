import { useState, useCallback } from 'react'
import { api } from '@/api'
import { useApi } from '@/hooks/useApi'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'

function Section({ title, subtitle, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      style={{
        width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
        borderRadius: 6, padding: '8px 12px', color: disabled ? 'var(--muted)' : 'var(--white)',
        fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
        cursor: disabled ? 'not-allowed' : 'text',
      }} />
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 38, height: 20, borderRadius: 100, cursor: 'pointer',
          background: value ? 'var(--green-l)' : 'var(--surface3)',
          border: `1px solid ${value ? 'var(--green-l)' : 'var(--border2)'}`,
          position: 'relative', transition: 'all .2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: 'var(--white)', transition: 'left .2s',
        }} />
      </div>
      {label && <span style={{ fontSize: 12, color: 'var(--white)' }}>{label}</span>}
    </div>
  )
}

function NumberInput({ value, onChange, min, max }) {
  return (
    <input type="number" value={value} onChange={onChange} min={min} max={max}
      style={{
        width: 80, background: 'var(--surface2)', border: '1px solid var(--border2)',
        borderRadius: 6, padding: '7px 10px', color: 'var(--white)',
        fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', textAlign: 'center',
      }} />
  )
}

const TONE_OPTIONS = [
  { id: 'profesional', label: 'Profesional', desc: 'Formal y directo. Ideal para empresas B2B.' },
  { id: 'amigable',    label: 'Amigable',    desc: 'Cordial y cercano. Bueno para PYMEs.' },
  { id: 'firme',       label: 'Firme',       desc: 'Claro y sin rodeos. Para cuentas vencidas.' },
]

export function Configuracion() {
  const { data: cfg, loading } = useApi(useCallback(() => api.getAgentConfig(), []))
  const { data: user }         = useApi(useCallback(() => api.getUser(), []))

  const [form, setForm]     = useState(null)
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  // Inicializar forms cuando llegan los datos
  if (cfg && !form)   setForm({ ...cfg })
  if (user && !profile) setProfile({
    company:           user.company ?? '',
    email:             user.email ?? '',
    twilioAccountSid:  user.twilioAccountSid ?? '',
    twilioAuthToken:   user.twilioAuthToken ?? '',
    twilioWaNumber:    user.twilioWaNumber ?? '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setChannel = (ch, val) => setForm(f => ({ ...f, channels: { ...f.channels, [ch]: val } }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        api.saveAgentConfig({ ...form, signature: `${profile?.company ?? ''} | ${form.whatsappNumber}` }),
        api.saveProfile(profile),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form || !profile) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton h={28} w={200} />
        {[1,2,3].map(i => <Skeleton key={i} h={160} style={{ borderRadius: 'var(--radius)' }} />)}
      </div>
    )
  }

  return (
    <div className="page-pad" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.02em' }}>Configuración</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Perfil de empresa, comportamiento del agente e integraciones</div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </Button>
      </div>

      {/* Empresa */}
      <Section title="Empresa" subtitle="Datos que el agente usa al comunicarse con clientes">
        <div className="config-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Nombre de empresa">
            <Input value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} placeholder="García & Asociados" />
          </Field>
          <Field label="Email de contacto">
            <Input value={profile.email} disabled placeholder="email@empresa.com" />
          </Field>
          <Field label="Número de WhatsApp" hint="Número desde el que el agente envía los mensajes">
            <Input value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} placeholder="+598 99 000 000" />
          </Field>
          <Field label="Firma en mensajes" hint="Texto que aparece al final de cada mensaje">
            <Input value={form.signature} onChange={e => set('signature', e.target.value)} placeholder="Empresa | teléfono" />
          </Field>
        </div>
      </Section>

      {/* Agente IA */}
      <Section title="Agente IA" subtitle="Cómo se comporta el agente al gestionar cobros">
        <Field label="Estado del agente">
          <Toggle value={form.enabled} onChange={v => set('enabled', v)} label={form.enabled ? 'Activo — gestionando cobros automáticamente' : 'Inactivo — el agente no enviará mensajes'} />
        </Field>

        <Field label="Tono de comunicación">
          <div style={{ display: 'flex', gap: 8 }}>
            {TONE_OPTIONS.map(t => (
              <div key={t.id} onClick={() => set('tone', t.id)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: form.tone === t.id ? 'rgba(45,158,95,0.1)' : 'var(--surface2)',
                border: `1px solid ${form.tone === t.id ? 'var(--green-l)' : 'var(--border)'}`,
                transition: 'all .15s',
              }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: form.tone === t.id ? 'var(--green-l)' : 'var(--white)', marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </Field>

        <div className="config-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <Field label="Primer recordatorio" hint="Días antes del vencimiento">
            <NumberInput value={form.firstReminderDays} onChange={e => set('firstReminderDays', +e.target.value)} min={1} max={30} />
          </Field>
          <Field label="Seguimiento" hint="Días entre recordatorios">
            <NumberInput value={form.followUpDays} onChange={e => set('followUpDays', +e.target.value)} min={1} max={30} />
          </Field>
          <Field label="Máx. recordatorios" hint="Antes de escalar a vos">
            <NumberInput value={form.maxFollowUps} onChange={e => set('maxFollowUps', +e.target.value)} min={1} max={10} />
          </Field>
        </div>

        <Field label="Escalar a propietario" hint="Si no hay respuesta luego de este plazo (días), te notificamos">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NumberInput value={form.escalateAfterDays} onChange={e => set('escalateAfterDays', +e.target.value)} min={1} max={60} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>días sin respuesta</span>
          </div>
        </Field>

        <Field label="Plan de pagos automático" hint="El agente puede proponer cuotas si detecta dificultades de pago">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Toggle value={form.offerPaymentPlan} onChange={v => set('offerPaymentPlan', v)} label="Ofrecer plan de cuotas" />
            {form.offerPaymentPlan && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NumberInput value={form.paymentPlanInstallments} onChange={e => set('paymentPlanInstallments', +e.target.value)} min={2} max={12} />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>cuotas</span>
              </div>
            )}
          </div>
        </Field>
      </Section>

      {/* Canales */}
      <Section title="Canales" subtitle="Por dónde el agente contacta a los clientes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📲</span>
              <div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700 }}>WhatsApp</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{form.whatsappNumber || 'Sin número configurado'}</div>
              </div>
            </div>
            <Toggle value={form.channels.whatsapp} onChange={v => setChannel('whatsapp', v)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📧</span>
              <div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700 }}>Email</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>Próximamente</div>
              </div>
            </div>
            <Toggle value={form.channels.email} onChange={v => setChannel('email', v)} />
          </div>
        </div>
      </Section>

      {/* Twilio */}
      <Section title="Conexión WhatsApp" subtitle="Credenciales de tu cuenta Twilio — cada negocio usa su propio número">
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(91,196,232,0.07)', border: '1px solid rgba(91,196,232,0.2)', marginBottom: 16, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
          <span style={{ color: '#5bc4e8', fontWeight: 700, fontFamily: 'var(--font-ui)' }}>¿Cómo conseguir estas credenciales?</span>
          {' '}Crear cuenta en{' '}
          <a href="https://twilio.com" target="_blank" rel="noreferrer" style={{ color: '#5bc4e8' }}>twilio.com</a>
          {' '}→ Console → Account Info. El número debe tener WhatsApp habilitado.
        </div>
        <div className="config-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Account SID" hint="Empieza con AC...">
            <Input
              value={profile?.twilioAccountSid ?? ''}
              onChange={e => setProfile(p => ({ ...p, twilioAccountSid: e.target.value }))}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </Field>
          <Field label="Auth Token" hint="Se guarda de forma segura">
            <Input
              value={profile?.twilioAuthToken ?? ''}
              onChange={e => setProfile(p => ({ ...p, twilioAuthToken: e.target.value }))}
              placeholder="••••••••••••••••••••••••••••••••"
              type="password"
            />
          </Field>
          <Field label="Número de WhatsApp" hint="Con código de país, ej: +59899123456">
            <Input
              value={profile?.twilioWaNumber ?? ''}
              onChange={e => setProfile(p => ({ ...p, twilioWaNumber: e.target.value }))}
              placeholder="+59899123456"
            />
          </Field>
          <Field label="URL del webhook" hint="Pegá esto en Twilio → Sandbox Settings">
            <div style={{
              background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6,
              padding: '8px 12px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
              wordBreak: 'break-all', userSelect: 'all', cursor: 'copy',
            }}
              onClick={e => { navigator.clipboard.writeText(e.currentTarget.textContent ?? ''); toast.success('URL copiada') }}
              title="Click para copiar"
            >
              {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-inbound`}
            </div>
          </Field>
        </div>
      </Section>

      {/* Horario */}
      <Section title="Horario de operación" subtitle="El agente solo envía mensajes dentro de este horario">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Field label="Desde">
            <input type="time" value={form.workingHours.from}
              onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, from: e.target.value } }))}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '7px 10px', color: 'var(--white)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }} />
          </Field>
          <span style={{ color: 'var(--muted)', marginTop: 8 }}>—</span>
          <Field label="Hasta">
            <input type="time" value={form.workingHours.to}
              onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, to: e.target.value } }))}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '7px 10px', color: 'var(--white)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }} />
          </Field>
        </div>
      </Section>
    </div>
  )
}
