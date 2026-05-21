// Página pública de pago — /pagar/:invoiceId
// Sin login. Muestra solo los métodos de pago que el negocio configuró.

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callFn(name, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    ...opts,
  })
  return res.json()
}

function fmt(n) {
  return Number(n).toLocaleString('es-UY', { minimumFractionDigits: 0 })
}

// ── Stripe checkout embebido ───────────────────────────────────
function StripeForm({ onSuccess, onError }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (error) {
      onError(error.message)
    } else {
      onSuccess()
    }
    setPaying(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={!stripe || paying}
        style={{ ...s.btnPrimary, width: '100%', marginTop: 16, opacity: paying ? .7 : 1 }}
      >
        {paying ? 'Procesando…' : 'Confirmar pago'}
      </button>
    </form>
  )
}

// ── Datos de demo (no toca Supabase) ──────────────────────────
const DEMO_INFO = {
  company:          'Ferretería San José',
  clientName:       'Supermercado El Sol',
  cfeId:            'A 0001-000247',
  amount:           18500,
  due:              '2025-06-30',
  status:           'pending',
  hasMercadoPago:   true,
  hasStripe:        true,
  hasBankTransfer:  true,
  bankName:         'BROU',
  bankAccount:      '001-0123456/00',
  bankAlias:        'ferreteriasjose.uy',
  paymentInstructions: 'Titular: Ferretería San José S.R.L.\nSISTARBANC: indicar número de factura en la referencia.',
  stripePk:         null,  // no carga Stripe real en demo
}

// ── Página principal ───────────────────────────────────────────
export function PaginaPago() {
  // useParams() no funciona fuera de <Routes> — extraemos el ID de la URL directamente
  const { invoiceId: routeId }  = useParams()
  const invoiceId               = routeId || window.location.pathname.split('/pagar/')[1]?.split('/')[0] || ''
  const isDemo                  = invoiceId === 'demo'
  const [params]                = useSearchParams()
  const [info, setInfo]         = useState(isDemo ? DEMO_INFO : null)
  const [loading, setLoading]   = useState(!isDemo)
  const [screen, setScreen]     = useState('main')   // main | bank | stripe | uploading | success | error
  const [msg, setMsg]           = useState('')
  const [mpLoading, setMpLoading] = useState(false)
  const [stripePromise, setStripePromise] = useState(null)
  const [clientSecret, setClientSecret]   = useState(null)
  const fileRef = useRef()

  // Cargar info de la factura (solo si no es demo)
  useEffect(() => {
    if (isDemo) return
    fetch(`${SUPABASE_URL}/functions/v1/get-payment-info?id=${invoiceId}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [invoiceId, isDemo])

  // Redirigido de vuelta desde MercadoPago
  useEffect(() => {
    const status = params.get('status')
    if (status === 'success') { setScreen('success'); setMsg('¡Pago confirmado! Tu pago fue procesado correctamente.') }
    else if (status === 'failure') { setScreen('error'); setMsg('El pago no se procesó. Podés intentarlo de nuevo o usar otro método.') }
    else if (status === 'pending') { setScreen('success'); setMsg('Pago en proceso. Te avisaremos cuando se confirme.') }
  }, [params])

  // ── Iniciar MercadoPago ──────────────────────────────────────
  async function handleMercadoPago() {
    if (isDemo) { setScreen('success'); setMsg('Demo: en producción esto redirige a MercadoPago Checkout.'); return }
    setMpLoading(true)
    try {
      const data = await callFn('create-mp-preference', {
        method: 'POST', body: JSON.stringify({ invoiceId }),
      })
      if (data.error) { setScreen('error'); setMsg(data.error); return }
      window.location.href = data.initPoint ?? data.sandboxUrl
    } catch {
      setScreen('error'); setMsg('No se pudo conectar con MercadoPago.')
    } finally { setMpLoading(false) }
  }

  // ── Iniciar Stripe ───────────────────────────────────────────
  async function handleStripe() {
    if (isDemo) { setScreen('success'); setMsg('Demo: en producción esto abre Apple Pay / Google Pay / tarjeta.'); return }
    if (!info?.stripePk) return
    setScreen('stripe')
    if (!stripePromise) setStripePromise(loadStripe(info.stripePk))
    const data = await callFn('create-stripe-intent', {
      method: 'POST', body: JSON.stringify({ invoiceId }),
    })
    if (data.error) { setScreen('error'); setMsg(data.error); return }
    setClientSecret(data.clientSecret)
  }

  // ── Subir comprobante ────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (isDemo) {
      setScreen('uploading')
      await new Promise(r => setTimeout(r, 2000))
      setScreen('success'); setMsg('Demo: comprobante verificado por IA ✓ (simulación)')
      return
    }
    setScreen('uploading')
    try {
      const fd = new FormData()
      fd.append('invoiceId', invoiceId)
      fd.append('file', file)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-receipt`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY },
        body: fd,
      })
      const data = await res.json()
      if (data.ok) {
        setScreen('success')
        setMsg(data.message ?? '¡Comprobante recibido y verificado!')
        setInfo(prev => prev ? { ...prev, status: 'paid' } : prev)
      } else {
        setScreen('error')
        setMsg(data.message ?? 'No pudimos verificar el comprobante. Intentá con una imagen más clara.')
      }
    } catch {
      setScreen('error'); setMsg('Error al subir. Intentá de nuevo.')
    }
  }

  // ── Renders de estados ───────────────────────────────────────
  if (loading) return <Shell><Spinner /><p style={s.muted}>Cargando...</p></Shell>

  if (!info || info.error) return (
    <Shell>
      <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
      <h2 style={s.title}>Factura no encontrada</h2>
      <p style={s.muted}>El link puede haber expirado o ser incorrecto.</p>
    </Shell>
  )

  if (screen === 'success') return (
    <Shell>
      <div style={{ fontSize: 56, marginBottom: 8 }}>✅</div>
      <h2 style={s.title}>¡Listo!</h2>
      <p style={{ ...s.muted, textAlign: 'center' }}>{msg}</p>
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #86efac', width: '100%' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#16a34a', textAlign: 'center' }}>
          Factura <strong>{info.cfeId}</strong> — <strong>{info.company}</strong>
        </p>
      </div>
    </Shell>
  )

  if (screen === 'error') return (
    <Shell>
      <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
      <h2 style={s.title}>Algo salió mal</h2>
      <p style={{ ...s.muted, textAlign: 'center' }}>{msg}</p>
      <button style={{ ...s.btnOutline, marginTop: 20 }} onClick={() => setScreen('main')}>← Volver</button>
    </Shell>
  )

  if (screen === 'uploading') return (
    <Shell><Spinner /><p style={{ ...s.muted, marginTop: 16 }}>Verificando comprobante con IA…</p></Shell>
  )

  // ── Pantalla Stripe embebida ─────────────────────────────────
  if (screen === 'stripe') return (
    <Shell wide>
      <InvoiceCard info={info} />
      <button style={{ ...s.btnOutline, marginBottom: 16, alignSelf: 'flex-start' }} onClick={() => setScreen('main')}>← Volver</button>
      {clientSecret && stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
          <StripeForm
            onSuccess={() => { setScreen('success'); setMsg('¡Pago con tarjeta confirmado!'); setInfo(i => ({ ...i, status: 'paid' })) }}
            onError={err => { setScreen('error'); setMsg(err) }}
          />
        </Elements>
      ) : (
        <div style={{ textAlign: 'center' }}><Spinner /><p style={s.muted}>Preparando checkout…</p></div>
      )}
    </Shell>
  )

  // ── Pantalla Transferencia bancaria ──────────────────────────
  if (screen === 'bank') return (
    <Shell>
      <button style={{ ...s.btnOutline, marginBottom: 16, alignSelf: 'flex-start' }} onClick={() => setScreen('main')}>← Volver</button>
      <InvoiceCard info={info} />
      <div style={s.bankBox}>
        <div style={s.bankTitle}>🏦 Datos para transferencia</div>
        {info.bankName    && <BankRow label="Banco"   value={info.bankName} />}
        {info.bankAccount && <BankRow label="Cuenta"  value={info.bankAccount} copy />}
        {info.bankAlias   && <BankRow label="Alias"   value={info.bankAlias}   copy />}
        {info.paymentInstructions && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#ccc', lineHeight: 1.7, whiteSpace: 'pre-line', borderTop: '1px solid #333', paddingTop: 12 }}>
            {info.paymentInstructions}
          </div>
        )}
      </div>

      <p style={{ ...s.muted, marginTop: 16, textAlign: 'center' }}>
        Una vez que transferiste, subí el comprobante:
      </p>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
      <button style={{ ...s.btnReceipt, marginTop: 8 }} onClick={() => fileRef.current?.click()}>
        📎 Subir comprobante de pago
      </button>
    </Shell>
  )

  // ── Pantalla principal ───────────────────────────────────────
  const isPaid = info.status === 'paid'
  const hasAnyMethod = info.hasMercadoPago || info.hasStripe || info.hasBankTransfer

  return (
    <Shell>
      {/* Banner demo */}
      {isDemo && (
        <div style={{
          width: '100%', padding: '8px 14px', borderRadius: 8, marginBottom: 4,
          background: 'rgba(99,91,255,0.15)', border: '1px solid rgba(99,91,255,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc' }}>Modo demo</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Así ve el link el cliente. Los pagos no son reales.</div>
          </div>
        </div>
      )}

      {/* Negocio */}
      <div style={s.bizRow}>
        <div style={s.bizInitials}>{(info.company || 'N').slice(0,2).toUpperCase()}</div>
        <div>
          <div style={s.bizName}>{info.company}</div>
          <div style={s.bizSub}>te envía esta factura</div>
        </div>
      </div>

      {/* Monto */}
      <InvoiceCard info={info} />

      {isPaid && <p style={{ ...s.muted, textAlign: 'center' }}>Esta factura ya fue abonada. ¡Gracias! 🙌</p>}

      {!isPaid && hasAnyMethod && (
        <>
          <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, alignSelf: 'flex-start' }}>Elegí cómo pagar</p>

          <div style={s.methods}>
            {/* MercadoPago */}
            {info.hasMercadoPago && (
              <button style={{ ...s.methodBtn, background: '#009ee3', color: '#fff', opacity: mpLoading ? .7 : 1 }}
                onClick={handleMercadoPago} disabled={mpLoading}>
                <span style={s.methodIcon}>💳</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>MercadoPago</div>
                  <div style={{ fontSize: 11, opacity: .8 }}>Tarjeta · Saldo MP · Cuotas</div>
                </div>
                <span style={s.arrow}>›</span>
              </button>
            )}

            {/* Stripe / Apple Pay / Google Pay */}
            {info.hasStripe && (
              <button style={{ ...s.methodBtn, background: '#635bff', color: '#fff' }}
                onClick={handleStripe}>
                <span style={s.methodIcon}> </span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Apple Pay · Google Pay · Tarjeta</div>
                  <div style={{ fontSize: 11, opacity: .8 }}>Pago seguro con Stripe</div>
                </div>
                <span style={s.arrow}>›</span>
              </button>
            )}

            {/* Transferencia bancaria */}
            {info.hasBankTransfer && (
              <button style={s.methodBtn} onClick={() => setScreen('bank')}>
                <span style={s.methodIcon}>🏦</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Transferencia bancaria</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{info.bankName || 'Ver datos de cuenta'}</div>
                </div>
                <span style={{ ...s.arrow, color: '#888' }}>›</span>
              </button>
            )}

            {/* Subir comprobante (siempre disponible si hay métodos) */}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
            <button style={s.btnReceipt} onClick={() => fileRef.current?.click()}>
              📎 Ya pagué — subir comprobante
            </button>
          </div>

          <p style={s.footerNote}>La verificación del comprobante es automática por IA.</p>
        </>
      )}

      {!isPaid && !hasAnyMethod && (
        <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
          <button style={s.btnReceipt} onClick={() => fileRef.current?.click()}>
            📎 Ya pagué — subir comprobante
          </button>
        </>
      )}
    </Shell>
  )
}

// ── Sub-componentes ────────────────────────────────────────────
function Shell({ children, wide }) {
  return (
    <div style={s.page}>
      <div style={{ ...s.card, maxWidth: wide ? 520 : 400 }}>
        {children}
      </div>
      <p style={{ textAlign: 'center', color: '#333', fontSize: 11, marginTop: 16 }}>
        Powered by <strong style={{ color: '#555' }}>Cobraya</strong>
      </p>
    </div>
  )
}

function Spinner() {
  return <div style={s.spinner} />
}

function InvoiceCard({ info }) {
  return (
    <div style={s.amountBox}>
      <div style={s.amountLabel}>Total a pagar</div>
      <div style={s.amount}>${fmt(info.amount)}<span style={s.currency}> UYU</span></div>
      <div style={s.invoiceRef}>Factura {info.cfeId} · Vence {info.due}</div>
      {info.status === 'paid' && (
        <div style={{ marginTop: 10 }}>
          <span style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600 }}>✓ Pagada</span>
        </div>
      )}
    </div>
  )
}

function BankRow({ label, value, copy }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #222' }}>
      <span style={{ fontSize: 11, color: '#666' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#ddd', fontFamily: 'monospace' }}>{value}</span>
        {copy && (
          <button onClick={handleCopy} style={{ background: 'none', border: '1px solid #333', borderRadius: 4, padding: '2px 8px', color: copied ? '#22c55e' : '#888', fontSize: 10, cursor: 'pointer' }}>
            {copied ? '✓' : 'Copiar'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Estilos ────────────────────────────────────────────────────
const s = {
  page:        { minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  card:        { background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, padding: '28px 24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  spinner:     { width: 32, height: 32, borderRadius: '50%', border: '2px solid #333', borderTopColor: '#22c55e', animation: 'spin .7s linear infinite' },
  muted:       { color: '#666', fontSize: 14, margin: 0 },
  title:       { fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' },
  bizRow:      { display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginBottom: 16 },
  bizInitials: { width: 40, height: 40, borderRadius: 10, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 },
  bizName:     { fontSize: 15, fontWeight: 700, color: '#fff' },
  bizSub:      { fontSize: 11, color: '#555', marginTop: 2 },
  amountBox:   { width: '100%', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '22px 20px', textAlign: 'center', marginBottom: 8 },
  amountLabel: { fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 },
  amount:      { fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-1px' },
  currency:    { fontSize: 16, fontWeight: 400, color: '#555' },
  invoiceRef:  { fontSize: 12, color: '#444', marginTop: 6 },
  methods:     { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 },
  methodBtn:   { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 },
  methodIcon:  { fontSize: 22, flexShrink: 0 },
  arrow:       { fontSize: 22, color: 'rgba(255,255,255,.4)' },
  btnReceipt:  { width: '100%', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 12, padding: '14px', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  btnOutline:  { background: 'transparent', border: '1px solid #333', borderRadius: 8, padding: '8px 16px', color: '#888', fontSize: 13, cursor: 'pointer' },
  btnPrimary:  { background: '#635bff', border: 'none', borderRadius: 10, padding: '14px 24px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  bankBox:     { width: '100%', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: '16px', marginTop: 4 },
  bankTitle:   { fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 12 },
  footerNote:  { fontSize: 11, color: '#333', marginTop: 12, textAlign: 'center' },
}
