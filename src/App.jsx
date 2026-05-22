import { useState, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header }  from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { NuevaFacturaModal } from '@/components/invoices/NuevaFacturaModal'
import { Toaster } from '@/components/ui/Toast'
import { Login }   from '@/pages/Login'

// Lazy-load pages — each gets its own chunk, slashing initial bundle size
const Dashboard       = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Facturas        = lazy(() => import('@/pages/Facturas').then(m => ({ default: m.Facturas })))
const Clientes        = lazy(() => import('@/pages/Clientes').then(m => ({ default: m.Clientes })))
const AgenteIA        = lazy(() => import('@/pages/AgenteIA').then(m => ({ default: m.AgenteIA })))
const Configuracion   = lazy(() => import('@/pages/Configuracion').then(m => ({ default: m.Configuracion })))
const PaginaPago      = lazy(() => import('@/pages/PaginaPago').then(m => ({ default: m.PaginaPago })))
const OnboardingWizard = lazy(() => import('@/components/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })))

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
  const { data: user, refetch: refreshUser } = useApi(api.getUser)
  const [facturaModal, setFacturaModal] = useState(false)
  const [facturaKey, setFacturaKey] = useState(0)

  // Página de pago pública — no requiere login
  if (window.location.pathname.startsWith('/pagar/')) return (
    <Suspense fallback={<Spinner />}><PaginaPago /></Suspense>
  )

  if (authLoading) return <Spinner />
  if (!session)    return <Login />

  // Onboarding — muestra el wizard hasta que se complete
  if (user && user.onboardingCompleted === false) {
    return (
      <>
        <Suspense fallback={<Spinner />}>
          <OnboardingWizard onComplete={async (dest) => {
            await refreshUser()
            if (dest === 'config') window.location.href = '/config'
          }} />
        </Suspense>
        <Toaster />
      </>
    )
  }

  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar user={user} />
      <div className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header user={user} onNuevaFactura={() => setFacturaModal(true)} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/"          element={<Dashboard key={facturaKey} />} />
              <Route path="/facturas"  element={<Facturas  key={facturaKey} />} />
              <Route path="/clientes"  element={<Clientes />} />
              <Route path="/agente-ia" element={<AgenteIA />} />
              <Route path="/config"    element={<Configuracion />} />
            </Routes>
          </Suspense>
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
