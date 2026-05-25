// ─────────────────────────────────────────────────────────────
// API REAL — conectada a Supabase.
// Reemplaza a src/api/mock.js una vez que configures .env.local
// ─────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabase'
import { getLimits } from '@/lib/plans'

// Helper: lanza si hay error de Supabase
function check(error) {
  if (error) throw new Error(error.message)
}

export const api = {

  // ── Resolución de identidad ───────────────────────────────────────────────
  // Devuelve { userId, profileId } donde profileId es el del propietario
  // si el usuario actual es miembro del equipo, o su propio id si es dueño.
  async _me() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, parent_profile_id')
      .eq('id', user.id)
      .single()
    return {
      userId:    user.id,
      profileId: profile?.parent_profile_id ?? user.id,
    }
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    check(error)
    const emailUser = user.email.split('@')[0].replace(/[._-]/g, ' ')
    const displayName = data.company || emailUser
    return {
      name:             displayName,
      email:            user.email,
      plan:             data.plan,
      initials:         displayName.slice(0,2).toUpperCase(),
      company:          data.company,
      whatsappNumber:   data.whatsapp,
      twilioAccountSid:     data.twilio_account_sid    ?? '',
      twilioAuthToken:      data.twilio_auth_token     ?? '',
      twilioWaNumber:       data.twilio_wa_number      ?? '',
      paymentInstructions:  data.payment_instructions  ?? '',
      mpAccessToken:        data.mp_access_token       ?? '',
      bankName:             data.bank_name             ?? '',
      bankAccount:          data.bank_account          ?? '',
      bankAlias:            data.bank_alias            ?? '',
      stripePk:             data.stripe_pk             ?? '',
      stripeSk:             data.stripe_sk             ?? '',
      waProvider:           data.wa_provider           ?? 'twilio',
      metaPhoneNumberId:    data.meta_phone_number_id  ?? '',
      metaAccessToken:      data.meta_access_token     ?? '',
      metaWabaId:           data.meta_waba_id          ?? '',
      metaVerifyToken:      data.meta_verify_token     ?? '',
      onboardingCompleted:  data.onboarding_completed  ?? true,
      planStartsAt:         data.plan_starts_at        ?? null,
      planExpiresAt:        data.plan_expires_at       ?? null,
      mpPreapprovalId:      data.mp_preapproval_id     ?? null,
    }
  },

  async completeOnboarding() {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
    check(error)
    return { ok: true }
  },

  async getKPIs() {
    const { profileId } = await api._me()
    const { data, error } = await supabase
      .from('invoices')
      .select('amount, status, issued, due')
      .eq('profile_id', profileId)
    check(error)

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear  = now.getFullYear()

    let cobrado = 0, pendiente = 0, vencido = 0, dsoDays = [], dsoCount = 0

    for (const inv of data ?? []) {
      const issued = new Date(inv.issued)
      const due    = new Date(inv.due)
      if (inv.status === 'paid' && issued.getMonth() === thisMonth && issued.getFullYear() === thisYear) {
        cobrado += +inv.amount
        const days = Math.ceil((due - issued) / 86400000)
        dsoDays.push(days); dsoCount++
      }
      if (['pending','reminded','ai_negotiating'].includes(inv.status)) pendiente += +inv.amount
      if (inv.status === 'overdue') vencido += +inv.amount
    }

    const dso = dsoCount > 0 ? Math.round(dsoDays.reduce((a,b) => a+b, 0) / dsoCount) : 0

    return [
      { id: 'cobrado',   label: 'Cobrado este mes',       value: cobrado,   delta: 0, unit: 'currency', trend: 'up' },
      { id: 'pendiente', label: 'Pendiente de cobro',     value: pendiente, delta: 0, unit: 'currency', trend: 'down' },
      { id: 'vencido',   label: 'Vencido sin gestionar',  value: vencido,   delta: 0, unit: 'currency', trend: 'up' },
      { id: 'dso',       label: 'Días promedio de cobro', value: dso,       delta: 0, unit: 'days',     trend: 'down' },
    ]
  },

  async getInvoices() {
    const { profileId } = await api._me()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(id, name, rut, phone)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
    check(error)

    return (data ?? []).map(inv => ({
      id:       inv.id,
      cfeId:    inv.cfe_id,
      clientId: inv.client_id,
      client:   inv.clients?.name ?? '',
      rut:      inv.clients?.rut ?? '',
      amount:   +inv.amount,
      issued:   inv.issued,
      due:      inv.due,
      status:   inv.status,
      channel:  inv.channel,
      aiNote:   inv.ai_note,
    }))
  },

  async getActivity() {
    const { profileId } = await api._me()
    // Primero traemos las conversaciones del usuario
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, clients(name)')
      .eq('profile_id', profileId)
    const convIds = (convs ?? []).map(c => c.id)
    if (!convIds.length) return []

    const convMap = Object.fromEntries((convs ?? []).map(c => [c.id, c.clients?.name ?? '']))

    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, from_role, body, sent_at')
      .in('conversation_id', convIds)
      .eq('from_role', 'agent')
      .order('sent_at', { ascending: false })
      .limit(10)
    check(error)
    return (data ?? []).map(m => ({
      id:     m.id,
      ts:     m.sent_at,
      client: convMap[m.conversation_id] ?? '',
      action: m.body.slice(0, 80),
      type:   'reminder',
      icon:   '📲',
    }))
  },

  async getChartData() {
    const { profileId } = await api._me()
    const { data, error } = await supabase
      .from('invoices')
      .select('amount, status, issued')
      .eq('profile_id', profileId)
    check(error)

    const months = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('es-UY', { month: 'short' })
      months[key] = { month: key, cobrado: 0, pendiente: 0 }
    }

    for (const inv of data ?? []) {
      const d = new Date(inv.issued)
      const key = d.toLocaleDateString('es-UY', { month: 'short' })
      if (!months[key]) continue
      if (inv.status === 'paid') months[key].cobrado += +inv.amount
      else months[key].pendiente += +inv.amount
    }

    return Object.values(months)
  },

  async getClients() {
    const { profileId } = await api._me()
    const { data, error } = await supabase
      .from('clients')
      .select('*, invoices(amount, status, issued, due)')
      .eq('profile_id', profileId)
      .order('name')
    check(error)

    return (data ?? []).map(c => {
      const invs = c.invoices ?? []
      const totalFacturado = invs.reduce((s, i) => s + +i.amount, 0)
      const pendiente = invs.filter(i => ['pending','reminded','ai_negotiating','overdue'].includes(i.status)).reduce((s,i) => s + +i.amount, 0)
      const paidInvs  = invs.filter(i => i.status === 'paid')
      const avgDays   = paidInvs.length > 0
        ? Math.round(paidInvs.reduce((s,i) => s + Math.ceil((new Date(i.due) - new Date(i.issued)) / 86400000), 0) / paidInvs.length)
        : 0
      const overdueCount = invs.filter(i => i.status === 'overdue').length
      const riskScore = Math.max(10, Math.min(99, 90 - overdueCount * 20 - Math.floor(avgDays / 5)))

      return {
        id:            c.id,
        name:          c.name,
        rut:           c.rut,
        phone:         c.phone,
        email:         c.email,
        totalFacturado,
        pendiente,
        avgDaysToPay:  avgDays,
        riskScore,
        invoiceCount:  invs.length,
        lastActivity:  invs[0]?.issued ?? c.created_at,
      }
    })
  },

  async getConversations(clientId) {
    const { profileId } = await api._me()

    let query = supabase
      .from('conversations')
      .select('*, clients(name, phone), invoices(cfe_id, amount), messages(id, from_role, body, status, sent_at)')
      .eq('profile_id', profileId)
      .order('sent_at', { ascending: true, foreignTable: 'messages' })

    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query
    check(error)

    const shape = (conv) => ({
      id:            conv.id,
      clientId:      conv.client_id,
      client:        conv.clients?.name ?? '',
      phone:         conv.clients?.phone ?? '',
      invoiceId:     conv.invoices?.cfe_id ?? '',
      invoiceAmount: conv.invoices ? +conv.invoices.amount : 0,
      messages: (conv.messages ?? []).map(m => ({
        id:     m.id,
        from:   m.from_role,
        ts:     m.sent_at,
        text:   m.body,
        status: m.status,
      })),
    })

    if (clientId) {
      const conv = data?.[0]
      return conv ? shape(conv) : null
    }
    return (data ?? []).map(shape)
  },

  async getAgentConfig() {
    const { userId, profileId } = await api._me()

    // maybeSingle para no lanzar error si el usuario aún no tiene fila
    let { data } = await supabase
      .from('agent_config')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle()

    // Si no existe la fila, crear una con valores por defecto
    if (!data) {
      const { data: created } = await supabase
        .from('agent_config')
        .insert({ profile_id: profileId })
        .select('*')
        .single()
      data = created
    }

    const { data: profile } = await supabase.from('profiles').select('whatsapp, signature').eq('id', profileId).single()

    return {
      enabled:                 data?.enabled                  ?? true,
      whatsappNumber:          profile?.whatsapp              ?? '',
      tone:                    data?.tone                     ?? 'profesional',
      firstReminderDays:       data?.first_reminder_days      ?? 1,
      followUpDays:            data?.follow_up_days           ?? 5,
      maxFollowUps:            data?.max_follow_ups           ?? 3,
      preDueReminderDays:      data?.pre_due_reminder_days    ?? 3,
      offerPaymentPlan:        data?.offer_payment_plan       ?? true,
      paymentPlanInstallments: data?.payment_plan_installments ?? 3,
      escalateAfterDays:       data?.escalate_after_days      ?? 15,
      channels: {
        whatsapp: data?.channel_whatsapp ?? true,
        email:    data?.channel_email    ?? false,
      },
      workingHours: {
        from: data?.working_hours_from ?? '09:00',
        to:   data?.working_hours_to   ?? '18:00',
      },
      signature: profile?.signature ?? '',
    }
  },

  async saveAgentConfig(config) {
    const { profileId } = await api._me()

    // upsert en lugar de update para soportar usuarios sin fila previa
    const { error } = await supabase
      .from('agent_config')
      .upsert({
        profile_id:               profileId,
        enabled:                  config.enabled,
        tone:                     config.tone,
        first_reminder_days:      config.firstReminderDays,
        follow_up_days:           config.followUpDays,
        max_follow_ups:           config.maxFollowUps,
        pre_due_reminder_days:    config.preDueReminderDays,
        offer_payment_plan:       config.offerPaymentPlan,
        payment_plan_installments: config.paymentPlanInstallments,
        escalate_after_days:      config.escalateAfterDays,
        channel_whatsapp:         config.channels.whatsapp,
        channel_email:            config.channels.email,
        working_hours_from:       config.workingHours.from,
        working_hours_to:         config.workingHours.to,
      }, { onConflict: 'profile_id' })

    await supabase.from('profiles').update({
      whatsapp:  config.whatsappNumber,
      signature: config.signature,
    }).eq('id', profileId)

    check(error)
    return { ok: true }
  },

  async testAutoReminder() {
    const { data, error } = await supabase.functions.invoke('auto-reminder', {
      body: {},
    })
    if (error) throw new Error(error.message)
    return data // { sent, skipped, errors }
  },

  async markPaid(invoiceId) {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)
    check(error)
    return { ok: true }
  },

  async sendReminder(invoiceId) {
    // Intenta enviar WA real via Edge Function; si no está deployada, actualiza solo el estado
    try {
      const { error } = await supabase.functions.invoke('whatsapp-send', {
        body: { invoiceId, type: 'reminder' },
      })
      if (error) throw error
    } catch {
      // Fallback: solo actualizar estado (sin WA real)
      const { error } = await supabase.from('invoices').update({ status: 'reminded' }).eq('id', invoiceId)
      check(error)
    }
    return { ok: true }
  },

  async activateAI(invoiceId) {
    // Intenta activar agente real via Edge Function; si no está deployada, actualiza solo el estado
    try {
      const { error } = await supabase.functions.invoke('whatsapp-send', {
        body: { invoiceId, type: 'ai' },
      })
      if (error) throw error
    } catch {
      // Fallback: solo actualizar estado (sin WA real)
      const { error } = await supabase.from('invoices').update({ status: 'ai_negotiating' }).eq('id', invoiceId)
      check(error)
    }
    return { ok: true }
  },

  async createClient({ name, rut, phone, email }) {
    const { profileId } = await api._me()

    // Verificar límite del plan
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', profileId).single()
    const limits = getLimits(profile?.plan ?? 'free')
    if (limits.maxClients !== Infinity) {
      const { count } = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('profile_id', profileId)
      if ((count ?? 0) >= limits.maxClients) {
        const err = new Error(`Límite del plan: máximo ${limits.maxClients} clientes en el plan gratuito.`)
        err.code = 'PLAN_LIMIT'
        throw err
      }
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({ profile_id: profileId, name, rut, phone, email })
      .select()
      .single()
    check(error)
    return data
  },

  async createInvoice({ clientId, cfeId, amount, issued, due, channel }) {
    const { profileId } = await api._me()

    // Verificar límite del plan
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', profileId).single()
    const limits = getLimits(profile?.plan ?? 'free')
    if (limits.maxInvoices !== Infinity) {
      const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('profile_id', profileId)
      if ((count ?? 0) >= limits.maxInvoices) {
        const err = new Error(`Límite del plan: máximo ${limits.maxInvoices} facturas en el plan gratuito.`)
        err.code = 'PLAN_LIMIT'
        throw err
      }
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        profile_id: profileId,
        client_id:  clientId,
        cfe_id:     cfeId,
        amount,
        issued,
        due,
        channel:    channel || null,
        status:     'pending',
      })
      .select()
      .single()
    check(error)
    return data
  },

  async updateClient(clientId, { name, rut, phone, email }) {
    const { error } = await supabase
      .from('clients')
      .update({ name, rut, phone, email })
      .eq('id', clientId)
    check(error)
    return { ok: true }
  },

  async deleteClient(clientId) {
    const { error } = await supabase.from('clients').delete().eq('id', clientId)
    check(error)
    return { ok: true }
  },

  async updateInvoice(invoiceId, { cfeId, amount, issued, due }) {
    const { error } = await supabase
      .from('invoices')
      .update({ cfe_id: cfeId, amount, issued, due })
      .eq('id', invoiceId)
    check(error)
    return { ok: true }
  },

  async deleteInvoice(invoiceId) {
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
    check(error)
    return { ok: true }
  },

  async bulkReminder(invoiceIds) {
    // Envía recordatorio a múltiples facturas en paralelo
    const results = await Promise.allSettled(
      invoiceIds.map(id => supabase.functions.invoke('whatsapp-send', { body: { invoiceId: id, type: 'reminder' } }))
    )
    // Fallback: marcar como reminded las que fallaron el edge function
    await Promise.all(
      invoiceIds.map(id => supabase.from('invoices').update({ status: 'reminded' }).eq('id', id).eq('status', 'pending'))
    )
    const failed = results.filter(r => r.status === 'rejected').length
    return { ok: true, sent: invoiceIds.length - failed, failed }
  },

  async importInvoices(rows) {
    // rows: [{ clientName, rut, phone, email, cfeId, amount, issued, due }]
    const { profileId } = await api._me()

    // 1. Traer clientes existentes
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id, name, rut, phone, email')
      .eq('profile_id', profileId)

    const clientMap = {}
    for (const c of existingClients ?? []) {
      clientMap[c.rut?.replace(/\D/g, '')] = c.id
      clientMap[c.name?.toLowerCase().trim()] = c.id
    }

    const results = { created: 0, skipped: 0, errors: [] }

    for (const row of rows) {
      try {
        // 2. Resolver o crear cliente
        const rutKey   = row.rut?.replace(/\D/g, '')
        const nameKey  = row.clientName?.toLowerCase().trim()
        let clientId   = (rutKey && clientMap[rutKey]) || (nameKey && clientMap[nameKey])

        if (!clientId) {
          const { data: newClient, error: ce } = await supabase
            .from('clients')
            .insert({ profile_id: profileId, name: row.clientName, rut: row.rut, phone: row.phone, email: row.email })
            .select('id').single()
          if (ce) throw new Error(ce.message)
          clientId = newClient.id
          if (rutKey)  clientMap[rutKey]  = clientId
          if (nameKey) clientMap[nameKey] = clientId
        }

        // 3. Crear factura
        const { error: ie } = await supabase.from('invoices').insert({
          profile_id: profileId,
          client_id:  clientId,
          cfe_id:     row.cfeId,
          amount:     parseFloat(row.amount),
          issued:     row.issued,
          due:        row.due,
          status:     'pending',
        })
        if (ie) throw new Error(ie.message)
        results.created++
      } catch (e) {
        results.errors.push(`Fila "${row.cfeId || row.clientName}": ${e.message}`)
        results.skipped++
      }
    }

    return results
  },

  async getUnreadCount() {
    const { profileId } = await api._me()
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('profile_id', profileId)
    if (!convs?.length) return 0
    const ids = convs.map(c => c.id)
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', ids)
      .eq('from_role', 'client')
      .neq('status', 'read')
    return count ?? 0
  },

  async sendMessage(conversationId, body) {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        from_role:       'agent',
        body,
        status:          'sent',
      })
    check(error)
    return { ok: true }
  },

  async saveProfile({ company, signature, twilioAccountSid, twilioAuthToken, twilioWaNumber,
                      paymentInstructions, mpAccessToken,
                      bankName, bankAccount, bankAlias,
                      stripePk, stripeSk,
                      waProvider, metaPhoneNumberId, metaAccessToken, metaWabaId, metaVerifyToken }) {
    const { data: { user } } = await supabase.auth.getUser()
    const t = v => (v ?? '').trim()
    const { error } = await supabase
      .from('profiles')
      .update({
        ...(company   !== undefined && { company }),
        ...(signature !== undefined && { signature: t(signature) }),
        ...(twilioAccountSid    !== undefined && { twilio_account_sid:    t(twilioAccountSid)   }),
        ...(twilioAuthToken     !== undefined && { twilio_auth_token:     t(twilioAuthToken)    }),
        ...(twilioWaNumber      !== undefined && { twilio_wa_number:      t(twilioWaNumber),
                                                   whatsapp:              t(twilioWaNumber)     }),
        ...(paymentInstructions !== undefined && { payment_instructions:  t(paymentInstructions) }),
        ...(mpAccessToken       !== undefined && { mp_access_token:       t(mpAccessToken)      }),
        ...(bankName            !== undefined && { bank_name:             t(bankName)            }),
        ...(bankAccount         !== undefined && { bank_account:          t(bankAccount)         }),
        ...(bankAlias           !== undefined && { bank_alias:            t(bankAlias)           }),
        ...(stripePk            !== undefined && { stripe_pk:             t(stripePk)            }),
        ...(stripeSk            !== undefined && { stripe_sk:             t(stripeSk)            }),
        ...(waProvider          !== undefined && { wa_provider:           waProvider             }),
        ...(metaPhoneNumberId   !== undefined && { meta_phone_number_id:  t(metaPhoneNumberId)  }),
        ...(metaAccessToken     !== undefined && { meta_access_token:     t(metaAccessToken)    }),
        ...(metaWabaId          !== undefined && { meta_waba_id:          t(metaWabaId)         }),
        ...(metaVerifyToken     !== undefined && { meta_verify_token:     t(metaVerifyToken)    }),
      })
      .eq('id', user.id)
    check(error)
    return { ok: true }
  },

  // ── Equipo (multi-usuario) ────────────────────────────────────────────────

  async getTeam() {
    const { userId, profileId } = await api._me()
    // Solo el propietario puede ver el equipo
    if (userId !== profileId) return { members: [], invitations: [] }

    // Miembros activos (profiles con parent_profile_id = mi id)
    const { data: members } = await supabase
      .from('profiles')
      .select('id, company, created_at')
      .eq('parent_profile_id', userId)
    // No podemos leer auth.users desde el cliente — usamos el email guardado en la invitación aceptada

    // Invitaciones pendientes y aceptadas
    const { data: invitations } = await supabase
      .from('invitations')
      .select('id, email, role, accepted_at, expires_at, created_at')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })

    // Enriquecer miembros con el email de la invitación aceptada
    const acceptedEmails = Object.fromEntries(
      (invitations ?? [])
        .filter(i => i.accepted_at)
        .map(i => [i.email, i])
    )

    return {
      members: (members ?? []).map(m => ({
        id:       m.id,
        company:  m.company,
        joinedAt: m.created_at,
        email:    Object.values(acceptedEmails).find(i => i)?.email ?? '',
      })),
      invitations: (invitations ?? []).filter(i => !i.accepted_at).map(i => ({
        id:        i.id,
        email:     i.email,
        role:      i.role,
        createdAt: i.created_at,
        expiresAt: i.expires_at,
      })),
    }
  },

  async inviteTeamMember(email, role = 'member') {
    const { userId, profileId } = await api._me()
    if (userId !== profileId) throw new Error('Solo el propietario puede invitar miembros')

    // Insertar invitación
    const { data: inv, error } = await supabase
      .from('invitations')
      .insert({ profile_id: userId, email: email.toLowerCase().trim(), role })
      .select('token, id')
      .single()
    check(error)

    // Enviar email de invitación (falla silenciosa si no hay Resend)
    const { data: profile } = await supabase.from('profiles').select('company').eq('id', userId).single()
    await supabase.functions.invoke('send-invitation', {
      body: {
        email,
        company:  profile?.company ?? 'Cobraya',
        token:    inv.token,
        role,
      },
    }).catch(() => {})

    return { ok: true, invitationId: inv.id }
  },

  async revokeInvitation(invitationId) {
    const { error } = await supabase.from('invitations').delete().eq('id', invitationId)
    check(error)
    return { ok: true }
  },

  async removeMember(memberId) {
    const { error } = await supabase
      .from('profiles')
      .update({ parent_profile_id: null })
      .eq('id', memberId)
    check(error)
    return { ok: true }
  },

  async getInvitationByToken(token) {
    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, role, expires_at, accepted_at, profiles(company)')
      .eq('token', token)
      .maybeSingle()
    check(error)
    if (!data) return null
    return {
      id:         data.id,
      email:      data.email,
      role:       data.role,
      expiresAt:  data.expires_at,
      acceptedAt: data.accepted_at,
      company:    data.profiles?.company ?? 'Cobraya',
    }
  },

  async acceptInvitation(token) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Necesitás iniciar sesión primero')

    // Obtener la invitación
    const { data: inv } = await supabase
      .from('invitations')
      .select('id, profile_id, email, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle()

    if (!inv) throw new Error('Invitación no encontrada o inválida')
    if (inv.accepted_at) throw new Error('Esta invitación ya fue aceptada')
    if (new Date(inv.expires_at) < new Date()) throw new Error('La invitación expiró')

    // Setear parent_profile_id en el perfil del usuario actual
    const { error: pe } = await supabase
      .from('profiles')
      .update({ parent_profile_id: inv.profile_id })
      .eq('id', user.id)
    check(pe)

    // Marcar la invitación como aceptada
    await supabase.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('id', inv.id)

    return { ok: true, profileId: inv.profile_id }
  },
}
