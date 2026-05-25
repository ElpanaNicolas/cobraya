// payment-webhook
// Centraliza la confirmación de pagos de MercadoPago y Stripe.
//
// Flujos soportados:
//   A. Webhook automático de MercadoPago  — body: { type:'payment', data:{id} }
//   B. Webhook automático de Stripe       — header: stripe-signature
//   C. Confirmación client-side de Stripe — body: { source:'stripe', invoiceId, paymentIntentId }
//   D. Confirmación client-side de MP     — body: { source:'mp', invoiceId, paymentId }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// ── Email de confirmación de pago ──────────────────────────────────────────
async function sendPaymentConfirmationEmail(opts: {
  clientName:  string
  clientEmail: string
  companyName: string
  invoiceRef:  string
  amount:      number
}) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    console.log('RESEND_API_KEY no configurada — omitiendo email de confirmación')
    return
  }

  const amountStr = new Intl.NumberFormat('es-UY', {
    style: 'currency', currency: 'UYU', minimumFractionDigits: 0,
  }).format(opts.amount)

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pago confirmado</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07)">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:24px 32px">
              <span style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#ffffff">
                cobra<span style="color:#2d9e5f">ya</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px">
              <div style="font-size:40px;margin-bottom:16px">✅</div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111">
                ¡Pago recibido!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.5">
                Hola <strong>${opts.clientName}</strong>,<br />
                confirmamos que <strong>${opts.companyName}</strong> recibió tu pago correctamente.
              </p>

              <!-- Invoice card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f0faf4;border:1px solid #b2f0ca;border-radius:10px;margin-bottom:24px">
                <tr>
                  <td style="padding:20px 24px">
                    <div style="font-size:12px;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em">
                      Factura N.°
                    </div>
                    <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:12px">
                      ${opts.invoiceRef}
                    </div>
                    <div style="font-size:12px;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em">
                      Monto abonado
                    </div>
                    <div style="font-size:28px;font-weight:800;color:#1a7a40;letter-spacing:-0.02em">
                      ${amountStr}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:14px;color:#555;line-height:1.6">
                Podés guardar este email como comprobante de pago.
                Si tenés alguna consulta, comunicate directamente con ${opts.companyName}.
              </p>

              <hr style="border:none;border-top:1px solid #eee;margin:0 0 20px" />
              <p style="margin:0;font-size:12px;color:#999;line-height:1.5">
                Este comprobante fue generado automáticamente por
                <a href="https://cobraya.app" style="color:#2d9e5f;text-decoration:none">Cobraya</a>
                en nombre de ${opts.companyName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'Cobraya <pagos@cobraya.app>',
      to:      [opts.clientEmail],
      subject: `✅ Pago confirmado — Factura ${opts.invoiceRef}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
  } else {
    console.log(`📧 Email de confirmación enviado a ${opts.clientEmail}`)
  }
}

// ── Marcar factura como pagada + enviar email ──────────────────────────────
async function markPaid(invoiceId: string, via: string) {
  const { data: inv } = await supabase
    .from('invoices')
    .select(`
      id, status, cfe_id, amount,
      clients(name, email),
      profiles(company)
    `)
    .eq('id', invoiceId)
    .maybeSingle()

  if (!inv || inv.status === 'paid') return false // ya estaba pagada

  await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId)
  console.log(`✓ Factura ${invoiceId} marcada como pagada vía ${via}`)

  // Email de confirmación al cliente (falla silenciosa si no hay email/config)
  const clientEmail = (inv.clients as { name?: string; email?: string } | null)?.email
  if (clientEmail) {
    try {
      await sendPaymentConfirmationEmail({
        clientName:  (inv.clients as { name?: string })?.name ?? 'Cliente',
        clientEmail,
        companyName: (inv.profiles as { company?: string } | null)?.company ?? 'Cobraya',
        invoiceRef:  inv.cfe_id ?? invoiceId,
        amount:      Number(inv.amount),
      })
    } catch (e) {
      console.error('Error enviando email de confirmación:', e)
      // No relanzar — el pago ya fue procesado correctamente
    }
  }

  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const url = new URL(req.url)

  // ── B. Stripe webhook (firma en header) ──────────────────────────────────
  if (req.headers.get('stripe-signature')) {
    const rawBody = await req.text()
    let event: Record<string, unknown>
    try { event = JSON.parse(rawBody) } catch { return new Response('bad json', { status: 400 }) }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data as { object: { id: string; metadata: Record<string, string> } }
      const invoiceId = pi.object.metadata?.invoice_id
      if (invoiceId) await markPaid(invoiceId, 'Stripe webhook')
    }
    return new Response('ok', { status: 200 })
  }

  const body = await req.json().catch(() => ({}))

  // ── A. Webhook automático de MercadoPago ────────────────────────────────
  if (body.type === 'payment') {
    const paymentId = body.data?.id
    if (!paymentId) return new Response('ok', { status: 200 })

    // Webhook token (protección del endpoint público)
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    if (webhookSecret && url.searchParams.get('token') !== webhookSecret) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      const externalRef = body.data?.external_reference ?? ''
      const invoiceId   = externalRef || body.data?.id

      if (!invoiceId) return new Response('ok', { status: 200 })

      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, profile_id')
        .eq('id', invoiceId)
        .maybeSingle()

      if (!invoice || invoice.status === 'paid') return new Response('ok', { status: 200 })

      const { data: profile } = await supabase
        .from('profiles')
        .select('mp_access_token')
        .eq('id', invoice.profile_id)
        .single()

      const accessToken = profile?.mp_access_token?.trim()
      if (!accessToken) return new Response('ok', { status: 200 })

      const mpRes  = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const payment = await mpRes.json()

      if (payment.status === 'approved') await markPaid(invoiceId, 'MercadoPago webhook')

      return new Response('ok', { status: 200 })
    } catch (err) {
      console.error('MP webhook error:', err)
      return new Response('ok', { status: 200 }) // siempre 200 para MP
    }
  }

  // ── C. Confirmación client-side de Stripe ────────────────────────────────
  if (body.source === 'stripe' && body.paymentIntentId) {
    const { invoiceId, paymentIntentId } = body as { invoiceId: string; paymentIntentId: string }

    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, profile_id')
        .eq('id', invoiceId)
        .maybeSingle()

      if (!invoice) return json({ ok: false, error: 'Factura no encontrada' }, 404)
      if (invoice.status === 'paid') return json({ ok: true, already: true })

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_sk')
        .eq('id', invoice.profile_id)
        .single()

      const secretKey = profile?.stripe_sk?.trim()
      if (!secretKey) return json({ ok: false, error: 'Sin Stripe config' }, 400)

      // Verificar con Stripe que el pago realmente se aprobó y corresponde a la factura
      const res = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      })
      const pi = await res.json()

      if (pi.status === 'succeeded' && pi.metadata?.invoice_id === invoiceId) {
        await markPaid(invoiceId, 'Stripe client-confirm')
        return json({ ok: true, invoiceId }, undefined, cors)
      }

      return json({ ok: false, error: `Pago no verificado (status: ${pi.status})` }, 400)
    } catch (err) {
      console.error('Stripe client-confirm error:', err)
      return json({ ok: false, error: 'Error interno' }, 500)
    }
  }

  // ── D. Confirmación client-side de MercadoPago ───────────────────────────
  if (body.source === 'mp' && body.paymentId && body.invoiceId) {
    const { invoiceId, paymentId } = body as { invoiceId: string; paymentId: string }

    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, profile_id')
        .eq('id', invoiceId)
        .maybeSingle()

      if (!invoice || invoice.status === 'paid') return json({ ok: true, already: true }, undefined, cors)

      const { data: profile } = await supabase
        .from('profiles')
        .select('mp_access_token')
        .eq('id', invoice.profile_id)
        .single()

      const accessToken = profile?.mp_access_token?.trim()
      if (!accessToken) return json({ ok: false, error: 'Sin MP config' }, 400)

      const mpRes  = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const payment = await mpRes.json()

      if (payment.status === 'approved') {
        await markPaid(invoiceId, 'MP client-confirm')
        return json({ ok: true, invoiceId }, undefined, cors)
      }

      return json({ ok: false, status: payment.status }, undefined, cors)
    } catch (err) {
      console.error('MP client-confirm error:', err)
      return json({ ok: false, error: 'Error interno' }, 500)
    }
  }

  return new Response('ok', { status: 200, headers: cors })
})

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', ...extraHeaders },
  })
}
