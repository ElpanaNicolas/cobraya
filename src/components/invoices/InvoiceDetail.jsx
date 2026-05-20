import { useState } from 'react'
import { fmt, fmtDate, STATUS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ChatView } from './ChatView'

export function InvoiceDetail({ invoice: inv, onClose, onAction }) {
  const [tab, setTab]     = useState('detalle')
  const [acting, setActing] = useState(null)

  const act = async (type) => {
    setActing(type)
    await onAction(type)
    setActing(null)
  }

  const tabs = [
    { id: 'detalle', label: 'Detalle' },
    { id: 'chats',   label: inv.channel === 'whatsapp' ? '💬 Chats' : 'Chats' },
  ]

  return (
    <div className="fade-up" style={{
      borderTop: '1px solid var(--border)',
      background: 'rgba(45,158,95,0.03)',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        gap: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700,
            color: tab === t.id ? 'var(--green-l)' : 'var(--muted)',
            borderBottom: tab === t.id ? '2px solid var(--green-l)' : '2px solid transparent',
            marginBottom: -1,
            transition: 'all .15s',
            letterSpacing: '.03em',
          }}>{t.label}</button>
        ))}
        <button onClick={onClose} style={{
          marginLeft: 'auto',
          background: 'none', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '8px 4px',
        }}>✕</button>
      </div>

      {/* Tab: Detalle */}
      {tab === 'detalle' && (
        <div style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1.5fr',
          gap: 24, alignItems: 'start',
        }}>
          {/* Client */}
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 6 }}>Cliente</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15 }}>{inv.client}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>RUT {inv.rut}</div>
            <div style={{ fontSize: 10, color: 'var(--muted2)', fontStyle: 'italic', marginTop: 1 }}>{inv.cfeId ?? inv.id}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Emisión: <span style={{ color: 'var(--white)' }}>{fmtDate(inv.issued)}</span></div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Vence: <span style={{ color: 'var(--white)' }}>{fmtDate(inv.due)}</span></div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 6 }}>Monto</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>{fmt(inv.amount)}</div>
            <div style={{ marginTop: 8 }}><Badge status={inv.status} /></div>
          </div>

          {/* AI Note + Actions */}
          <div>
            {inv.aiNote && (
              <div style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 12,
                background: 'rgba(155,140,255,0.08)', border: '1px solid rgba(155,140,255,0.25)',
                fontSize: 10, color: 'var(--muted)', lineHeight: 1.5,
              }}>
                <span style={{ color: 'var(--purple)', fontWeight: 700, fontFamily: 'var(--font-ui)' }}>🤖 IA: </span>
                {inv.aiNote}
              </div>
            )}
            {inv.status !== 'paid' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Button size="sm" onClick={() => act('paid')} disabled={!!acting}>
                  {acting === 'paid' ? '…' : '✓ Marcar pagada'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => act('reminder')} disabled={!!acting}>
                  {acting === 'reminder' ? '…' : '📲 Recordatorio'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => act('ai')} disabled={!!acting}>
                  {acting === 'ai' ? '…' : '🤖 Activar IA'}
                </Button>
              </div>
            )}
            {inv.status === 'paid' && (
              <div style={{ fontSize: 11, color: '#4caf7d', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
                ✓ Factura cobrada
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Chats */}
      {tab === 'chats' && (
        <ChatView clientId={inv.clientId} invoiceId={inv.id} />
      )}
    </div>
  )
}
