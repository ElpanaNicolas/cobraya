// auto-reminder
// Corre diariamente vía pg_cron. Para cada negocio con agente activo:
//   0. Envía aviso previo a facturas que vencen en X días (pre_due_reminder_days)
//   1. Envía primer recordatorio a facturas vencidas tras el período de gracia
//   2. Envía follow-up a facturas ya recordadas (si pasaron los días configurados)
// También se puede invocar desde el frontend (JWT) para correr solo el propio perfil.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callClaude } from '../_shared/claude.ts'
import { sendEmail, reminderEmailHtml } from '../_shared/resend.ts'
import { sendMetaWhatsApp, sendMetaTemplate } from '../_shared/meta-whatsapp.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const APP_URL = Deno.env.get('APP_URL') ?? 'https://cobraya-phi.vercel.app'

function uruguayHour(): number {
  return (new Date().getUTCHours() - 3 + 24) % 24
}

function isWithinWorkingHours(from: string, to: string): boolean {
  const hour = uruguayHour()
  const [fh] = from.split(':').map(Number)
  const [th] = to.split(':').map(Number)
  return hour >= fh && hour < th
}

// Verifica si ya se envió un mensaje para esta factura en las últimas N horas.
// Previene duplicados por ejecuciones concurrentes del cron.
async function alreadySentRecently(invoiceId: string, withinHours = 6): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString()
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('invoice_id', invoiceId)
    .maybeSingle()
  if (!conv) return false
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conv.id)
    .eq('from_role', 'agent')
    .gte('sent_at', since)
  return (count ?? 0) > 0
}

async function hasRecentClientMessage(convId: string, withinHours = 24): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', convId)
    .eq('from_role', 'client')
    .gte('sent_at', since)
  return (count ?? 0) > 0
}

function buildReminderTemplate(
  clientName: string,
  company: string,
  cfeId: string,
  amount: number,
  due: string,
  paymentLink: string,
): { name: string; components: unknown[] } {
  return {
    name: 'cobraya_cobro',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: clientName || 'Cliente' },
        { type: 'text', text: company || 'la empresa' },
        { type: 'text', text: cfeId },
        { type: 'text', text: Number(amount).toLocaleString('es-AR') },
        { type: 'text', text: due },
        { type: 'text', text: paymentLink },
      ],
    }],
  }
}

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

async function dispatchMessage(
  phone: string,
  email: string | null,
  body: string,
  waProvider: string,
  profile: Record<string, string>,
  cfg: Record<string, unknown>,
  convId: string,
  templateData?: { name: string; components: unknown[] },
): Promise<void> {
  if (cfg.channel_whatsapp !== false) {
    const twilioSid   = profile.twilio_account_sid || Deno.env.get('TWILIO_ACCOUNT_SID')!
    const twilioToken = profile.twilio_auth_token  || Deno.env.get('TWILIO_AUTH_TOKEN')!
    const twilioFrom  = profile.twilio_wa_number   || Deno.env.get('TWILIO_WHATSAPP_NUMBER')!
    if (waProvider === 'meta' && profile.meta_phone_number_id && profile.meta_access_token) {
      if (templateData) {
        await sendMetaTemplate(phone, templateData.name, templateData.components, profile.meta_phone_number_id, profile.meta_access_token)
      } else {
        await sendMetaWhatsApp(phone, body, profile.meta_phone_number_id, profile.meta_access_token)
      }
    } else if (twilioSid && twilioToken && twilioFrom) {
      await sendWhatsApp(phone, body, twilioSid, twilioToken, twilioFrom)
    }
  }
  if (cfg.channel_email !== false && email) {
    await sendEmail({
      to:      email,
      subject: `Aviso de cobro — ${profile.company ?? 'tu proveedor'}`,
      html:    reminderEmailHtml({
        clientName:  '',
        company:     profile.company ?? 'la empresa',
        cfeId:       '',
        amount:      0,
        due:         '',
        messageBody: body,
      }),
    })
  }
  await supabase.from('messages').insert({
    conversation_id: convId,
    from_role:       'agent',
    body,
    status:          'sent',
  })
}

async function ensureConversation(profileId: string, clientId: string, invoiceId: string): Promise<string> {
  let { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .eq('invoice_id', invoiceId)
    .maybeSingle()
  if (!conv) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ profile_id: profileId, client_id: clientId, invoice_id: invoiceId })
      .select('id').single()
    conv = newConv
  }
  return conv!.id as string
}

serve(async (req) => {
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  const url           = new URL(req.url)
  const urlToken      = url.searchParams.get('token')
  const authHeader    = req.headers.get('Authorization') ?? ''

  // Determinar si es llamada de cron (token) o de usuario autenticado (JWT)
  const isCronCall = !webhookSecret || urlToken === webhookSecret
  let targetProfileId: string | null = null

  if (!isCronCall) {
    if (authHeader.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      if (user) {
        targetProfileId = user.id
      } else {
        return new Response('Unauthorized', { status: 401 })
      }
    } else {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const stats = { sent: 0, skipped: 0, errors: 0 }
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  try {
    let query = supabase
      .from('agent_config')
      .select('*, profiles(id, company, signature, twilio_account_sid, twilio_auth_token, twilio_wa_number, wa_provider, meta_phone_number_id, meta_access_token)')
      .eq('enabled', true)

    // Llamada de usuario: solo procesar su propio perfil
    if (targetProfileId) query = query.eq('profile_id', targetProfileId)

    const { data: configs } = await query

    for (const cfg of configs ?? []) {
      const profile = cfg.profiles as Record<string, string>
      if (!profile) continue

      // Respetar horario laboral (solo en ejecución automática, no en test manual)
      if (isCronCall && !isWithinWorkingHours(
        cfg.working_hours_from ?? '09:00',
        cfg.working_hours_to   ?? '18:00',
      )) {
        stats.skipped++
        continue
      }

      const waProvider = profile.wa_provider ?? 'twilio'
      const toneMap: Record<string, string> = {
        profesional: 'profesional y directo',
        amigable:    'amigable y cordial',
        firme:       'firme y enfático',
      }
      const tone  = toneMap[cfg.tone ?? 'profesional']
      const firma = profile.signature || profile.company || 'El equipo de cobros'

      // ── 0. AVISO PREVIO AL VENCIMIENTO ──────────────────────────────
      const preDueDays = Number(cfg.pre_due_reminder_days ?? 3)
      if (preDueDays > 0) {
        const preDueDate = new Date(today)
        preDueDate.setDate(preDueDate.getDate() + preDueDays)
        const preDueDateStr = preDueDate.toISOString().split('T')[0]

        const { data: upcoming } = await supabase
          .from('invoices')
          .select('id, cfe_id, amount, due, clients(id, name, phone, email)')
          .eq('profile_id', profile.id)
          .eq('status', 'pending')
          .eq('due', preDueDateStr)

        for (const inv of upcoming ?? []) {
          const client = inv.clients as Record<string, string>
          if (!client?.phone) { stats.skipped++; continue }
          if (await alreadySentRecently(inv.id)) { stats.skipped++; continue }
          try {
            const paymentLink = `${APP_URL}/pagar/${inv.id}`
            const convId = await ensureConversation(profile.id, client.id, inv.id)
            let templateData: { name: string; components: unknown[] } | undefined
            if (waProvider === 'meta' && profile.meta_phone_number_id && !(await hasRecentClientMessage(convId))) {
              templateData = buildReminderTemplate(client.name, profile.company, inv.cfe_id, inv.amount, inv.due, paymentLink)
            }
            const prompt = `Redactá un aviso amigable ${tone} recordando que la factura ${inv.cfe_id} por $${Number(inv.amount).toLocaleString('es-UY')} UYU vence en ${preDueDays} día${preDueDays > 1 ? 's' : ''} (el ${inv.due}). Incluí el link: ${paymentLink} — Máximo 3 oraciones. No uses listas. Firma: ${firma}`
            const msg = await callClaude(
              `Sos el asistente de cobros de ${profile.company ?? 'la empresa'}. Respondé solo con el mensaje de WhatsApp, sin comillas ni comentarios.`,
              [{ role: 'user', content: prompt }], 180, 'claude-haiku-4-5'
            )
            await dispatchMessage(client.phone, client.email, msg, waProvider, profile, cfg, convId, templateData)
            console.log(`✓ Aviso previo (${preDueDays}d): ${inv.cfe_id} → ${client.name}`)
            stats.sent++
          } catch (err) {
            console.error(`✗ Error aviso previo ${inv.id}:`, err)
            stats.errors++
          }
        }
      }

      // ── 1. PRIMER RECORDATORIO: facturas vencidas (tras días de gracia) ───
      const graceDays = Number(cfg.first_reminder_days ?? 1)
      const firstCutoff = new Date(today)
      firstCutoff.setDate(firstCutoff.getDate() - graceDays)

      const { data: pendingInvoices } = await supabase
        .from('invoices')
        .select('id, cfe_id, amount, due, clients(id, name, phone, email)')
        .eq('profile_id', profile.id)
        .eq('status', 'pending')
        .lte('due', firstCutoff.toISOString().split('T')[0])

      for (const inv of pendingInvoices ?? []) {
        const client = inv.clients as Record<string, string>
        if (!client?.phone) { stats.skipped++; continue }
        if (await alreadySentRecently(inv.id)) { stats.skipped++; continue }
        try {
          const paymentLink = `${APP_URL}/pagar/${inv.id}`
          const convId = await ensureConversation(profile.id, client.id, inv.id)
          let templateData: { name: string; components: unknown[] } | undefined
          if (waProvider === 'meta' && profile.meta_phone_number_id && !(await hasRecentClientMessage(convId))) {
            templateData = buildReminderTemplate(client.name, profile.company, inv.cfe_id, inv.amount, inv.due, paymentLink)
          }
          const prompt = `Redactá un recordatorio de pago ${tone} para la factura ${inv.cfe_id} por $${Number(inv.amount).toLocaleString('es-UY')} UYU con vencimiento el ${inv.due}. Incluí el link: ${paymentLink} — Máximo 4 oraciones. No uses listas. Firma: ${firma}`
          const msg = await callClaude(
            `Sos el asistente de cobros de ${profile.company ?? 'la empresa'}. Respondé solo con el mensaje de WhatsApp, sin comillas ni comentarios.`,
            [{ role: 'user', content: prompt }], 200, 'claude-haiku-4-5'
          )
          await dispatchMessage(client.phone, client.email, msg, waProvider, profile, cfg, convId, templateData)
          await supabase.from('invoices').update({ status: 'reminded' }).eq('id', inv.id)
          console.log(`✓ Recordatorio: ${inv.cfe_id} → ${client.name}`)
          stats.sent++
        } catch (err) {
          console.error(`✗ Error recordatorio ${inv.id}:`, err)
          stats.errors++
        }
      }

      // ── 2. FOLLOW-UP: facturas reminded / ai_negotiating ────────────────
      const followUpCutoff = new Date(today)
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
          const { data: conv } = await supabase
            .from('conversations')
            .select('id, messages(id, from_role, sent_at)')
            .eq('client_id', client.id)
            .eq('invoice_id', inv.id)
            .maybeSingle()
          if (!conv) { stats.skipped++; continue }

          const agentMsgs = (conv.messages ?? []).filter((m: { from_role: string }) => m.from_role === 'agent')
          const lastMsg   = agentMsgs.at(-1) as { sent_at: string } | undefined

          if (agentMsgs.length >= (cfg.max_follow_ups ?? 3)) { stats.skipped++; continue }
          if (lastMsg && new Date(lastMsg.sent_at) > followUpCutoff) { stats.skipped++; continue }

          const paymentLink = `${APP_URL}/pagar/${inv.id}`
          let templateData: { name: string; components: unknown[] } | undefined
          if (waProvider === 'meta' && profile.meta_phone_number_id && !(await hasRecentClientMessage(conv.id))) {
            templateData = buildReminderTemplate(client.name, profile.company, inv.cfe_id, inv.amount, inv.due, paymentLink)
          }
          const prompt = `Redactá un seguimiento de cobro ${tone} para la factura vencida ${inv.cfe_id} por $${Number(inv.amount).toLocaleString('es-UY')} UYU (venció el ${inv.due}). Es el mensaje nº ${agentMsgs.length + 1}. Incluí el link: ${paymentLink}${cfg.offer_payment_plan ? ` — Mencioná posibilidad de ${cfg.payment_plan_installments} cuotas.` : ''} Máximo 4 oraciones. Firma: ${firma}`
          const msg = await callClaude(
            `Sos el asistente de cobros de ${profile.company ?? 'la empresa'}. Respondé solo con el mensaje de WhatsApp, sin comillas ni comentarios.`,
            [{ role: 'user', content: prompt }], 200, 'claude-haiku-4-5'
          )
          await dispatchMessage(client.phone, client.email, msg, waProvider, profile, cfg, conv.id, templateData)
          await supabase.from('invoices').update({ status: 'ai_negotiating' }).eq('id', inv.id)
          console.log(`✓ Follow-up: ${inv.cfe_id} → ${client.name}`)
          stats.sent++
        } catch (err) {
          console.error(`✗ Error follow-up ${inv.id}:`, err)
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
