// whatsapp-inbound
// Twilio llama a esta función cuando un cliente responde por WhatsApp.
// Guarda el mensaje, llama a Claude y responde automáticamente.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callClaude, fetchTwilioImageAsBase64, detectPaymentReceipt } from '../_shared/claude.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Envía un WhatsApp usando las credenciales específicas del negocio.
async function sendReply(to: string, body: string, sid: string, token: string, from: string) {
  const toFormatted   = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  const fromFormatted = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: fromFormatted, To: toFormatted, Body: body }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`Twilio error: ${data.message}`)
  return data
}

serve(async (req) => {
  // Twilio envía POST con form-data
  const rawBody        = await req.text()
  const form           = new URLSearchParams(rawBody)
  const from           = form.get('From')              ?? ''
  const to             = form.get('To')                ?? ''
  const body           = form.get('Body')              ?? ''
  const numMedia       = parseInt(form.get('NumMedia') ?? '0')
  const mediaUrl       = form.get('MediaUrl0')         ?? ''
  const mediaType      = form.get('MediaContentType0') ?? ''

  // Protección básica: verificar token secreto en query string
  // La URL del webhook debe incluir ?token=WEBHOOK_SECRET
  const url           = new URL(req.url)
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  if (webhookSecret && url.searchParams.get('token') !== webhookSecret) {
    console.warn('Token de webhook inválido — request rechazado')
    return twiml('')
  }

  const clientPhone   = from.replace('whatsapp:', '').trim()
  const businessPhone = to.replace('whatsapp:', '').trim()

  try {
    // ── 1. Identificar el negocio por su número de WhatsApp ──
    // Esto permite que un solo webhook sirva a múltiples negocios,
    // cada uno con su propio número de Twilio.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('twilio_wa_number', businessPhone)
      .maybeSingle()

    if (!profile) {
      console.log(`Número de negocio no registrado: ${businessPhone}`)
      return twiml('')
    }

    // ── 2. Encontrar el cliente dentro de ese negocio ────────
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, profile_id')
      .eq('phone', clientPhone)
      .eq('profile_id', profile.id)   // ← scoped al negocio correcto
      .maybeSingle()

    if (!client) {
      console.log(`Número de cliente desconocido: ${clientPhone} para negocio ${businessPhone}`)
      return twiml('')
    }

    // ── 2. Encontrar o crear la conversación activa ──────────
    let { data: conv } = await supabase
      .from('conversations')
      .select('id, invoice_id')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!conv) {
      // Buscar la factura pendiente más urgente
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('client_id', client.id)
        .in('status', ['pending', 'reminded', 'ai_negotiating', 'overdue'])
        .order('due', { ascending: true })
        .limit(1)
        .maybeSingle()

      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ profile_id: client.profile_id, client_id: client.id, invoice_id: invoice?.id ?? null })
        .select('id, invoice_id')
        .single()
      conv = newConv
    }

    // ── 3. Guardar mensaje entrante ──────────────────────────
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      from_role:       'client',
      body,
      status:          'read',
    })

    // ── 4. Historial de la conversación (contexto para Claude)
    const { data: history } = await supabase
      .from('messages')
      .select('from_role, body')
      .eq('conversation_id', conv.id)
      .order('sent_at', { ascending: true })
      .limit(20)

    // ── 5. Configuración del agente y perfil ─────────────────
    const [{ data: agentCfg }, { data: profileData }, { data: invoice }] = await Promise.all([
      supabase.from('agent_config').select('*').eq('profile_id', client.profile_id).single(),
      supabase.from('profiles').select('company, signature, twilio_account_sid, twilio_auth_token, twilio_wa_number').eq('id', client.profile_id).single(),
      conv.invoice_id
        ? supabase.from('invoices').select('id, cfe_id, amount, due, status').eq('id', conv.invoice_id).single()
        : Promise.resolve({ data: null }),
    ])

    const twilioSid   = profileData?.twilio_account_sid || Deno.env.get('TWILIO_ACCOUNT_SID')!
    const twilioToken = profileData?.twilio_auth_token  || Deno.env.get('TWILIO_AUTH_TOKEN')!
    const twilioFrom  = profileData?.twilio_wa_number   || Deno.env.get('TWILIO_WHATSAPP_NUMBER')!

    // ── 5b. Detección de comprobante de pago ─────────────────
    // Si el cliente mandó una imagen o texto con comprobante, registrar el pago automáticamente.
    const hasMedia = numMedia > 0 && mediaUrl && mediaType.startsWith('image/')
    if ((hasMedia || body) && conv.invoice_id && invoice && invoice.status !== 'paid') {
      // Descargar imagen si la hay
      const imageBase64 = hasMedia
        ? await fetchTwilioImageAsBase64(mediaUrl, twilioSid, twilioToken)
        : null

      const detection = await detectPaymentReceipt(body, imageBase64)

      if (detection.isPayment) {
        console.log(`💰 Comprobante detectado para factura ${invoice.cfe_id}:`, detection)

        // Marcar factura como pagada
        await supabase.from('invoices').update({ status: 'paid' }).eq('id', conv.invoice_id)

        // Armar mensaje de confirmación con los datos extraídos
        const details = [
          detection.amount  ? `Importe: $${detection.amount.toLocaleString('es-UY')} UYU` : null,
          detection.bank    ? `Banco: ${detection.bank}`                                   : null,
          detection.reference ? `Referencia: ${detection.reference}`                       : null,
        ].filter(Boolean).join(' · ')

        const confirmMsg = `¡Gracias! Recibimos tu comprobante de pago${details ? ` (${details})` : ''}. Quedó registrado. ¡Que tengas un excelente día! 🙏\n— ${profileData?.company ?? 'El equipo de cobros'}`

        // Guardar confirmación en DB y enviar
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          from_role:       'agent',
          body:            confirmMsg,
          status:          'sent',
        })
        await sendReply(from, confirmMsg, twilioSid, twilioToken, twilioFrom)

        return twiml('')   // cortar aquí, no hace falta respuesta genérica de Claude
      }
    }

    const toneMap: Record<string, string> = {
      profesional: 'formal y profesional',
      amigable:    'amigable y cordial',
      firme:       'firme y directo sin rodeos',
    }

    const systemPrompt = [
      `Sos el asistente de cobros de ${profileData?.company ?? 'la empresa'}.`,
      `Comunicación: ${toneMap[agentCfg?.tone ?? 'profesional']}.`,
      invoice
        ? `Factura en gestión: ${invoice.cfe_id} por $${Number(invoice.amount).toLocaleString('es-UY')} UYU, vencimiento ${invoice.due}. Estado: ${invoice.status}.`
        : '',
      agentCfg?.offer_payment_plan
        ? `Si el cliente tiene dificultades, podés ofrecer un plan de ${agentCfg.payment_plan_installments} cuotas mensuales sin interés.`
        : '',
      `Respondé siempre en español rioplatense. Máximo 3 párrafos cortos. Sin emojis excesivos.`,
      `Firma: ${profileData?.signature || profileData?.company || 'El equipo de cobros'}`,
    ].filter(Boolean).join(' ')

    const claudeMessages = (history ?? []).map(m => ({
      role:    m.from_role === 'agent' ? 'assistant' as const : 'user' as const,
      content: m.body,
    }))

    // ── 6. Generar respuesta con Claude ──────────────────────
    const reply = await callClaude(systemPrompt, claudeMessages, 350, 'claude-sonnet-4-5')

    // ── 7. Guardar respuesta del agente ──────────────────────
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      from_role:       'agent',
      body:            reply,
      status:          'sent',
    })

    // ── 8. Enviar por WhatsApp con las credenciales del negocio ─
    await sendReply(from, reply, twilioSid, twilioToken, twilioFrom)

    return twiml('')   // respuesta vacía (ya enviamos con la API REST)

  } catch (err) {
    console.error('whatsapp-inbound error:', err)
    return twiml('')   // nunca fallar ante Twilio
  }
})

function twiml(msg: string) {
  const body = msg ? `<Message>${msg}</Message>` : ''
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  })
}
