import { STATUS } from '@/lib/utils'

export function Badge({ status, size = 'md' }) {
  const cfg = STATUS[status] ?? STATUS.pending
  const pad = size === 'sm' ? '2px 8px' : '4px 11px'
  const fs  = size === 'sm' ? 9 : 10
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, borderRadius: 100,
      fontSize: fs, fontFamily: 'var(--font-ui)', fontWeight: 700,
      letterSpacing: '0.05em', whiteSpace: 'nowrap',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {status === 'ai_negotiating' && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--purple)', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
      )}
      {cfg.label}
    </span>
  )
}
