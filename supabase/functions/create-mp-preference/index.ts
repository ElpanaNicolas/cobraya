// create-mp-preference
// Crea una preferencia de pago en MercadoPago con el access token del negocio.
// Retorna el init_point (URL de pago) y el preference_id.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const APP_URL = Deno.env.get('APP_URL') ?? 'https://cobraya-phi.vercel.app'
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? ''

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const { invoiceId } = await req.json()
  if (!invoiceId) return json({ error: 'invoiceId requerido' }, 400)

  // Traer factura y perfil
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, cfe_id, amount, due, profile_id, clients(name)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return json({ error: 'Factura no encontrada' }, 404)

  const { data: profile } = await supabase
    .from('profiles')
    .select('company, mp_access_token')
    .eq('id', invoice.profile_id)
    .single()

  const accessToken = profile?.mp_access_token?.trim()
  if (!accessToken) return json({ error: 'El negocio no tiene MercadoPago configurado' }, 400)

  const baseUrl = `${APP_URL}/pagar/${invoiceId}`

  // Crear preferencia en MercadoPago
  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{
        id:          invoice.id,
        title:       `Factura ${invoice.cfe_id} — ${profile?.company ?? ''}`,
        quantity:    1,
        unit_price:  Number(invoice.amount),
        currency_id: 'UYU',
      }],
      payer: { name: invoice.clients?.name ?? '' },
      back_urls: {
        success: `${baseUrl}?status=success`,
        failure: `${baseUrl}?status=failure`,
        pending: `${baseUrl}?status=pending`,
      },
      auto_return:          'approved',
      external_reference:   invoice.id,
      notification_url:     `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook?token=${WEBHOOK_SECRET}`,
      statement_descriptor: profile?.company ?? 'Cobraya',
    }),
  })

  const mp = await res.json()
  if (!res.ok) return json({ error: mp.message ?? 'Error MercadoPago' }, 400)

  return json({
    preferenceId: mp.id,
    initPoint:    mp.init_point,      // producción
    sandboxUrl:   mp.sandbox_init_point, // testing
  })
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
