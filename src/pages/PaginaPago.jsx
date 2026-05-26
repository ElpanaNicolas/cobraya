// Página pública de pago — /pagar/:invoiceId
// Diseño 2-click: carga preferencia de MP en el fondo, botón instantáneo.
// Apple Pay / Google Pay: listo para enchufar dLocal cuando esté aprobado.

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
// Cuando dLocal esté aprobado, agregar la API key pública acá:
const DLOCAL_API_KEY    = import.meta.env.VITE_DLOCAL_API_KEY ?? ''

async function callFn(name, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    ...opts,
  })
  return res.json()
}

function fmt(n) {
  return Number(n).toLocaleString('es-UY', { minimumFractionDigits: 0 })
}

// ─── Demo ──────────────────────────────────────────────────────────────────────
const DEMO_INFO = {
  company: 'Ferretería San José', clientName: 'Supermercado El Sol',
  cfeId: 'A 0001-000247', amount: 18500, due: '2025-06-30', status: 'pending',
  hasMercadoPago: true, mpPublicKey: '', hasStripe: false, hasBankTransfer: true,
  bankName: 'BROU', bankAccount: '001-0123456/00', bankAlias: 'ferreteriasjose.uy',
  paymentInstructions: 'Titular: Ferretería San José S.R.L.\nSISTARBANC: indicar número de factura en la referencia.',
  stripePk: null,
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export function PaginaPago() {
  const { invoiceId: routeId } = useParams()
  const invoiceId  = routeId || window.location.pathname.split('/pagar/')[1]?.split('/')[0] || ''
  const isDemo     = invoiceId === 'demo'
  const [params]   = useSearchParams()

  const [info,       setInfo]       = useState(isDemo ? DEMO_INFO : null)
  const [loading,    setLoading]    = useState(!isDemo)
  const [screen,     setScreen]     = useState('main')
  const [msg,        setMsg]        = useState('')

  // Pre-carga de MercadoPago en segundo plano
  const [mpReady,    setMpReady]    = useState(false)
  const [mpUrl,      setMpUrl]      = useState(null)
  const [mpLoading,  setMpLoading]  = useState(false)
  const mpPreloaded                 = useRef(false)

  const fileRef = useRef()

  // ── Cargar info de la factura ──────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) return
    fetch(`${SUPABASE_URL}/functions/v1/get-payment-info?id=${invoiceId}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [invoiceId, isDemo])

  // ── Cargar SDK de MercadoPago cuando hay clave pública ────────────────────
  useEffect(() => {
    if (!info?.mpPublicKey || info?.status === 'paid') return
    if (window.MercadoPago) { setMpReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.onload = () => setMpReady(true)
    script.onerror = () => {}
    document.head.appendChild(script)
  }, [info?.mpPublicKey, info?.status])

  // ── Pre-cargar preferencia de MP (fallback sin clave pública) ─────────────
  useEffect(() => {
    if (!info?.hasMercadoPago || info?.mpPublicKey || isDemo || mpPreloaded.current || info?.status === 'paid') return
    mpPreloaded.current = true
    callFn('create-mp-preference', {
      method: 'POST', body: JSON.stringify({ invoiceId }),
    }).then(data => {
      if (data.initPoint || data.sandboxUrl) {
        setMpUrl(data.initPoint ?? data.sandboxUrl)
      }
    }).catch(() => {})
  }, [info, invoiceId, isDemo])

  // ── Volver de MercadoPago ──────────────────────────────────────────────────
  useEffect(() => {
    const status    = params.get('collection_status') || params.get('status')
    const paymentId = params.get('payment_id') || params.get('collection_id')
    if (!status) return

    if (status === 'approved' || status === 'success') {
      setScreen('success')
      setMsg('¡Pago aprobado! Tu pago fue procesado correctamente.')
      setInfo(prev => prev ? { ...prev, status: 'paid' } : prev)
      if (paymentId && invoiceId && !isDemo) {
        callFn('payment-webhook', {
          method: 'POST',
          body: JSON.stringify({ source: 'mp', invoiceId, paymentId }),
        }).catch(() => {})
      }
    } else if (status === 'failure' || status === 'rejected') {
      setScreen('error')
      setMsg('El pago no se procesó. Podés intentarlo de nuevo.')
    } else if (status === 'pending' || status === 'in_process') {
      setScreen('success')
      setMsg('Pago en proceso. Te avisaremos cuando se confirme.')
    }
  }, [params, invoiceId, isDemo])

  // ── Pagar con MP (fallback redirect — cuando no hay clave pública) ─────────
  async function handleMercadoPagoRedirect() {
    if (isDemo) { setScreen('success'); setMsg('Demo: en producción redirige a MercadoPago.'); return }
    if (mpUrl) { window.location.href = mpUrl; return }
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

  // ── Subir comprobante bancario ─────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (isDemo) {
      setScreen('uploading')
      await new Promise(r => setTimeout(r, 1500))
      setScreen('success'); setMsg('Demo: comprobante verificado por IA ✓')
      return
    }
    setScreen('uploading')
    try {
      const fd = new FormData()
      fd.append('invoiceId', invoiceId)
      fd.append('file', file)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-receipt`, {
        method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, body: fd,
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

  // ── Pantallas de estado ────────────────────────────────────────────────────
  if (loading) return <Page><Spinner /><p style={t.muted}>Cargando...</p></Page>

  if (!info || info.error) return (
    <Page>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <h2 style={t.h2}>Factura no encontrada</h2>
      <p style={t.muted}>El link puede haber expirado o ser incorrecto.</p>
    </Page>
  )

  if (screen === 'uploading') return (
    <Page><Spinner /><p style={{ ...t.muted, marginTop: 16 }}>Verificando comprobante con IA…</p></Page>
  )

  if (screen === 'success') return (
    <Page>
      <div style={{ fontSize: 64, marginBottom: 4 }}>✅</div>
      <h2 style={t.h2}>¡Listo!</h2>
      <p style={{ ...t.muted, textAlign: 'center', marginBottom: 16 }}>{msg}</p>
      <div style={{ width: '100%', padding: '14px 16px', background: 'rgba(34,197,94,0.08)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#4ade80' }}>
          Factura <strong>{info.cfeId}</strong>
        </div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{info.company}</div>
      </div>
    </Page>
  )

  if (screen === 'error') return (
    <Page>
      <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
      <h2 style={t.h2}>Algo salió mal</h2>
      <p style={{ ...t.muted, textAlign: 'center', marginBottom: 20 }}>{msg}</p>
      <button style={t.btnOutline} onClick={() => setScreen('main')}>← Intentar de nuevo</button>
    </Page>
  )

  // ── Pantalla de transferencia bancaria ─────────────────────────────────────
  if (screen === 'bank') return (
    <Page>
      <button style={{ ...t.btnOutline, alignSelf: 'flex-start', marginBottom: 20 }} onClick={() => setScreen('main')}>
        ← Volver
      </button>

      <AmountCard info={info} />

      <div style={{ width: '100%', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '20px', marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          🏦 Datos para transferencia
        </div>
        {info.bankName    && <BankRow label="Banco"  value={info.bankName} />}
        {info.bankAccount && <BankRow label="Cuenta" value={info.bankAccount} copy />}
        {info.bankAlias   && <BankRow label="Alias"  value={info.bankAlias}   copy />}
        {info.paymentInstructions && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#aaa', lineHeight: 1.7, whiteSpace: 'pre-line', borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
            {info.paymentInstructions}
          </div>
        )}
      </div>

      <div style={{ width: '100%', marginTop: 20 }}>
        <p style={{ ...t.muted, marginBottom: 10, textAlign: 'center', fontSize: 12 }}>
          Una vez transferiste, subí el comprobante para confirmación inmediata:
        </p>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
        <button style={t.btnReceipt} onClick={() => fileRef.current?.click()}>
          📎 Subir comprobante
        </button>
      </div>
    </Page>
  )

  // ── Pantalla principal ─────────────────────────────────────────────────────
  const isPaid       = info.status === 'paid'
  const hasMp        = info.hasMercadoPago
  const hasBank      = info.hasBankTransfer
  const hasDLocal    = !!DLOCAL_API_KEY
  const hasMpBricks  = hasMp && !!info.mpPublicKey && mpReady  // Wallet Button con Face ID

  return (
    <Page>
      {/* Banner demo */}
      {isDemo && (
        <div style={{ width: '100%', padding: '8px 14px', borderRadius: 8, marginBottom: 8, background: 'rgba(99,91,255,0.12)', border: '1px solid rgba(99,91,255,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc' }}>Modo demo</div>
            <div style={{ fontSize: 10, color: '#555' }}>Así ve el link el cliente. Los pagos no son reales.</div>
          </div>
        </div>
      )}

      {/* Empresa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: '-.02em' }}>
          {(info.company || 'N').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{info.company}</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 1 }}>te envía esta factura</div>
        </div>
      </div>

      {/* Monto */}
      <AmountCard info={info} />

      {/* Pagada */}
      {isPaid && (
        <p style={{ ...t.muted, textAlign: 'center', marginTop: 8 }}>
          Esta factura ya fue abonada. ¡Gracias! 🙌
        </p>
      )}

      {/* Botones de pago */}
      {!isPaid && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>

          {/* Apple Pay / Google Pay — dLocal (cuando esté configurado) */}
          {hasDLocal && (
            <DLocalButton invoiceId={invoiceId} info={info} isDemo={isDemo}
              onSuccess={() => { setScreen('success'); setMsg('¡Pago aprobado!') }}
              onError={m => { setScreen('error'); setMsg(m) }}
            />
          )}

          {/* MercadoPago Wallet Button (con Face ID / huella) */}
          {hasMp && (
            hasMpBricks
              ? <MpWalletBrick
                  invoiceId={invoiceId}
                  publicKey={info.mpPublicKey}
                  isDemo={isDemo}
                  onError={m => { setScreen('error'); setMsg(m) }}
                />
              : <button
                  onClick={handleMercadoPagoRedirect}
                  disabled={mpLoading}
                  style={{
                    ...t.btnBig,
                    background: mpLoading ? '#007bb5' : '#009ee3',
                    opacity: mpLoading ? 0.85 : 1,
                    boxShadow: '0 4px 24px rgba(0,158,227,0.25)',
                  }}
                >
                  {mpLoading ? (
                    <><SmallSpinner />Conectando…</>
                  ) : (
                    <>
                      <span style={{ fontSize: 20 }}>💳</span>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1 }}>
                          Pagar ${fmt(info.amount)} UYU
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>
                          MercadoPago · tarjeta · cuotas · saldo MP
                        </div>
                      </div>
                      <span style={{ fontSize: 20, opacity: 0.7 }}>›</span>
                    </>
                  )}
                </button>
          )}

          {/* Transferencia bancaria — opción secundaria */}
          {hasBank && (
            <button style={t.btnSecondary} onClick={() => setScreen('bank')}>
              🏦 Pagar por transferencia bancaria
            </button>
          )}

          {/* Ya pagué — subir comprobante */}
          {(hasMp || hasBank) && (
            <>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
              <button style={t.btnGhost} onClick={() => fileRef.current?.click()}>
                📎 Ya pagué — subir comprobante
              </button>
            </>
          )}

          {/* Si no hay métodos configurados */}
          {!hasMp && !hasBank && (
            <>
              <p style={{ ...t.muted, textAlign: 'center', fontSize: 12 }}>
                El negocio no tiene métodos de pago online configurados aún.
                <br />Subí el comprobante si ya realizaste el pago:
              </p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
              <button style={t.btnReceipt} onClick={() => fileRef.current?.click()}>
                📎 Subir comprobante de pago
              </button>
            </>
          )}
        </div>
      )}
    </Page>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MercadoPago Wallet Button (Bricks)
// Muestra el botón oficial de MP embebido en la página.
// En mobile con app MP instalada → Face ID / huella directo.
// Requiere: clave pública del negocio en mp_public_key.
// ══════════════════════════════════════════════════════════════════════════════
function MpWalletBrick({ invoiceId, publicKey, isDemo, onError }) {
  const containerId        = `mp-wallet-${invoiceId}`
  const brickRef           = useRef(null)
  const [ready, setReady]  = useState(false)
  const [prefId, setPrefId] = useState(null)

  // Paso 1: crear preferencia primero (antes de inicializar el Brick)
  useEffect(() => {
    if (isDemo) { setPrefId('demo'); return }
    callFn('create-mp-preference', {
      method: 'POST',
      body:   JSON.stringify({ invoiceId }),
    }).then(data => {
      if (data.error) { onError(data.error); return }
      setPrefId(data.preferenceId)
    }).catch(() => onError('No se pudo conectar con MercadoPago.'))
  }, [invoiceId, isDemo])

  // Paso 2: inicializar el Brick solo cuando ya tenemos preferenceId
  useEffect(() => {
    if (!prefId || brickRef.current) return

    try {
      const mp = new window.MercadoPago(publicKey, { locale: 'es-UY' })
      mp.bricks().create('wallet', containerId, {
        initialization: {
          preferenceId: prefId,
          redirectMode: 'self',   // redirige en el mismo tab; abre app MP con Face ID
        },
        customization: {
          texts:  { action: 'pay', valueProp: 'smart_option' },
          visual: { buttonBackground: 'default', borderRadius: '14px', buttonHeight: '56px' },
        },
        callbacks: {
          onReady: () => setReady(true),
          onError: (err) => {
            console.error('MP Brick error:', err)
            onError('Error al iniciar el pago. Intentá de nuevo.')
          },
        },
      }).then(brick => { brickRef.current = brick })
    } catch (e) {
      console.warn('MP Bricks init error:', e)
      onError('Error al cargar MercadoPago.')
    }

    return () => { brickRef.current?.unmount?.(); brickRef.current = null }
  }, [prefId, publicKey, containerId])

  return (
    <div style={{ width: '100%' }}>
      <div id={containerId} style={{ width: '100%', minHeight: 56 }} />
      {!ready && (
        <div style={{
          width: '100%', height: 56, borderRadius: 14, marginTop: -56,
          background: 'linear-gradient(90deg, #009ee3 0%, #007bb5 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          pointerEvents: 'none',
        }}>
          <SmallSpinner />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600 }}>
            MercadoPago…
          </span>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// dLocal — Apple Pay / Google Pay
// Se activa cuando VITE_DLOCAL_API_KEY está configurado
// ══════════════════════════════════════════════════════════════════════════════
function DLocalButton({ invoiceId, info, isDemo, onSuccess, onError }) {
  const [loaded,  setLoaded]  = useState(false)
  const [canPay,  setCanPay]  = useState(false) // ¿el dispositivo soporta Apple/Google Pay?
  const [paying,  setPaying]  = useState(false)
  const containerRef          = useRef()

  useEffect(() => {
    // Cargar dLocal.js dinámicamente
    if (window.dlocal) { initDLocal(); return }
    const script = document.createElement('script')
    script.src   = 'https://js.dlocal.com/'
    script.onload = initDLocal
    document.head.appendChild(script)
  }, [])

  function initDLocal() {
    try {
      const dl = window.dlocal(DLOCAL_API_KEY)
      const fields = dl.fields({ locale: 'es', country: 'UY' })

      const paymentRequest = dl.paymentRequest({
        country:  'UY',
        currency: 'UYU',
        amount:   info.amount,
        label:    `${info.company} — ${info.cfeId}`,
        requestPayerEmail: false,
        requestPayerName:  false,
      })

      paymentRequest.canMakePayment().then(result => {
        if (!result) return
        setCanPay(true)

        // Montar el botón nativo de Apple Pay / Google Pay
        const prButton = fields.create('paymentRequestButton', {
          paymentRequest,
          style: {
            paymentRequestButton: { type: 'pay', theme: 'dark', height: '56px' },
          },
        })

        if (containerRef.current) {
          prButton.mount(containerRef.current)
          setLoaded(true)
        }

        paymentRequest.on('paymentmethod', async (ev) => {
          if (isDemo) { ev.complete('success'); onSuccess(); return }
          setPaying(true)
          try {
            const data = await callFn('create-dlocal-payment', {
              method: 'POST',
              body: JSON.stringify({
                invoiceId,
                paymentMethodId: ev.paymentMethod.id,
                amount: info.amount,
              }),
            })
            if (data.ok) {
              ev.complete('success')
              onSuccess()
            } else {
              ev.complete('fail')
              onError(data.error ?? 'No se pudo procesar el pago.')
            }
          } catch {
            ev.complete('fail')
            onError('Error al procesar el pago.')
          } finally {
            setPaying(false)
          }
        })
      })
    } catch (e) {
      console.warn('dLocal init error:', e)
    }
  }

  if (!canPay) return null  // No mostrar si el dispositivo no soporta

  return (
    <div>
      {/* El SDK de dLocal monta el botón nativo de Apple Pay / Google Pay acá */}
      <div ref={containerRef} style={{ width: '100%', minHeight: 56, borderRadius: 14, overflow: 'hidden' }} />
      {!loaded && (
        <div style={{ width: '100%', height: 56, borderRadius: 14, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <SmallSpinner />
          <span style={{ fontSize: 13, color: '#555' }}>Cargando Apple Pay…</span>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────
function Page({ children }) {
  return (
    <div style={t.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
      `}</style>
      <div style={t.card}>{children}</div>
      <p style={{ textAlign: 'center', color: '#444', fontSize: 11, marginTop: 14 }}>
        Cobros automáticos por <strong style={{ color: '#333' }}>Cobraya</strong>
        {' · '}
        <a href="/privacidad" style={{ color: '#555', textDecoration: 'none' }}>Privacidad</a>
        {' · '}
        <a href="/terminos" style={{ color: '#555', textDecoration: 'none' }}>Términos</a>
      </p>
    </div>
  )
}

function AmountCard({ info }) {
  const isOverdue = info.status !== 'paid' && new Date(info.due) < new Date()
  return (
    <div style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${isOverdue ? '#3f1818' : '#1a1a1a'}`, borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
        Total a pagar
      </div>
      <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>
        ${fmt(info.amount)}
        <span style={{ fontSize: 18, fontWeight: 400, color: '#333', marginLeft: 6 }}>UYU</span>
      </div>
      <div style={{ fontSize: 11, color: '#333', marginTop: 10, lineHeight: 1.6 }}>
        {info.cfeId} · Vence {new Date(info.due + 'T12:00:00').toLocaleDateString('es-UY', { day: 'numeric', month: 'long' })}
      </div>
      {isOverdue && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#f87171', fontWeight: 600 }}>
          ⚠️ Factura vencida
        </div>
      )}
      {info.status === 'paid' && (
        <div style={{ marginTop: 10 }}>
          <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
            ✓ Pagada
          </span>
        </div>
      )}
    </div>
  )
}

function BankRow({ label, value, copy }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ fontSize: 11, color: '#444' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#ccc', fontFamily: 'monospace' }}>{value}</span>
        {copy && (
          <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ background: 'none', border: `1px solid ${copied ? '#22c55e' : '#2a2a2a'}`, borderRadius: 5, padding: '2px 8px', color: copied ? '#22c55e' : '#555', fontSize: 10, cursor: 'pointer', transition: 'all .2s' }}
          >
            {copied ? '✓' : 'Copiar'}
          </button>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #1e1e1e', borderTopColor: '#22c55e', animation: 'spin .7s linear infinite' }} />
}

function SmallSpinner() {
  return <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.15)', borderTopColor: 'rgba(255,255,255,.6)', animation: 'spin .6s linear infinite', flexShrink: 0 }} />
}

// ── Estilos base ───────────────────────────────────────────────────────────────
const t = {
  page:        { minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  card:        { background: '#111', border: '1px solid #1c1c1c', borderRadius: 22, padding: '28px 22px', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  h2:          { fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px', textAlign: 'center' },
  muted:       { color: '#555', fontSize: 13, margin: 0 },
  btnBig:      { width: '100%', border: 'none', borderRadius: 14, padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: '#fff', transition: 'opacity .15s, transform .1s', fontFamily: 'inherit' },
  btnSecondary:{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '14px 18px', cursor: 'pointer', color: '#aaa', fontSize: 13, fontWeight: 600, textAlign: 'left', fontFamily: 'inherit' },
  btnGhost:    { width: '100%', background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 12, padding: '12px', cursor: 'pointer', color: '#444', fontSize: 12, fontWeight: 500, fontFamily: 'inherit' },
  btnReceipt:  { width: '100%', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 12, padding: '14px', color: '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnOutline:  { background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 16px', color: '#666', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
}
