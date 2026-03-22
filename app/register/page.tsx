'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Lang = 'fr' | 'ar' | 'en' | 'es'
const LANG_LABELS: Record<Lang, string> = { fr: 'FR', ar: 'عربي', en: 'EN', es: 'ES' }

const T: Record<string, Record<Lang, string>> = {
  already:    { fr: 'Déjà un compte ?', ar: 'لديك حساب؟', en: 'Have an account?', es: '¿Tienes cuenta?' },
  signin:     { fr: 'Se connecter', ar: 'تسجيل الدخول', en: 'Sign in', es: 'Iniciar sesión' },
  create:     { fr: 'Créer un compte', ar: 'إنشاء حساب', en: 'Create account', es: 'Crear cuenta' },
  your_biz:   { fr: 'Votre business', ar: 'نشاطك التجاري', en: 'Your business', es: 'Tu negocio' },
  sub1:       { fr: 'Essai gratuit 14 jours — aucune carte', ar: '14 يوماً مجاناً — لا بطاقة', en: '14-day free trial — no card', es: '14 días gratis — sin tarjeta' },
  sub2:       { fr: "Plus qu'une étape", ar: 'خطوة أخيرة', en: 'One more step', es: 'Un paso más' },
  email:      { fr: 'Email', ar: 'البريد الإلكتروني', en: 'Email', es: 'Correo' },
  email_ph:   { fr: 'votre@email.com', ar: 'بريدك@email.com', en: 'your@email.com', es: 'tu@email.com' },
  pass:       { fr: 'Mot de passe', ar: 'كلمة المرور', en: 'Password', es: 'Contraseña' },
  pass_ph:    { fr: 'Minimum 6 caractères', ar: '6 أحرف على الأقل', en: 'Min 6 characters', es: 'Mín 6 caracteres' },
  cont:       { fr: 'Continuer', ar: 'متابعة', en: 'Continue', es: 'Continuar' },
  biz_name:   { fr: 'Nom du business', ar: 'اسم النشاط', en: 'Business name', es: 'Nombre del negocio' },
  biz_ph:     { fr: 'Restaurant Al Badr', ar: 'مطعم الفيصل', en: 'My Business', es: 'Mi Negocio' },
  city:       { fr: 'Ville', ar: 'المدينة', en: 'City', es: 'Ciudad' },
  city_ph:    { fr: 'Choisir une ville...', ar: 'اختر مدينة...', en: 'Choose a city...', es: 'Elige una ciudad...' },
  biz_type:   { fr: 'Type de business', ar: 'نوع النشاط', en: 'Business type', es: 'Tipo de negocio' },
  specify_ph: { fr: 'Ex: Spa, pharmacie, épicerie...', ar: 'مثال: صالون، صيدلية...', en: 'E.g. Spa, pharmacy...', es: 'Ej: Spa, farmacia...' },
  finish:     { fr: 'Continuer →', ar: 'متابعة →', en: 'Continue →', es: 'Continuar →' },
  creating:   { fr: 'Création...', ar: 'جاري الإنشاء...', en: 'Creating...', es: 'Creando...' },
  back:       { fr: 'Retour', ar: 'رجوع', en: 'Back', es: 'Volver' },
  trial_b:    { fr: '14 jours gratuits · Aucune carte', ar: '14 يوماً مجاناً · لا بطاقة', en: '14 days free · No card', es: '14 días gratis · Sin tarjeta' },
}

const SECTORS: Record<Lang, { value: string; label: string; icon: string }[]> = {
  fr: [{value:'restaurant',label:'Restaurant / Café',icon:'🍽️'},{value:'gym',label:'Salle de sport',icon:'🏋️'},{value:'hotel',label:'Hôtel / Riad',icon:'🏨'},{value:'car_rental',label:'Location voiture',icon:'🚗'},{value:'other',label:'Autre',icon:'🏪'}],
  ar: [{value:'restaurant',label:'مطعم / مقهى',icon:'🍽️'},{value:'gym',label:'صالة رياضية',icon:'🏋️'},{value:'hotel',label:'فندق / رياض',icon:'🏨'},{value:'car_rental',label:'تأجير سيارات',icon:'🚗'},{value:'other',label:'أخرى',icon:'🏪'}],
  en: [{value:'restaurant',label:'Restaurant / Café',icon:'🍽️'},{value:'gym',label:'Gym',icon:'🏋️'},{value:'hotel',label:'Hotel / Riad',icon:'🏨'},{value:'car_rental',label:'Car rental',icon:'🚗'},{value:'other',label:'Other',icon:'🏪'}],
  es: [{value:'restaurant',label:'Restaurante',icon:'🍽️'},{value:'gym',label:'Gimnasio',icon:'🏋️'},{value:'hotel',label:'Hotel / Riad',icon:'🏨'},{value:'car_rental',label:'Alquiler',icon:'🚗'},{value:'other',label:'Otro',icon:'🏪'}],
}

const CITIES_FR = ['Casablanca','Rabat','Salé','Témara','Mohammedia','Berrechid','Settat','Tanger','Tétouan','Al Hoceïma','Nador','Oujda','Chefchaouen','Larache','Fès','Meknès','Ifrane','Khénifra','Béni Mellal','Khouribga','Marrakech','Agadir','Essaouira','Ouarzazate','Laâyoune','Dakhla','Tiznit','Taroudant','Errachidia','Midelt']
const CITIES_AR = ['الدار البيضاء','الرباط','سلا','تمارة','المحمدية','بريشيد','سطات','طنجة','تطوان','الحسيمة','الناظور','وجدة','شفشاون','العرائش','فاس','مكناس','إفران','خنيفرة','بني ملال','خريبكة','مراكش','أكادير','الصويرة','ورزازات','العيون','الداخلة','تيزنيت','تارودانت','الراشيدية','ميدلت']

export default function RegisterPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [bizName, setBizName] = useState('')
  const [city, setCity] = useState('')
  const [sector, setSector] = useState('restaurant')
  const [otherSector, setOtherSector] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isRTL = lang === 'ar'
  const t = (k: string) => T[k]?.[lang] || T[k]?.fr || k
  const cities = lang === 'ar' ? CITIES_AR : CITIES_FR

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true)
    setError('')

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
      if (authErr || !authData.user) {
        setError(authErr?.message || 'Registration failed')
        setLoading(false)
        return
      }

      const finalSector = sector === 'other' && otherSector.trim() ? otherSector.trim() : sector

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          businessName: bizName,
          city,
          sector: finalSector,
          categories: [], // Will be set in /setup
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create business')
        setLoading(false)
        return
      }

      // Go to setup to configure questions
      window.location.href = '/setup'
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue. Réessayez.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 13px', background: '#070f1d', border: '1.5px solid rgba(255,255,255,.09)', borderRadius: 10, fontSize: 13.5, color: '#e8f0fa', fontFamily: 'inherit', outline: 'none', transition: 'border-color .2s' }
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5a72' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 13px center', paddingRight: 34 }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus,select:focus{border-color:#028090 !important;background:#060d1a !important}
        input::placeholder{color:#2a3a52}
      `}</style>

      <div style={{ minHeight: '100vh', background: '#07101f', display: 'flex', flexDirection: 'column', position: 'relative' }} dir={isRTL ? 'rtl' : 'ltr'}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,180,200,.1), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <nav style={{ padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'relative', zIndex: 10 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 900, fontSize: 13, color: '#fff' }}>F</div>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: '#e8f0fa', letterSpacing: -.3 }}>FeedbackPro</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4a5a72' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: 3, gap: 2 }}>
              {(['fr','ar','en','es'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', background: lang === l ? '#028090' : 'transparent', color: lang === l ? '#fff' : '#3d4e62', transition: 'all .15s' }}>
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
            <span>{t('already')}</span>
            <a href="/login" style={{ color: '#00b4c8', textDecoration: 'none', fontWeight: 500 }}>{t('signin')}</a>
          </div>
        </nav>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: 460, background: '#0d1927', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '36px 36px', boxShadow: '0 24px 64px rgba(0,0,0,.5)', animation: 'fadeUp .5s ease' }}>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#028090,#00b4c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(0,180,200,.25)' }}>F</div>
              <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 22, fontWeight: 900, color: '#e8f0fa', letterSpacing: -.5, marginBottom: 5 }}>{step === 1 ? t('create') : t('your_biz')}</div>
              <div style={{ fontSize: 13, color: '#4a5a72' }}>{step === 1 ? t('sub1') : t('sub2')}</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                {[1,2,3].map(s => <div key={s} style={{ height: 3, borderRadius: 2, flex: 1, maxWidth: 32, background: step >= s ? '#028090' : 'rgba(255,255,255,.07)', transition: 'all .3s' }}/>)}
              </div>
              <div style={{ fontSize: 11, color: '#2a3a52', marginTop: 6 }}>Étape {step} sur 3</div>
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div style={{ animation: 'slideIn .25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 13px', background: 'rgba(0,180,200,.06)', border: '1px solid rgba(0,180,200,.14)', borderRadius: 9, fontSize: 12, color: '#7dd8e0', marginBottom: 16 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00b4c8' }}/>
                    {t('trial_b')}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4a5a72', textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{t('email')}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email_ph')} required autoComplete="email" style={inp}/>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4a5a72', textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{t('pass')}</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('pass_ph')} required minLength={6} style={{ ...inp, paddingRight: 42 }}/>
                      <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3d4e62', padding: 4, display: 'flex' }}>
                        {showPass ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                  </div>
                  {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9, padding: '10px 13px', fontSize: 12.5, color: '#fca5a5', marginBottom: 13, display: 'flex', alignItems: 'center', gap: 7 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
                  <button type="submit" style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#028090,#00a8bc)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(0,180,200,.18)', marginTop: 8 }}>
                    {t('cont')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
              )}

              {step === 2 && (
                <div style={{ animation: 'slideIn .25s ease' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3d4e62', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', marginBottom: 16, padding: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    {t('back')}
                  </button>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4a5a72', textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{t('biz_name')}</label>
                    <input type="text" value={bizName} onChange={e => setBizName(e.target.value)} placeholder={t('biz_ph')} required style={inp}/>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4a5a72', textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{t('city')}</label>
                    <select value={city} onChange={e => setCity(e.target.value)} required style={sel}>
                      <option value="" disabled>{t('city_ph')}</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#4a5a72', textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{t('biz_type')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                      {SECTORS[lang].map(s => (
                        <div key={s.value} onClick={() => { setSector(s.value); if (s.value !== 'other') setOtherSector('') }}
                          style={{ padding: '11px 7px', borderRadius: 10, border: `1px solid ${sector === s.value ? '#028090' : 'rgba(255,255,255,.07)'}`, background: sector === s.value ? 'rgba(0,180,200,.07)' : '#070f1d', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                          <div style={{ fontSize: 20, marginBottom: 3 }}>{s.icon}</div>
                          <div style={{ fontSize: 11, color: sector === s.value ? '#7dd8e0' : '#5a6a82', fontWeight: 500 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {sector === 'other' && (
                      <div style={{ marginTop: 8 }}>
                        <input type="text" value={otherSector} onChange={e => setOtherSector(e.target.value)} placeholder={t('specify_ph')} required style={inp}/>
                      </div>
                    )}
                  </div>
                  {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9, padding: '10px 13px', fontSize: 12.5, color: '#fca5a5', marginBottom: 13, display: 'flex', alignItems: 'center', gap: 7 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: 13, background: loading ? 'rgba(255,255,255,.05)' : 'linear-gradient(135deg,#028090,#00a8bc)', color: loading ? '#4a5a72' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 8 }}>
                    {loading ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }}/>{t('creating')}</> : <>{t('finish')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
                  </button>
                </div>
              )}
            </form>

            <div style={{ textAlign: 'center', fontSize: 12.5, color: '#3d4e62', marginTop: 18 }}>
              {step === 1 ? <>{t('already')} <a href="/login" style={{ color: '#00b4c8', textDecoration: 'none', fontWeight: 500 }}>{t('signin')}</a></> : <>Besoin d&apos;aide ? <a href="mailto:support@feedbackpro.ma" style={{ color: '#00b4c8', textDecoration: 'none', fontWeight: 500 }}>Contact</a></>}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
