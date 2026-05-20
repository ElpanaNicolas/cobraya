import { useState, useCallback, useEffect, useRef } from 'react'

// ── Store global minimalista ──────────────────────────────────
let _addToast = null
export const toast = {
  success: (msg) => _addToast?.({ type: 'success', msg }),
  error:   (msg) => _addToast?.({ type: 'error',   msg }),
  info:    (msg) => _addToast?.({ type: 'info',    msg }),
}

const COLORS = {
  success: { bg: 'rgba(45,158,95,0.15)',  border: 'rgba(45,158,95,0.35)',  icon: '✓', color: '#4caf7d' },
  error:   { bg: 'rgba(224,96,96,0.15)',  border: 'rgba(224,96,96,0.35)',  icon: '✕', color: '#e06060' },
  info:    { bg: 'rgba(91,196,232,0.12)', border: 'rgba(91,196,232,0.3)',  icon: 'ℹ', color: '#5bc4e8' },
}

function ToastItem({ toast: t, onRemove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onRemove, 300)
    }, 3200)
    return () => clearTimeout(timer)
  }, [])

  const c = COLORS[t.type]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 14px', borderRadius: 10,
      background: c.bg, border: `1px solid ${c.border}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--white)',
      minWidth: 220, maxWidth: 340,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      opacity: visible ? 1 : 0,
      transition: 'all .28s cubic-bezier(.23,1,.32,1)',
    }}>
      <span style={{ color: c.color, fontWeight: 800, fontSize: 13 }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{t.msg}</span>
      <button onClick={() => { setVisible(false); setTimeout(onRemove, 300) }}
        style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2 }}>✕</button>
    </div>
  )
}

export function Toaster() {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const addToast = useCallback((t) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { ...t, id }])
  }, [])

  useEffect(() => { _addToast = addToast; return () => { _addToast = null } }, [addToast])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
    }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />)}
    </div>
  )
}
