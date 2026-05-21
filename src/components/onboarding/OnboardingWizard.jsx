import { useState } from 'react'
import { api } from '@/api'

// ─── Íconos SVG inline ─────────────────────────────────────────
const IcoBuilding = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
    <path d="M10 9h.01M14 9h.01M10 13h.01M14 13h.01M10 17h.01M14 17h.01"/>
  </svg>
)
const IcoUser = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IcoFile = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)
const IcoArrow = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IcoStar = () => (
  <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

// ─── Stepper dots ───────────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width:  i === current ? 24 : 8,
          height: 8,
          borderRadius: 4,
          background: i <= current ? 'var(--green)' : 'var(--border2)',
          transition: 'all .3s ease',
        }} />
      ))}
    </div>
  )
}

// ─── Campos de formulario reutilizables ─────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, required, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', opacity: 0.75, letterSpacing: '.02em' }}>
        {label}{required && <span style={{ color: 'var(--green)' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '11px 14px',
          borderRadius: 10,
          border: '1.5px solid var(--border2)',
          background: 'var(--surface2)',
          color: 'var(--white)',
          fontSize: 15,
          outline: 'none',
          transition: 'border-color .2s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--green)'}
        onBlur={e => e.target.style.borderColor = 'var(--border2)'}
      />
      {hint && <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{hint}</p>}
    </div>
  )
}

// ─── Botones ────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, variant = 'primary', style: sx }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
    transition: 'opacity .2s, transform .15s', opacity: disabled ? 0.5 : 1,
    ...sx,
  }
  const styles = {
    primary: { background: 'var(--green)', color: '#fff' },
    ghost:   { background: 'transparent', color: 'var(--muted)', fontSize: 14, padding: '10px 20px' },
  }
  return (
    <button style={{ ...base, ...styles[variant] }} onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.88' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
      {children}
    </button>
  )
}

// ─── Tarjeta contenedora del wizard ────────────────────────────
function Card({ children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 20,
      padding: '40px 44px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
      width: '100%',
      maxWidth: 480,
    }}>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PASO 0 — Bienvenida
// ═══════════════════════════════════════════════════════════════
function StepBienvenida({ onNext }) {
  return (
    <Card>
      {/* Logo / marca */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'linear-gradient(135deg, var(--green) 0%, #22c55e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(21,128,61,0.30)',
        }}>
          <span style={{ fontSize: 30 }}>💸</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--white)' }}>
          Bienvenido a CobraYa
        </h1>
        <p style={{ marginTop: 10, fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 340, margin: '10px auto 0' }}>
          Tu agente de cobros inteligente. En 3 pasos rápidos vas a estar enviando recordatorios automáticos a tus clientes.
        </p>
      </div>

      {/* Features */}
      {[
        { icon: '🤖', title: 'IA que cobra por vos',    desc: 'Mensajes automáticos por WhatsApp y email' },
        { icon: '💳', title: 'Pagos en el momento',    desc: 'MercadoPago, transferencia o tarjeta' },
        { icon: '📊', title: 'Reportes claros',        desc: 'Sabés siempre qué se cobró y qué falta' },
      ].map(f => (
        <div key={f.title} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'var(--surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>{f.icon}</div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--white)' }}>{f.title}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>{f.desc}</p>
          </div>
        </div>
      ))}

      <Btn onClick={onNext} style={{ width: '100%', marginTop: 28 }}>
        Empezar configuración <IcoArrow />
      </Btn>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// PASO 1 — Datos de la empresa
// ═══════════════════════════════════════════════════════════════
function StepEmpresa({ onNext, onBack }) {
  const [company, setCompany]   = useState('')
  const [signature, setSignature] = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')

  async function handleNext() {
    if (!company.trim()) { setErr('El nombre de la empresa es obligatorio.'); return }
    setErr(''); setLoading(true)
    try {
      await api.saveProfile({ company: company.trim(), signature: signature.trim() || company.trim() })
      onNext({ company, signature })
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <StepHeader icon={<IcoBuilding />} step="Paso 1 de 3" title="Tu empresa" subtitle="¿Cómo se llama tu negocio? Esto aparece en todos los mensajes a tus clientes." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Nombre de la empresa" value={company} onChange={setCompany}
          placeholder="Ej: Ferretería San José" required />
        <Field label="Firma en mensajes" value={signature} onChange={setSignature}
          placeholder={company || 'Ej: El equipo de Ferretería San José'}
          hint="Texto que aparece al final de cada mensaje. Si lo dejás vacío, usamos el nombre de la empresa." />
      </div>
      {err && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <Btn variant="ghost" onClick={onBack}>Atrás</Btn>
        <Btn onClick={handleNext} disabled={loading} style={{ flex: 1 }}>
          {loading ? 'Guardando…' : <>Continuar <IcoArrow /></>}
        </Btn>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// PASO 2 — Primer cliente
// ═══════════════════════════════════════════════════════════════
function StepCliente({ onNext, onBack }) {
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [rut,   setRut]   = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleNext() {
    if (!name.trim())  { setErr('El nombre es obligatorio.'); return }
    if (!phone.trim()) { setErr('El teléfono es obligatorio para enviar mensajes.'); return }
    setErr(''); setLoading(true)
    try {
      const client = await api.createClient({ name: name.trim(), rut: rut.trim(), phone: phone.trim(), email: email.trim() })
      onNext({ client })
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <StepHeader icon={<IcoUser />} step="Paso 2 de 3" title="Primer cliente" subtitle="Agregá un cliente para probar el sistema. Podés agregar más desde la sección Clientes." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Nombre" value={name} onChange={setName} placeholder="Ej: Supermercado El Sol" required />
        <Field label="Teléfono WhatsApp" value={phone} onChange={setPhone}
          placeholder="Ej: +59899123456"
          hint="Incluí el código de país. Ej: +598 para Uruguay." required />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="cliente@empresa.com" />
        <Field label="RUT" value={rut} onChange={setRut} placeholder="Ej: 219876540015" />
      </div>
      {err && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <Btn variant="ghost" onClick={onBack}>Atrás</Btn>
        <Btn onClick={handleNext} disabled={loading} style={{ flex: 1 }}>
          {loading ? 'Guardando…' : <>Continuar <IcoArrow /></>}
        </Btn>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// PASO 3 — Primera factura
// ═══════════════════════════════════════════════════════════════
function StepFactura({ onNext, onBack, onSkip, client }) {
  const today = new Date().toISOString().split('T')[0]
  const [cfeId,  setCfeId]  = useState('')
  const [amount, setAmount] = useState('')
  const [issued, setIssued] = useState(today)
  const [due,    setDue]    = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleNext() {
    if (!cfeId.trim())  { setErr('El número de factura es obligatorio.'); return }
    if (!amount || isNaN(+amount) || +amount <= 0) { setErr('Ingresá un monto válido.'); return }
    if (!due) { setErr('Seleccioná la fecha de vencimiento.'); return }
    setErr(''); setLoading(true)
    try {
      await api.createInvoice({ clientId: client.id, cfeId: cfeId.trim(), amount: +amount, issued, due })
      onNext()
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <StepHeader icon={<IcoFile />} step="Paso 3 de 3" title="Primera factura"
        subtitle={`Cargá una factura para ${client?.name ?? 'tu cliente'}. Podés importar más en lote desde Facturas.`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="N° de factura / CFE" value={cfeId} onChange={setCfeId}
          placeholder="Ej: A 0001-000123" required />
        <Field label="Monto (UYU)" type="number" value={amount} onChange={setAmount}
          placeholder="Ej: 15000" required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Fecha emisión" type="date" value={issued} onChange={setIssued} required />
          <Field label="Vencimiento" type="date" value={due} onChange={setDue} required />
        </div>
      </div>
      {err && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <Btn variant="ghost" onClick={onBack}>Atrás</Btn>
        <Btn variant="ghost" onClick={onSkip} style={{ color: 'var(--muted)' }}>Saltar</Btn>
        <Btn onClick={handleNext} disabled={loading} style={{ flex: 1 }}>
          {loading ? 'Guardando…' : <>Finalizar <IcoArrow /></>}
        </Btn>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════
// PASO 4 — ¡Todo listo!
// ═══════════════════════════════════════════════════════════════
function StepListo({ onDone, company }) {
  return (
    <Card>
      <div style={{ textAlign: 'center' }}>
        {/* Confetti-style celebration */}
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--white)' }}>
          ¡{company || 'Tu empresa'} está lista!
        </h2>
        <p style={{ marginTop: 10, fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>
          Configuraste tu cuenta. El siguiente paso es conectar WhatsApp para empezar a cobrar automáticamente.
        </p>

        {/* Checklist */}
        <div style={{ textAlign: 'left', margin: '24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            'Empresa configurada',
            'Primer cliente agregado',
            'Primera factura cargada',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: '#dcfce7', color: 'var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <IcoCheck />
              </div>
              <span style={{ fontSize: 14, color: 'var(--white)', fontWeight: 500 }}>{item}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--surface2)', color: 'var(--muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 14, fontWeight: 700,
            }}>4</div>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Conectar WhatsApp — <em>pendiente</em></span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn onClick={() => onDone('config')} style={{ width: '100%' }}>
            Conectar WhatsApp ahora
          </Btn>
          <Btn variant="ghost" onClick={() => onDone('dashboard')} style={{ width: '100%' }}>
            Ir al dashboard
          </Btn>
        </div>
      </div>
    </Card>
  )
}

// ─── Header compartido ──────────────────────────────────────────
function StepHeader({ icon, step, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: '#dcfce7', color: 'var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        {icon}
      </div>
      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: 'var(--green)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
        {step}
      </p>
      <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'var(--white)' }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// WIZARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export function OnboardingWizard({ onComplete }) {
  const [step, setStep]       = useState(0)
  const [company, setCompany] = useState('')
  const [client, setClient]   = useState(null)
  const [facturaSkipped, setFacturaSkipped] = useState(false)

  // Los 5 pasos: 0 bienvenida, 1 empresa, 2 cliente, 3 factura, 4 listo
  const TOTAL_DOTS = 3  // puntos visibles solo en pasos 1-3

  async function finalize() {
    try { await api.completeOnboarding() } catch {}
  }

  async function handleDone(dest) {
    await finalize()
    onComplete(dest)  // 'config' o 'dashboard'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      overflowY: 'auto',
    }}>
      {/* Stepper — solo visible en pasos intermedios */}
      {step >= 1 && step <= 3 && (
        <div style={{ marginBottom: 28 }}>
          <Steps current={step - 1} total={TOTAL_DOTS} />
        </div>
      )}

      {step === 0 && (
        <StepBienvenida onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <StepEmpresa
          onBack={() => setStep(0)}
          onNext={({ company: c }) => { setCompany(c); setStep(2) }}
        />
      )}
      {step === 2 && (
        <StepCliente
          onBack={() => setStep(1)}
          onNext={({ client: cl }) => { setClient(cl); setStep(3) }}
        />
      )}
      {step === 3 && (
        <StepFactura
          client={client}
          onBack={() => setStep(2)}
          onSkip={async () => { setFacturaSkipped(true); await finalize(); setStep(4) }}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <StepListo company={company} onDone={handleDone} />
      )}
    </div>
  )
}
