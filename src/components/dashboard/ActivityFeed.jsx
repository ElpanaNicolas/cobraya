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
  if (diff < 1)  return 'ahora'
  if (diff < 60) return `hace ${diff} min`
  const h = Math.floor(diff / 60)
  return `hace ${h}h`
}

export function ActivityFeed({ data, loading }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-l)', animation: 'pulse 2s infinite' }} />
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>Actividad IA</div>
      </div>

      {loading ? (
        [0,1,2,3,4].map(i => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <Skeleton w={28} h={28} radius={7} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Skeleton h={10} />
              <div style={{ marginTop: 5 }}><Skeleton w="65%" h={9} /></div>
            </div>
          </div>
        ))
      ) : !data?.length ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 28 }}>🤖</div>
          <div style={{ fontSize: 11, textAlign: 'center' }}>El agente aún no tiene actividad.<br />Creá facturas para que empiece a gestionar.</div>
        </div>
      ) : (
        data.map((item, i) => (
          <div key={item.id} className="fade-up" style={{
            animationDelay: `${i * .07}s`,
            padding: '10px 0',
            borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: `${TYPE_COLOR[item.type]}18`,
              border: `1px solid ${TYPE_COLOR[item.type]}38`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.client}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.45 }}>{item.action}</div>
              <div style={{ fontSize: 9, color: 'var(--muted2)', marginTop: 3 }}>{timeAgo(item.ts)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
