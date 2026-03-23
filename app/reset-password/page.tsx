'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function ResetForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    async function init() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Listen for PASSWORD_RECOVERY event (triggered by hash fragment)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setReady(true)
        }
      })

      // Also try code-based flow
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setError('Lien invalide ou expiré.')
        } else {
          setReady(true)
        }
      }

      // Fallback: if hash contains access_token, Supabase SDK handles it automatically
      const hash = window.location.hash
      if (hash.includes('access_token') || hash.includes('type=recovery')) {
        // SDK will fire onAuthStateChange with PASSWORD_RECOVERY
        // Just wait for it
        setTimeout(() => {
          if (!ready) setReady(true)
        }, 1500)
      } else if (!code) {
        setTimeout(() => {
          setError('Lien invalide ou expiré. Veuillez refaire une demande.')
        }, 2000)
      }

      return () => subscription.unsubscribe()
    }
    init()
  }, [ready, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6) { setError('Minimum 6 caractères.'); return }
    setLoading(true)
    setError('')

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => { window.location.replace('/login') }, 2000)
  }

  if (done) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 20, fontWeight: 900, color: '#e8f0fa', marginBottom: 8 }}>Mot de passe mis à jour !</div>
      <div style={{ fontSize: 13, color: '#4a5a72' }}>Redirection vers la connexion...</div>
    </div>
  )

  if (error && !ready) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 18, fontWeight: 900, color: '#e8f0fa', marginBottom: 8 }}>Lien invalide</div>
      <div style={{ fontSize: 13, color: '#4a5a72', marginBottom: 24, lineHeight: 1.6 }}>{error}</div>
      <Link href="/forgot-password" style={{ display: 'inline-flex', padding: '11px 24px', background: '#028090', color: '#fff', borderRadius: 11, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Nouvelle demande</Link>
    </div>
  )

  if (!ready) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,.07)', borderTopColor: '#028090', animation: 'spin .8s linear infinite', margin: '0 auto 14px' }}/>
      <div style={{ fontSize: 13, color: '#4a5a72' }}>Vérification du lien...</div>
    </div>
  )

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', background: '#070f1d', border: '1.5px solid rgba(255,255,255,.09)', borderRadius: 11, fontSize: 14, color: '#e8f0fa', fontFamily: 'inherit', outline: 'none' }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#028090,#00b4c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 22, fontWeight: 900, color: '#e8f0fa', letterSpacing: -.5, marginBottom: 6 }}>Nouveau mot de passe</div>
        <div style={{ fontSize: 13, color: '#4a5a72' }}>Choisissez un mot de passe sécurisé.</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#5a6a82', textTransform: 'uppercase' as const, letterSpacing: .6 }}>Nouveau mot de passe</label>
            <span style={{ fontSize: 11, color: password.length >= 6 ? '#10B981' : password.length > 0 ? '#EF4444' : '#3d4e62' }}>
              {password.length >= 6 ? '✓ OK' : password.length > 0 ? `${password.length}/6` : ''}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères" required minLength={6} style={{ ...inp, paddingRight: 42 }}
              onFocus={e => (e.target.style.borderColor = '#028090')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.09)')}/>
            <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3d4e62', padding: 4, display: 'flex' }}>
              {showPass ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6a82', textTransform: 'uppercase' as const, letterSpacing: .6, marginBottom: 7 }}>Confirmer</label>
          <input type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Répétez le mot de passe" required
            style={{ ...inp, borderColor: confirm && confirm !== password ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.09)' }}
            onFocus={e => (e.target.style.borderColor = '#028090')} onBlur={e => (e.target.style.borderColor = confirm && confirm !== password ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.09)')}/>
          {confirm && confirm !== password && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 5 }}>Les mots de passe ne correspondent pas</div>}
          {confirm && confirm === password && password.length >= 6 && <div style={{ fontSize: 11, color: '#10B981', marginTop: 5 }}>✓ Correspondent</div>}
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>{error}</div>}
        <button type="submit" disabled={loading || password !== confirm || password.length < 6}
          style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#028090,#00a8bc)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (loading || password !== confirm || password.length < 6) ? 0.5 : 1 }}>
          {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>Mise à jour...</> : 'Enregistrer le mot de passe'}
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
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{ minHeight: '100vh', background: '#07101f', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,180,200,.1), transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>
        <nav style={{ padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'relative', zIndex: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 900, fontSize: 13, color: '#fff' }}>F</div>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: '#e8f0fa', letterSpacing: -.3 }}>FeedbackPro</span>
          </Link>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#0d1927', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,.5)', animation: 'fadeUp .5s ease' }}>
            <Suspense fallback={<div style={{ textAlign: 'center', color: '#4a5a72', padding: '40px 0' }}>Chargement...</div>}>
              <ResetForm/>
            </Suspense>
          </div>
        </main>
      </div>
    </>
  )
}
