import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',          icon: '▦', label: 'Dashboard'     },
  { to: '/facturas',  icon: '◧', label: 'Facturas'      },
  { to: '/clientes',  icon: '◉', label: 'Clientes'      },
  { to: '/agente-ia', icon: '◈', label: 'Agente IA'     },
  { to: '/config',    icon: '◎', label: 'Configuración' },
]

export function Sidebar({ user }) {
  const [open, setOpen] = useState(true)
  const w = open ? 'var(--sidebar-w)' : '60px'

  return (
    <aside style={{
      width: w, minWidth: w, transition: 'width .3s cubic-bezier(.23,1,.32,1)',
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Logo row */}
      <div style={{
        height: 'var(--header-h)', padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {open && (
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            Cobra<span style={{ color: 'var(--green-l)' }}>Ya</span>
          </span>
        )}
        <button onClick={() => setOpen(o => !o)} style={{
          background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
          fontSize: 15, padding: 6, lineHeight: 1,
          marginLeft: open ? 0 : 'auto', marginRight: open ? 0 : 'auto',
        }}>
          {open ? '◂' : '▸'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, marginBottom: 2,
            textDecoration: 'none', transition: 'all .15s',
            color: isActive ? 'var(--green-l)' : 'var(--muted)',
            background: isActive ? 'var(--green-p)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--green-l)' : '2px solid transparent',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13,
            whiteSpace: 'nowrap',
          })}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
            {open && item.label}
          </NavLink>
        ))}
      </nav>

      {/* AI status */}
      {open && (
        <div style={{
          margin: '0 10px 12px',
          padding: '10px 12px',
          background: 'var(--green-p)',
          border: '1px solid rgba(45,158,95,0.25)',
          borderRadius: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-l)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10, color: 'var(--green-l)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              IA Activa
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
            3 facturas en gestión automática
          </div>
        </div>
      )}

      {/* User */}
      {user && (
        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--green), var(--green-l))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 11,
          }}>{user.initials}</div>
          {open && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Plan {user.plan}</div>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
