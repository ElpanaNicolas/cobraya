// create-stripe-intent
// Crea un PaymentIntent de Stripe con el secret key del negocio.
// El frontend usa el client_secret para mostrar el Payment Element
// que auto-detecta Apple Pay, Google Pay o formulario de tarjeta.

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

  const { invoiceId } = await req.json()
  if (!invoiceId) return json({ error: 'invoiceId requerido' }, 400)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, cfe_id, amount, profile_id, clients(name, email)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return json({ error: 'Factura no encontrada' }, 404)

  const { data: profile } = await supabase
    .from('profiles')
    .select('company, stripe_sk')
    .eq('id', invoice.profile_id)
    .single()

  const secretKey = profile?.stripe_sk?.trim()
  if (!secretKey) return json({ error: 'El negocio no tiene Stripe configurado' }, 400)

  // Crear PaymentIntent en Stripe
  // Stripe maneja montos en centésimos
  const amountCents = Math.round(Number(invoice.amount) * 100)

  const body = new URLSearchParams({
    amount:                     String(amountCents),
    currency:                   'uyu',
    'automatic_payment_methods[enabled]': 'true',
    description:                `Factura ${invoice.cfe_id} — ${profile?.company ?? ''}`,
    metadata:                   JSON.stringify({ invoice_id: invoice.id }),
    'receipt_email':            invoice.clients?.email ?? '',
  })

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const intent = await res.json()
  if (!res.ok) return json({ error: intent.error?.message ?? 'Error Stripe' }, 400)

  return json({
    clientSecret:    intent.client_secret,
    paymentIntentId: intent.id,
    amount:          Number(invoice.amount),
  })
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
