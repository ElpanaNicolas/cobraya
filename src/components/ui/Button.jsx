export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-ui)', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .15s', opacity: disabled ? 0.5 : 1,
    letterSpacing: '0.02em', whiteSpace: 'nowrap',
  }
  const sizes = { sm: { padding: '5px 12px', fontSize: 11 }, md: { padding: '8px 16px', fontSize: 12 }, lg: { padding: '11px 22px', fontSize: 13 } }
  const variants = {
    primary: { background: 'var(--green)', color: 'var(--white)' },
    ghost:   { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border2)' },
    danger:  { background: 'rgba(224,96,96,.15)', color: 'var(--red)', border: '1px solid rgba(224,96,96,.3)' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  )
}
