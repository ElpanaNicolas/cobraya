// Reporte mensual PDF generado en el cliente con @react-pdf/renderer
// Uso: <MonthlyReportButton />

import { useState } from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
    color: '#111111',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  logo: { fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: { fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 2 },

  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#888',
    marginBottom: 8,
    marginTop: 20,
  },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 4,
    padding: 10,
  },
  kpiLabel: { fontSize: 8, color: '#888', marginBottom: 4 },
  kpiValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  kpiUnit: { fontSize: 9, color: '#888' },

  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    padding: '6 8',
    borderRadius: 3,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '6 8',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  colClient:  { flex: 2.5 },
  colCfe:     { flex: 1.5 },
  colAmount:  { flex: 1.2, textAlign: 'right' },
  colDue:     { flex: 1.2, textAlign: 'right' },
  colStatus:  { flex: 1, textAlign: 'center' },
  thText:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#555', textTransform: 'uppercase', letterSpacing: 0.4 },
  tdText:     { fontSize: 9, color: '#222' },

  statusBadge: { borderRadius: 3, padding: '2 5', fontSize: 8, fontFamily: 'Helvetica-Bold' },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: '#bbb' },
})

const STATUS_LABELS = {
  pending:       'Pendiente',
  reminded:      'Recordado',
  ai_negotiating:'Negociando',
  overdue:       'Vencido',
  paid:          'Pagado',
}

const STATUS_COLORS = {
  pending:        '#f59e0b',
  reminded:       '#3b82f6',
  ai_negotiating: '#8b5cf6',
  overdue:        '#ef4444',
  paid:           '#22c55e',
}

function fmt(n) {
  return Number(n).toLocaleString('es-UY', { minimumFractionDigits: 0 })
}

function ReportDocument({ invoices, kpis, company, month }) {
  const paid      = invoices.filter(i => i.status === 'paid')
  const pending   = invoices.filter(i => ['pending','reminded','ai_negotiating'].includes(i.status))
  const overdue   = invoices.filter(i => i.status === 'overdue')

  const cobrado   = kpis.find(k => k.id === 'cobrado')?.value  ?? 0
  const pendiente = kpis.find(k => k.id === 'pendiente')?.value ?? 0
  const vencido   = kpis.find(k => k.id === 'vencido')?.value  ?? 0
  const dso       = kpis.find(k => k.id === 'dso')?.value      ?? 0

  const generatedAt = new Date().toLocaleDateString('es-UY', { day:'2-digit', month:'long', year:'numeric' })

  return (
    <Document title={`Reporte ${month} — ${company}`} author="Cobraya">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{company}</Text>
            <Text style={{ fontSize: 10, color: '#888', marginTop: 4 }}>Reporte de Cobros — {month}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Generado el</Text>
            <Text style={styles.headerValue}>{generatedAt}</Text>
          </View>
        </View>

        {/* KPIs */}
        <Text style={styles.sectionTitle}>Resumen del período</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Cobrado este mes</Text>
            <Text style={styles.kpiValue}>${fmt(cobrado)}</Text>
            <Text style={styles.kpiUnit}>UYU · {paid.length} facturas</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Pendiente de cobro</Text>
            <Text style={styles.kpiValue}>${fmt(pendiente)}</Text>
            <Text style={styles.kpiUnit}>UYU · {pending.length} facturas</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Vencido sin gestionar</Text>
            <Text style={styles.kpiValue}>${fmt(vencido)}</Text>
            <Text style={styles.kpiUnit}>UYU · {overdue.length} facturas</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Días promedio cobro</Text>
            <Text style={styles.kpiValue}>{dso}</Text>
            <Text style={styles.kpiUnit}>días (DSO)</Text>
          </View>
        </View>

        {/* Tabla de facturas */}
        <Text style={styles.sectionTitle}>Detalle de facturas</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colClient]}>Cliente</Text>
            <Text style={[styles.thText, styles.colCfe]}>Factura</Text>
            <Text style={[styles.thText, styles.colAmount]}>Importe</Text>
            <Text style={[styles.thText, styles.colDue]}>Vencimiento</Text>
            <Text style={[styles.thText, styles.colStatus]}>Estado</Text>
          </View>
          {invoices.slice(0, 40).map((inv, i) => (
            <View key={inv.id} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tdText, styles.colClient]} numberOfLines={1}>{inv.client}</Text>
              <Text style={[styles.tdText, styles.colCfe]}>{inv.cfeId}</Text>
              <Text style={[styles.tdText, styles.colAmount]}>${fmt(inv.amount)}</Text>
              <Text style={[styles.tdText, styles.colDue]}>{inv.due}</Text>
              <View style={styles.colStatus}>
                <Text style={[styles.statusBadge, { color: STATUS_COLORS[inv.status] ?? '#888' }]}>
                  {STATUS_LABELS[inv.status] ?? inv.status}
                </Text>
              </View>
            </View>
          ))}
          {invoices.length > 40 && (
            <Text style={{ fontSize: 8, color: '#888', padding: '6 8' }}>
              + {invoices.length - 40} facturas adicionales no mostradas
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Cobraya · Gestión automatizada de cobros</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export function MonthlyReportButton() {
  const [loading, setLoading] = useState(false)

  const month = new Date().toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })

  async function handleDownload() {
    setLoading(true)
    try {
      const [invoices, kpis, user] = await Promise.all([
        api.getInvoices(),
        api.getKPIs(),
        api.getUser(),
      ])

      const doc  = <ReportDocument invoices={invoices} kpis={kpis} company={user.company ?? 'Mi empresa'} month={month} />
      const blob = await pdf(doc).toBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `reporte-cobros-${new Date().toISOString().slice(0,7)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} variant="outline" size="sm">
      {loading ? 'Generando…' : '↓ Reporte PDF'}
    </Button>
  )
}
