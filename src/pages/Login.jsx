import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function Login() {
  const [mode, setMode]       = useState('login') // 'login' | 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { company, whatsapp } },
      })
      if (error) setError(error.message)
      else setSuccess('Revisá tu email para confirmar la cuenta.')
    }

    setLoading(false)
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
        width: '100%', maxWidth: 400,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '36px 32px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: '-0.03em', color: 'var(--white)' }}>
            cobra<span style={{ color: 'var(--green-l)' }}>ya</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            {mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <>
              <div>
                <label style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Empresa</label>
                <input style={inputStyle} placeholder="García & Asociados" value={company} onChange={e => setCompany(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>WhatsApp</label>
                <input style={inputStyle} placeholder="+598 99 000 000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Email</label>
            <input style={inputStyle} type="email" placeholder="vos@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required />
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

          {success && (
            <div style={{ padding: '9px 12px', background: 'rgba(45,158,95,0.1)', border: '1px solid rgba(45,158,95,0.3)', borderRadius: 6, fontSize: 11, color: 'var(--green-l)' }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: 4,
            padding: '11px', borderRadius: 8, border: 'none',
            background: 'var(--green)', color: 'var(--white)',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity .15s',
            letterSpacing: '.03em',
          }}>
            {loading ? 'Cargando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccess(null) }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)' }}>
            {mode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Ingresá'}
          </button>
        </div>
      </div>
    </div>
  )
}
