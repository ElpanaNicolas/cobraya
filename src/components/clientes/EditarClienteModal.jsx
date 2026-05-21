import { useState } from 'react'
import { api } from '@/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

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

export function EditarClienteModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:  client.name  ?? '',
    rut:   client.rut   ?? '',
    phone: client.phone ?? '',
    email: client.email ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError(null)
    try {
      await api.updateClient(client.id, form)
      toast.success('Cliente actualizado')
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Editar cliente" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Razón social" required>
            <input type="text" value={form.name} onChange={set('name')}
              placeholder="Empresa S.A." style={inputStyle} />
          </Field>
          <Field label="RUT">
            <input type="text" value={form.rut} onChange={set('rut')}
              placeholder="21.234.567-8" style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="WhatsApp / Teléfono">
              <input type="text" value={form.phone} onChange={set('phone')}
                placeholder="+598 99 000 000" style={inputStyle} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="pagos@empresa.com" style={inputStyle} />
            </Field>
          </div>
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
          <Button type="submit" disabled={loading || !form.name.trim()}>
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
