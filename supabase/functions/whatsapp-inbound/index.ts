// whatsapp-inbound
// Twilio llama a esta función cuando un cliente responde por WhatsApp.
// Guarda el mensaje, llama a Claude y responde automáticamente.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWhatsApp } from '../_shared/twilio.ts'
import { callClaude }   from '../_shared/claude.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  // Twilio envía POST con form-data
  const form  = await req.formData()
  const from  = (form.get('From') as string) ?? ''   // "whatsapp:+59899123456"
  const body  = (form.get('Body') as string) ?? ''

  const phone = from.replace('whatsapp:', '').trim()

  try {
    // ── 1. Encontrar el cliente por teléfono ─────────────────
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, profile_id')
      .eq('phone', phone)
      .maybeSingle()

    if (!client) {
      console.log(`Número desconocido: ${phone}`)
      return twiml('')   // silencio — no responder a números no registrados
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
    const [{ data: agentCfg }, { data: profile }, { data: invoice }] = await Promise.all([
      supabase.from('agent_config').select('*').eq('profile_id', client.profile_id).single(),
      supabase.from('profiles').select('company, signature').eq('id', client.profile_id).single(),
      conv.invoice_id
        ? supabase.from('invoices').select('cfe_id, amount, due, status').eq('id', conv.invoice_id).single()
        : Promise.resolve({ data: null }),
    ])

    const toneMap: Record<string, string> = {
      profesional: 'formal y profesional',
      amigable:    'amigable y cordial',
      firme:       'firme y directo sin rodeos',
    }

    const systemPrompt = [
      `Sos el asistente de cobros de ${profile?.company ?? 'la empresa'}.`,
      `Comunicación: ${toneMap[agentCfg?.tone ?? 'profesional']}.`,
      invoice
        ? `Factura en gestión: ${invoice.cfe_id} por $${Number(invoice.amount).toLocaleString('es-UY')} UYU, vencimiento ${invoice.due}. Estado: ${invoice.status}.`
        : '',
      agentCfg?.offer_payment_plan
        ? `Si el cliente tiene dificultades, podés ofrecer un plan de ${agentCfg.payment_plan_installments} cuotas mensuales sin interés.`
        : '',
      `Respondé siempre en español rioplatense. Máximo 3 párrafos cortos. Sin emojis excesivos.`,
      `Firma: ${profile?.signature || profile?.company || 'El equipo de cobros'}`,
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

    // ── 8. Enviar por WhatsApp vía Twilio ────────────────────
    await sendWhatsApp(from, reply)

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
