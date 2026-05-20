import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { NotificationsPanel } from './NotificationsPanel'

export function Header({ user, onNuevaFactura }) {
  const [time, setTime]         = useState(new Date())
  const [aiPulse, setAiPulse]   = useState(false)
  const [notifs, setNotifs]     = useState(false)
  const [hasUnread, setHasUnread] = useState(true)

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 30000)
    const t2 = setInterval(() => setAiPulse(p => !p), 2200)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const hour     = time.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const timeStr  = time.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
  const dateStr  = time.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header className="app-header" style={{
      height: 'var(--header-h)', padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(8,8,8,0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 50, flexShrink: 0,
    }}>
      <div>
        <div className="greeting-name" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {greeting}{user ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </div>
        <div className="greeting-date" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1, letterSpacing: '.05em' }}>
          {dateStr} · {timeStr}
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button size="sm" onClick={onNuevaFactura}>+ Nueva factura</Button>

        {/* AI pulse */}
        <div title="Agente IA activo" style={{
          width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
          background: aiPulse ? 'rgba(45,158,95,0.2)' : 'rgba(45,158,95,0.07)',
          border: '1px solid rgba(45,158,95,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, transition: 'background .4s',
          animation: aiPulse ? 'glow .8s ease' : 'none',
        }}>🤖</div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => { setNotifs(v => !v); setHasUnread(false) }}
            style={{
              width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
              background: notifs ? 'var(--surface3)' : 'var(--surface2)',
              border: `1px solid ${notifs ? 'var(--border2)' : 'var(--border2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              transition: 'background .15s',
            }}>🔔</div>
          {hasUnread && (
            <div style={{
              position: 'absolute', top: -3, right: -3,
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--red)', border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'white',
            }}>!</div>
          )}
          {notifs && <NotificationsPanel onClose={() => setNotifs(false)} />}
        </div>

        {/* Logout */}
        <div
          title="Cerrar sesión"
          onClick={() => supabase.auth.signOut()}
          style={{
            width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          }}>⏏︎</div>
      </div>
    </header>
  )
}
