// Helper para enviar emails via Resend API
// Documentación: https://resend.com/docs/api-reference/emails/send-email

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

export interface EmailPayload {
  to:      string
  subject: string
  html:    string
  from?:   string   // default: onboarding@resend.dev (solo para testing sin dominio propio)
  replyTo?: string
}

export async function sendEmail({ to, subject, html, from, replyTo }: EmailPayload) {
  const fromAddress = from ?? 'Cobraya <onboarding@resend.dev>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:     fromAddress,
      to:       [to],
      subject,
      html,
      ...(replyTo && { reply_to: replyTo }),
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Resend error: ${data.message ?? JSON.stringify(data)}`)
  return data
}

// Genera el HTML del email de recordatorio de cobro
export function reminderEmailHtml({
  clientName,
  company,
  cfeId,
  amount,
  due,
  messageBody,
}: {
  clientName:  string
  company:     string
  cfeId:       string
  amount:      number
  due:         string
  messageBody: string
}): string {
  const amountFmt = amount.toLocaleString('es-UY')
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr>
          <td style="background:#111;padding:20px 32px">
            <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.5px">${company}</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;color:#111;font-size:15px">Estimado/a <strong>${clientName}</strong>,</p>
            <p style="margin:0 0 24px;color:#444;font-size:14px;line-height:1.6">${messageBody.replace(/\n/g, '<br>')}</p>

            <!-- Invoice card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:16px 20px">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.06em">Factura</td>
                      <td align="right" style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.06em">Vencimiento</td>
                    </tr>
                    <tr>
                      <td style="color:#111;font-size:15px;font-weight:600;padding-top:4px">${cfeId}</td>
                      <td align="right" style="color:#111;font-size:15px;font-weight:600;padding-top:4px">${due}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top:12px;border-top:1px solid #e5e5e5;margin-top:12px"></td>
                    </tr>
                    <tr>
                      <td style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.06em">Importe</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td style="color:#111;font-size:20px;font-weight:700;padding-top:4px">$${amountFmt} <span style="font-size:13px;font-weight:400;color:#888">UYU</span></td>
                      <td></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#888;font-size:12px">Si ya realizó el pago, por favor ignorá este mensaje. Ante cualquier consulta no dudes en responder este email.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #e5e5e5">
            <p style="margin:0;color:#aaa;font-size:11px">Este mensaje fue enviado por ${company} a través de Cobraya.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
