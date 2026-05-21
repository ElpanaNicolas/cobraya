// auto-reminder
// Corre diariamente vía pg_cron. Para cada negocio con agente activo:
//   1. Envía primer recordatorio a facturas vencidas sin gestionar
//   2. Envía follow-up a facturas ya recordadas (si pasaron los días configurados)
// Respeta horario laboral y límite de follow-ups del agente.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callClaude } from '../_shared/claude.ts'
import { sendEmail, reminderEmailHtml } from '../_shared/resend.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Uruguay = UTC-3. Retorna la hora actual en Montevideo.
function uruguayHour(): number {
  return (new Date().getUTCHours() - 3 + 24) % 24
}

function isWithinWorkingHours(from: string, to: string): boolean {
  const hour    = uruguayHour()
  const [fh]   = from.split(':').map(Number)
  const [th]   = to.split(':').map(Number)
  return hour >= fh && hour < th
}

// Envía un WhatsApp usando las credenciales del negocio.
async function sendWhatsApp(to: string, body: string, sid: string, token: string, from: string) {
  const fmt = (n: string) => n.startsWith('whatsapp:') ? n : `whatsapp:${n}`
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: fmt(from), To: fmt(to), Body: body }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`Twilio error: ${data.message}`)
  return data
}

serve(async (req) => {
  // Protección: solo llamadas con el token secreto
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  const url = new URL(req.url)
  if (webhookSecret && url.searchParams.get('token') !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stats = { sent: 0, skipped: 0, errors: 0 }

  try {
    // ── 1. Obtener todos los perfiles con agente activo ──────
    const { data: configs } = await supabase
      .from('agent_config')
      .select('*, profiles(id, company, signature, twilio_account_sid, twilio_auth_token, twilio_wa_number)')
      .eq('enabled', true)

    for (const cfg of configs ?? []) {
      const profile = cfg.profiles as Record<string, string>
      if (!profile) continue

      // Verificar horario laboral
      if (!isWithinWorkingHours(cfg.working_hours_from ?? '09:00', cfg.working_hours_to ?? '18:00')) {
        console.log(`Fuera de horario para perfil ${profile.id}`)
        stats.skipped++
        continue
      }

      const twilioSid   = profile.twilio_account_sid || Deno.env.get('TWILIO_ACCOUNT_SID')!
      const twilioToken = profile.twilio_auth_token  || Deno.env.get('TWILIO_AUTH_TOKEN')!
      const twilioFrom  = profile.twilio_wa_number   || Deno.env.get('TWILIO_WHATSAPP_NUMBER')!

      if (!twilioSid || !twilioToken || !twilioFrom) {
        console.log(`Perfil ${profile.id} sin credenciales Twilio`)
        stats.skipped++
        continue
      }

      const toneMap: Record<string, string> = {
        profesional: 'profesional y directo',
        amigable:    'amigable y cordial',
        firme:       'firme y enfático',
      }
      const tone  = toneMap[cfg.tone ?? 'profesional']
      const firma = profile.signature || profile.company || 'El equipo de cobros'

      // ── 2. Primer recordatorio: facturas pending vencidas ──
      const firstReminderCutoff = new Date()
      firstReminderCutoff.setDate(firstReminderCutoff.getDate() - (cfg.first_reminder_days ?? 1))

      const { data: pendingInvoices } = await supabase
        .from('invoices')
        .select('id, cfe_id, amount, due, clients(id, name, phone, email)')
        .eq('profile_id', profile.id)
        .eq('status', 'pending')
        .lte('due', firstReminderCutoff.toISOString().split('T')[0])

      for (const inv of pendingInvoices ?? []) {
        const client = inv.clients as Record<string, string>
        if (!client?.phone) { stats.skipped++; continue }

        try {
          const APP_URL     = Deno.env.get('APP_URL') ?? 'https://cobraya-7354.vercel.app'
          const paymentLink = `${APP_URL}/pagar/${inv.id}`
          const prompt = `Redactá un recordatorio de pago ${tone} para la factura ${inv.cfe_id} por $${Number(inv.amount).toLocaleString('es-UY')} UYU con vencimiento el ${inv.due}. Incluí este link al final para que pueda ver los detalles y pagar: ${paymentLink} — Sé conciso (máximo 4 oraciones). No uses listas ni bullets. Firma como: ${firma}`
          const msg = await callClaude(
            `Sos el asistente de cobros de ${profile.company ?? 'la empresa'}. Respondé solo con el mensaje de WhatsApp, sin comillas ni comentarios.`,
            [{ role: 'user', content: prompt }],
            200,
            'claude-haiku-4-5'
          )

          // Encontrar o crear conversación
          let { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('client_id', client.id)
            .eq('invoice_id', inv.id)
            .maybeSingle()

          if (!conv) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({ profile_id: profile.id, client_id: client.id, invoice_id: inv.id })
              .select('id').single()
            conv = newConv
          }

          await supabase.from('messages').insert({
            conversation_id: conv!.id,
            from_role: 'agent',
            body: msg,
            status: 'sent',
          })
          await supabase.from('invoices').update({ status: 'reminded' }).eq('id', inv.id)

          // WhatsApp
          if (cfg.channel_whatsapp !== false) {
            await sendWhatsApp(client.phone, msg, twilioSid, twilioToken, twilioFrom)
          }

          // Email
          if (cfg.channel_email !== false && client.email) {
            await sendEmail({
              to:      client.email,
              subject: `Recordatorio de pago — Factura ${inv.cfe_id}`,
              html:    reminderEmailHtml({
                clientName:  client.name,
                company:     profile.company ?? 'la empresa',
                cfeId:       inv.cfe_id,
                amount:      Number(inv.amount),
                due:         inv.due,
                messageBody: msg,
              }),
            })
          }

          console.log(`✓ Recordatorio enviado: factura ${inv.cfe_id} → ${client.name}`)
          stats.sent++
        } catch (err) {
          console.error(`✗ Error en factura ${inv.id}:`, err)
          stats.errors++
        }
      }

      // ── 3. Follow-up: facturas reminded/ai_negotiating ────
      const followUpCutoff = new Date()
      followUpCutoff.setDate(followUpCutoff.getDate() - (cfg.follow_up_days ?? 3))

      const { data: remindedInvoices } = await supabase
        .from('invoices')
        .select('id, cfe_id, amount, due, clients(id, name, phone, email)')
        .eq('profile_id', profile.id)
        .in('status', ['reminded', 'ai_negotiating'])

      for (const inv of remindedInvoices ?? []) {
        const client = inv.clients as Record<string, string>
        if (!client?.phone) { stats.skipped++; continue }

        try {
          // Buscar conversación y contar mensajes del agente
          const { data: conv } = await supabase
            .from('conversations')
            .select('id, messages(id, from_role, sent_at)')
            .eq('client_id', client.id)
            .eq('invoice_id', inv.id)
            .maybeSingle()

          if (!conv) { stats.skipped++; continue }

          const agentMsgs = (conv.messages ?? []).filter((m: { from_role: string }) => m.from_role === 'agent')
          const lastMsg   = agentMsgs.at(-1) as { sent_at: string } | undefined

          // Respetar límite de follow-ups
          if (agentMsgs.length >= (cfg.max_follow_ups ?? 3)) {
            console.log(`Límite de follow-ups alcanzado: ${inv.cfe_id}`)
            stats.skipped++
            continue
          }

          // Verificar que pasaron los días de espera desde el último mensaje
          if (lastMsg && new Date(lastMsg.sent_at) > followUpCutoff) {
            stats.skipped++
            continue
          }

          const APP_URL_fu     = Deno.env.get('APP_URL') ?? 'https://cobraya-7354.vercel.app'
          const paymentLinkFu = `${APP_URL_fu}/pagar/${inv.id}`
          const prompt = `Redactá un seguimiento de cobro ${tone} para la factura vencida ${inv.cfe_id} por $${Number(inv.amount).toLocaleString('es-UY')} UYU (venció el ${inv.due}). Es el mensaje número ${agentMsgs.length + 1}. Incluí este link para que pueda pagar o subir comprobante: ${paymentLinkFu} — ${cfg.offer_payment_plan ? `Podés mencionar que hay posibilidad de plan de ${cfg.payment_plan_installments} cuotas.` : ''} Máximo 4 oraciones. Firma como: ${firma}`

          const msg = await callClaude(
            `Sos el asistente de cobros de ${profile.company ?? 'la empresa'}. Respondé solo con el mensaje de WhatsApp, sin comillas ni comentarios.`,
            [{ role: 'user', content: prompt }],
            200,
            'claude-haiku-4-5'
          )

          await supabase.from('messages').insert({
            conversation_id: conv.id,
            from_role: 'agent',
            body: msg,
            status: 'sent',
          })
          await supabase.from('invoices').update({ status: 'ai_negotiating' }).eq('id', inv.id)

          // WhatsApp
          if (cfg.channel_whatsapp !== false) {
            await sendWhatsApp(client.phone, msg, twilioSid, twilioToken, twilioFrom)
          }

          // Email
          if (cfg.channel_email !== false && client.email) {
            await sendEmail({
              to:      client.email,
              subject: `Seguimiento de cobro — Factura ${inv.cfe_id}`,
              html:    reminderEmailHtml({
                clientName:  client.name,
                company:     profile.company ?? 'la empresa',
                cfeId:       inv.cfe_id,
                amount:      Number(inv.amount),
                due:         inv.due,
                messageBody: msg,
              }),
            })
          }

          console.log(`✓ Follow-up enviado: factura ${inv.cfe_id} → ${client.name}`)
          stats.sent++
        } catch (err) {
          console.error(`✗ Error en follow-up ${inv.id}:`, err)
          stats.errors++
        }
      }
    }

    console.log('auto-reminder completado:', stats)
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('auto-reminder error fatal:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
