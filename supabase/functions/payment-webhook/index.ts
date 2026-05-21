// payment-webhook
// MercadoPago llama a este endpoint cuando un pago cambia de estado.
// Si el pago es aprobado, marca la factura como pagada.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  // Verificar token de seguridad
  const url = new URL(req.url)
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  if (webhookSecret && url.searchParams.get('token') !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => ({}))

  // MercadoPago envía notificaciones de tipo "payment"
  if (body.type !== 'payment') {
    return new Response('ok', { status: 200 })
  }

  const paymentId = body.data?.id
  if (!paymentId) return new Response('ok', { status: 200 })

  try {
    // Buscar el access token del negocio usando el external_reference (invoice_id)
    // Primero obtenemos el pago de MP para saber a qué factura pertenece.
    // Usamos el access token de entorno para validación inicial.
    // En multi-tenant, cada negocio tiene su propio token; lo buscamos después.

    // Buscar cualquier perfil con mp_access_token para autenticar (buscamos por external_reference)
    // La estrategia: buscamos la factura por external_reference en todos los perfiles
    const externalRef = body.data?.external_reference ?? ''

    // Obtener el pago directamente con el token del negocio
    // Para eso necesitamos saber a qué negocio pertenece la factura
    let invoiceId = externalRef

    // Si no viene en el body, intentamos parsear del topic
    if (!invoiceId && body.resource) {
      const match = (body.resource as string).match(/\/([a-f0-9-]{36})$/)
      if (match) invoiceId = match[1]
    }

    if (!invoiceId) {
      console.log('payment-webhook: no se pudo determinar invoiceId')
      return new Response('ok', { status: 200 })
    }

    // Buscar la factura y el perfil
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, status, profile_id')
      .eq('id', invoiceId)
      .maybeSingle()

    if (!invoice || invoice.status === 'paid') {
      return new Response('ok', { status: 200 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('mp_access_token')
      .eq('id', invoice.profile_id)
      .single()

    const accessToken = profile?.mp_access_token?.trim()
    if (!accessToken) return new Response('ok', { status: 200 })

    // Verificar estado del pago en MercadoPago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const payment = await mpRes.json()

    console.log(`payment-webhook: pago ${paymentId} — status: ${payment.status}`)

    if (payment.status === 'approved') {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)

      console.log(`✓ Factura ${invoiceId} marcada como pagada vía MercadoPago`)
    }

    return new Response('ok', { status: 200 })

  } catch (err) {
    console.error('payment-webhook error:', err)
    return new Response('ok', { status: 200 }) // siempre 200 para MP
  }
})
