import { useState, useCallback } from 'react'
import { api } from '@/api'
import { useApi } from '@/hooks/useApi'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { WhatsAppGuide } from '@/components/config/WhatsAppGuide'

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

function TestReminderButton() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  const run = async () => {
    setLoading(true)
    setResult(null)
    try {
      const r = await api.testAutoReminder()
      setResult(r)
      if ((r?.sent ?? 0) > 0) {
        toast.success(`${r.sent} recordatorio${r.sent > 1 ? 's' : ''} enviado${r.sent > 1 ? 's' : ''}`)
      } else {
        toast.success('Agente ejecutado — no había facturas elegibles en este momento')
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 4, padding: '14px 16px', background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--green-l)', marginBottom: 3 }}>
            📅 Ejecución automática diaria
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
            El agente corre todos los días a las 09:00 (Uruguay). Guardá los cambios antes de probar.
          </div>
          {result && (
            <div style={{ marginTop: 6, fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Última ejecución → ✉ {result.sent ?? 0} enviados · ⏭ {result.skipped ?? 0} omitidos · ✗ {result.errors ?? 0} errores
            </div>
          )}
        </div>
        <button
          onClick={run}
          disabled={loading}
          style={{
            padding: '7px 16px', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'transparent' : 'rgba(22,163,74,0.1)',
            border: '1px solid rgba(22,163,74,0.3)',
            color: 'var(--green-l)', fontSize: 11,
            fontFamily: 'var(--font-ui)', fontWeight: 700,
            opacity: loading ? 0.6 : 1, transition: 'all .15s', whiteSpace: 'nowrap',
          }}
        >
          {loading ? '⏳ Ejecutando…' : '▶ Ejecutar ahora'}
        </button>
      </div>
    </div>
  )
}

function EquipoSection({ user }) {
  const { data: team, loading: teamLoading, refetch: refetchTeam } = useApi(useCallback(() => api.getTeam(), []))
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting]       = useState(false)

  // Solo el propietario (userId === profileId) ve la sección completa
  const isOwner = user?.id === user?.profileId // simplificado: si tiene parent_profile_id NO es owner

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await api.inviteTeamMember(inviteEmail.trim())
      toast.success(`Invitación enviada a ${inviteEmail}`)
      setInviteEmail('')
      refetchTeam()
    } catch (err) {
      toast.error(err.message || 'Error al enviar invitación')
    } finally {
      setInviting(false)
    }
  }

  const handleRevoke = async (id) => {
    try {
      await api.revokeInvitation(id)
      toast.success('Invitación revocada')
      refetchTeam()
    } catch {
      toast.error('Error al revocar la invitación')
    }
  }

  const handleRemove = async (memberId) => {
    if (!confirm('¿Eliminar a este miembro del equipo?')) return
    try {
      await api.removeMember(memberId)
      toast.success('Miembro eliminado')
      refetchTeam()
    } catch {
      toast.error('Error al eliminar el miembro')
    }
  }

  const chipStyle = (color) => ({
    fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '2px 7px',
    background: `${color}18`, color, border: `1px solid ${color}38`,
    letterSpacing: '.04em', textTransform: 'uppercase',
    fontFamily: 'var(--font-ui)',
  })

  const inputStyle = {
    flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 6, padding: '8px 12px', color: 'var(--white)',
    fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
  }

  return (
    <Section title="Equipo" subtitle="Invitá a colegas para que accedan a la misma cuenta">
      {teamLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton h={40} /><Skeleton h={40} />
        </div>
      ) : (
        <>
          {/* Miembros activos */}
          {team?.members?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                Miembros activos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {team.members.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: 'var(--surface2)', border: '1px solid var(--border2)',
                    borderRadius: 8,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(45,158,95,0.15)', border: '1px solid rgba(45,158,95,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: 'var(--green-l)',
                    }}>
                      {(m.email || m.company || '?').slice(0,1).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--white)' }} className="truncate">
                        {m.email || m.company || 'Miembro'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        Se unió {new Date(m.joinedAt).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <span style={chipStyle('var(--green-l)')}>Activo</span>
                    <button onClick={() => handleRemove(m.id)} title="Eliminar miembro"
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invitaciones pendientes */}
          {team?.invitations?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                Invitaciones pendientes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {team.invitations.map(inv => (
                  <div key={inv.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: 'var(--surface2)', border: '1px solid var(--border2)',
                    borderRadius: 8,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>✉️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--white)' }} className="truncate">
                        {inv.email}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        Vence {new Date(inv.expiresAt).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <span style={chipStyle('#fbbf24')}>Pendiente</span>
                    <button onClick={() => handleRevoke(inv.id)} title="Revocar invitación"
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form para invitar */}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@empresa.com"
              style={inputStyle}
              required
            />
            <button type="submit" disabled={inviting || !inviteEmail.trim()} style={{
              padding: '8px 18px', borderRadius: 6, border: 'none', flexShrink: 0,
              background: inviteEmail.trim() ? 'var(--green)' : 'var(--surface3)',
              color: 'var(--white)', fontFamily: 'var(--font-ui)', fontWeight: 700,
              fontSize: 12, cursor: inviteEmail.trim() ? 'pointer' : 'default',
              opacity: inviting ? 0.7 : 1,
            }}>
              {inviting ? 'Enviando…' : '+ Invitar'}
            </button>
          </form>
          <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 6 }}>
            El invitado recibirá un email con un link para unirse a tu cuenta.
          </div>
        </>
      )}
    </Section>
  )
}

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
    company:             user.company             ?? '',
    email:               user.email               ?? '',
    twilioAccountSid:    user.twilioAccountSid    ?? '',
    twilioAuthToken:     user.twilioAuthToken     ?? '',
    twilioWaNumber:      user.twilioWaNumber      ?? '',
    paymentInstructions: user.paymentInstructions ?? '',
    mpAccessToken:       user.mpAccessToken       ?? '',
    mpPublicKey:         user.mpPublicKey         ?? '',
    bankName:            user.bankName            ?? '',
    bankAccount:         user.bankAccount         ?? '',
    bankAlias:           user.bankAlias           ?? '',
    stripePk:            user.stripePk            ?? '',
    waProvider:          user.waProvider          ?? 'twilio',
    metaPhoneNumberId:   user.metaPhoneNumberId   ?? '',
    metaAccessToken:     user.metaAccessToken     ?? '',
    metaWabaId:          user.metaWabaId          ?? '',
    metaVerifyToken:     user.metaVerifyToken      ?? '',
    stripeSk:            user.stripeSk            ?? '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setChannel = (ch, val) => setForm(f => ({ ...f, channels: { ...f.channels, [ch]: val } }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        api.saveAgentConfig(form),
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

        {/* Timeline visual */}
        <div style={{ margin: '4px 0 20px', padding: '14px 16px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 10 }}>Línea de tiempo de recordatorios</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 10, overflowX: 'auto' }}>
            {[
              { label: `−${form.preDueReminderDays ?? 3}d`, desc: 'Aviso previo', color: 'var(--blue)', active: (form.preDueReminderDays ?? 3) > 0 },
              { label: 'Vencimiento', desc: '📅', color: 'var(--muted)', active: true },
              { label: `+${form.firstReminderDays ?? 1}d`, desc: '1° recordatorio', color: 'var(--amber)', active: true },
              { label: `+${(form.firstReminderDays ?? 1) + (form.followUpDays ?? 5)}d`, desc: '2° follow-up', color: 'var(--red)', active: true },
            ].map((step, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 'none', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: step.active ? 1 : 0.35 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: step.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-ui)', fontWeight: 700, color: step.color, whiteSpace: 'nowrap' }}>{step.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{step.desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: 'var(--border2)', margin: '0 6px', marginBottom: 18 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="config-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <Field label="Aviso previo" hint="Días ANTES del vencimiento (0 = desactivado)">
            <NumberInput value={form.preDueReminderDays ?? 3} onChange={e => set('preDueReminderDays', +e.target.value)} min={0} max={30} />
          </Field>
          <Field label="Días de gracia" hint="Días DESPUÉS del vencimiento para el 1° recordatorio">
            <NumberInput value={form.firstReminderDays} onChange={e => set('firstReminderDays', +e.target.value)} min={0} max={30} />
          </Field>
          <Field label="Seguimiento" hint="Días entre recordatorios sucesivos">
            <NumberInput value={form.followUpDays} onChange={e => set('followUpDays', +e.target.value)} min={1} max={30} />
          </Field>
        </div>

        <div className="config-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Máx. recordatorios" hint="Luego de este límite el agente te escala a vos">
            <NumberInput value={form.maxFollowUps} onChange={e => set('maxFollowUps', +e.target.value)} min={1} max={10} />
          </Field>
          <Field label="Escalar tras" hint="Días sin respuesta antes de notificarte">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NumberInput value={form.escalateAfterDays} onChange={e => set('escalateAfterDays', +e.target.value)} min={1} max={60} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>días</span>
            </div>
          </Field>
        </div>

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

        {/* Ejecución manual */}
        <TestReminderButton />
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

      {/* WhatsApp */}
      <Section
        title="Conexión WhatsApp"
        subtitle="Conectá tu número de WhatsApp Business — tus clientes no necesitan hacer nada"
      >

        {/* Selector de proveedor */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {/* Meta — opción principal */}
          <div
            onClick={() => setProfile(pr => ({ ...pr, waProvider: 'meta' }))}
            style={{
              flex: 2, padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
              background: (profile?.waProvider ?? 'meta') === 'meta' ? 'rgba(45,158,95,0.08)' : 'var(--surface2)',
              border: `1.5px solid ${(profile?.waProvider ?? 'meta') === 'meta' ? 'var(--green-l)' : 'var(--border)'}`,
              transition: 'all .15s', position: 'relative',
            }}
          >
            {/* Badge recomendado */}
            <span style={{
              position: 'absolute', top: 8, right: 10,
              fontSize: 8, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
              background: 'rgba(45,158,95,0.15)', color: 'var(--green-l)',
              border: '1px solid rgba(45,158,95,0.3)', borderRadius: 4, padding: '1px 6px',
            }}>RECOMENDADO</span>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-ui)', color: (profile?.waProvider ?? 'meta') === 'meta' ? 'var(--green-l)' : 'var(--white)', marginBottom: 2 }}>
              ✅ Meta WhatsApp Cloud API
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>Producción real · tu número propio · gratis hasta 1.000 conv/mes</div>
          </div>

          {/* Twilio — opción avanzada */}
          <div
            onClick={() => setProfile(pr => ({ ...pr, waProvider: 'twilio' }))}
            style={{
              flex: 1, padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
              background: profile?.waProvider === 'twilio' ? 'rgba(251,191,36,0.06)' : 'var(--surface2)',
              border: `1.5px solid ${profile?.waProvider === 'twilio' ? 'rgba(251,191,36,0.4)' : 'var(--border)'}`,
              transition: 'all .15s',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)', color: profile?.waProvider === 'twilio' ? '#fbbf24' : 'var(--muted)', marginBottom: 2 }}>
              🧪 Twilio
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted2)' }}>Solo para pruebas</div>
          </div>
        </div>

        {/* Wizard / guía */}
        <WhatsAppGuide
          provider={profile?.waProvider ?? 'meta'}
          profile={profile}
          webhookTwilio={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-inbound`}
          webhookMeta={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-meta-inbound`}
        />

        {/* Campos de credenciales */}
        <div style={{ marginTop: 20 }}>
          {(profile?.waProvider ?? 'meta') === 'meta' ? (
            <div className="config-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Phone Number ID" hint="ID numérico del número en Meta">
                <Input value={profile?.metaPhoneNumberId ?? ''} onChange={e => setProfile(p => ({ ...p, metaPhoneNumberId: e.target.value }))} placeholder="123456789012345" />
              </Field>
              <Field label="WABA ID" hint="WhatsApp Business Account ID">
                <Input value={profile?.metaWabaId ?? ''} onChange={e => setProfile(p => ({ ...p, metaWabaId: e.target.value }))} placeholder="123456789012345" />
              </Field>
              <Field label="Access Token" hint="Token permanente — se guarda de forma segura">
                <Input value={profile?.metaAccessToken ?? ''} onChange={e => setProfile(p => ({ ...p, metaAccessToken: e.target.value }))} placeholder="EAAxxxxxxxxxx..." type="password" />
              </Field>
              <Field label="Verify Token" hint="Texto secreto que elegís vos (paso 3 del wizard)">
                <Input value={profile?.metaVerifyToken ?? ''} onChange={e => setProfile(p => ({ ...p, metaVerifyToken: e.target.value }))} placeholder="mi-empresa-cobraya-2025" />
              </Field>
            </div>
          ) : (
            <div className="config-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Account SID" hint="Empieza con AC...">
                <Input value={profile?.twilioAccountSid ?? ''} onChange={e => setProfile(p => ({ ...p, twilioAccountSid: e.target.value }))} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
              </Field>
              <Field label="Auth Token" hint="Se guarda de forma segura">
                <Input value={profile?.twilioAuthToken ?? ''} onChange={e => setProfile(p => ({ ...p, twilioAuthToken: e.target.value }))} placeholder="••••••••••••••••••••••••••••••••" type="password" />
              </Field>
              <Field label="Número de WhatsApp Sandbox" hint="Con código de país, ej: +14155238886">
                <Input value={profile?.twilioWaNumber ?? ''} onChange={e => setProfile(p => ({ ...p, twilioWaNumber: e.target.value }))} placeholder="+14155238886" />
              </Field>
            </div>
          )}
        </div>
      </Section>

      {/* Métodos de pago */}
      <Section title="Métodos de pago" subtitle={
        <span>
          Elegí qué opciones ve el cliente cuando abre el link de pago —{' '}
          <a
            href="/pagar/demo"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--green-l)', textDecoration: 'none', fontWeight: 600 }}
          >
            Ver demo ↗
          </a>
        </span>
      }>

        {/* MercadoPago */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: profile?.mpAccessToken ? 14 : 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#009ee3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💳</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                MercadoPago
                <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(0,158,227,0.15)', color: '#009ee3', border: '1px solid rgba(0,158,227,0.3)', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.02em' }}>RECOMENDADO 🇺🇾</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Tarjeta, saldo MP, cuotas — funciona en Uruguay</div>
            </div>
            <Toggle
              value={!!profile?.mpAccessToken}
              onChange={v => setProfile(p => ({ ...p, mpAccessToken: v ? (p.mpAccessToken || '') : '' }))}
              label=""
            />
          </div>
          {(!!profile?.mpAccessToken || profile?.mpAccessToken === '') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Tip: dónde encontrar las credenciales */}
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,158,227,0.06)', border: '1px solid rgba(0,158,227,0.18)', marginBottom: 14, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
                📍 Encontrás ambas claves en{' '}
                <a href="https://www.mercadopago.com.uy/developers/panel/app" target="_blank" rel="noreferrer" style={{ color: '#009ee3' }}>
                  mercadopago.com.uy → Tus integraciones → Credenciales de producción
                </a>
              </div>
              <div className="config-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Clave pública" hint="Empieza con APP_USR- · segura para el frontend">
                  <Input
                    value={profile?.mpPublicKey ?? ''}
                    onChange={e => setProfile(p => ({ ...p, mpPublicKey: e.target.value }))}
                    placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </Field>
                <Field label="Access Token" hint="Empieza con APP_USR- · se guarda de forma segura">
                  <Input
                    value={profile?.mpAccessToken ?? ''}
                    onChange={e => setProfile(p => ({ ...p, mpAccessToken: e.target.value }))}
                    placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxx"
                    type="password"
                  />
                </Field>
              </div>
              {profile?.mpPublicKey && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 11, color: 'var(--green-l)' }}>
                  ✓ Con la clave pública configurada, tus clientes verán el botón de MercadoPago con Face ID / huella directamente en la página de pago — sin salir a otro sitio.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

        {/* Transferencia bancaria */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: profile?.bankAccount ? 14 : 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700 }}>Transferencia bancaria</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>BROU, Itaú, Santander, etc.</div>
            </div>
            <Toggle
              value={!!profile?.bankAccount}
              onChange={v => setProfile(p => ({ ...p, bankAccount: v ? (p.bankAccount || '') : '' }))}
              label=""
            />
          </div>
          {(!!profile?.bankAccount || profile?.bankAccount === '') && (
            <div className="config-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <Field label="Banco">
                <Input value={profile?.bankName ?? ''} onChange={e => setProfile(p => ({ ...p, bankName: e.target.value }))} placeholder="BROU" />
              </Field>
              <Field label="Número de cuenta">
                <Input value={profile?.bankAccount ?? ''} onChange={e => setProfile(p => ({ ...p, bankAccount: e.target.value }))} placeholder="001-0123456/00" />
              </Field>
              <Field label="Alias (opcional)">
                <Input value={profile?.bankAlias ?? ''} onChange={e => setProfile(p => ({ ...p, bankAlias: e.target.value }))} placeholder="mi.empresa.uy" />
              </Field>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Instrucciones adicionales" hint="Texto libre que verá el cliente (titular, SISTARBANC, etc.)">
                  <textarea
                    value={profile?.paymentInstructions ?? ''}
                    onChange={e => setProfile(p => ({ ...p, paymentInstructions: e.target.value }))}
                    placeholder="Titular: García & Asociados S.A.&#10;Banco: BROU&#10;Cuenta: 001-0123456/00"
                    rows={3}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 12px', color: 'var(--white)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical' }}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

        {/* Stripe / Apple Pay / Google Pay */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: profile?.stripePk ? 14 : 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#635bff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>  </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                Apple Pay · Google Pay · Tarjeta
                <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(99,91,255,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,91,255,0.25)', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.02em' }}>INTERNACIONAL 🌎</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Vía Stripe — solo para empresas registradas fuera de Uruguay</div>
            </div>
            <Toggle
              value={!!profile?.stripePk}
              onChange={v => setProfile(p => ({ ...p, stripePk: v ? (p.stripePk || '') : '', stripeSk: v ? (p.stripeSk || '') : '' }))}
              label=""
            />
          </div>
          {(!!profile?.stripePk || profile?.stripePk === '') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', marginBottom: 14, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>⚠️ Stripe no soporta Uruguay como país de cobro.</span>
                {' '}Solo podés usarlo si tu empresa está registrada en USA, Europa u otro país compatible. Para cobros en Uruguay usá <strong style={{ color: 'var(--white)' }}>MercadoPago</strong>.
                {' '}Más info en <a href="https://stripe.com/global" target="_blank" rel="noreferrer" style={{ color: '#a5b4fc' }}>stripe.com/global</a>.
              </div>
              <div className="config-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Publishable Key" hint="Empieza con pk_live_ o pk_test_">
                  <Input value={profile?.stripePk ?? ''} onChange={e => setProfile(p => ({ ...p, stripePk: e.target.value }))} placeholder="pk_live_xxxxxxxxxxxx" />
                </Field>
                <Field label="Secret Key" hint="Se guarda de forma segura">
                  <Input value={profile?.stripeSk ?? ''} onChange={e => setProfile(p => ({ ...p, stripeSk: e.target.value }))} placeholder="sk_live_xxxxxxxxxxxx" type="password" />
                </Field>
              </div>
            </div>
          )}
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

      {/* Equipo */}
      <EquipoSection user={user} />
    </div>
  )
}
