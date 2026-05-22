import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { api } from '@/api'
import { NotificationsPanel } from './NotificationsPanel'

export function Header({ user, onNuevaFactura }) {
  const [time, setTime]         = useState(new Date())
  const [aiPulse, setAiPulse]   = useState(false)
  const [notifs, setNotifs]     = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = useCallback(async () => {
    try { setUnreadCount(await api.getUnreadCount()) } catch {}
  }, [])

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 30000)
    const t2 = setInterval(() => setAiPulse(p => !p), 2200)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  // Cargar conteo inicial
  useEffect(() => { fetchUnread() }, [fetchUnread])

  // Realtime: actualizar badge cuando llega un mensaje de cliente
  useEffect(() => {
    const channel = supabase
      .channel('header-unread')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'from_role=eq.client',
      }, () => { fetchUnread() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchUnread])

  const hour     = time.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const timeStr  = time.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
  const dateStr  = time.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header className="app-header" style={{
      height: 'var(--header-h)', padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(245,242,238,0.88)',
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
        <Button size="sm" className="nueva-factura" onClick={onNuevaFactura}>+ Nueva factura</Button>

        {/* AI pulse */}
        <div className="ai-pulse-icon" title="Agente IA activo" style={{
          width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
          background: aiPulse ? 'rgba(22,163,74,0.15)' : 'rgba(22,163,74,0.07)',
          border: '1px solid rgba(22,163,74,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, transition: 'background .4s',
          animation: aiPulse ? 'glow .8s ease' : 'none',
        }}>🤖</div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => { setNotifs(v => !v); if (!notifs) fetchUnread() }}
            style={{
              width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
              background: notifs ? 'var(--surface3)' : 'var(--surface2)',
              border: '1px solid var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              transition: 'background .15s',
            }}>🔔</div>
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 16, height: 16, borderRadius: 8,
              background: 'var(--red)', border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
              fontSize: 8, fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'white',
            }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
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
