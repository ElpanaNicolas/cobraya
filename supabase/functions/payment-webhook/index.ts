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

async function markPaid(invoiceId: string, via: string) {
  const { data: inv } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!inv || inv.status === 'paid') return false // ya estaba pagada

  await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId)
  console.log(`✓ Factura ${invoiceId} marcada como pagada vía ${via}`)
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
