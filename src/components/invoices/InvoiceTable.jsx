import { useState } from 'react'
import { fmt, fmtDate, daysUntil, STATUS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { InvoiceDetail } from './InvoiceDetail'

const FILTERS = [
  { id: 'all',           label: 'Todas'        },
  { id: 'pending',       label: 'Pendiente'    },
  { id: 'reminded',      label: 'Recordatorio' },
  { id: 'ai_negotiating',label: 'IA negociando'},
  { id: 'overdue',       label: 'Vencidas'     },
  { id: 'paid',          label: 'Pagadas'      },
]

const COLS = ['CFE / ID', 'Cliente', 'Monto', 'Vencimiento', 'Canal', 'Estado', '']

export function InvoiceTable({ data, loading, onAction, onDelete }) {
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = (data ?? []).filter(inv => {
    const matchStatus = filter === 'all' || inv.status === filter
    const q = search.toLowerCase()
    const matchSearch = inv.client.toLowerCase().includes(q) || (inv.cfeId ?? inv.id).toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>

      {/* Controls */}
      <div style={{
        padding: '13px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>
          Facturas
          {data && <span style={{ marginLeft: 7, fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>{filtered.length} / {data.length}</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)', pointerEvents: 'none' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cliente o CFE…"
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: 6, padding: '6px 10px 6px 26px',
                color: 'var(--white)', fontSize: 11, fontFamily: 'var(--font-mono)',
                outline: 'none', width: 190,
              }} />
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {FILTERS.map(f => {
              const cfg = STATUS[f.id]
              const active = filter === f.id
              return (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: '4px 10px', borderRadius: 100, fontSize: 10,
                  fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '.05em',
                  cursor: 'pointer', transition: 'all .14s', whiteSpace: 'nowrap',
                  border: `1px solid ${active ? (cfg?.border ?? 'rgba(45,158,95,0.4)') : 'var(--border)'}`,
                  background: active ? (cfg?.bg ?? 'var(--green-p)') : 'transparent',
                  color: active ? (cfg?.color ?? 'var(--green-l)') : 'var(--muted)',
                }}>{f.label}</button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {COLS.map(h => (
                <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0,1,2,3,4,5].map(i => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {[120,160,80,80,40,80,60].map((w,j) => (
                    <td key={j} style={{ padding: '13px 16px' }}><Skeleton h={11} w={w} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 && !search && filter === 'all' ? (
              <tr>
                <td colSpan={7}>
                  <div style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 40 }}>🧾</div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>Sin facturas todavía</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 280 }}>
                      Creá tu primera factura con el botón <strong style={{ color: 'var(--white)' }}>+ Nueva factura</strong> en la barra superior
                    </div>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                  Sin resultados — probá con otro filtro o búsqueda
                </td>
              </tr>
            ) : (
              filtered.map((inv, i) => {
                const days = daysUntil(inv.due)
                const isSel = selected?.id === inv.id
                return (
                  <tr key={inv.id}
                    onClick={() => setSelected(isSel ? null : inv)}
                    className="fade-up"
                    style={{
                      animationDelay: `${i * .035}s`,
                      borderBottom: '1px solid var(--border)',
                      background: isSel ? 'rgba(45,158,95,0.06)' : 'transparent',
                      cursor: 'pointer', transition: 'background .13s',
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'rgba(45,158,95,0.06)' : 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontStyle: 'italic', fontSize: 10 }}>{inv.cfeId ?? inv.id}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12 }}>{inv.client}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>{fmt(inv.amount)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11 }}>
                      <span style={{ color: inv.status === 'overdue' ? 'var(--red)' : days <= 7 && inv.status !== 'paid' ? 'var(--amber)' : 'var(--muted)' }}>
                        {fmtDate(inv.due)}
                        {inv.status !== 'paid' && (
                          <span style={{ marginLeft: 5, fontSize: 9, opacity: .8 }}>
                            {inv.status === 'overdue' ? `(+${Math.abs(days)}d)` : days > 0 ? `(${days}d)` : '(hoy)'}
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {inv.channel === 'whatsapp' ? '📲' : inv.channel === 'email' ? '📧' : <span style={{ color: 'var(--muted2)', fontSize: 10 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}><Badge status={inv.status} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setSelected(isSel ? null : inv) }}>
                        {isSel ? 'Cerrar' : 'Ver →'}
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <InvoiceDetail
          invoice={selected}
          onClose={() => setSelected(null)}
          onAction={async (action) => { await onAction(action, selected.id); setSelected(null) }}
          onDelete={async () => { await onDelete(selected.id); setSelected(null) }}
        />
      )}
    </div>
  )
}
