import { useEffect, useRef, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { api } from '@/api'
import { Skeleton } from '@/components/ui/Skeleton'

const TYPE_COLOR = {
  negotiation: 'var(--purple)',
  reminder:    'var(--green-l)',
  insight:     'var(--amber)',
  alert:       'var(--red)',
  scheduled:   'var(--blue)',
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (diff < 1)   return 'ahora'
  if (diff < 60)  return `hace ${diff}m`
  if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`
  return `hace ${Math.floor(diff / 1440)}d`
}

export function NotificationsPanel({ onClose }) {
  const ref = useRef(null)
  const { data, loading } = useApi(useCallback(() => api.getActivity(), []))

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="fade-up" style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: 340, zIndex: 100,
      background: 'var(--surface)', border: '1px solid var(--border2)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>Notificaciones</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'var(--green-l)', fontFamily: 'var(--font-ui)', fontWeight: 700, background: 'rgba(45,158,95,0.12)', padding: '2px 7px', borderRadius: 100 }}>
            {data?.length ?? 0} nuevas
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
        </div>
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <Skeleton w={28} h={28} style={{ borderRadius: 7, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skeleton h={10} style={{ marginBottom: 5 }} />
                <Skeleton w="65%" h={9} />
              </div>
            </div>
          ))
        ) : !data?.length ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
            Sin notificaciones todavía
          </div>
        ) : data.map((item, i) => (
          <div key={item.id} style={{
            padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
            borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none',
            cursor: 'default', transition: 'background .13s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: `${TYPE_COLOR[item.type] ?? 'var(--muted)'}18`,
              border: `1px solid ${TYPE_COLOR[item.type] ?? 'var(--muted)'}38`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)', marginBottom: 2 }} className="truncate">
                {item.client}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>{item.action}</div>
              <div style={{ fontSize: 9, color: 'var(--muted2)', marginTop: 3 }}>{timeAgo(item.ts)}</div>
            </div>
          </div>
        ))}
      </div>

      {data?.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-ui)', cursor: 'pointer' }}
            onClick={onClose}>Ver todo en Agente IA →</span>
        </div>
      )}
    </div>
  )
}
