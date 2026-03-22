'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // createBrowserClient stores session in COOKIES → middleware can read it
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : error.message
      )
      setLoading(false)
      return
    }

    if (data.user) {
      // Check if admin to redirect correctly
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()

      // Hard navigate so browser sends fresh request with new cookies
      window.location.href = profile?.is_admin ? '/admin' : '/dashboard'
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07101f; font-family: 'Instrument Sans', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#07101f', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Glow */}
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,180,200,.1), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Nav */}
        <nav style={{ padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'relative', zIndex: 10 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 900, fontSize: 13, color: '#fff' }}>F</div>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: '#e8f0fa', letterSpacing: -.3 }}>FeedbackPro</span>
          </a>
          <div style={{ fontSize: 13, color: '#4a5a72' }}>
            Pas de compte ?{' '}
            <a href="/register" style={{ color: '#00b4c8', textDecoration: 'none', fontWeight: 500 }}>S&apos;inscrire</a>
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#0d1927', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,.5)', animation: 'fadeUp .5s ease' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#028090,#00b4c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(0,180,200,.25)' }}>F</div>
              <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 24, fontWeight: 900, color: '#e8f0fa', letterSpacing: -.5, marginBottom: 6 }}>Connexion</div>
              <div style={{ fontSize: 13.5, color: '#4a5a72' }}>Accédez à votre tableau de bord</div>
            </div>

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6a82', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 7 }}>
                  Adresse email
                </label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required autoComplete="email"
                  style={{ width: '100%', padding: '12px 14px', background: '#070f1d', border: '1.5px solid rgba(255,255,255,.09)', borderRadius: 11, fontSize: 14, color: '#e8f0fa', fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s' }}
                  onFocus={e => (e.target.style.borderColor = '#028090')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.09)')}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#5a6a82', textTransform: 'uppercase', letterSpacing: .6 }}>
                    Mot de passe
                  </label>
                  <a href="/forgot-password" style={{ fontSize: 11, color: '#028090', textDecoration: 'none', fontWeight: 600 }}>
                    Mot de passe oublié ?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: '100%', padding: '12px 42px 12px 14px', background: '#070f1d', border: '1.5px solid rgba(255,255,255,.09)', borderRadius: 11, fontSize: 14, color: '#e8f0fa', fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s' }}
                    onFocus={e => (e.target.style.borderColor = '#028090')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.09)')}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3d4e62', padding: 4, display: 'flex', transition: 'color .15s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#8899b0')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#3d4e62')}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: 13, background: loading ? 'rgba(255,255,255,.05)' : 'linear-gradient(135deg,#028090,#00a8bc)', color: loading ? '#4a5a72' : '#fff', border: 'none', borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 16px rgba(0,180,200,.2)', transition: 'all .2s' }}>
                {loading
                  ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#00b4c8', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />Connexion...</>
                  : <>Se connecter <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>
                }
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#4a5a72', marginTop: 20 }}>
              Pas encore de compte ?{' '}
              <a href="/register" style={{ color: '#00b4c8', textDecoration: 'none', fontWeight: 500 }}>Créer un compte</a>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
