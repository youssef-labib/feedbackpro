'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Lang = 'fr' | 'ar' | 'en' | 'es'

const T: Record<string, Record<Lang, string>> = {
  title:    { fr: 'Connexion', ar: 'تسجيل الدخول', en: 'Sign in', es: 'Iniciar sesión' },
  sub:      { fr: 'Accédez à votre tableau de bord', ar: 'الوصول إلى لوحة التحكم', en: 'Access your dashboard', es: 'Accede a tu panel' },
  email:    { fr: 'Adresse email', ar: 'البريد الإلكتروني', en: 'Email address', es: 'Correo electrónico' },
  email_ph: { fr: 'votre@email.com', ar: 'بريدك@email.com', en: 'your@email.com', es: 'tu@email.com' },
  pass:     { fr: 'Mot de passe', ar: 'كلمة المرور', en: 'Password', es: 'Contraseña' },
  pass_ph:  { fr: '••••••••', ar: '••••••••', en: '••••••••', es: '••••••••' },
  forgot:   { fr: 'Mot de passe oublié ?', ar: 'نسيت كلمة المرور؟', en: 'Forgot password?', es: '¿Olvidaste la contraseña?' },
  submit:   { fr: 'Se connecter', ar: 'تسجيل الدخول', en: 'Sign in', es: 'Iniciar sesión' },
  loading:  { fr: 'Connexion...', ar: 'جاري تسجيل الدخول...', en: 'Signing in...', es: 'Iniciando sesión...' },
  no_acc:   { fr: 'Pas encore de compte ?', ar: 'ليس لديك حساب؟', en: "Don't have an account?", es: '¿No tienes cuenta?' },
  register: { fr: 'Créer un compte', ar: 'إنشاء حساب', en: 'Create account', es: 'Crear cuenta' },
  err_inv:  { fr: 'Email ou mot de passe incorrect', ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Invalid email or password', es: 'Email o contraseña incorrectos' },
}

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const isRTL = lang === 'ar'
  const t = (k: string) => T[k]?.[lang] || T[k]?.fr || k

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
      setError(error.message === 'Invalid login credentials' ? t('err_inv') : error.message)
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  const LANGS: { code: Lang; label: string }[] = [
    { code: 'fr', label: 'FR' }, { code: 'ar', label: 'عربي' },
    { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;background:#07101f;font-family:'Instrument Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus{border-color:#028090!important;background:#060d1a!important;outline:none}
        input::placeholder{color:#2a3a52}
      `}</style>

      <div style={{minHeight:'100vh',background:'#07101f',display:'flex',flexDirection:'column',position:'relative'}} dir={isRTL?'rtl':'ltr'}>
        <div style={{position:'fixed',top:0,left:0,right:0,height:400,background:'radial-gradient(ellipse at 50% 0%,rgba(0,180,200,.1),transparent 70%)',pointerEvents:'none',zIndex:0}}/>

        {/* NAV */}
        <nav style={{padding:'0 24px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(255,255,255,.06)',position:'relative',zIndex:10}}>
          <a href="/" style={{display:'flex',alignItems:'center',gap:9,textDecoration:'none'}}>
            <div style={{width:30,height:30,borderRadius:9,background:'#028090',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cabinet Grotesk,sans-serif',fontWeight:900,fontSize:13,color:'#fff'}}>F</div>
            <span style={{fontFamily:'Cabinet Grotesk,sans-serif',fontWeight:800,fontSize:14,color:'#e8f0fa',letterSpacing:-.3}}>FeedbackPro</span>
          </a>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {/* Lang switcher */}
            <div style={{display:'flex',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:9,padding:3,gap:2}}>
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  style={{padding:'3px 8px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit',background:lang===l.code?'#028090':'transparent',color:lang===l.code?'#fff':'#4a5a72',transition:'all .15s'}}>
                  {l.label}
                </button>
              ))}
            </div>
            <span style={{fontSize:13,color:'#4a5a72',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>
              {T['no_acc'][lang]} <a href="/register" style={{color:'#00b4c8',textDecoration:'none',fontWeight:500}}>{T['register'][lang]}</a>
            </span>
          </div>
        </nav>

        {/* CARD */}
        <main style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'28px 20px',position:'relative',zIndex:1}}>
          <div style={{width:'100%',maxWidth:420,background:'#0d1927',border:'1px solid rgba(255,255,255,.08)',borderRadius:22,padding:'36px 32px',boxShadow:'0 24px 64px rgba(0,0,0,.5)',animation:'fadeUp .5s ease'}}>
            <div style={{textAlign:'center',marginBottom:28}}>
              <div style={{width:52,height:52,borderRadius:15,background:'linear-gradient(135deg,#028090,#00b4c8)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cabinet Grotesk,sans-serif',fontWeight:900,fontSize:22,color:'#fff',margin:'0 auto 14px',boxShadow:'0 4px 16px rgba(0,180,200,.25)'}}>F</div>
              <div style={{fontFamily:'Cabinet Grotesk,sans-serif',fontSize:22,fontWeight:900,color:'#e8f0fa',letterSpacing:-.5,marginBottom:5}}>{t('title')}</div>
              <div style={{fontSize:13,color:'#4a5a72'}}>{t('sub')}</div>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{marginBottom:15}}>
                <label style={{display:'block',fontSize:10,fontWeight:700,color:'#5a6a82',textTransform:'uppercase',letterSpacing:.7,marginBottom:6}}>{t('email')}</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('email_ph')} required
                  style={{width:'100%',padding:'11px 13px',background:'#070f1d',border:'1.5px solid rgba(255,255,255,.09)',borderRadius:10,fontSize:14,color:'#e8f0fa',fontFamily:'inherit'}}/>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <label style={{fontSize:10,fontWeight:700,color:'#5a6a82',textTransform:'uppercase',letterSpacing:.7}}>{t('pass')}</label>
                  <a href="/forgot-password" style={{fontSize:11,color:'#028090',textDecoration:'none',fontWeight:600}}>{t('forgot')}</a>
                </div>
                <div style={{position:'relative'}}>
                  <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={t('pass_ph')} required
                    style={{width:'100%',padding:'11px 42px 11px 13px',background:'#070f1d',border:'1.5px solid rgba(255,255,255,.09)',borderRadius:10,fontSize:14,color:'#e8f0fa',fontFamily:'inherit'}}/>
                  <button type="button" onClick={()=>setShowPass(p=>!p)} style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#3d4e62',padding:4,display:'flex'}}>
                    {showPass?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              {error&&<div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:9,padding:'10px 13px',fontSize:12.5,color:'#fca5a5',marginBottom:14,display:'flex',alignItems:'center',gap:7}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
              <button type="submit" disabled={loading}
                style={{width:'100%',padding:13,background:loading?'rgba(255,255,255,.05)':'linear-gradient(135deg,#028090,#00a8bc)',color:loading?'#4a5a72':'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:loading?'none':'0 4px 16px rgba(0,180,200,.2)'}}>
                {loading?<><div style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>{t('loading')}</>:<>{t('submit')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
              </button>
            </form>
            <div style={{textAlign:'center',fontSize:12.5,color:'#4a5a72',marginTop:18}}>
              {t('no_acc')} <a href="/register" style={{color:'#00b4c8',textDecoration:'none',fontWeight:500}}>{t('register')}</a>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
