import { fmt } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { useState, useEffect, useRef } from 'react'

function HBar({ value, max, color, height = 8 }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const t = requestAnimationFrame(() => setPct(max > 0 ? (value / max) * 100 : 0))
    return () => cancelAnimationFrame(t)
  }, [value, max])
  return (
    <div style={{
      height, borderRadius: 3,
      background: color,
      width: `${pct}%`,
      transition: 'width .9s cubic-bezier(.23,1,.32,1)',
      minWidth: value > 0 ? 3 : 0,
    }} />
  )
}

export function TrendChart({ data, loading }) {
  const maxVal = data ? Math.max(1, ...data.map(d => Math.max(d.cobrado, d.pendiente))) : 1

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '18px 20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>Tendencia de cobros</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Últimos 6 meses · UYU</div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--muted)' }}>
          {[
            { color: 'var(--green-l)',          label: 'Cobrado'   },
            { color: 'rgba(232,160,32,0.6)',     label: 'Pendiente' },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Bars */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} h={20} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map((d) => (
            <div key={d.month} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Mes */}
              <span style={{
                width: 30, flexShrink: 0, textAlign: 'right',
                fontSize: 9, fontFamily: 'var(--font-ui)', fontWeight: 700,
                color: 'var(--muted2)', letterSpacing: '.08em', textTransform: 'uppercase',
              }}>{d.month}</span>

              {/* Barras */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Cobrado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                    <HBar value={d.cobrado} max={maxVal} color="linear-gradient(90deg, var(--green), var(--green-l))" height={8} />
                  </div>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700,
                    color: d.cobrado > 0 ? 'var(--green-l)' : 'var(--muted2)',
                    minWidth: 80, textAlign: 'right', whiteSpace: 'nowrap',
                  }}>
                    {d.cobrado > 0 ? fmt(d.cobrado) : '—'}
                  </span>
                </div>
                {/* Pendiente */}
                {d.pendiente > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                      <HBar value={d.pendiente} max={maxVal} color="rgba(232,160,32,0.45)" height={5} />
                    </div>
                    <span style={{
                      fontSize: 9, fontFamily: 'var(--font-ui)',
                      color: 'rgba(232,160,32,0.7)',
                      minWidth: 80, textAlign: 'right', whiteSpace: 'nowrap',
                    }}>
                      {fmt(d.pendiente)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
