'use client'

import { useState, useEffect, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'

function ResetForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Supabase puts the token in the URL hash: #access_token=...&type=recovery
    // We listen for the PASSWORD_RECOVERY event which fires automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
      if (event === 'SIGNED_IN' && session) {
        // Also handle PKCE code flow
        setReady(true)
      }
    })

    // Also try exchanging code from URL query params (PKCE flow)
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError('Lien invalide ou expiré.')
        } else {
          setReady(true)
        }
      })
    }

    // If no code and no hash, show error after short delay
    const timeout = setTimeout(() => {
      const hash = window.location.hash
      if (!code && !hash.includes('access_token')) {
        setError('Lien invalide ou expiré. Veuillez refaire une demande.')
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6) { setError('Minimum 6 caractères.'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }

    setDone(true)
    setTimeout(() => { window.location.href = '/dashboard' }, 2000)
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ fontFamily: 'Cabinet Grotesk,sans-serif', fontSize: 20, fontWeight: 900, color: '#e8f0fa', marginBottom: 8, letterSpacing: -.3 }}>
          Mot de passe mis à jour !
        </div>
        <div style={{ fontSize: 13, color: '#4a5a72' }}>Redirection vers votre tableau de bord...</div>
      </div>
    )
  }

  if (error && !ready) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div style={{ fontFamily: 'Cabinet Grotesk,sans-serif', fontSize: 18, fontWeight: 900, color: '#e8f0fa', marginBottom: 8 }}>Lien invalide</div>
        <div style={{ fontSize: 13, color: '#4a5a72', marginBottom: 24, lineHeight: 1.6 }}>{error}</div>
        <a href="/forgot-password" style={{ display: 'inline-flex', padding: '11px 24px', background: '#028090', color: '#fff', borderRadius: 11, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .15s' }}>
          Nouvelle demande
        </a>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,.07)', borderTopColor: '#028090', animation: 'spin .8s linear infinite', margin: '0 auto 14px' }}/>
        <div style={{ fontSize: 13, color: '#4a5a72' }}>Vérification du lien...</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#028090,#00b4c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(0,180,200,.25)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{ fontFamily: 'Cabinet Grotesk,sans-serif', fontSize: 22, fontWeight: 900, color: '#e8f0fa', letterSpacing: -.5, marginBottom: 6 }}>
          Nouveau mot de passe
        </div>
        <div style={{ fontSize: 13, color: '#4a5a72' }}>Choisissez un mot de passe sécurisé.</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#5a6a82', textTransform: 'uppercase' as const, letterSpacing: '.6px' }}>
              Nouveau mot de passe
            </label>
            <span style={{ fontSize: 11, color: password.length > 0 && password.length < 6 ? '#EF4444' : password.length >= 6 ? '#10B981' : '#3d4e62' }}>
              {password.length >= 6 ? '✓ Sécurisé' : password.length > 0 ? `${password.length}/6 min` : ''}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              required minLength={6}
              style={{ width: '100%', padding: '12px 42px 12px 14px', background: '#070f1d', border: '1.5px solid rgba(255,255,255,.09)', borderRadius: 11, fontSize: 14, color: '#e8f0fa', fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s' }}
              onFocus={e => (e.target.style.borderColor = '#028090')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.09)')}
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3d4e62', padding: 4, display: 'flex' }}>
              {showPass
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6a82', textTransform: 'uppercase' as const, letterSpacing: '.6px', marginBottom: 7 }}>
            Confirmer le mot de passe
          </label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Répétez le mot de passe"
            required
            style={{ width: '100%', padding: '12px 14px', background: '#070f1d', border: `1.5px solid ${confirm && confirm !== password ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.09)'}`, borderRadius: 11, fontSize: 14, color: '#e8f0fa', fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s' }}
            onFocus={e => (e.target.style.borderColor = '#028090')}
            onBlur={e => (e.target.style.borderColor = confirm && confirm !== password ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.09)')}
          />
          {confirm && confirm !== password && (
            <div style={{ fontSize: 11, color: '#EF4444', marginTop: 5 }}>Les mots de passe ne correspondent pas</div>
          )}
          {confirm && confirm === password && password.length >= 6 && (
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 5 }}>✓ Les mots de passe correspondent</div>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <button type="submit"
          disabled={loading || !password || !confirm || password !== confirm || password.length < 6}
          style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#028090,#00a8bc)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,180,200,.2)', opacity: (loading || password !== confirm || password.length < 6) ? 0.5 : 1 }}>
          {loading
            ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>Mise à jour...</>
            : 'Enregistrer le nouveau mot de passe'
          }
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
        .page{min-height:100vh;display:flex;flex-direction:column;background:#07101f}
        .page::before{content:'';position:fixed;top:0;left:50%;transform:translateX(-50%);width:700px;height:400px;background:radial-gradient(ellipse at 50% 0%,rgba(0,180,200,.1),transparent 70%);pointer-events:none;z-index:0}
        .nav{padding:0 40px;height:60px;display:flex;align-items:center;border-bottom:1px solid rgba(255,255,255,.06);position:relative;z-index:10}
        .logo{display:flex;align-items:center;gap:9px;text-decoration:none}
        .logo-mark{width:30px;height:30px;border-radius:9px;background:#028090;display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:13px;color:#fff}
        .logo-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:14px;color:#e8f0fa;letter-spacing:-.3px}
        .main{flex:1;display:flex;align-items:center;justify-content:center;padding:32px 20px;position:relative;z-index:1}
        .card{width:100%;max-width:420px;background:#0d1927;border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:40px 36px;box-shadow:0 24px 64px rgba(0,0,0,.5)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .card{animation:fadeUp .5s ease}
        @media(max-width:480px){.nav{padding:0 18px}.card{padding:28px 22px}}
      `}</style>

      <div className="page">
        <nav className="nav">
          <a href="/" className="logo">
            <div className="logo-mark">F</div>
            <span className="logo-name">FeedbackPro</span>
          </a>
        </nav>
        <main className="main">
          <div className="card">
            <Suspense fallback={<div style={{ textAlign: 'center', color: '#4a5a72', padding: '40px 0' }}>Chargement...</div>}>
              <ResetForm/>
            </Suspense>
          </div>
        </main>
      </div>
    </>
  )
}
