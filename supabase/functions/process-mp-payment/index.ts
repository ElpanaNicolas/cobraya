// process-mp-payment
// Procesa un pago tokenizado desde el Payment Brick de MercadoPago.
// Soporta tarjeta de crédito/débito, Apple Pay y Google Pay.
// Recibe: { invoiceId, formData } donde formData viene del onSubmit del Brick.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  let body: { invoiceId?: string; formData?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Body inválido' }, 400)
  }

  const { invoiceId, formData } = body
  if (!invoiceId || !formData) return json({ error: 'invoiceId y formData requeridos' }, 400)

  // ── Traer factura y access token del negocio ────────────────────────────────
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, amount, status, profile_id, cfe_id, clients(name)')
    .eq('id', invoiceId)
    .single()

  if (invErr || !invoice) return json({ error: 'Factura no encontrada' }, 404)
  if (invoice.status === 'paid') return json({ error: 'Esta factura ya fue pagada' }, 400)

  const { data: profile } = await supabase
    .from('profiles')
    .select('mp_access_token, company')
    .eq('id', invoice.profile_id)
    .single()

  if (!profile?.mp_access_token) return json({ error: 'El negocio no tiene MercadoPago configurado' }, 400)

  // ── Construir el payload de pago ────────────────────────────────────────────
  // Siempre usamos el monto real de la factura (no el que viene del cliente)
  const paymentPayload = {
    ...formData,
    transaction_amount: Number(invoice.amount),
    description:        `${invoice.cfe_id} — ${profile.company}`,
    metadata:           { invoice_id: invoiceId },
    // Si el Brick no envía email, usamos un placeholder (requerido por MP)
    payer: {
      email: (formData.payer as Record<string, string>)?.email || 'cliente@cobraya.app',
      ...(typeof formData.payer === 'object' ? formData.payer as object : {}),
    },
  }

  // ── Crear pago en MercadoPago ───────────────────────────────────────────────
  const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${profile.mp_access_token}`,
      'Content-Type':  'application/json',
      'X-Idempotency-Key': `cobraya-${invoiceId}-${Date.now()}`,
    },
    body: JSON.stringify(paymentPayload),
  })

  const payment = await mpRes.json()

  if (!mpRes.ok) {
    console.error('MP payment error:', JSON.stringify(payment))
    return json({
      error: payment.message || 'Error al procesar el pago en MercadoPago',
      cause: payment.cause,
    }, 400)
  }

  const { status, status_detail, id: paymentId } = payment

  // ── Actualizar factura si el pago fue aprobado ──────────────────────────────
  if (status === 'approved') {
    await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)

    // Registrar el pago en conversations/messages si existe conversación activa
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('invoice_id', invoiceId)
      .maybeSingle()

    if (conv?.id) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        from_role:       'system',
        body:            `✅ Pago aprobado vía MercadoPago. ID: ${paymentId}`,
        status:          'sent',
        sent_at:         new Date().toISOString(),
      })
    }
  }

  return json({
    status,
    status_detail,
    paymentId,
    approved: status === 'approved',
    // Si está pendiente (ej. tarjeta en revisión), lo informamos
    pending:  status === 'in_process' || status === 'pending',
  })
})

function json(data: unknown, httpStatus = 200) {
  return new Response(JSON.stringify(data), {
    status:  httpStatus,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
