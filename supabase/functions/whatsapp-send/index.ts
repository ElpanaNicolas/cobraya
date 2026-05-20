// whatsapp-send
// El frontend llama a esta función cuando el usuario aprieta
// "Recordatorio" o "Activar IA" en una factura.
// Genera el mensaje con Claude, lo envía por Twilio y lo guarda en la DB.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWhatsApp } from '../_shared/twilio.ts'
import { callClaude }   from '../_shared/claude.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // ── Auth ─────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return json({ error: 'No autorizado' }, 401)

    const { invoiceId, type } = await req.json()
    if (!invoiceId || !type) return json({ error: 'invoiceId y type son requeridos' }, 400)

    // ── Datos de la factura + cliente ────────────────────────
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*, clients(id, name, phone)')
      .eq('id', invoiceId)
      .eq('profile_id', user.id)
      .single()
    if (invErr || !invoice) return json({ error: 'Factura no encontrada' }, 404)

    const clientPhone = invoice.clients?.phone
    if (!clientPhone) return json({ error: 'El cliente no tiene teléfono configurado' }, 400)

    // ── Config del agente y perfil ───────────────────────────
    const [{ data: agentCfg }, { data: profile }] = await Promise.all([
      supabase.from('agent_config').select('*').eq('profile_id', user.id).single(),
      supabase.from('profiles').select('company, signature').eq('id', user.id).single(),
    ])

    const toneMap: Record<string, string> = {
      profesional: 'profesional y directo',
      amigable:    'amigable y cordial',
      firme:       'firme y enfático',
    }
    const tone = toneMap[agentCfg?.tone ?? 'profesional']
    const firma = profile?.signature || profile?.company || 'El equipo de cobros'

    // ── Prompt según tipo de acción ──────────────────────────
    const prompts: Record<string, string> = {
      reminder: `Redactá un recordatorio de pago ${tone} para la factura ${invoice.cfe_id} por $${Number(invoice.amount).toLocaleString('es-UY')} UYU con vencimiento el ${invoice.due}. Sé conciso (máximo 4 oraciones). No uses listas ni bullets. Firma como: ${firma}`,
      ai:       `Redactá un mensaje inicial para gestionar el cobro de la factura vencida ${invoice.cfe_id} por $${Number(invoice.amount).toLocaleString('es-UY')} UYU (venció el ${invoice.due}). Tono ${tone}. ${agentCfg?.offer_payment_plan ? `Mencioná que hay posibilidad de plan de ${agentCfg.payment_plan_installments} cuotas.` : ''} Máximo 4 oraciones. Firma como: ${firma}`,
    }

    const prompt = prompts[type] ?? prompts.reminder

    // ── Generar con Claude ───────────────────────────────────
    const messageBody = await callClaude(
      `Sos el asistente de cobros de ${profile?.company ?? 'la empresa'}. Respondé solo con el mensaje de WhatsApp, sin comillas ni comentarios adicionales.`,
      [{ role: 'user', content: prompt }],
      200,
      'claude-haiku-4-5'
    )

    // ── Encontrar o crear conversación ───────────────────────
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('client_id', invoice.clients.id)
      .eq('invoice_id', invoiceId)
      .maybeSingle()

    if (!conv) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ profile_id: user.id, client_id: invoice.clients.id, invoice_id: invoiceId })
        .select('id')
        .single()
      conv = newConv
    }

    // ── Guardar mensaje en DB ────────────────────────────────
    await supabase.from('messages').insert({
      conversation_id: conv!.id,
      from_role:       'agent',
      body:            messageBody,
      status:          'sent',
    })

    // ── Actualizar estado de la factura ──────────────────────
    const newStatus = type === 'ai' ? 'ai_negotiating' : 'reminded'
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId)

    // ── Enviar por WhatsApp ──────────────────────────────────
    await sendWhatsApp(clientPhone, messageBody)

    return json({ ok: true, message: messageBody })

  } catch (err) {
    console.error('whatsapp-send error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
