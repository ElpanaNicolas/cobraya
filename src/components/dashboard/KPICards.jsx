import { fmt } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

export function KPICards({ data, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
            <Skeleton w="55%" h={10} />
            <div style={{ marginTop: 12, marginBottom: 8 }}><Skeleton h={28} /></div>
            <Skeleton w="38%" h={9} />
          </div>
        ))}
      </div>
    )
  }

  if (!data?.length) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      {data.map((kpi, i) => {
        const isCobrado = kpi.id === 'cobrado'
        const isVencido = kpi.id === 'vencido'
        const isDso     = kpi.id === 'dso'
        // "good" if cobrado↑, pendiente↓, vencido↓, dso↓
        const good = isCobrado ? kpi.delta > 0 : kpi.delta < 0
        const valueColor = isCobrado ? 'var(--green-l)' : isVencido ? 'var(--red)' : 'var(--white)'

        return (
          <div key={kpi.id} className="fade-up" style={{
            animationDelay: `${i * .07}s`,
            background: 'var(--surface)',
            border: `1px solid ${isCobrado ? 'rgba(45,158,95,0.3)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: '16px 18px',
            position: 'relative', overflow: 'hidden',
          }}>
            {isCobrado && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), var(--green-l))' }} />
            )}
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 }}>
              {kpi.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: valueColor, marginBottom: 6 }}>
              {kpi.unit === 'days' ? `${kpi.value} días` : fmt(kpi.value)}
            </div>
            <div style={{ fontSize: 10, color: good ? '#4caf7d' : 'var(--red)' }}>
              {kpi.delta > 0 ? '↑' : '↓'} {Math.abs(kpi.delta)}{kpi.unit === 'days' ? ' días' : '%'} vs mes anterior
            </div>
          </div>
        )
      })}
    </div>
  )
}
