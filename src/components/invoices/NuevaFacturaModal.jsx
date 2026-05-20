import { useState, useCallback } from 'react'
import { api } from '@/api'
import { useApi } from '@/hooks/useApi'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { NuevoClienteModal } from '@/components/clientes/NuevoClienteModal'

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 5,
      }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
  borderRadius: 6, padding: '9px 12px', color: 'var(--white)',
  fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
function addDays(n) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function nextCfe(invoices) {
  if (!invoices?.length) return `CFE-${new Date().getFullYear()}-001`
  const nums = invoices
    .map(i => parseInt((i.cfeId || i.id || '').split('-').pop()))
    .filter(n => !isNaN(n))
  const next = (Math.max(0, ...nums) + 1).toString().padStart(3, '0')
  return `CFE-${new Date().getFullYear()}-${next}`
}

export function NuevaFacturaModal({ onClose, onCreated }) {
  const { data: clients, refetch: refetchClients } = useApi(useCallback(() => api.getClients(), []))
  const { data: invoices } = useApi(useCallback(() => api.getInvoices(), []))

  const [form, setForm] = useState({
    clientId: '',
    cfeId:    '',
    amount:   '',
    issued:   today(),
    due:      addDays(30),
    channel:  'whatsapp',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [showNewClient, setShowNewClient] = useState(false)

  // Auto-generar CFE ID cuando llegan las facturas
  if (invoices && !form.cfeId) {
    setForm(f => ({ ...f, cfeId: nextCfe(invoices) }))
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientId || !form.amount || !form.cfeId) return
    setLoading(true)
    setError(null)
    try {
      const inv = await api.createInvoice({
        clientId: form.clientId,
        cfeId:    form.cfeId,
        amount:   parseFloat(form.amount),
        issued:   form.issued,
        due:      form.due,
        channel:  form.channel || null,
      })
      onCreated(inv)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = form.clientId && form.amount && form.cfeId && !loading

  return (
    <>
      <Modal title="Nueva factura" onClose={onClose} width={520}>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Cliente */}
            <Field label="Cliente" required>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={form.clientId}
                  onChange={set('clientId')}
                  style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                >
                  <option value="">Seleccioná un cliente…</option>
                  {(clients ?? []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewClient(true)}>
                  + Nuevo
                </Button>
              </div>
            </Field>

            {/* CFE ID y monto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Número CFE" required>
                <input value={form.cfeId} onChange={set('cfeId')} style={inputStyle} placeholder="CFE-2025-001" />
              </Field>
              <Field label="Monto (UYU)" required>
                <input type="number" value={form.amount} onChange={set('amount')} style={inputStyle} placeholder="0" min="0" step="1" />
              </Field>
            </div>

            {/* Fechas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Fecha de emisión" required>
                <input type="date" value={form.issued} onChange={set('issued')} style={inputStyle} />
              </Field>
              <Field label="Fecha de vencimiento" required>
                <input type="date" value={form.due} onChange={set('due')} style={inputStyle} />
              </Field>
            </div>

            {/* Canal */}
            <Field label="Canal de cobro">
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'whatsapp', label: '📲 WhatsApp' },
                  { id: 'email',    label: '📧 Email' },
                  { id: '',         label: 'Sin canal' },
                ].map(opt => (
                  <button
                    key={opt.id} type="button"
                    onClick={() => setForm(f => ({ ...f, channel: opt.id }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer',
                      fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700,
                      background: form.channel === opt.id ? 'rgba(45,158,95,0.12)' : 'var(--surface2)',
                      border: `1px solid ${form.channel === opt.id ? 'var(--green-l)' : 'var(--border)'}`,
                      color: form.channel === opt.id ? 'var(--green-l)' : 'var(--muted)',
                      transition: 'all .15s',
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </Field>

            {error && (
              <div style={{
                padding: '9px 12px', background: 'rgba(224,96,96,0.1)',
                border: '1px solid rgba(224,96,96,0.3)', borderRadius: 6,
                fontSize: 11, color: 'var(--red)',
              }}>{error}</div>
            )}
          </div>

          <div style={{
            padding: '14px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}>
            <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
            <Button type="submit" disabled={!canSubmit}>
              {loading ? 'Guardando…' : 'Crear factura'}
            </Button>
          </div>
        </form>
      </Modal>

      {showNewClient && (
        <NuevoClienteModal
          onClose={() => setShowNewClient(false)}
          onCreated={(client) => {
            refetchClients()
            setForm(f => ({ ...f, clientId: client.id }))
          }}
        />
      )}
    </>
  )
}
