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

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : error.message
      )
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
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
        .nav-right{font-size:13px;color:#4a5a72}
        .nav-right a{color:#00b4c8;text-decoration:none;font-weight:500;margin-left:5px}
        .main{flex:1;display:flex;align-items:center;justify-content:center;padding:32px 20px;position:relative;z-index:1}
        .card{width:100%;max-width:420px;background:#0d1927;border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:40px 36px;box-shadow:0 24px 64px rgba(0,0,0,.5)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .card{animation:fadeUp .5s ease}
        .card-top{text-align:center;margin-bottom:32px}
        .card-mark{width:52px;height:52px;border-radius:15px;background:linear-gradient(135deg,#028090,#00b4c8);display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:22px;color:#fff;margin:0 auto 16px;box-shadow:0 4px 16px rgba(0,180,200,.25)}
        .card-title{font-family:'Cabinet Grotesk',sans-serif;font-size:24px;font-weight:900;color:#e8f0fa;letter-spacing:-.5px;margin-bottom:6px}
        .card-sub{font-size:13.5px;color:#4a5a72}
        .field{margin-bottom:16px}
        .field label{display:block;font-size:11px;font-weight:700;color:#5a6a82;text-transform:uppercase;letter-spacing:.6px;margin-bottom:7px}
        .field-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
        .field-head label{margin-bottom:0}
        .forgot-link{font-size:11px;color:#028090;text-decoration:none;font-weight:600;transition:color .15s}
        .forgot-link:hover{color:#00b4c8}
        .iw{position:relative}
        .iw input{width:100%;padding:12px 14px;background:#070f1d;border:1.5px solid rgba(255,255,255,.09);border-radius:11px;font-size:14px;color:#e8f0fa;font-family:inherit;outline:none;transition:border-color .2s}
        .iw input::placeholder{color:#2a3a52}
        .iw input:focus{border-color:#028090;background:#060d1a}
        .eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#3d4e62;padding:4px;display:flex;transition:color .15s}
        .eye:hover{color:#8899b0}
        .err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:11px 14px;font-size:13px;color:#fca5a5;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .submit{width:100%;padding:13px;background:linear-gradient(135deg,#028090,#00a8bc);color:#fff;border:none;border-radius:12px;font-size:14.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(0,180,200,.2);margin-top:8px}
        .submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,180,200,.3)}
        .submit:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .foot{text-align:center;font-size:13px;color:#4a5a72;margin-top:20px}
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
          <div className="nav-right">
            Pas de compte ?<a href="/register">S&apos;inscrire</a>
          </div>
        </nav>

        <main className="main">
          <div className="card">
            <div className="card-top">
              <div className="card-mark">F</div>
              <div className="card-title">Connexion</div>
              <div className="card-sub">Accédez à votre tableau de bord</div>
            </div>

            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Adresse email</label>
                <div className="iw">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" required autoComplete="email"/>
                </div>
              </div>

              <div className="field">
                <div className="field-head">
                  <label style={{fontSize:11,fontWeight:700,color:'#5a6a82',textTransform:'uppercase',letterSpacing:'.6px'}}>
                    Mot de passe
                  </label>
                  <a href="/forgot-password" className="forgot-link">Mot de passe oublié ?</a>
                </div>
                <div className="iw">
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required style={{ paddingRight: 42 }}/>
                  <button type="button" className="eye" onClick={() => setShowPass(p => !p)}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div className="err">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="submit" disabled={loading}>
                {loading
                  ? <><div className="spin"/>Connexion...</>
                  : <>Se connecter <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                }
              </button>
            </form>

            <div className="foot">
              Pas encore de compte ? <a href="/register">Créer un compte</a>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
