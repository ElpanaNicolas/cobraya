import { useApi } from '@/hooks/useApi'
import { api } from '@/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCallback } from 'react'

const STATUS_ICON = { sent: '✓', delivered: '✓✓', read: '✓✓' }

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
}

function fmtDay(ts) {
  return new Date(ts).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function groupByDay(messages) {
  const groups = []
  let currentDay = null
  for (const msg of messages) {
    const day = msg.ts.slice(0, 10)
    if (day !== currentDay) {
      groups.push({ type: 'day', day, label: fmtDay(msg.ts) })
      currentDay = day
    }
    groups.push({ type: 'msg', ...msg })
  }
  return groups
}

export function ChatView({ clientId, invoiceId }) {
  const fetcher = useCallback(() => api.getConversations(clientId), [clientId])
  const { data: conv, loading } = useApi(fetcher)

  if (loading) {
    return (
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
            <Skeleton h={44} w={220 + i * 20} style={{ borderRadius: 12 }} />
          </div>
        ))}
      </div>
    )
  }

  if (!conv) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
        <div>Sin conversaciones registradas</div>
        <div style={{ fontSize: 10, marginTop: 4, color: 'var(--muted2)' }}>
          El agente aún no inició contacto por WhatsApp para esta factura
        </div>
      </div>
    )
  }

  const items = groupByDay(conv.messages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header WhatsApp */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(37,211,102,0.06)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(37,211,102,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15,
        }}>📲</div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12 }}>{conv.client}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{conv.phone} · WhatsApp</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {conv.messages.length} mensajes
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 4,
        background: 'rgba(0,0,0,0.15)',
        maxHeight: 360,
      }}>
        {items.map((item, i) => {
          if (item.type === 'day') {
            return (
              <div key={`day-${i}`} style={{ textAlign: 'center', margin: '8px 0' }}>
                <span style={{
                  fontSize: 9, color: 'var(--muted2)', fontFamily: 'var(--font-ui)',
                  background: 'var(--surface2)', padding: '2px 10px', borderRadius: 100,
                  letterSpacing: '.05em',
                }}>{item.label}</span>
              </div>
            )
          }

          const isAgent = item.from === 'agent'
          return (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: isAgent ? 'flex-end' : 'flex-start',
              marginBottom: 2,
            }}>
              <div style={{
                maxWidth: '72%',
                padding: '8px 12px',
                borderRadius: isAgent ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isAgent ? 'rgba(37,211,102,0.15)' : 'var(--surface2)',
                border: `1px solid ${isAgent ? 'rgba(37,211,102,0.25)' : 'var(--border)'}`,
                position: 'relative',
              }}>
                {isAgent && (
                  <div style={{ fontSize: 9, color: 'rgba(37,211,102,0.8)', fontFamily: 'var(--font-ui)', fontWeight: 700, marginBottom: 3 }}>
                    🤖 Agente IA
                  </div>
                )}
                <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--white)' }}>{item.text}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--muted2)' }}>{fmtTime(item.ts)}</span>
                  {isAgent && (
                    <span style={{
                      fontSize: 9,
                      color: item.status === 'read' ? '#53bdeb' : 'var(--muted2)',
                    }}>{STATUS_ICON[item.status] ?? '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer info */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        fontSize: 10, color: 'var(--muted2)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 12 }}>🔒</span>
        Los mensajes son enviados desde tu número de WhatsApp registrado
      </div>
    </div>
  )
}
