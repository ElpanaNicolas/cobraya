import { useState, useEffect } from 'react'
import { api } from '@/api'
import { supabase } from '@/lib/supabase'

export function AcceptarInvitacion() {
  const token = new URLSearchParams(window.location.search).get('token')

  const [step, setStep]         = useState('loading') // loading | preview | login | accepting | done | error
  const [invitation, setInvitation] = useState(null)
  const [error, setError]       = useState(null)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    if (!token) { setStep('error'); setError('Token inválido.'); return }
    api.getInvitationByToken(token).then(inv => {
      if (!inv) { setStep('error'); setError('Invitación no encontrada o expirada.'); return }
      if (inv.acceptedAt) { setStep('error'); setError('Esta invitación ya fue aceptada.'); return }
      if (new Date(inv.expiresAt) < new Date()) { setStep('error'); setError('La invitación expiró.'); return }
      setInvitation(inv)
      setEmail(inv.email)
      // Verificar si el usuario ya está logueado
      supabase.auth.getUser().then(({ data }) => {
        setStep(data.user ? 'preview' : 'login')
      })
    }).catch(e => { setStep('error'); setError(e.message) })
  }, [token])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setError(null)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) {
      // Intentar registrar si no tiene cuenta
      const { error: signUpErr } = await supabase.auth.signUp({
        email, password,
        options: { data: { company: '' } },
      })
      if (signUpErr) { setError(signUpErr.message); setAuthLoading(false); return }
    }
    setAuthLoading(false)
    setStep('preview')
  }

  const handleAccept = async () => {
    setStep('accepting')
    try {
      await api.acceptInvitation(token)
      setStep('done')
    } catch (e) {
      setStep('error')
      setError(e.message)
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 8, padding: '10px 14px',
    color: 'var(--white)', fontSize: 13, fontFamily: 'var(--font-mono)',
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div className="fade-up" style={{
        width: '100%', maxWidth: 420,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '36px 32px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', color: 'var(--white)' }}>
            cobra<span style={{ color: 'var(--green-l)' }}>ya</span>
          </div>
        </div>

        {step === 'loading' && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>
            Verificando invitación…
          </div>
        )}

        {step === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>❌</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 8 }}>
              Invitación inválida
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>{error}</div>
            <a href="/" style={{ fontSize: 12, color: 'var(--green-l)', textDecoration: 'none' }}>← Ir al inicio</a>
          </div>
        )}

        {step === 'login' && (
          <>
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>👥</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, color: 'var(--white)', textAlign: 'center', marginBottom: 6 }}>
              Invitación de {invitation?.company}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Iniciá sesión o creá una cuenta para aceptar la invitación.
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Email</label>
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Contraseña</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              {error && (
                <div style={{ padding: '9px 12px', background: 'rgba(224,96,96,0.1)', border: '1px solid rgba(224,96,96,0.3)', borderRadius: 6, fontSize: 11, color: 'var(--red)' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={authLoading} style={{
                marginTop: 4, padding: '11px', borderRadius: 8, border: 'none',
                background: 'var(--green)', color: 'var(--white)',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13,
                cursor: authLoading ? 'not-allowed' : 'pointer',
                opacity: authLoading ? 0.7 : 1,
              }}>
                {authLoading ? 'Cargando…' : 'Continuar'}
              </button>
            </form>
          </>
        )}

        {step === 'preview' && invitation && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 17, color: 'var(--white)', marginBottom: 8 }}>
              Unirte al equipo de {invitation.company}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 }}>
              Al aceptar, vas a poder ver y gestionar todas las facturas y clientes de <strong style={{ color: 'var(--white)' }}>{invitation.company}</strong>.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleAccept} style={{
                padding: '12px', borderRadius: 8, border: 'none',
                background: 'var(--green)', color: 'var(--white)',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14,
                cursor: 'pointer',
              }}>
                ✓ Aceptar invitación
              </button>
              <a href="/" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none', padding: 8 }}>
                Rechazar
              </a>
            </div>
          </div>
        )}

        {step === 'accepting' && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>
            Procesando…
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 17, color: 'var(--white)', marginBottom: 8 }}>
              ¡Ya sos parte del equipo!
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 }}>
              Ahora tenés acceso a la cuenta de {invitation?.company}.
            </div>
            <a href="/" style={{
              display: 'block', padding: '12px', borderRadius: 8,
              background: 'var(--green)', color: 'var(--white)',
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', textAlign: 'center',
            }}>
              Ir a Cobraya →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
