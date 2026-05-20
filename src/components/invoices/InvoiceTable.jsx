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

const DATE_FILTERS = [
  { id: 'all',    label: 'Todo'           },
  { id: 'month',  label: 'Este mes'       },
  { id: 'prev',   label: 'Mes anterior'   },
  { id: '3months',label: 'Últimos 3 meses'},
]

function matchesDateFilter(inv, dateFilter) {
  if (dateFilter === 'all') return true
  const d = new Date(inv.issued)
  const now = new Date()
  if (dateFilter === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }
  if (dateFilter === 'prev') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth()
  }
  if (dateFilter === '3months') {
    const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 3)
    return d >= cutoff
  }
  return true
}

const COLS = ['CFE / ID', 'Cliente', 'Monto', 'Vencimiento', 'Canal', 'Estado', '']

function exportCsv(rows) {
  const headers = ['CFE/ID', 'Cliente', 'RUT', 'Monto (UYU)', 'Emisión', 'Vencimiento', 'Canal', 'Estado']
  const statusLabel = { paid: 'Pagada', pending: 'Pendiente', reminded: 'Recordatorio', ai_negotiating: 'IA negociando', overdue: 'Vencida' }
  const lines = [
    headers.join(';'),
    ...rows.map(inv => [
      inv.cfeId ?? inv.id,
      inv.client,
      inv.rut ?? '',
      inv.amount,
      inv.issued ?? '',
      inv.due ?? '',
      inv.channel ?? '',
      statusLabel[inv.status] ?? inv.status,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')),
  ]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `cobraya-facturas-${new Date().toISOString().slice(0,10)}.csv` })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function InvoiceTable({ data, loading, onAction, onDelete }) {
  const [filter, setFilter]       = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)

  const filtered = (data ?? []).filter(inv => {
    const matchStatus = filter === 'all' || inv.status === filter
    const matchDate   = matchesDateFilter(inv, dateFilter)
    const q = search.toLowerCase()
    const matchSearch = inv.client.toLowerCase().includes(q) || (inv.cfeId ?? inv.id).toLowerCase().includes(q)
    return matchStatus && matchDate && matchSearch
  })

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>

      {/* Controls */}
      <div className="invoice-controls" style={{
        padding: '13px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>
            Facturas
            {data && <span style={{ marginLeft: 7, fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>{filtered.length} / {data.length}</span>}
          </div>
          {filtered.length > 0 && (
            <button
              onClick={() => exportCsv(filtered)}
              title="Exportar CSV"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                background: 'transparent', border: '1px solid var(--border2)',
                color: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700,
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,158,95,0.5)'; e.currentTarget.style.color = 'var(--green-l)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--muted)' }}
            >
              ↓ CSV
            </button>
          )}
        </div>

        <div className="invoice-filter-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

          {/* Date pills */}
          <div className="invoice-pills" style={{ display: 'flex', gap: 4 }}>
            {DATE_FILTERS.map(f => {
              const active = dateFilter === f.id
              return (
                <button key={f.id} onClick={() => setDateFilter(f.id)} style={{
                  padding: '4px 10px', borderRadius: 100, fontSize: 10,
                  fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '.05em',
                  cursor: 'pointer', transition: 'all .14s', whiteSpace: 'nowrap',
                  border: `1px solid ${active ? 'rgba(91,196,232,0.4)' : 'var(--border)'}`,
                  background: active ? 'rgba(91,196,232,0.1)' : 'transparent',
                  color: active ? '#5bc4e8' : 'var(--muted)',
                }}>{f.label}</button>
              )
            })}
          </div>

          {/* Status pills */}
          <div className="invoice-pills" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
            ) : filtered.length === 0 && !search && filter === 'all' && dateFilter === 'all' ? (
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
