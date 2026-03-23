'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type Lang = 'fr' | 'ar' | 'en'

const FLAGS: Record<Lang, { flag: string; label: string }> = {
  fr: { flag: '🇫🇷', label: 'FR' },
  ar: { flag: '🇲🇦', label: 'AR' },
  en: { flag: '🇬🇧', label: 'EN' },
}

const T: Record<string, Record<Lang, string>> = {
  title:    { fr: 'Connexion', ar: 'تسجيل الدخول', en: 'Sign in' },
  sub:      { fr: 'Accédez à votre tableau de bord', ar: 'الوصول إلى لوحة التحكم', en: 'Access your dashboard' },
  email:    { fr: 'Adresse email', ar: 'البريد الإلكتروني', en: 'Email address' },
  email_ph: { fr: 'votre@email.com', ar: 'بريدك@email.com', en: 'your@email.com' },
  pass:     { fr: 'Mot de passe', ar: 'كلمة المرور', en: 'Password' },
  forgot:   { fr: 'Mot de passe oublié ?', ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
  submit:   { fr: 'Se connecter', ar: 'تسجيل الدخول', en: 'Sign in' },
  loading:  { fr: 'Connexion...', ar: 'جاري...', en: 'Signing in...' },
  no_acc:   { fr: 'Pas de compte ?', ar: 'ليس لديك حساب؟', en: "No account?" },
  register: { fr: "S'inscrire", ar: 'إنشاء حساب', en: 'Sign up' },
  err_inv:  { fr: 'Email ou mot de passe incorrect', ar: 'بريد أو كلمة مرور غير صحيحة', en: 'Invalid email or password' },
}

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const isRTL = lang === 'ar'
  const t = (k: string) => T[k]?.[lang] || k

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? t('err_inv') : error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single()
      window.location.href = profile?.is_admin ? '/admin' : '/dashboard'
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;background:#07101f;font-family:'Instrument Sans',sans-serif;min-height:100%}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .inp{width:100%;padding:12px 13px;background:#070f1d;border:1.5px solid rgba(255,255,255,.09);border-radius:11px;font-size:14px;color:#e8f0fa;font-family:inherit;outline:none;transition:border-color .2s;-webkit-appearance:none}
        .inp:focus{border-color:#028090;background:#060d1a}
        .inp::placeholder{color:#2a3a52}
        .inpp{padding-right:44px}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#07101f', display:'flex', flexDirection:'column' }} dir={isRTL?'rtl':'ltr'}>
        <div style={{ position:'fixed', top:0, left:0, right:0, height:360, background:'radial-gradient(ellipse at 50% 0%,rgba(0,180,200,.1),transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

        {/* NAV */}
        <nav style={{ padding:'0 20px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.06)', position:'relative', zIndex:10, flexShrink:0 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
            <div style={{ width:30, height:30, borderRadius:9, background:'#028090', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cabinet Grotesk,sans-serif', fontWeight:900, fontSize:13, color:'#fff', flexShrink:0 }}>F</div>
            <span style={{ fontFamily:'Cabinet Grotesk,sans-serif', fontWeight:800, fontSize:14, color:'#e8f0fa', letterSpacing:-.3 }}>FeedbackPro</span>
          </Link>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Flag lang selector */}
            <div style={{ display:'flex', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:9, padding:3, gap:2 }}>
              {(Object.entries(FLAGS) as [Lang, typeof FLAGS[Lang]][]).map(([code, info]) => (
                <button key={code} onClick={() => setLang(code)} title={code.toUpperCase()}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700, background:lang===code?'#028090':'transparent', color:lang===code?'#fff':'#5a6a82', transition:'all .15s', whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:14 }}>{info.flag}</span>
                  <span style={{ display:'none' }} className="lang-label">{info.label}</span>
                </button>
              ))}
            </div>

            <Link href="/register" style={{ fontSize:13, color:'#00b4c8', textDecoration:'none', fontWeight:500, whiteSpace:'nowrap' }}>{t('register')}</Link>
          </div>
        </nav>

        {/* MAIN */}
        <main style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', position:'relative', zIndex:1 }}>
          <div style={{ width:'100%', maxWidth:420, background:'#0d1927', border:'1px solid rgba(255,255,255,.08)', borderRadius:20, padding:'32px 28px', boxShadow:'0 24px 64px rgba(0,0,0,.5)', animation:'fadeUp .5s ease' }}>

            <div style={{ textAlign:'center', marginBottom:26 }}>
              <div style={{ width:50, height:50, borderRadius:14, background:'linear-gradient(135deg,#028090,#00b4c8)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cabinet Grotesk,sans-serif', fontWeight:900, fontSize:20, color:'#fff', margin:'0 auto 12px', boxShadow:'0 4px 16px rgba(0,180,200,.25)' }}>F</div>
              <div style={{ fontFamily:'Cabinet Grotesk,sans-serif', fontSize:22, fontWeight:900, color:'#e8f0fa', letterSpacing:-.5, marginBottom:4 }}>{t('title')}</div>
              <div style={{ fontSize:13, color:'#4a5a72' }}>{t('sub')}</div>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#5a6a82', textTransform:'uppercase', letterSpacing:.7, marginBottom:6 }}>{t('email')}</label>
                <input className="inp" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('email_ph')} required autoComplete="email"/>
              </div>

              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'#5a6a82', textTransform:'uppercase', letterSpacing:.7 }}>{t('pass')}</label>
                  <Link href="/forgot-password" style={{ fontSize:11, color:'#028090', textDecoration:'none', fontWeight:600 }}>{t('forgot')}</Link>
                </div>
                <div style={{ position:'relative' }}>
                  <input className="inp inpp" type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
                  <button type="button" onClick={()=>setShowPass(p=>!p)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#3d4e62', padding:4, display:'flex' }}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:9, padding:'10px 13px', fontSize:12.5, color:'#fca5a5', marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width:'100%', padding:13, background:loading?'rgba(255,255,255,.05)':'linear-gradient(135deg,#028090,#00a8bc)', color:loading?'#4a5a72':'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:loading?'none':'0 4px 16px rgba(0,180,200,.2)', transition:'all .2s' }}>
                {loading
                  ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>{t('loading')}</>
                  : <>{t('submit')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                }
              </button>
            </form>

            <div style={{ textAlign:'center', fontSize:13, color:'#4a5a72', marginTop:16 }}>
              {t('no_acc')}{' '}
              <Link href="/register" style={{ color:'#00b4c8', textDecoration:'none', fontWeight:600 }}>{t('register')}</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
