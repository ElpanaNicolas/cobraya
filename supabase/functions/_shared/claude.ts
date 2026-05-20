const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

// Soporta texto plano o contenido multimodal (texto + imágenes)
type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

export async function callClaude(
  system: string,
  messages: Message[],
  maxTokens = 300,
  model = 'claude-haiku-4-5'
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Claude error: ${data.error?.message}`)
  return data.content?.[0]?.text ?? ''
}

// Descarga una imagen de Twilio (requiere auth) y la convierte a base64
export async function fetchTwilioImageAsBase64(
  mediaUrl: string,
  twilioSid: string,
  twilioToken: string
): Promise<{ data: string; media_type: string } | null> {
  try {
    const res = await fetch(mediaUrl, {
      headers: {
        Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
      },
    })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const buffer      = await res.arrayBuffer()
    const bytes       = new Uint8Array(buffer)
    // btoa solo maneja chars <= 255, lo hacemos chunk a chunk
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return { data: btoa(binary), media_type: contentType.split(';')[0] }
  } catch {
    return null
  }
}

// Detecta si un mensaje (texto o imagen) es un comprobante de pago uruguayo.
// Retorna { isPayment, amount, bank, reference } como JSON parseado.
export async function detectPaymentReceipt(
  textBody: string,
  imageBase64: { data: string; media_type: string } | null
): Promise<{ isPayment: boolean; amount?: number; bank?: string; reference?: string }> {

  const contentBlocks: ContentBlock[] = []

  if (imageBase64) {
    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: imageBase64.media_type, data: imageBase64.data },
    })
  }

  contentBlocks.push({
    type: 'text',
    text: imageBase64
      ? `El cliente envió esta imagen. ¿Es un comprobante de transferencia o pago bancario? Texto adjunto: "${textBody}"`
      : `El cliente envió este mensaje: "${textBody}". ¿Es un comprobante o confirmación de pago?`,
  })

  const system = `Sos un asistente que detecta comprobantes de pago en Uruguay.
Los bancos uruguayos incluyen: BROU, Itaú, Santander, Scotiabank, HSBC, OCA, Mercado Pago, Prex, Abitab, RedPagos.
Los comprobantes pueden ser capturas de pantalla de apps bancarias, PDFs o texto con detalles de transferencia.
Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, con este formato exacto:
{"isPayment": true/false, "amount": número_o_null, "bank": "nombre_o_null", "reference": "número_o_null"}`

  try {
    const raw = await callClaude(system, [{ role: 'user', content: contentBlocks }], 150, 'claude-haiku-4-5')
    // Extraer JSON aunque venga con texto alrededor
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return { isPayment: false }
    return JSON.parse(match[0])
  } catch {
    return { isPayment: false }
  }
}
