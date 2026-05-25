// send-invitation
// Envía un email de invitación para unirse al equipo de una empresa en Cobraya.
//
// Body: { email, company, token, role }
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
    console.log('RESEND_API_KEY no configurada — omitiendo email de invitación')
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const body    = await req.json().catch(() => ({}))
  const email   = body.email   as string
  const company = body.company as string | undefined
  const token   = body.token   as string
  const role    = body.role    as string | undefined

  if (!email || !token) {
    return new Response(JSON.stringify({ ok: false, error: 'email y token requeridos' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const companyName = company?.trim() || 'Cobraya'
  const roleLabel   = role === 'admin' ? 'Administrador' : 'Miembro'
  const acceptUrl   = `https://cobraya.app/unirse?token=${token}`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invitación al equipo de ${companyName}</title>
</head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0"
          style="background:#161616;border-radius:14px;overflow:hidden;border:1px solid #2a2a2a">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:24px 32px;border-bottom:1px solid #222">
              <span style="font-size:24px;font-weight:800;letter-spacing:-0.04em;color:#ffffff">
                cobra<span style="color:#2d9e5f">ya</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px">
              <div style="font-size:38px;margin-bottom:16px">👥</div>
              <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em">
                Te invitaron al equipo de ${companyName}
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#aaa;line-height:1.6">
                Tenés una invitación para unirte como <strong style="color:#fff">${roleLabel}</strong>.
                Al aceptar, vas a poder ver y gestionar las facturas y clientes de ${companyName}.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}"
                      style="display:inline-block;padding:14px 36px;
                        background:#2d9e5f;color:#ffffff;
                        text-decoration:none;border-radius:8px;
                        font-weight:700;font-size:15px;letter-spacing:.02em">
                      Aceptar invitación →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;color:#555;line-height:1.6">
                O copiá este link en tu navegador:
              </p>
              <div style="padding:10px 14px;background:#1e1e1e;border-radius:7px;border:1px solid #2a2a2a;
                font-size:12px;color:#888;word-break:break-all;font-family:monospace">
                ${acceptUrl}
              </div>

              <p style="margin:20px 0 0;font-size:12px;color:#555;line-height:1.6">
                Esta invitación vence en 7 días. Si no la esperabas, ignorá este email.
              </p>

              <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0 16px" />
              <p style="margin:0;font-size:11px;color:#444;line-height:1.5">
                Enviado por <a href="https://cobraya.app" style="color:#2d9e5f;text-decoration:none">Cobraya</a>
                — plataforma de cobros inteligentes para PYMEs uruguayas
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
        from:    'Cobraya <onboarding@resend.dev>',
        to:      [email],
        subject: `Te invitaron al equipo de ${companyName} en Cobraya`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ ok: false, error: err }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    console.log(`📧 Invitación enviada a ${email}`)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Error en send-invitation:', e)
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
