// upload-receipt
// El cliente sube una foto del comprobante desde la página de pago.
// Analiza la imagen con Claude, y si es un pago válido marca la factura como pagada.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { detectPaymentReceipt } from '../_shared/claude.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const formData  = await req.formData()
    const invoiceId = formData.get('invoiceId') as string
    const file      = formData.get('file') as File

    if (!invoiceId || !file) return json({ error: 'invoiceId y file son requeridos' }, 400)

    // Verificar que la factura existe y no está pagada
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, cfe_id, status, profile_id, clients(name)')
      .eq('id', invoiceId)
      .single()

    if (!invoice)              return json({ error: 'Factura no encontrada' }, 404)
    if (invoice.status === 'paid') return json({ ok: true, alreadyPaid: true })

    // Convertir imagen a base64 para Claude
    const buffer  = await file.arrayBuffer()
    const bytes   = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    const base64     = btoa(binary)
    const mediaType  = file.type || 'image/jpeg'

    // Analizar con Claude
    const detection = await detectPaymentReceipt('', { data: base64, media_type: mediaType })

    if (!detection.isPayment) {
      return json({
        ok:        false,
        detected:  false,
        message:   'No pudimos confirmar que sea un comprobante de pago. Por favor subí una imagen clara de la transferencia.',
      })
    }

    // Subir imagen al bucket de Supabase Storage
    const fileName = `${invoiceId}/${Date.now()}.jpg`
    await supabase.storage
      .from('receipts')
      .upload(fileName, file, { contentType: mediaType, upsert: true })

    // Marcar factura como pagada
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId)

    const { data: profile } = await supabase
      .from('profiles')
      .select('company')
      .eq('id', invoice.profile_id)
      .single()

    console.log(`✓ Comprobante web aceptado: factura ${invoice.cfe_id} → pagada`)

    return json({
      ok:       true,
      detected: true,
      amount:   detection.amount,
      bank:     detection.bank,
      message:  `¡Gracias! Registramos tu pago${detection.amount ? ` de $${detection.amount.toLocaleString('es-UY')} UYU` : ''}. ${profile?.company ?? 'El negocio'} recibirá la confirmación.`,
    })

  } catch (err) {
    console.error('upload-receipt error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
