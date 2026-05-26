// whatsapp-meta-inbound
// Meta llama a este endpoint cuando un cliente responde por WhatsApp Cloud API.
// Maneja: verificación del webhook (GET) + mensajes entrantes (POST).
// Formato JSON, completamente distinto al webhook de Twilio.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callClaude, detectPaymentReceipt } from '../_shared/claude.ts'
import { sendMetaWhatsApp, fetchMetaImageAsBase64 } from '../_shared/meta-whatsapp.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const url = new URL(req.url)

  // ── Verificación del webhook (Meta envía GET al configurar) ──
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Verificar token contra el perfil del negocio
    if (mode === 'subscribe') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('meta_verify_token', token)
        .maybeSingle()

      if (profile || token === Deno.env.get('WEBHOOK_SECRET')) {
        return new Response(challenge, { status: 200 })
      }
    }
    return new Response('Forbidden', { status: 403 })
  }

  // ── Mensajes entrantes (POST JSON de Meta) ───────────────────
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return new Response('ok', { status: 200 })
  }

  // Meta siempre espera 200, nunca fallar
  try {
    const entry   = (payload.entry as unknown[])?.[0] as Record<string, unknown>
    const change  = (entry?.changes as unknown[])?.[0] as Record<string, unknown>
    const value   = change?.value as Record<string, unknown>

    if (!value || value.messaging_product !== 'whatsapp') {
      return new Response('ok', { status: 200 })
    }

    // Solo procesar mensajes (no status updates)
    const messages = value.messages as unknown[]
    if (!messages?.length) return new Response('ok', { status: 200 })

    const message = messages[0] as Record<string, unknown>
    const meta    = value.metadata as Record<string, unknown>

    const phoneNumberId = meta?.phone_number_id as string  // número del negocio
    const fromPhone     = `+${message.from}`               // número del cliente
    const msgType       = message.type as string           // 'text' | 'image' | ...

    // ── 1. Identificar el negocio por phone_number_id ───────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, meta_access_token, meta_phone_number_id')
      .eq('meta_phone_number_id', phoneNumberId)
      .maybeSingle()

    if (!profile) {
      console.log(`phone_number_id no registrado: ${phoneNumberId}`)
      return new Response('ok', { status: 200 })
    }

    const accessToken = profile.meta_access_token as string

    // ── 2. Encontrar el cliente ──────────────────────────────────
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, profile_id')
      .eq('phone', fromPhone)
      .eq('profile_id', profile.id)
      .maybeSingle()

    if (!client) {
      console.log(`Cliente desconocido: ${fromPhone}`)
      return new Response('ok', { status: 200 })
    }

    // ── 3. Extraer contenido del mensaje ─────────────────────────
    let textBody = ''
    let imageBase64: { data: string; media_type: string } | null = null

    if (msgType === 'text') {
      textBody = (message.text as Record<string, string>)?.body ?? ''
    } else if (msgType === 'image') {
      const img = message.image as Record<string, string>
      textBody  = img?.caption ?? ''
      if (img?.id) {
        imageBase64 = await fetchMetaImageAsBase64(img.id, accessToken)
      }
    } else {
      // Tipo no soportado (video, audio, etc.) — ignorar
      return new Response('ok', { status: 200 })
    }

    // ── 4. Encontrar o crear conversación ────────────────────────
    let { data: conv } = await supabase
      .from('conversations')
      .select('id, invoice_id')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!conv) {
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

    // ── 5. Guardar mensaje entrante ──────────────────────────────
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      from_role:       'client',
      body:            textBody || '[imagen]',
      status:          'read',
    })

    // ── 6. Configuración del agente y perfil ─────────────────────
    const [{ data: agentCfg }, { data: profileData }, { data: invoice }] = await Promise.all([
      supabase.from('agent_config').select('*').eq('profile_id', client.profile_id).single(),
      supabase.from('profiles').select('company, signature').eq('id', client.profile_id).single(),
      conv.invoice_id
        ? supabase.from('invoices').select('id, cfe_id, amount, due, status').eq('id', conv.invoice_id).single()
        : Promise.resolve({ data: null }),
    ])

    // ── 7. Detección de comprobante de pago ──────────────────────
    if (conv.invoice_id && invoice && invoice.status !== 'paid') {
      const detection = await detectPaymentReceipt(textBody, imageBase64)

      if (detection.isPayment) {
        console.log(`💰 Comprobante Meta detectado: ${invoice.cfe_id}`)
        await supabase.from('invoices').update({ status: 'paid' }).eq('id', conv.invoice_id)

        const details = [
          detection.amount    ? `Importe: $${detection.amount.toLocaleString('es-UY')} UYU` : null,
          detection.bank      ? `Banco: ${detection.bank}`       : null,
          detection.reference ? `Ref: ${detection.reference}`    : null,
        ].filter(Boolean).join(' · ')

        const confirmMsg = `¡Gracias! Recibimos tu comprobante${details ? ` (${details})` : ''}. Quedó registrado. 🙏\n— ${profileData?.company ?? 'El equipo de cobros'}`

        await supabase.from('messages').insert({ conversation_id: conv.id, from_role: 'agent', body: confirmMsg, status: 'sent' })
        await sendMetaWhatsApp(fromPhone, confirmMsg, phoneNumberId, accessToken)
        return new Response('ok', { status: 200 })
      }
    }

    // ── 8. Historial de conversación para Claude ─────────────────
    const { data: history } = await supabase
      .from('messages')
      .select('from_role, body')
      .eq('conversation_id', conv.id)
      .order('sent_at', { ascending: true })
      .limit(20)

    const toneMap: Record<string, string> = {
      profesional: 'formal y profesional',
      amigable:    'amigable y cordial',
      firme:       'firme y directo sin rodeos',
    }

    const APP_URL     = Deno.env.get('APP_URL') ?? 'https://cobraya-phi.vercel.app'
    const paymentLink = invoice ? `${APP_URL}/pagar/${invoice.id}` : null

    const systemPrompt = [
      `Sos el asistente de cobros de ${profileData?.company ?? 'la empresa'}.`,
      `Comunicación: ${toneMap[agentCfg?.tone ?? 'profesional']}.`,
      invoice
        ? `Factura en gestión: ${invoice.cfe_id} por $${Number(invoice.amount).toLocaleString('es-UY')} UYU, vencimiento ${invoice.due}. Estado: ${invoice.status}.`
        : '',
      paymentLink
        ? `Link de pago real (usá EXACTAMENTE este link, no inventes otro): ${paymentLink}`
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

    // ── 9. Respuesta con Claude ───────────────────────────────────
    const reply = await callClaude(systemPrompt, claudeMessages, 350, 'claude-sonnet-4-5')

    await supabase.from('messages').insert({ conversation_id: conv.id, from_role: 'agent', body: reply, status: 'sent' })
    await sendMetaWhatsApp(fromPhone, reply, phoneNumberId, accessToken)

  } catch (err) {
    console.error('whatsapp-meta-inbound error:', err)
  }

  return new Response('ok', { status: 200 })
})
