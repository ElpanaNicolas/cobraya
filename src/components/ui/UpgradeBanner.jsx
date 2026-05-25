import { getLimits, MP_SUBSCRIPTION_URL } from '@/lib/plans'

// Muestra un banner de upgrade cuando el usuario está cerca o en el límite del plan.
// props:
//   plan       — 'free' | 'pro'
//   clients    — cantidad actual de clientes
//   invoices   — cantidad actual de facturas
//   compact    — si true muestra versión inline pequeña (para modales)
export function UpgradeBanner({ plan, clients = 0, invoices = 0, compact = false }) {
  if (plan === 'pro') return null

  const limits  = getLimits('free')
  const pctCli  = clients  / limits.maxClients
  const pctInv  = invoices / limits.maxInvoices

  const atLimitCli = clients  >= limits.maxClients
  const atLimitInv = invoices >= limits.maxInvoices
  const nearLimit  = pctCli >= 0.8 || pctInv >= 0.8

  if (!nearLimit && !atLimitCli && !atLimitInv) return null

  const isBlocked = atLimitCli || atLimitInv
  const accent    = isBlocked ? '#ef4444' : '#f59e0b'
  const accentBg  = isBlocked ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)'
  const accentBorder = isBlocked ? 'rgba(239,68,68,0.22)' : 'rgba(245,158,11,0.22)'

  const limitedResource = atLimitInv
    ? `Llegaste al límite de ${limits.maxInvoices} facturas`
    : atLimitCli
    ? `Llegaste al límite de ${limits.maxClients} clientes`
    : pctInv >= pctCli
    ? `${invoices} / ${limits.maxInvoices} facturas usadas`
    : `${clients} / ${limits.maxClients} clientes usados`

  const handleUpgrade = () => {
    if (MP_SUBSCRIPTION_URL) {
      window.open(MP_SUBSCRIPTION_URL, '_blank')
    } else {
      // Fallback: WhatsApp al equipo de Cobraya
      window.open('https://wa.me/59899000000?text=Hola%2C%20quiero%20activar%20el%20plan%20Pro%20de%20Cobraya', '_blank')
    }
  }

  if (compact) {
    return (
      <div style={{
        padding: '10px 14px',
        background: accentBg,
        border: `1px solid ${accentBorder}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ fontSize: 11, color: accent, fontWeight: 600, lineHeight: 1.4 }}>
          {isBlocked ? '🔒 ' : '⚠️ '}{limitedResource}.{' '}
          <span style={{ color: 'var(--muted)' }}>Pasá al plan Pro para continuar.</span>
        </div>
        <button onClick={handleUpgrade} style={{
          padding: '5px 12px', borderRadius: 6, border: 'none', flexShrink: 0,
          background: accent, color: '#fff',
          fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, cursor: 'pointer',
        }}>
          Ver Pro →
        </button>
      </div>
    )
  }

  return (
    <div style={{
      padding: '14px 18px',
      background: accentBg,
      border: `1px solid ${accentBorder}`,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: accent, fontFamily: 'var(--font-ui)', marginBottom: 3 }}>
          {isBlocked ? '🔒 Límite del plan gratuito alcanzado' : '⚠️ Acercándote al límite del plan'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
          {limitedResource}.{' '}
          {isBlocked
            ? 'Actualizá al plan Pro para seguir creando.'
            : 'El plan Pro te da clientes y facturas ilimitados.'}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--muted2)' }}>
            Clientes: <strong style={{ color: pctCli >= 0.8 ? accent : 'var(--white)' }}>{clients}/{limits.maxClients}</strong>
          </span>
          <span style={{ fontSize: 10, color: 'var(--muted2)' }}>
            Facturas: <strong style={{ color: pctInv >= 0.8 ? accent : 'var(--white)' }}>{invoices}/{limits.maxInvoices}</strong>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <button onClick={handleUpgrade} style={{
          padding: '9px 20px', borderRadius: 7, border: 'none',
          background: accent, color: '#fff',
          fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          ⚡ Pasarme al Pro — $1.490 UYU/mes
        </button>
        <div style={{ fontSize: 9, color: 'var(--muted2)', textAlign: 'right' }}>
          Clientes y facturas ilimitados · Cancalá cuando quieras
        </div>
      </div>
    </div>
  )
}
