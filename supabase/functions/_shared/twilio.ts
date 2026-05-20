const ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!
const WA_NUMBER   = Deno.env.get('TWILIO_WHATSAPP_NUMBER')!

export async function sendWhatsApp(to: string, body: string) {
  // Normalizar número: asegurar formato whatsapp:+XXXX
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${WA_NUMBER}`,
        To:   toFormatted,
        Body: body,
      }),
    }
  )

  const data = await res.json()
  if (!res.ok) throw new Error(`Twilio error: ${data.message}`)
  return data
}
