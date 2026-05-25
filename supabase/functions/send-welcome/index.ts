// send-welcome
// Envía un email de bienvenida al registrarse en Cobraya.
//
// Invocar desde el cliente tras el signUp exitoso:
//   supabase.functions.invoke('send-welcome', { body: { email, company } })
//
// Requiere: RESEND_API_KEY en los secrets de Supabase.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    console.log('RESEND_API_KEY no configurada — omitiendo email de bienvenida')
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json().catch(() => ({}))
  const email   = body.email   as string | undefined
  const company = body.company as string | undefined

  if (!email) {
    return new Response(JSON.stringify({ ok: false, error: 'email requerido' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const companyName = company?.trim() || 'tu empresa'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bienvenido a Cobraya</title>
</head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#161616;border-radius:14px;overflow:hidden;border:1px solid #2a2a2a">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:28px 36px;border-bottom:1px solid #222">
              <span style="font-size:26px;font-weight:800;letter-spacing:-0.04em;color:#ffffff">
                cobra<span style="color:#2d9e5f">ya</span>
              </span>
              <span style="display:inline-block;margin-left:10px;font-size:11px;font-weight:700;
                background:rgba(45,158,95,0.15);color:#2d9e5f;
                border:1px solid rgba(45,158,95,0.3);border-radius:20px;padding:2px 9px;
                vertical-align:middle;letter-spacing:.06em">
                BIENVENIDO
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.02em">
                ¡Hola, ${companyName}! 👋
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#aaa;line-height:1.65">
                Tu cuenta en Cobraya está lista. Ahora podés cobrar lo que te deben
                sin perseguir a tus clientes — el agente IA lo hace por vos.
              </p>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
                <tr>
                  <td style="padding:14px 18px;background:#1e1e1e;border-radius:10px;border:1px solid #2a2a2a;margin-bottom:10px">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="padding-right:14px">
                          <div style="width:34px;height:34px;border-radius:50%;background:rgba(45,158,95,0.15);
                            border:1px solid rgba(45,158,95,0.3);text-align:center;line-height:34px;font-size:16px">
                            1️⃣
                          </div>
                        </td>
                        <td>
                          <div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:3px">
                            Configurá WhatsApp
                          </div>
                          <div style="font-size:12px;color:#888;line-height:1.4">
                            Conectá tu número de Twilio o Meta para que el agente envíe mensajes.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td height="8"></td></tr>
                <tr>
                  <td style="padding:14px 18px;background:#1e1e1e;border-radius:10px;border:1px solid #2a2a2a">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="padding-right:14px">
                          <div style="width:34px;height:34px;border-radius:50%;background:rgba(45,158,95,0.15);
                            border:1px solid rgba(45,158,95,0.3);text-align:center;line-height:34px;font-size:16px">
                            2️⃣
                          </div>
                        </td>
                        <td>
                          <div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:3px">
                            Agregá tus clientes
                          </div>
                          <div style="font-size:12px;color:#888;line-height:1.4">
                            Importá desde Excel o cargá uno a uno con nombre, RUT y teléfono.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td height="8"></td></tr>
                <tr>
                  <td style="padding:14px 18px;background:#1e1e1e;border-radius:10px;border:1px solid #2a2a2a">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="padding-right:14px">
                          <div style="width:34px;height:34px;border-radius:50%;background:rgba(45,158,95,0.15);
                            border:1px solid rgba(45,158,95,0.3);text-align:center;line-height:34px;font-size:16px">
                            3️⃣
                          </div>
                        </td>
                        <td>
                          <div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:3px">
                            Creá tu primera factura
                          </div>
                          <div style="font-size:12px;color:#888;line-height:1.4">
                            El agente empieza a enviar recordatorios automáticamente al vencimiento.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
                <tr>
                  <td align="center">
                    <a href="https://cobraya.app"
                      style="display:inline-block;padding:14px 36px;
                        background:#2d9e5f;color:#ffffff;
                        text-decoration:none;border-radius:8px;
                        font-weight:700;font-size:14px;letter-spacing:.02em">
                      Abrir Cobraya →
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #2a2a2a;margin:0 0 20px" />
              <p style="margin:0;font-size:12px;color:#555;line-height:1.6">
                ¿Tenés dudas? Respondé este email y te ayudamos.
                <br />— El equipo de Cobraya
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Cobraya <hola@cobraya.app>',
        to:      [email],
        subject: '¡Bienvenido a Cobraya! 🎉 Tres pasos para empezar',
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ ok: false, error: err }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    console.log(`📧 Email de bienvenida enviado a ${email}`)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Error en send-welcome:', e)
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
