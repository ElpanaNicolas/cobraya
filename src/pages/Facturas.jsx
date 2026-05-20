import { api } from '@/api'
import { useApi } from '@/hooks/useApi'
import { fmt, STATUS } from '@/lib/utils'
import { InvoiceTable } from '@/components/invoices/InvoiceTable'
import { Skeleton } from '@/components/ui/Skeleton'

const STAT_ORDER = ['pending', 'reminded', 'ai_negotiating', 'overdue', 'paid']

function StatBar({ data, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {[1,2,3,4,5].map(i => <Skeleton key={i} h={72} style={{ flex: 1, borderRadius: 'var(--radius)' }} />)}
      </div>
    )
  }

  const counts = {}
  const totals = {}
  for (const s of STAT_ORDER) { counts[s] = 0; totals[s] = 0 }
  for (const inv of (data ?? [])) {
    if (counts[inv.status] !== undefined) {
      counts[inv.status]++
      totals[inv.status] += inv.amount
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {STAT_ORDER.map(s => {
        const cfg = STATUS[s]
        return (
          <div key={s} className="fade-up" style={{
            flex: 1, padding: '14px 16px',
            background: 'var(--surface)', border: `1px solid ${cfg.border}`,
            borderRadius: 'var(--radius)',
          }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: cfg.color, fontFamily: 'var(--font-ui)', fontWeight: 700, marginBottom: 6 }}>
              {cfg.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--white)' }}>
              {counts[s]}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              {totals[s] > 0 ? fmt(totals[s]) : '—'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Facturas() {
  const invoices = useApi(api.getInvoices)

  const handleAction = async (action, invoiceId) => {
    if (action === 'paid')     await api.markPaid(invoiceId)
    if (action === 'reminder') await api.sendReminder(invoiceId)
    if (action === 'ai')       await api.activateAI(invoiceId)
    invoices.refetch()
  }

  const handleDelete = async (invoiceId) => {
    await api.deleteInvoice(invoiceId)
    invoices.refetch()
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.02em' }}>Facturas</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Gestión completa de comprobantes y estado de cobro
          </div>
        </div>
      </div>

      <StatBar data={invoices.data} loading={invoices.loading} />

      <InvoiceTable
        data={invoices.data}
        loading={invoices.loading}
        onAction={handleAction}
        onDelete={handleDelete}
      />
    </div>
  )
}
