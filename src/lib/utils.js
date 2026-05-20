import { clsx } from 'clsx'

export const cx = (...args) => clsx(args)

export const fmt = (n) =>
  new Intl.NumberFormat('es-UY', {
    style: 'currency', currency: 'UYU', maximumFractionDigits: 0,
  }).format(n)

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })

export const daysUntil = (dateStr) =>
  Math.ceil((new Date(dateStr) - new Date()) / 86_400_000)

export const STATUS = {
  paid:           { label: 'Pagada',        color: '#4caf7d', bg: 'rgba(76,175,125,0.12)',  border: 'rgba(76,175,125,0.3)'  },
  reminded:       { label: 'Recordatorio',  color: '#e8a020', bg: 'rgba(232,160,32,0.12)',  border: 'rgba(232,160,32,0.3)'  },
  ai_negotiating: { label: 'IA negociando', color: '#9b8cff', bg: 'rgba(155,140,255,0.12)', border: 'rgba(155,140,255,0.3)' },
  overdue:        { label: 'Vencida',       color: '#e06060', bg: 'rgba(224,96,96,0.12)',   border: 'rgba(224,96,96,0.3)'   },
  pending:        { label: 'Pendiente',     color: '#8a8a8a', bg: 'rgba(138,138,138,0.1)',  border: 'rgba(138,138,138,0.2)' },
}
