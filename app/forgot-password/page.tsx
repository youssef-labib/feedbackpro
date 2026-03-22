'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
        .page{min-height:100vh;display:flex;flex-direction:column;background:#07101f}
        .page::before{content:'';position:fixed;top:0;left:50%;transform:translateX(-50%);width:700px;height:400px;background:radial-gradient(ellipse at 50% 0%,rgba(0,180,200,.1),transparent 70%);pointer-events:none;z-index:0}
        .nav{padding:0 40px;height:60px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);position:relative;z-index:10}
        .logo{display:flex;align-items:center;gap:9px;text-decoration:none}
        .logo-mark{width:30px;height:30px;border-radius:9px;background:#028090;display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:13px;color:#fff}
        .logo-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:14px;color:#e8f0fa;letter-spacing:-.3px}
        .nav-right a{color:#00b4c8;text-decoration:none;font-weight:500;font-size:13px}
        .main{flex:1;display:flex;align-items:center;justify-content:center;padding:32px 20px;position:relative;z-index:1}
        .card{width:100%;max-width:420px;background:#0d1927;border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:40px 36px;box-shadow:0 24px 64px rgba(0,0,0,.5)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .card{animation:fadeUp .5s ease}
        .card-top{text-align:center;margin-bottom:28px}
        .icon-wrap{width:52px;height:52px;border-radius:15px;background:rgba(0,180,200,.1);border:1px solid rgba(0,180,200,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
        .card-title{font-family:'Cabinet Grotesk',sans-serif;font-size:22px;font-weight:900;color:#e8f0fa;letter-spacing:-.5px;margin-bottom:8px}
        .card-sub{font-size:13px;color:#4a5a72;line-height:1.6}
        .field{margin-bottom:18px}
        .field label{display:block;font-size:11px;font-weight:700;color:#5a6a82;text-transform:uppercase;letter-spacing:.6px;margin-bottom:7px}
        .iw input{width:100%;padding:12px 14px;background:#070f1d;border:1.5px solid rgba(255,255,255,.09);border-radius:11px;font-size:14px;color:#e8f0fa;font-family:inherit;outline:none;transition:border-color .2s}
        .iw input::placeholder{color:#2a3a52}
        .iw input:focus{border-color:#028090;background:#060d1a}
        .err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:11px 14px;font-size:13px;color:#fca5a5;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .submit{width:100%;padding:13px;background:linear-gradient(135deg,#028090,#00a8bc);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(0,180,200,.2);margin-top:8px}
        .submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,180,200,.3)}
        .submit:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .success{text-align:center;padding:8px 0}
        .success-icon{width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
        .success-title{font-family:'Cabinet Grotesk',sans-serif;font-size:20px;font-weight:900;color:#e8f0fa;margin-bottom:10px;letter-spacing:-.3px}
        .success-sub{font-size:13px;color:#4a5a72;line-height:1.65;max-width:300px;margin:0 auto 24px}
        .foot{text-align:center;font-size:13px;color:#3d4e62;margin-top:20px}
        .foot a{color:#00b4c8;text-decoration:none;font-weight:500}
        .foot a:hover{color:#7dd8e0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @media(max-width:480px){.nav{padding:0 18px}.card{padding:28px 22px}}
      `}</style>

      <div className="page">
        <nav className="nav">
          <a href="/" className="logo">
            <div className="logo-mark">F</div>
            <span className="logo-name">FeedbackPro</span>
          </a>
          <div className="nav-right"><a href="/login">← Retour à la connexion</a></div>
        </nav>

        <main className="main">
          <div className="card">
            {!sent ? (
              <>
                <div className="card-top">
                  <div className="icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00b4c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div className="card-title">Mot de passe oublié</div>
                  <div className="card-sub">Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label>Adresse email</label>
                    <div className="iw">
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="votre@email.com" required autoComplete="email"/>
                    </div>
                  </div>
                  {error && (
                    <div className="err">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </div>
                  )}
                  <button type="submit" className="submit" disabled={loading}>
                    {loading ? <><div className="spin"/>Envoi...</> : <>Envoyer le lien de réinitialisation</>}
                  </button>
                </form>

                <div className="foot"><a href="/login">← Retour à la connexion</a></div>
              </>
            ) : (
              <div className="success">
                <div className="success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="success-title">Email envoyé !</div>
                <div className="success-sub">
                  Vérifiez votre boîte mail à <strong style={{color:'#e8f0fa'}}>{email}</strong>. Cliquez sur le lien pour créer un nouveau mot de passe.
                </div>
                <a href="/login" style={{display:'inline-flex',alignItems:'center',gap:7,padding:'11px 24px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:11,color:'#8899b0',fontSize:13,fontWeight:500,textDecoration:'none',transition:'all .15s'}}>
                  Retour à la connexion
                </a>
                <div style={{fontSize:12,color:'#2a3a52',marginTop:16}}>
                  Pas reçu ? Vérifiez vos spams ou <button onClick={() => setSent(false)} style={{background:'none',border:'none',color:'#00b4c8',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>réessayez</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
