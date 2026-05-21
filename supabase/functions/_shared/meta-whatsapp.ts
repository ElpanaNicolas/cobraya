// Helper para enviar mensajes y descargar media via WhatsApp Cloud API (Meta)
// Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api

const GRAPH_URL = 'https://graph.facebook.com/v19.0'

// Envía un mensaje de texto
export async function sendMetaWhatsApp(
  to: string,
  body: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<void> {
  const phone = to.replace('whatsapp:', '').replace('+', '')

  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type:    'individual',
      to:                phone,
      type:              'text',
      text:              { body, preview_url: false },
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Meta WA error: ${JSON.stringify(data.error ?? data)}`)
}

// Descarga una imagen de Meta (necesita access token) y la devuelve en base64
export async function fetchMetaImageAsBase64(
  mediaId: string,
  accessToken: string,
): Promise<{ data: string; media_type: string } | null> {
  try {
    // 1. Obtener URL de descarga
    const metaRes = await fetch(`${GRAPH_URL}/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const metaData = await metaRes.json()
    if (!metaData.url) return null

    // 2. Descargar la imagen
    const imgRes = await fetch(metaData.url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!imgRes.ok) return null

    const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
    const buffer      = await imgRes.arrayBuffer()
    const bytes       = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return { data: btoa(binary), media_type: contentType.split(';')[0] }
  } catch {
    return null
  }
}
