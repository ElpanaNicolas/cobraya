import { lazy, Suspense, useCallback } from 'react'
import { api } from '@/api'
import { useApi } from '@/hooks/useApi'
import { KPICards }     from '@/components/dashboard/KPICards'
import { TrendChart }   from '@/components/dashboard/TrendChart'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { InvoiceTable } from '@/components/invoices/InvoiceTable'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
import { toast } from '@/components/ui/Toast'

// @react-pdf/renderer es ~1.4 MB — cargarlo sólo cuando el usuario lo pide
const MonthlyReportButton = lazy(() =>
  import('@/components/reports/MonthlyReport').then(m => ({ default: m.MonthlyReportButton }))
)

export function Dashboard() {
  const kpis      = useApi(api.getKPIs)
  const invoices  = useApi(api.getInvoices)
  const activity  = useApi(api.getActivity)
  const chart     = useApi(api.getChartData)
  const userApi   = useApi(useCallback(() => api.getUser(), []))

  const handleAction = async (action, invoiceId) => {
    try {
      if (action === 'paid')     await api.markPaid(invoiceId)
      if (action === 'reminder') await api.sendReminder(invoiceId)
      if (action === 'ai')       await api.activateAI(invoiceId)
      invoices.refetch()
      kpis.refetch()
      if (action === 'paid')     toast.success('Factura marcada como pagada')
      if (action === 'reminder') toast.success('Recordatorio enviado')
      if (action === 'ai')       toast.success('Agente IA activado')
    } catch {
      toast.error('Error al procesar la acción')
    }
  }

  const handleDelete = async (invoiceId) => {
    try {
      await api.deleteInvoice(invoiceId)
      invoices.refetch()
      kpis.refetch()
      toast.success('Factura eliminada')
    } catch {
      toast.error('Error al eliminar la factura')
    }
  }

  return (
    <div className="page-pad" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Suspense fallback={null}>
          <MonthlyReportButton />
        </Suspense>
      </div>

      {/* Upgrade banner — solo si está cerca del límite */}
      {userApi.data && (
        <UpgradeBanner
          plan={userApi.data.plan ?? 'free'}
          clients={0}
          invoices={invoices.data?.length ?? 0}
        />
      )}

      {/* KPIs */}
      <KPICards data={kpis.data} loading={kpis.loading} />

      {/* Chart + Feed */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <TrendChart data={chart.data} loading={chart.loading} />
        <ActivityFeed data={activity.data} loading={activity.loading} />
      </div>

      {/* Invoices */}
      <InvoiceTable
        data={invoices.data}
        loading={invoices.loading}
        onAction={handleAction}
        onDelete={handleDelete}
      />
    </div>
  )
}
