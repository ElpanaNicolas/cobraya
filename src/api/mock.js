// ─────────────────────────────────────────────────────────────
// MOCK API — cada función simula un fetch() con delay realista.
// Para conectar al backend real, reemplazá el cuerpo de cada
// función con: return fetch('/api/...').then(r => r.json())
// ─────────────────────────────────────────────────────────────

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export const api = {

  async getUser() {
    await delay(300)
    return {
      name: 'Juan García',
      email: 'juan@garcia.uy',
      plan: 'Pro',
      initials: 'JG',
      company: 'García & Asociados',
      whatsappNumber: '+598 99 123 456',
    }
  },

  async getKPIs() {
    await delay(500)
    return [
      { id: 'cobrado',   label: 'Cobrado este mes',       value: 284500, delta: +23.4, unit: 'currency', trend: 'up'   },
      { id: 'pendiente', label: 'Pendiente de cobro',     value: 61200,  delta: -8.1,  unit: 'currency', trend: 'down' },
      { id: 'vencido',   label: 'Vencido sin gestionar',  value: 14800,  delta: +4.2,  unit: 'currency', trend: 'up'   },
      { id: 'dso',       label: 'Días promedio de cobro', value: 18,     delta: -3,    unit: 'days',     trend: 'down' },
    ]
  },

  async getInvoices() {
    await delay(700)
    return [
      { id: 'CFE-2025-001', client: 'Supermercado Devoto S.A.',  clientId: 'c1', rut: '21.234.567-8', amount: 84200,  issued: '2025-04-01', due: '2025-04-30', status: 'paid',           channel: 'email',    aiNote: null },
      { id: 'CFE-2025-002', client: 'Construcciones del Sur',    clientId: 'c2', rut: '21.345.678-9', amount: 38900,  issued: '2025-04-05', due: '2025-05-05', status: 'reminded',       channel: 'whatsapp', aiNote: 'Abrió el mensaje. Sin respuesta aún.' },
      { id: 'CFE-2025-003', client: 'Farmacia Fénix',            clientId: 'c3', rut: '21.456.789-0', amount: 12400,  issued: '2025-04-10', due: '2025-05-10', status: 'ai_negotiating', channel: 'whatsapp', aiNote: 'Propuso plan de 3 cuotas. Cliente respondió "lo consulto".' },
      { id: 'CFE-2025-004', client: 'Estudio García & Asoc.',    clientId: 'c4', rut: '21.567.890-1', amount: 24700,  issued: '2025-03-15', due: '2025-04-15', status: 'overdue',        channel: 'email',    aiNote: '3er recordatorio enviado. Sin respuesta en 15 días.' },
      { id: 'CFE-2025-005', client: 'Logística Río Negro',       clientId: 'c5', rut: '21.678.901-2', amount: 67300,  issued: '2025-04-12', due: '2025-05-12', status: 'pending',        channel: null,       aiNote: null },
      { id: 'CFE-2025-006', client: 'Clínica Santa Elena',       clientId: 'c6', rut: '21.789.012-3', amount: 18900,  issued: '2025-04-15', due: '2025-05-15', status: 'paid',           channel: 'email',    aiNote: null },
      { id: 'CFE-2025-007', client: 'Agro San José SRL',         clientId: 'c7', rut: '21.890.123-4', amount: 55100,  issued: '2025-04-02', due: '2025-05-02', status: 'reminded',       channel: 'whatsapp', aiNote: 'Historial: pagador tardío recurrente (avg +12 días).' },
      { id: 'CFE-2025-008', client: 'Tech Solutions UY',         clientId: 'c8', rut: '21.901.234-5', amount: 9800,   issued: '2025-03-20', due: '2025-04-20', status: 'overdue',        channel: 'email',    aiNote: 'Cliente nuevo. Primer impago registrado.' },
      { id: 'CFE-2025-009', client: 'Importadora Del Plata',     clientId: 'c9', rut: '22.012.345-6', amount: 142000, issued: '2025-04-18', due: '2025-05-18', status: 'pending',        channel: null,       aiNote: null },
      { id: 'CFE-2025-010', client: 'Veterinaria El Campo',      clientId: 'c10',rut: '22.123.456-7', amount: 7600,   issued: '2025-04-20', due: '2025-05-20', status: 'paid',           channel: 'whatsapp', aiNote: null },
      { id: 'CFE-2025-011', client: 'Distribuidora Norte',       clientId: 'c11',rut: '22.234.567-8', amount: 33400,  issued: '2025-04-22', due: '2025-05-22', status: 'pending',        channel: null,       aiNote: null },
      { id: 'CFE-2025-012', client: 'Consultora RH Partners',    clientId: 'c12',rut: '22.345.678-9', amount: 21000,  issued: '2025-04-08', due: '2025-05-08', status: 'reminded',       channel: 'email',    aiNote: 'Primer recordatorio. Tasa apertura: alta.' },
    ]
  },

  async getActivity() {
    await delay(400)
    return [
      { id: 1, ts: '2025-05-20T14:38:00', client: 'Farmacia Fénix',         action: 'Propuso plan de pago en 3 cuotas por WhatsApp', type: 'negotiation', icon: '🤝' },
      { id: 2, ts: '2025-05-20T14:22:00', client: 'Construcciones del Sur', action: 'Recordatorio enviado — tasa apertura alta',       type: 'reminder',    icon: '📲' },
      { id: 3, ts: '2025-05-20T13:45:00', client: 'Agro San José SRL',      action: 'Detectó patrón tardío → adelantó recordatorio',   type: 'insight',     icon: '🧠' },
      { id: 4, ts: '2025-05-20T12:10:00', client: 'Estudio García & Asoc.', action: '3er recordatorio sin respuesta — escalar a vos',  type: 'alert',       icon: '⚠️' },
      { id: 5, ts: '2025-05-20T11:30:00', client: 'Logística Río Negro',    action: 'Factura vence en 7 días — recordatorio programado', type: 'scheduled', icon: '🗓️' },
      { id: 6, ts: '2025-05-20T10:05:00', client: 'Tech Solutions UY',      action: 'Primer impago detectado — iniciando secuencia',    type: 'alert',       icon: '🚨' },
    ]
  },

  async getChartData() {
    await delay(450)
    return [
      { month: 'Nov', cobrado: 180000, pendiente: 95000 },
      { month: 'Dic', cobrado: 210000, pendiente: 78000 },
      { month: 'Ene', cobrado: 195000, pendiente: 110000 },
      { month: 'Feb', cobrado: 230000, pendiente: 85000 },
      { month: 'Mar', cobrado: 248000, pendiente: 72000 },
      { month: 'Abr', cobrado: 284500, pendiente: 61200 },
    ]
  },

  async getClients() {
    await delay(500)
    return [
      { id: 'c1',  name: 'Supermercado Devoto S.A.',  rut: '21.234.567-8', phone: '+598 99 111 001', email: 'pagos@devoto.com.uy',      totalFacturado: 284200, pendiente: 0,      avgDaysToPay: 12, riskScore: 92, invoiceCount: 4,  lastActivity: '2025-04-30' },
      { id: 'c2',  name: 'Construcciones del Sur',    rut: '21.345.678-9', phone: '+598 99 222 002', email: 'admin@constsur.uy',         totalFacturado: 98600,  pendiente: 38900,  avgDaysToPay: 28, riskScore: 61, invoiceCount: 3,  lastActivity: '2025-05-20' },
      { id: 'c3',  name: 'Farmacia Fénix',            rut: '21.456.789-0', phone: '+598 99 333 003', email: 'contabilidad@fenix.uy',     totalFacturado: 67400,  pendiente: 12400,  avgDaysToPay: 21, riskScore: 74, invoiceCount: 5,  lastActivity: '2025-05-20' },
      { id: 'c4',  name: 'Estudio García & Asoc.',    rut: '21.567.890-1', phone: '+598 99 444 004', email: 'garcia@estudiogarcia.uy',   totalFacturado: 54800,  pendiente: 24700,  avgDaysToPay: 45, riskScore: 32, invoiceCount: 2,  lastActivity: '2025-05-15' },
      { id: 'c5',  name: 'Logística Río Negro',       rut: '21.678.901-2', phone: '+598 99 555 005', email: 'finanzas@logrnegro.uy',     totalFacturado: 198400, pendiente: 67300,  avgDaysToPay: 18, riskScore: 78, invoiceCount: 6,  lastActivity: '2025-05-12' },
      { id: 'c6',  name: 'Clínica Santa Elena',       rut: '21.789.012-3', phone: '+598 99 666 006', email: 'admin@santaelena.uy',       totalFacturado: 112300, pendiente: 0,      avgDaysToPay: 9,  riskScore: 96, invoiceCount: 7,  lastActivity: '2025-05-15' },
      { id: 'c7',  name: 'Agro San José SRL',         rut: '21.890.123-4', phone: '+598 99 777 007', email: 'cuentas@agrosanjose.uy',    totalFacturado: 178900, pendiente: 55100,  avgDaysToPay: 35, riskScore: 48, invoiceCount: 5,  lastActivity: '2025-05-20' },
      { id: 'c8',  name: 'Tech Solutions UY',         rut: '21.901.234-5', phone: '+598 99 888 008', email: 'info@techsolutions.uy',     totalFacturado: 9800,   pendiente: 9800,   avgDaysToPay: 0,  riskScore: 22, invoiceCount: 1,  lastActivity: '2025-05-18' },
      { id: 'c9',  name: 'Importadora Del Plata',     rut: '22.012.345-6', phone: '+598 99 999 009', email: 'pagos@delplata.uy',         totalFacturado: 387000, pendiente: 142000, avgDaysToPay: 22, riskScore: 69, invoiceCount: 8,  lastActivity: '2025-05-18' },
      { id: 'c10', name: 'Veterinaria El Campo',      rut: '22.123.456-7', phone: '+598 98 100 010', email: 'admin@elcampo.uy',          totalFacturado: 34200,  pendiente: 0,      avgDaysToPay: 8,  riskScore: 98, invoiceCount: 6,  lastActivity: '2025-05-20' },
      { id: 'c11', name: 'Distribuidora Norte',       rut: '22.234.567-8', phone: '+598 98 200 011', email: 'finanzas@distnorte.uy',     totalFacturado: 121400, pendiente: 33400,  avgDaysToPay: 19, riskScore: 83, invoiceCount: 4,  lastActivity: '2025-05-22' },
      { id: 'c12', name: 'Consultora RH Partners',   rut: '22.345.678-9', phone: '+598 98 300 012', email: 'administracion@rhpartners.uy',totalFacturado: 58700, pendiente: 21000,  avgDaysToPay: 16, riskScore: 85, invoiceCount: 3,  lastActivity: '2025-05-20' },
    ]
  },

  // Conversaciones de WhatsApp por clientId
  async getConversations(clientId) {
    await delay(400)
    const all = {
      c2: {
        clientId: 'c2', client: 'Construcciones del Sur', phone: '+598 99 222 002',
        invoiceId: 'CFE-2025-002', invoiceAmount: 38900,
        messages: [
          { id: 1, from: 'agent', ts: '2025-05-18T10:00:00', text: 'Hola! Le escribimos de García & Asociados. Le recordamos que la factura CFE-2025-002 por $U 38.900 vence el 5 de mayo. ¿Necesita información adicional para gestionar el pago?', status: 'read' },
          { id: 2, from: 'client', ts: '2025-05-18T11:23:00', text: 'Sí, la tenemos registrada. Esta semana la procesamos.' },
          { id: 3, from: 'agent', ts: '2025-05-18T11:24:00', text: 'Perfecto, muchas gracias. Le confirmo que puede transferir al número de cuenta 001-234567/89 (BROU). Ante cualquier consulta quedo a disposición.', status: 'read' },
          { id: 4, from: 'client', ts: '2025-05-19T09:15:00', text: 'Tuvimos un contratiempo, la pagamos la semana que viene.' },
          { id: 5, from: 'agent', ts: '2025-05-19T09:16:00', text: 'Entendido, no hay problema. ¿Le parece bien confirmar el pago para el lunes 26 de mayo?', status: 'read' },
          { id: 6, from: 'client', ts: '2025-05-19T10:02:00', text: 'Si, el lunes.' },
          { id: 7, from: 'agent', ts: '2025-05-20T14:22:00', text: 'Buenos días! Le recuerdo el compromiso de pago de hoy lunes. Ante cualquier inconveniente no dude en avisarnos.', status: 'delivered' },
        ]
      },
      c3: {
        clientId: 'c3', client: 'Farmacia Fénix', phone: '+598 99 333 003',
        invoiceId: 'CFE-2025-003', invoiceAmount: 12400,
        messages: [
          { id: 1, from: 'agent', ts: '2025-05-15T09:00:00', text: 'Hola Farmacia Fénix! Les escribimos de García & Asociados. Tenemos pendiente la factura CFE-2025-003 por $U 12.400, con vencimiento el 10 de mayo. ¿Cómo podemos ayudarlos a gestionar el pago?', status: 'read' },
          { id: 2, from: 'client', ts: '2025-05-15T10:45:00', text: 'Hola. Estamos con la caja ajustada este mes. ¿Pueden esperar un poco?' },
          { id: 3, from: 'agent', ts: '2025-05-15T10:46:00', text: 'Claro, lo entendemos. Podríamos ofrecerles un plan de pago en cuotas para facilitarlo. Por ejemplo, 3 cuotas de $U 4.134 en los próximos 3 meses. ¿Les sería útil?', status: 'read' },
          { id: 4, from: 'client', ts: '2025-05-15T11:30:00', text: 'Suena bien, lo consulto con el dueño y le aviso.' },
          { id: 5, from: 'agent', ts: '2025-05-16T09:00:00', text: 'Buenos días! ¿Pudieron evaluar la propuesta de cuotas?', status: 'read' },
          { id: 6, from: 'client', ts: '2025-05-16T14:22:00', text: 'Si, aceptamos el plan. ¿Cómo lo formalizamos?' },
          { id: 7, from: 'agent', ts: '2025-05-16T14:23:00', text: 'Excelente! Le enviamos el acuerdo por correo a contabilidad@fenix.uy para su firma. Primera cuota: $U 4.134 el 1 de junio.', status: 'read' },
          { id: 8, from: 'agent', ts: '2025-05-20T14:38:00', text: 'Recordatorio: primer cuota del plan de pago el 1 de junio por $U 4.134. ¿Todo en orden?', status: 'delivered' },
        ]
      },
      c7: {
        clientId: 'c7', client: 'Agro San José SRL', phone: '+598 99 777 007',
        invoiceId: 'CFE-2025-007', invoiceAmount: 55100,
        messages: [
          { id: 1, from: 'agent', ts: '2025-05-13T09:00:00', text: 'Buen día Agro San José! Le escribimos por la factura CFE-2025-007 ($U 55.100), que vence en menos de una semana. ¿Está todo encaminado para el pago?', status: 'read' },
          { id: 2, from: 'client', ts: '2025-05-14T11:10:00', text: 'Si, esta semana la mandamos.' },
          { id: 3, from: 'agent', ts: '2025-05-19T09:00:00', text: 'Hola! La factura CFE-2025-007 venció ayer. ¿Pudieron procesar el pago?', status: 'read' },
          { id: 4, from: 'client', ts: '2025-05-19T15:30:00', text: 'Disculpe, se nos pasó. Esta semana sin falta.' },
          { id: 5, from: 'agent', ts: '2025-05-20T13:45:00', text: 'Entendido. ¿Pueden confirmar fecha exacta para registrarla? Necesitamos coordinar con el área contable.', status: 'sent' },
        ]
      },
      c10: {
        clientId: 'c10', client: 'Veterinaria El Campo', phone: '+598 98 100 010',
        invoiceId: 'CFE-2025-010', invoiceAmount: 7600,
        messages: [
          { id: 1, from: 'agent', ts: '2025-05-19T10:00:00', text: 'Hola! Recordatorio de la factura CFE-2025-010 por $U 7.600, vence mañana 20 de mayo.', status: 'read' },
          { id: 2, from: 'client', ts: '2025-05-19T10:30:00', text: 'Ya la pagamos hoy, fijate el comprobante.' },
          { id: 3, from: 'agent', ts: '2025-05-19T10:31:00', text: 'Confirmado, muchas gracias! Vamos a registrar el pago. Que tengan buen día.', status: 'read' },
        ]
      },
    }
    if (clientId) return all[clientId] ?? null
    // Devuelve todas las conversaciones (para la página Agente IA)
    return Object.values(all)
  },

  async getAgentConfig() {
    await delay(300)
    return {
      enabled: true,
      whatsappNumber: '+598 99 123 456',
      tone: 'profesional',
      firstReminderDays: 3,
      followUpDays: 5,
      maxFollowUps: 3,
      offerPaymentPlan: true,
      paymentPlanInstallments: 3,
      escalateAfterDays: 15,
      channels: { whatsapp: true, email: false },
      workingHours: { from: '09:00', to: '18:00' },
      signature: 'García & Asociados | +598 99 123 456',
    }
  },

  async saveAgentConfig(config) {
    await delay(400)
    return { ok: true }
  },

  // Acciones (en real → POST /api/invoices/:id/action)
  async markPaid(invoiceId)     { await delay(400); return { ok: true } },
  async sendReminder(invoiceId) { await delay(600); return { ok: true } },
  async activateAI(invoiceId)   { await delay(500); return { ok: true } },
}
