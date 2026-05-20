import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',          icon: '▦', label: 'Dashboard'  },
  { to: '/facturas',  icon: '◧', label: 'Facturas'   },
  { to: '/clientes',  icon: '◉', label: 'Clientes'   },
  { to: '/agente-ia', icon: '◈', label: 'Agente IA'  },
  { to: '/config',    icon: '◎', label: 'Config'     },
]

export function MobileNav() {
  return (
    <nav className="mobile-nav" style={{ display: 'none' }}>
      {NAV.map(item => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 3, textDecoration: 'none',
          color: isActive ? 'var(--green-l)' : 'var(--muted)',
          fontSize: 9, fontFamily: 'var(--font-ui)', fontWeight: 700,
          letterSpacing: '.04em', minHeight: 44,
        })}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
