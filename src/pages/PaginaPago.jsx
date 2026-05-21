// Página pública de pago — accesible sin login
// URL: /pagar/:invoiceId
// Diseñada para abrirse desde WhatsApp en el celu del cliente

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

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

function statusColor(s) {
  return s === 'paid' ? '#22c55e' : '#f59e0b'
}

export function PaginaPago() {
  const { invoiceId }        = useParams()
  const [params]             = useSearchParams()
  const [info, setInfo]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep]      = useState('main') // main | uploading | success | error
  const [msg, setMsg]        = useState('')
  const [mpLoading, setMpLoading] = useState(false)
  const fileRef              = useRef()

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/get-payment-info?id=${invoiceId}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [invoiceId])

  // Llegó de vuelta desde MercadoPago
  useEffect(() => {
    const status = params.get('status')
    if (status === 'success') {
      setStep('success')
      setMsg('¡Pago confirmado! Tu pago fue procesado correctamente.')
    } else if (status === 'failure') {
      setStep('error')
      setMsg('El pago no fue procesado. Podés intentarlo de nuevo o usar otro método.')
    } else if (status === 'pending') {
      setStep('success')
      setMsg('Pago en proceso. Te avisaremos cuando se confirme.')
    }
  }, [params])

  async function handleMercadoPago() {
    setMpLoading(true)
    try {
      const data = await callFn('create-mp-preference', {
        method: 'POST',
        body: JSON.stringify({ invoiceId }),
      })
      if (data.error) { setStep('error'); setMsg(data.error); return }
      // En producción usar initPoint, en test sandboxUrl
      const url = data.initPoint ?? data.sandboxUrl
      window.location.href = url
    } catch {
      setStep('error')
      setMsg('No se pudo conectar con MercadoPago. Intentá de nuevo.')
    } finally {
      setMpLoading(false)
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setStep('uploading')
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
        setStep('success')
        setMsg(data.message ?? '¡Comprobante recibido! Quedó registrado.')
        setInfo(prev => prev ? { ...prev, status: 'paid' } : prev)
      } else {
        setStep('error')
        setMsg(data.message ?? 'No pudimos verificar el comprobante. Intentá con otra imagen.')
      }
    } catch {
      setStep('error')
      setMsg('Error al subir el archivo. Intentá de nuevo.')
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={{ color: '#888', fontSize: 14, marginTop: 16 }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!info || info.error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
          <h2 style={styles.title}>Factura no encontrada</h2>
          <p style={{ color: '#888', fontSize: 14 }}>El link puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    )
  }

  // ── Pantalla de éxito ──────────────────────────────────────
  if (step === 'success') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✅</div>
          <h2 style={styles.title}>¡Listo!</h2>
          <p style={{ color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>{msg}</p>
          <div style={{ marginTop: 24, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#16a34a', textAlign: 'center' }}>
              Factura <strong>{info.cfeId}</strong> — <strong>{info.company}</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Pantalla de error ──────────────────────────────────────
  if (step === 'error') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
          <h2 style={styles.title}>Algo salió mal</h2>
          <p style={{ color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>{msg}</p>
          <button style={{ ...styles.btnPrimary, marginTop: 20 }} onClick={() => setStep('main')}>
            Volver a intentar
          </button>
        </div>
      </div>
    )
  }

  // ── Cargando comprobante ───────────────────────────────────
  if (step === 'uploading') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={{ color: '#888', fontSize: 14, marginTop: 16, textAlign: 'center' }}>
            Analizando comprobante con IA…
          </p>
        </div>
      </div>
    )
  }

  const isPaid = info.status === 'paid'

  // ── Página principal ───────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Negocio */}
        <div style={styles.businessHeader}>
          <div style={styles.businessInitials}>
            {(info.company || 'N').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={styles.businessName}>{info.company}</div>
            <div style={styles.businessLabel}>te envía esta factura</div>
          </div>
        </div>

        {/* Monto */}
        <div style={styles.amountBox}>
          <div style={styles.amountLabel}>Total a pagar</div>
          <div style={styles.amount}>${fmt(info.amount)}<span style={styles.currency}> UYU</span></div>
          <div style={styles.invoiceRef}>Factura {info.cfeId} · Vence {info.due}</div>
          {isPaid && (
            <div style={{ marginTop: 10, padding: '6px 14px', background: '#f0fdf4', borderRadius: 20, display: 'inline-block' }}>
              <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>✓ Pagada</span>
            </div>
          )}
        </div>

        {!isPaid && (
          <>
            {/* Instrucciones de transferencia */}
            {info.paymentInstructions && (
              <div style={styles.transferBox}>
                <div style={styles.transferTitle}>🏦 Datos para transferencia</div>
                <div style={styles.transferText}>{info.paymentInstructions}</div>
              </div>
            )}

            <div style={styles.divider}><span>O pagá directamente</span></div>

            {/* Botones de pago */}
            <div style={styles.actions}>

              {/* MercadoPago */}
              {info.hasMercadoPago && (
                <button
                  style={{ ...styles.btnMP, opacity: mpLoading ? .7 : 1 }}
                  onClick={handleMercadoPago}
                  disabled={mpLoading}
                >
                  <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png"
                    alt="MercadoPago" height={22} style={{ filter: 'brightness(0) invert(1)' }} />
                  {mpLoading ? 'Redirigiendo…' : 'Pagar con MercadoPago'}
                </button>
              )}

              {/* Subir comprobante */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button style={styles.btnReceipt} onClick={() => fileRef.current?.click()}>
                📎 Ya pagué — subir comprobante
              </button>
            </div>

            <p style={styles.footer}>
              La verificación del comprobante es automática por IA.
            </p>
          </>
        )}

        {isPaid && (
          <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: 8 }}>
            Esta factura ya fue abonada. ¡Gracias!
          </p>
        )}
      </div>

      {/* Powered by */}
      <p style={{ textAlign: 'center', color: '#555', fontSize: 11, marginTop: 20 }}>
        Powered by <strong>Cobraya</strong>
      </p>
    </div>
  )
}

// ── Estilos ────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 20,
    padding: '28px 24px',
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '2px solid #333',
    borderTopColor: '#22c55e',
    animation: 'spin .7s linear infinite',
  },
  businessHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  businessInitials: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: '#1a1a1a',
    border: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  businessName: { fontSize: 16, fontWeight: 700, color: '#fff' },
  businessLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  amountBox: {
    width: '100%',
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    borderRadius: 16,
    padding: '24px 20px',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  amount: { fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: '-1px' },
  currency: { fontSize: 18, fontWeight: 400, color: '#666' },
  invoiceRef: { fontSize: 12, color: '#555', marginTop: 8 },
  transferBox: {
    width: '100%',
    background: '#0d1117',
    border: '1px solid #1a2332',
    borderRadius: 12,
    padding: '16px',
    marginBottom: 16,
  },
  transferTitle: { fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 8 },
  transferText: { fontSize: 13, color: '#ccc', lineHeight: 1.7, whiteSpace: 'pre-line' },
  divider: {
    width: '100%',
    textAlign: 'center',
    borderTop: '1px solid #222',
    marginBottom: 16,
    position: 'relative',
    '& span': {
      background: '#111',
      padding: '0 10px',
      fontSize: 11,
      color: '#555',
      position: 'relative',
      top: -9,
    },
  },
  actions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  btnMP: {
    width: '100%',
    background: '#009ee3',
    border: 'none',
    borderRadius: 12,
    padding: '15px',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnReceipt: {
    width: '100%',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: 12,
    padding: '15px',
    color: '#ccc',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnPrimary: {
    background: '#22c55e',
    border: 'none',
    borderRadius: 12,
    padding: '14px 28px',
    color: '#000',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  title: { fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 },
  footer: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 1.5,
  },
}
