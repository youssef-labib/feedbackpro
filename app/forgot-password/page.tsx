'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) { setError(error.message); setLoading(false); return }
      setSent(true)
    } catch {
      setError('Une erreur est survenue.')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus{border-color:#028090 !important;background:#060d1a !important}
        input::placeholder{color:#2a3a52}
      `}</style>
      <div style={{ minHeight: '100vh', background: '#07101f', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,180,200,.1), transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>
        <nav style={{ padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'relative', zIndex: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 900, fontSize: 13, color: '#fff' }}>F</div>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: '#e8f0fa', letterSpacing: -.3 }}>FeedbackPro</span>
          </Link>
          <Link href="/login" style={{ color: '#00b4c8', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>← Retour à la connexion</Link>
        </nav>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#0d1927', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,.5)', animation: 'fadeUp .5s ease' }}>
            {!sent ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(0,180,200,.1)', border: '1px solid rgba(0,180,200,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00b4c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 22, fontWeight: 900, color: '#e8f0fa', letterSpacing: -.5, marginBottom: 8 }}>Mot de passe oublié</div>
                  <div style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.6 }}>Entrez votre email et nous vous enverrons un lien de réinitialisation.</div>
                </div>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6a82', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 7 }}>Adresse email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required
                      style={{ width: '100%', padding: '12px 14px', background: '#070f1d', border: '1.5px solid rgba(255,255,255,.09)', borderRadius: 11, fontSize: 14, color: '#e8f0fa', fontFamily: 'inherit', outline: 'none' }}/>
                  </div>
                  {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>{error}</div>}
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: 13, background: loading ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#028090,#00a8bc)', color: loading ? '#4a5a72' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>Envoi...</> : 'Envoyer le lien'}
                  </button>
                </form>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#3d4e62', marginTop: 20 }}>
                  <Link href="/login" style={{ color: '#00b4c8', textDecoration: 'none', fontWeight: 500 }}>← Retour à la connexion</Link>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 20, fontWeight: 900, color: '#e8f0fa', marginBottom: 8 }}>Email envoyé !</div>
                <div style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.65, maxWidth: 300, margin: '0 auto 24px' }}>
                  Vérifiez votre boîte mail à <strong style={{ color: '#e8f0fa' }}>{email}</strong> et cliquez sur le lien.
                </div>
                <Link href="/login" style={{ display: 'inline-flex', padding: '11px 24px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, color: '#8899b0', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  Retour à la connexion
                </Link>
                <div style={{ fontSize: 12, color: '#2a3a52', marginTop: 16 }}>
                  Pas reçu ?{' '}
                  <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: '#00b4c8', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Réessayer</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
