// ─────────────────────────────────────────────────────────────
// API REAL — conectada a Supabase.
// Reemplaza a src/api/mock.js una vez que configures .env.local
// ─────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabase'

// Helper: lanza si hay error de Supabase
function check(error) {
  if (error) throw new Error(error.message)
}

export const api = {

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    check(error)
    return {
      name:     user.email.split('@')[0],
      email:    user.email,
      plan:     data.plan,
      initials: data.company ? data.company.slice(0,2).toUpperCase() : user.email.slice(0,2).toUpperCase(),
      company:  data.company,
      whatsappNumber: data.whatsapp,
    }
  },

  async getKPIs() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('invoices')
      .select('amount, status, issued, due')
      .eq('profile_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(id, name, rut, phone)')
      .eq('profile_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('messages')
      .select('*, conversations(client_id, clients(name))')
      .eq('conversations.profile_id', user.id)
      .eq('from_role', 'agent')
      .order('sent_at', { ascending: false })
      .limit(10)
    check(error)
    return (data ?? []).map((m, i) => ({
      id:     m.id,
      ts:     m.sent_at,
      client: m.conversations?.clients?.name ?? '',
      action: m.body.slice(0, 80),
      type:   'reminder',
      icon:   '📲',
    }))
  },

  async getChartData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('invoices')
      .select('amount, status, issued')
      .eq('profile_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('clients')
      .select('*, invoices(amount, status, issued, due)')
      .eq('profile_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('conversations')
      .select('*, clients(name, phone), invoices(cfe_id, amount), messages(id, from_role, body, status, sent_at)')
      .eq('profile_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('agent_config')
      .select('*')
      .eq('profile_id', user.id)
      .single()
    check(error)
    const { data: profile } = await supabase.from('profiles').select('whatsapp').eq('id', user.id).single()

    return {
      enabled:                  data.enabled,
      whatsappNumber:           profile?.whatsapp ?? '',
      tone:                     data.tone,
      firstReminderDays:        data.first_reminder_days,
      followUpDays:             data.follow_up_days,
      maxFollowUps:             data.max_follow_ups,
      offerPaymentPlan:         data.offer_payment_plan,
      paymentPlanInstallments:  data.payment_plan_installments,
      escalateAfterDays:        data.escalate_after_days,
      channels: {
        whatsapp: data.channel_whatsapp,
        email:    data.channel_email,
      },
      workingHours: {
        from: data.working_hours_from,
        to:   data.working_hours_to,
      },
      signature: profile?.whatsapp ?? '',
    }
  },

  async saveAgentConfig(config) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('agent_config')
      .update({
        enabled:                  config.enabled,
        tone:                     config.tone,
        first_reminder_days:      config.firstReminderDays,
        follow_up_days:           config.followUpDays,
        max_follow_ups:           config.maxFollowUps,
        offer_payment_plan:       config.offerPaymentPlan,
        payment_plan_installments: config.paymentPlanInstallments,
        escalate_after_days:      config.escalateAfterDays,
        channel_whatsapp:         config.channels.whatsapp,
        channel_email:            config.channels.email,
        working_hours_from:       config.workingHours.from,
        working_hours_to:         config.workingHours.to,
      })
      .eq('profile_id', user.id)

    await supabase.from('profiles').update({
      whatsapp:  config.whatsappNumber,
      signature: config.signature,
    }).eq('id', user.id)

    check(error)
    return { ok: true }
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
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'reminded' })
      .eq('id', invoiceId)
    check(error)
    return { ok: true }
  },

  async activateAI(invoiceId) {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'ai_negotiating' })
      .eq('id', invoiceId)
    check(error)
    return { ok: true }
  },

  async createClient({ name, rut, phone, email }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('clients')
      .insert({ profile_id: user.id, name, rut, phone, email })
      .select()
      .single()
    check(error)
    return data
  },

  async createInvoice({ clientId, cfeId, amount, issued, due, channel }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        profile_id: user.id,
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

  async deleteClient(clientId) {
    const { error } = await supabase.from('clients').delete().eq('id', clientId)
    check(error)
    return { ok: true }
  },

  async deleteInvoice(invoiceId) {
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
    check(error)
    return { ok: true }
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

  async saveProfile({ company }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ company })
      .eq('id', user.id)
    check(error)
    return { ok: true }
  },
}
