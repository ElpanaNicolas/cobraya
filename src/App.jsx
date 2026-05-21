import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header }  from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { NuevaFacturaModal } from '@/components/invoices/NuevaFacturaModal'
import { Toaster } from '@/components/ui/Toast'
import { Dashboard }     from '@/pages/Dashboard'
import { Facturas }      from '@/pages/Facturas'
import { Clientes }      from '@/pages/Clientes'
import { AgenteIA }      from '@/pages/AgenteIA'
import { Configuracion } from '@/pages/Configuracion'
import { Login }         from '@/pages/Login'
import { PaginaPago }    from '@/pages/PaginaPago'

function Spinner() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2px solid var(--border2)',
        borderTopColor: 'var(--green-l)',
        animation: 'spin .7s linear infinite',
      }} />
    </div>
  )
}

export default function App() {
  const { session, loading: authLoading } = useAuth()
  const { data: user } = useApi(api.getUser)
  const [facturaModal, setFacturaModal] = useState(false)
  const [facturaKey, setFacturaKey] = useState(0)

  // Página de pago pública — no requiere login
  if (window.location.pathname.startsWith('/pagar/')) return <PaginaPago />

  if (authLoading) return <Spinner />
  if (!session)    return <Login />

  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar user={user} />
      <div className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header user={user} onNuevaFactura={() => setFacturaModal(true)} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/"          element={<Dashboard key={facturaKey} />} />
            <Route path="/facturas"  element={<Facturas  key={facturaKey} />} />
            <Route path="/clientes"  element={<Clientes />} />
            <Route path="/agente-ia" element={<AgenteIA />} />
            <Route path="/config"    element={<Configuracion />} />
          </Routes>
        </main>
      </div>

      <MobileNav />

      <Toaster />

      {facturaModal && (
        <NuevaFacturaModal
          onClose={() => setFacturaModal(false)}
          onCreated={() => setFacturaKey(k => k + 1)}
        />
      )}
    </div>
  )
}
