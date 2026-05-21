// get-payment-info
// Endpoint público (sin auth) que devuelve los datos de una factura
// para mostrar en la página de pago del cliente.
// Solo expone campos seguros, nunca datos sensibles del negocio.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const url      = new URL(req.url)
  const invoiceId = url.searchParams.get('id')
  if (!invoiceId) return json({ error: 'id requerido' }, 400)

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, cfe_id, amount, due, status, profile_id, clients(name)')
    .eq('id', invoiceId)
    .single()

  if (error || !invoice) return json({ error: 'Factura no encontrada' }, 404)

  // Datos del negocio — solo campos públicos, nunca secrets
  const { data: profile } = await supabase
    .from('profiles')
    .select('company, payment_instructions, mp_access_token, bank_name, bank_account, bank_alias, stripe_pk')
    .eq('id', invoice.profile_id)
    .single()

  return json({
    invoiceId:           invoice.id,
    cfeId:               invoice.cfe_id,
    amount:              Number(invoice.amount),
    due:                 invoice.due,
    status:              invoice.status,
    clientName:          invoice.clients?.name ?? '',
    company:             profile?.company ?? '',
    // Métodos de pago disponibles
    hasMercadoPago:      !!(profile?.mp_access_token?.trim()),
    hasStripe:           !!(profile?.stripe_pk?.trim()),
    stripePk:            profile?.stripe_pk?.trim() ?? '',       // public key, seguro exponer
    hasBankTransfer:     !!(profile?.bank_account?.trim()),
    bankName:            profile?.bank_name            ?? '',
    bankAccount:         profile?.bank_account         ?? '',
    bankAlias:           profile?.bank_alias           ?? '',
    paymentInstructions: profile?.payment_instructions ?? '',
  })
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
