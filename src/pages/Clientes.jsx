import { useState, useCallback } from 'react'
import { api } from '@/api'
import { useApi } from '@/hooks/useApi'
import { fmt } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { ChatView } from '@/components/invoices/ChatView'
import { NuevoClienteModal } from '@/components/clientes/NuevoClienteModal'
import { toast } from '@/components/ui/Toast'

function riskLabel(score) {
  if (score >= 85) return { label: 'Bajo riesgo',  color: '#4caf7d', bg: 'rgba(76,175,125,0.12)',  border: 'rgba(76,175,125,0.3)'  }
  if (score >= 60) return { label: 'Riesgo medio', color: '#e8a020', bg: 'rgba(232,160,32,0.12)',  border: 'rgba(232,160,32,0.3)'  }
  return               { label: 'Alto riesgo',  color: '#e06060', bg: 'rgba(224,96,96,0.12)',   border: 'rgba(224,96,96,0.3)'   }
}

function RiskBadge({ score }) {
  const r = riskLabel(score)
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 100, fontSize: 9,
      fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '.05em',
      color: r.color, background: r.bg, border: `1px solid ${r.border}`,
    }}>{r.label}</span>
  )
}

function ScoreBar({ score }) {
  const r = riskLabel(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: r.color, borderRadius: 2, transition: 'width .5s ease' }} />
      </div>
      <span style={{ fontSize: 10, color: r.color, fontFamily: 'var(--font-ui)', fontWeight: 700, minWidth: 24 }}>{score}</span>
    </div>
  )
}

function ClientRow({ client, expanded, onToggle, onDelete }) {
  const [chatTab, setChatTab]   = useState(false)
  const [confirm, setConfirm]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: expanded ? 'none' : '1px solid var(--border)',
          background: expanded ? 'rgba(45,158,95,0.04)' : 'transparent',
          cursor: 'pointer', transition: 'background .13s',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={e => { e.currentTarget.style.background = expanded ? 'rgba(45,158,95,0.04)' : 'transparent' }}
      >
        <td style={{ padding: '13px 16px' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>{client.name}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>RUT {client.rut}</div>
        </td>
        <td style={{ padding: '13px 16px', fontSize: 11, color: 'var(--muted)' }}>
          <div>{client.phone || '—'}</div>
          <div style={{ fontSize: 10, marginTop: 1 }}>{client.email || '—'}</div>
        </td>
        <td style={{ padding: '13px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
          {client.totalFacturado > 0 ? fmt(client.totalFacturado) : <span style={{ color: 'var(--muted2)' }}>—</span>}
        </td>
        <td style={{ padding: '13px 16px' }}>
          {client.pendiente > 0
            ? <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--amber)' }}>{fmt(client.pendiente)}</span>
            : <span style={{ fontSize: 11, color: '#4caf7d' }}>✓ Al día</span>
          }
        </td>
        <td style={{ padding: '13px 16px' }}>
          <div style={{ minWidth: 120 }}><ScoreBar score={client.riskScore} /></div>
          <div style={{ marginTop: 4 }}><RiskBadge score={client.riskScore} /></div>
        </td>
        <td style={{ padding: '13px 16px', fontSize: 11, color: 'var(--muted)' }}>
          {client.avgDaysToPay === 0 ? <span style={{ color: 'var(--muted2)' }}>—</span> : `${client.avgDaysToPay}d`}
        </td>
        <td style={{ padding: '13px 16px', fontSize: 11, color: 'var(--muted)' }}>
          {client.invoiceCount}
        </td>
        <td style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, color: expanded ? 'var(--green-l)' : 'var(--muted)' }}>
              {expanded ? 'Cerrar ↑' : 'Ver →'}
            </span>
            {!confirm ? (
              <span
                onClick={e => { e.stopPropagation(); setConfirm(true) }}
                style={{ fontSize: 10, color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted2)'}
              >Eliminar</span>
            ) : (
              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                <button onClick={async () => { setDeleting(true); await onDelete(client.id); setDeleting(false) }}
                  style={{ padding: '3px 8px', fontSize: 9, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer', borderRadius: 4, border: '1px solid rgba(224,96,96,0.4)', background: 'rgba(224,96,96,0.12)', color: 'var(--red)' }}>
                  {deleting ? '…' : 'Confirmar'}
                </button>
                <button onClick={() => setConfirm(false)}
                  style={{ padding: '3px 8px', fontSize: 9, fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted)' }}>
                  No
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={8} style={{ padding: 0 }}>
            <div className="fade-up" style={{ background: 'rgba(45,158,95,0.03)' }}>
              <div style={{ display: 'flex', gap: 0, padding: '0 20px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
                {['Info', 'Chats'].map(t => (
                  <button key={t} onClick={e => { e.stopPropagation(); setChatTab(t === 'Chats') }} style={{
                    padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700,
                    color: (t === 'Chats') === chatTab ? 'var(--green-l)' : 'var(--muted)',
                    borderBottom: (t === 'Chats') === chatTab ? '2px solid var(--green-l)' : '2px solid transparent',
                    marginBottom: -1, transition: 'all .15s', letterSpacing: '.03em',
                  }}>{t === 'Chats' ? '💬 Chats' : t}</button>
                ))}
              </div>
              {!chatTab && (
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 6 }}>Contacto</div>
                    <div style={{ fontSize: 12 }}>{client.phone || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{client.email || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 6 }}>Historial</div>
                    <div style={{ fontSize: 12 }}>{client.invoiceCount} facturas emitidas</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Promedio de pago: {client.avgDaysToPay || '—'}d</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 6 }}>Score de riesgo</div>
                    <ScoreBar score={client.riskScore} />
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>Basado en historial de pagos</div>
                  </div>
                </div>
              )}
              {chatTab && (
                <div onClick={e => e.stopPropagation()}>
                  <ChatView clientId={client.id} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const COLS = ['Cliente', 'Contacto', 'Total facturado', 'Pendiente', 'Score de riesgo', 'Días prom.', 'Facturas', '']

function EmptyClientes({ onNuevo }) {
  return (
    <tr>
      <td colSpan={8}>
        <div style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 40 }}>🏢</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>Sin clientes todavía</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 280 }}>
            Agregá tu primer cliente para empezar a gestionar facturas y cobros
          </div>
          <button onClick={onNuevo} style={{
            marginTop: 4, padding: '9px 20px', borderRadius: 8,
            background: 'var(--green)', color: 'var(--white)', border: 'none',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>+ Nuevo cliente</button>
        </div>
      </td>
    </tr>
  )
}

export function Clientes() {
  const { data, loading, refetch } = useApi(api.getClients)
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)

  const handleDelete = async (clientId) => {
    try {
      await api.deleteClient(clientId)
      setExpanded(null)
      refetch()
      toast.success('Cliente eliminado')
    } catch {
      toast.error('Error al eliminar el cliente')
    }
  }

  const filtered = (data ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.rut.includes(search)
  )

  return (
    <div className="page-pad" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.02em' }}>Clientes</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Historial de pagos, score de riesgo y conversaciones por cliente
          </div>
        </div>
        <Button onClick={() => setModal(true)}>+ Nuevo cliente</Button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13 }}>
            Clientes
            {data && <span style={{ marginLeft: 7, fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>{filtered.length} / {data.length}</span>}
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)', pointerEvents: 'none' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre o RUT…"
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: 6, padding: '6px 10px 6px 26px',
                color: 'var(--white)', fontSize: 11, fontFamily: 'var(--font-mono)',
                outline: 'none', width: 200,
              }} />
          </div>
        </div>

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
                [0,1,2,3,4].map(i => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {[180,140,100,100,140,60,60,40].map((w,j) => (
                      <td key={j} style={{ padding: '14px 16px' }}><Skeleton h={11} w={w} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 && !search ? (
                <EmptyClientes onNuevo={() => setModal(true)} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 36, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Sin resultados para "{search}"</td></tr>
              ) : (
                filtered.map(c => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    expanded={expanded === c.id}
                    onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <NuevoClienteModal
          onClose={() => setModal(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  )
}
