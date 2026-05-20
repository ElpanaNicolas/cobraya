import { fmt } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

function Bar({ value, max, color, delay }) {
  const pct = (value / max) * 100
  return (
    <div style={{
      flex: 1, background: color, borderRadius: '3px 3px 0 0',
      height: `${pct}%`,
      transition: `height .9s cubic-bezier(.23,1,.32,1) ${delay}s`,
    }} />
  )
}

export function TrendChart({ data, loading }) {
  const maxVal = data ? Math.max(...data.map(d => d.cobrado)) : 1

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>Tendencia de cobros</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Últimos 6 meses · UYU</div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--muted)' }}>
          {[{ color: 'var(--green-l)', label: 'Cobrado' }, { color: 'rgba(232,160,32,0.5)', label: 'Pendiente' }].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? <Skeleton h={80} /> : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 90 }}>
          {data.map((d, i) => (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <Bar value={d.cobrado}   max={maxVal} color="linear-gradient(180deg,var(--green-l),var(--green))" delay={i*.07} />
                <Bar value={d.pendiente} max={maxVal} color="rgba(232,160,32,0.45)" delay={i*.07+.05} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--muted2)', letterSpacing: '.05em' }}>{d.month}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
