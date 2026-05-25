// mp-subscription-webhook
// Recibe notificaciones de MercadoPago cuando una suscripción cambia de estado.
// Activa o desactiva el plan Pro en profiles según el estado del preapproval.
//
// Registrar este endpoint en MercadoPago → Tus integraciones → Notificaciones:
//   URL: https://<project>.supabase.co/functions/v1/mp-subscription-webhook
//   Eventos: Suscripciones (preapproval)
//
// Requiere secrets:
//   COBRAYA_MP_ACCESS_TOKEN  — access token del proyecto Cobraya en MP (no el del cliente)
//   WEBHOOK_SECRET           — token para verificar que el request viene de MP

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  // Verificación del webhook secret (opcional pero recomendada)
  const url = new URL(req.url)
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  if (webhookSecret && url.searchParams.get('token') !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => ({}))

  // MP envía: { type: 'subscription_preapproval', data: { id: 'PREAPPROVAL_ID' } }
  if (body.type !== 'subscription_preapproval' || !body.data?.id) {
    return new Response('ok', { status: 200 })
  }

  const preapprovalId = body.data.id as string

  // Obtener detalles de la suscripción desde MP
  const cobraToken = Deno.env.get('COBRAYA_MP_ACCESS_TOKEN')
  if (!cobraToken) {
    console.error('COBRAYA_MP_ACCESS_TOKEN no configurado')
    return new Response('ok', { status: 200 })
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${cobraToken}` },
    })
    const preapproval = await mpRes.json()
    console.log('Preapproval:', JSON.stringify(preapproval))

    // external_reference = email o user_id del cliente de Cobraya (lo seteamos al crear la suscripción)
    const externalRef = preapproval.external_reference as string | undefined
    if (!externalRef) {
      console.error('Sin external_reference en el preapproval')
      return new Response('ok', { status: 200 })
    }

    const status = preapproval.status as string // authorized | paused | cancelled | pending

    if (status === 'authorized') {
      // Activar plan Pro
      const nextBillingDate = preapproval.next_payment_date
        ? new Date(preapproval.next_payment_date)
        : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000) // +31 días como fallback

      // external_reference puede ser email o user id — buscamos por email primero
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === externalRef || u.id === externalRef)
      if (!user) {
        console.error(`Usuario no encontrado para external_reference: ${externalRef}`)
        return new Response('ok', { status: 200 })
      }

      await supabase.from('profiles').update({
        plan:              'pro',
        mp_preapproval_id: preapprovalId,
        plan_starts_at:    new Date().toISOString(),
        plan_expires_at:   nextBillingDate.toISOString(),
      }).eq('id', user.id)

      console.log(`✓ Plan Pro activado para ${externalRef} hasta ${nextBillingDate.toISOString()}`)

    } else if (['cancelled', 'paused'].includes(status)) {
      // Volver a free
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === externalRef || u.id === externalRef)
      if (user) {
        await supabase.from('profiles').update({
          plan:           'free',
          plan_expires_at: new Date().toISOString(),
        }).eq('id', user.id)
        console.log(`Plan vuelto a free para ${externalRef} (status: ${status})`)
      }
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('mp-subscription-webhook error:', err)
    return new Response('ok', { status: 200 }) // siempre 200 para MP
  }
})
