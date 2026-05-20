import { useState } from 'react'
import { api } from '@/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const EMPTY = { name: '', rut: '', phone: '', email: '' }

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

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
        borderRadius: 6, padding: '9px 12px', color: 'var(--white)',
        fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
      }} />
  )
}

export function NuevoClienteModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.rut) return
    setLoading(true)
    setError(null)
    try {
      const client = await api.createClient(form)
      onCreated(client)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Razón social" required>
            <Input value={form.name} onChange={set('name')} placeholder="Empresa S.A." />
          </Field>

          <Field label="RUT" required>
            <Input value={form.rut} onChange={set('rut')} placeholder="21.234.567-8" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="WhatsApp / Teléfono">
              <Input value={form.phone} onChange={set('phone')} placeholder="+598 99 000 000" />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={set('email')} placeholder="pagos@empresa.com" type="email" />
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
          <Button type="submit" disabled={loading || !form.name || !form.rut}>
            {loading ? 'Guardando…' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
