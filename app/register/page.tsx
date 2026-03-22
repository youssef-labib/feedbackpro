'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Lang = 'fr' | 'ar' | 'en' | 'es'
const LANG_LABELS: Record<Lang, string> = { fr: 'FR', ar: 'عربي', en: 'EN', es: 'ES' }

const T: Record<string, Record<Lang, string>> = {
  already:   { fr: 'Déjà un compte ?', ar: 'لديك حساب؟', en: 'Have an account?', es: '¿Tienes cuenta?' },
  signin:    { fr: 'Se connecter', ar: 'تسجيل الدخول', en: 'Sign in', es: 'Iniciar sesión' },
  create:    { fr: 'Créer un compte', ar: 'إنشاء حساب', en: 'Create account', es: 'Crear cuenta' },
  your_biz:  { fr: 'Votre business', ar: 'نشاطك التجاري', en: 'Your business', es: 'Tu negocio' },
  sub1:      { fr: 'Essai gratuit 14 jours — aucune carte', ar: '14 يوماً مجاناً — لا بطاقة', en: '14-day free trial — no card', es: '14 días gratis — sin tarjeta' },
  sub2:      { fr: "Plus qu'une étape", ar: 'خطوة أخيرة', en: 'One more step', es: 'Un paso más' },
  email:     { fr: 'Email', ar: 'البريد الإلكتروني', en: 'Email', es: 'Correo' },
  email_ph:  { fr: 'votre@email.com', ar: 'بريدك@email.com', en: 'your@email.com', es: 'tu@email.com' },
  pass:      { fr: 'Mot de passe', ar: 'كلمة المرور', en: 'Password', es: 'Contraseña' },
  pass_ph:   { fr: 'Minimum 6 caractères', ar: 'الحد الأدنى 6 أحرف', en: 'Min 6 characters', es: 'Mín 6 caracteres' },
  cont:      { fr: 'Continuer', ar: 'متابعة', en: 'Continue', es: 'Continuar' },
  biz_name:  { fr: 'Nom du business', ar: 'اسم النشاط', en: 'Business name', es: 'Nombre del negocio' },
  biz_ph:    { fr: 'Restaurant Al Badr', ar: 'مطعم الفيصل', en: 'Al Badr Restaurant', es: 'Restaurante Al Badr' },
  city:      { fr: 'Ville', ar: 'المدينة', en: 'City', es: 'Ciudad' },
  city_ph:   { fr: 'Choisir une ville...', ar: 'اختر مدينة...', en: 'Choose a city...', es: 'Elige una ciudad...' },
  biz_type:  { fr: 'Type de business', ar: 'نوع النشاط', en: 'Business type', es: 'Tipo de negocio' },
  specify:   { fr: 'Précisez votre activité', ar: 'حدد نشاطك', en: 'Specify your activity', es: 'Especifica tu actividad' },
  specify_ph:{ fr: 'Ex: Spa, pharmacie, épicerie...', ar: 'مثال: صالون، صيدلية...', en: 'E.g. Spa, pharmacy...', es: 'Ej: Spa, farmacia...' },
  finish:    { fr: 'Créer mon compte', ar: 'إنشاء حسابي', en: 'Create account', es: 'Crear cuenta' },
  creating:  { fr: 'Création...', ar: 'جاري الإنشاء...', en: 'Creating...', es: 'Creando...' },
  back:      { fr: 'Retour', ar: 'رجوع', en: 'Back', es: 'Volver' },
  trial_b:   { fr: '14 jours gratuits · Aucune carte', ar: '14 يوماً مجاناً · لا بطاقة', en: '14 days free · No card', es: '14 días gratis · Sin tarjeta' },
}

const SECTORS: Record<Lang, { value: string; label: string; icon: string }[]> = {
  fr: [
    {value:'restaurant',label:'Restaurant / Café',icon:'🍽️'},
    {value:'gym',label:'Salle de sport',icon:'🏋️'},
    {value:'hotel',label:'Hôtel / Riad',icon:'🏨'},
    {value:'car_rental',label:'Location voiture',icon:'🚗'},
    {value:'other',label:'Autre',icon:'🏪'},
  ],
  ar: [
    {value:'restaurant',label:'مطعم / مقهى',icon:'🍽️'},
    {value:'gym',label:'صالة رياضية',icon:'🏋️'},
    {value:'hotel',label:'فندق / رياض',icon:'🏨'},
    {value:'car_rental',label:'تأجير سيارات',icon:'🚗'},
    {value:'other',label:'أخرى',icon:'🏪'},
  ],
  en: [
    {value:'restaurant',label:'Restaurant / Café',icon:'🍽️'},
    {value:'gym',label:'Gym',icon:'🏋️'},
    {value:'hotel',label:'Hotel / Riad',icon:'🏨'},
    {value:'car_rental',label:'Car rental',icon:'🚗'},
    {value:'other',label:'Other',icon:'🏪'},
  ],
  es: [
    {value:'restaurant',label:'Restaurante',icon:'🍽️'},
    {value:'gym',label:'Gimnasio',icon:'🏋️'},
    {value:'hotel',label:'Hotel / Riad',icon:'🏨'},
    {value:'car_rental',label:'Alquiler',icon:'🚗'},
    {value:'other',label:'Otro',icon:'🏪'},
  ],
}

const CATS: Record<string, {label_fr:string;label_ar:string;label_en:string;label_es:string}[]> = {
  restaurant:[
    {label_fr:'Qualité de la nourriture',label_ar:'جودة الطعام',label_en:'Food quality',label_es:'Calidad de la comida'},
    {label_fr:'Service & attente',label_ar:'الخدمة',label_en:'Service',label_es:'Servicio'},
    {label_fr:'Propreté',label_ar:'النظافة',label_en:'Cleanliness',label_es:'Limpieza'},
    {label_fr:'Ambiance',label_ar:'الأجواء',label_en:'Ambiance',label_es:'Ambiente'},
  ],
  gym:[
    {label_fr:'Équipements',label_ar:'المعدات',label_en:'Equipment',label_es:'Equipamiento'},
    {label_fr:'Propreté',label_ar:'النظافة',label_en:'Cleanliness',label_es:'Limpieza'},
    {label_fr:'Coaches',label_ar:'المدربون',label_en:'Coaches',label_es:'Entrenadores'},
    {label_fr:'Ambiance',label_ar:'الأجواء',label_en:'Ambiance',label_es:'Ambiente'},
  ],
  hotel:[
    {label_fr:'Chambre',label_ar:'الغرفة',label_en:'Room',label_es:'Habitación'},
    {label_fr:'Accueil',label_ar:'الاستقبال',label_en:'Reception',label_es:'Recepción'},
    {label_fr:'Propreté',label_ar:'النظافة',label_en:'Cleanliness',label_es:'Limpieza'},
    {label_fr:'Petit-déjeuner',label_ar:'الإفطار',label_en:'Breakfast',label_es:'Desayuno'},
  ],
  car_rental:[
    {label_fr:'État du véhicule',label_ar:'حالة السيارة',label_en:'Vehicle condition',label_es:'Estado del vehículo'},
    {label_fr:'Service',label_ar:'الخدمة',label_en:'Service',label_es:'Servicio'},
    {label_fr:'Prix',label_ar:'السعر',label_en:'Price',label_es:'Precio'},
    {label_fr:'Processus',label_ar:'الإجراءات',label_en:'Process',label_es:'Proceso'},
  ],
  other:[
    {label_fr:'Qualité',label_ar:'الجودة',label_en:'Quality',label_es:'Calidad'},
    {label_fr:'Service',label_ar:'الخدمة',label_en:'Service',label_es:'Servicio'},
    {label_fr:'Propreté',label_ar:'النظافة',label_en:'Cleanliness',label_es:'Limpieza'},
    {label_fr:'Rapport qualité-prix',label_ar:'القيمة مقابل السعر',label_en:'Value for money',label_es:'Relación calidad-precio'},
  ],
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
    setLoading(true); setError('')

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr || !authData.user) { setError(authErr?.message || 'Error'); setLoading(false); return }

    const finalSector = sector === 'other' && otherSector.trim() ? otherSector.trim() : sector
    const categories = (CATS[sector] || CATS.other).map((c, i) => ({ id: String(i+1), ...c }))

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authData.user.id, businessName: bizName, city, sector: finalSector, categories }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
        .page{min-height:100vh;display:flex;flex-direction:column}
        .page::before{content:'';position:fixed;top:0;left:50%;transform:translateX(-50%);width:700px;height:400px;background:radial-gradient(ellipse at 50% 0%,rgba(0,180,200,.1),transparent 70%);pointer-events:none;z-index:0}
        .nav{padding:0 40px;height:60px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);position:relative;z-index:10}
        .nav-logo{display:flex;align-items:center;gap:9px;text-decoration:none}
        .nav-mark{width:30px;height:30px;border-radius:9px;background:#028090;display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:13px;color:#fff}
        .nav-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:14px;color:#e8f0fa;letter-spacing:-.3px}
        .nav-right{display:flex;align-items:center;gap:10px;font-size:13px;color:#4a5a72}
        .nav-right a{color:#00b4c8;text-decoration:none;font-weight:500;margin-left:4px}
        .lang-sw{display:flex;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:3px;gap:2px}
        .lang-b{padding:3px 8px;border-radius:6px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;transition:all .15s;background:transparent;color:#3d4e62}
        .lang-b.on{background:#028090;color:#fff}
        .lang-b:hover:not(.on){color:#e8f0fa}
        .main{flex:1;display:flex;align-items:center;justify-content:center;padding:28px 20px;position:relative;z-index:1}
        .card{width:100%;max-width:460px;background:#0d1927;border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:36px;box-shadow:0 24px 64px rgba(0,0,0,.4)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        .card{animation:fadeUp .5s ease}
        .step-body{animation:slideIn .25s ease}
        .card-top{text-align:center;margin-bottom:24px}
        .card-mark{width:52px;height:52px;border-radius:15px;background:linear-gradient(135deg,#028090,#00b4c8);display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:22px;color:#fff;margin:0 auto 14px;box-shadow:0 4px 16px rgba(0,180,200,.25)}
        .card-title{font-family:'Cabinet Grotesk',sans-serif;font-size:22px;font-weight:900;color:#e8f0fa;letter-spacing:-.5px;margin-bottom:5px}
        .card-sub{font-size:13px;color:#4a5a72}
        .progress{display:flex;gap:6px;justify-content:center;margin-top:12px}
        .prog{height:3px;border-radius:2px;transition:all .3s;flex:1;max-width:40px}
        .prog.on{background:#028090}
        .prog.off{background:rgba(255,255,255,.07)}
        .field{margin-bottom:14px}
        .field label{display:block;font-size:10px;font-weight:700;color:#4a5a72;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px}
        .iw{position:relative}
        .iw input,.iw select{width:100%;padding:11px 13px;background:#070f1d;border:1px solid rgba(255,255,255,.09);border-radius:10px;font-size:13.5px;color:#e8f0fa;font-family:inherit;outline:none;transition:border-color .2s}
        .iw select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5a72' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;padding-right:34px}
        .iw input::placeholder,.iw select::placeholder{color:#2a3a52}
        .iw input:focus,.iw select:focus{border-color:#028090;background:#060d1a}
        .eye-btn{position:absolute;right:11px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#3d4e62;padding:4px;transition:color .15s;display:flex}
        .eye-btn:hover{color:#8899b0}
        .sgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:1px}
        .sopt{padding:11px 7px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:#070f1d;cursor:pointer;transition:all .15s;text-align:center;user-select:none}
        .sopt:hover{border-color:rgba(0,180,200,.2)}
        .sopt.sel{border-color:#028090;background:rgba(0,180,200,.07)}
        .sopt .si{font-size:20px;margin-bottom:3px}
        .sopt .sl{font-size:11px;color:#5a6a82;font-weight:500;line-height:1.3}
        .sopt.sel .sl{color:#7dd8e0}
        .other-in{margin-top:8px;animation:slideIn .2s ease}
        .trial-b{display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 13px;background:rgba(0,180,200,.06);border:1px solid rgba(0,180,200,.14);border-radius:9px;font-size:12px;color:#7dd8e0;margin-bottom:16px}
        .trial-dot{width:5px;height:5px;border-radius:50%;background:#00b4c8;flex-shrink:0}
        .error-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:9px;padding:10px 13px;font-size:12.5px;color:#fca5a5;margin-bottom:13px;display:flex;align-items:center;gap:7px}
        .submit-btn{width:100%;padding:13px;background:linear-gradient(135deg,#028090,#00a8bc);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 4px 14px rgba(0,180,200,.18);margin-top:8px}
        .submit-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,180,200,.28)}
        .submit-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .back-btn{background:none;border:none;color:#3d4e62;font-size:12.5px;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit;margin-bottom:16px;padding:0;transition:color .15s}
        .back-btn:hover{color:#8899b0}
        .foot{text-align:center;font-size:12.5px;color:#3d4e62;margin-top:18px}
        .foot a{color:#00b4c8;text-decoration:none;font-weight:500}
        .foot a:hover{color:#7dd8e0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @media(max-width:480px){.nav{padding:0 16px}.card{padding:26px 18px}}
      `}</style>

      <div className="page" dir={isRTL ? 'rtl' : 'ltr'}>
        <nav className="nav">
          <a href="/" className="nav-logo"><div className="nav-mark">F</div><span className="nav-name">FeedbackPro</span></a>
          <div className="nav-right">
            <div className="lang-sw">
              {(['fr','ar','en','es'] as Lang[]).map(l=>(
                <button key={l} className={`lang-b${lang===l?' on':''}`} onClick={()=>setLang(l)}>{LANG_LABELS[l]}</button>
              ))}
            </div>
            <span>{t('already')}</span><a href="/login">{t('signin')}</a>
          </div>
        </nav>

        <main className="main">
          <div className="card">
            <div className="card-top">
              <div className="card-mark">F</div>
              <div className="card-title">{step===1?t('create'):t('your_biz')}</div>
              <div className="card-sub">{step===1?t('sub1'):t('sub2')}</div>
              <div className="progress">
                <div className={`prog ${step>=1?'on':'off'}`}/>
                <div className={`prog ${step>=2?'on':'off'}`}/>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {step===1&&<div className="step-body">
                <div className="trial-b"><div className="trial-dot"/>{t('trial_b')}</div>
                <div className="field">
                  <label>{t('email')}</label>
                  <div className="iw"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('email_ph')} required autoComplete="email"/></div>
                </div>
                <div className="field">
                  <label>{t('pass')}</label>
                  <div className="iw">
                    <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={t('pass_ph')} required minLength={6} style={{paddingRight:42}}/>
                    <button type="button" className="eye-btn" onClick={()=>setShowPass(p=>!p)}>
                      {showPass?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>
                {error&&<div className="error-box"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
                <button type="submit" className="submit-btn">{t('cont')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>
              </div>}

              {step===2&&<div className="step-body">
                <button type="button" className="back-btn" onClick={()=>setStep(1)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  {t('back')}
                </button>
                <div className="field">
                  <label>{t('biz_name')}</label>
                  <div className="iw"><input type="text" value={bizName} onChange={e=>setBizName(e.target.value)} placeholder={t('biz_ph')} required/></div>
                </div>
                <div className="field">
                  <label>{t('city')}</label>
                  <div className="iw">
                    <select value={city} onChange={e=>setCity(e.target.value)} required>
                      <option value="" disabled>{t('city_ph')}</option>
                      {cities.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>{t('biz_type')}</label>
                  <div className="sgrid">
                    {SECTORS[lang].map(s=>(
                      <div key={s.value} className={`sopt${sector===s.value?' sel':''}`} onClick={()=>{setSector(s.value);if(s.value!=='other')setOtherSector('')}}>
                        <div className="si">{s.icon}</div>
                        <div className="sl">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {sector==='other'&&<div className="other-in">
                    <div className="iw"><input type="text" value={otherSector} onChange={e=>setOtherSector(e.target.value)} placeholder={t('specify_ph')} required/></div>
                  </div>}
                </div>
                {error&&<div className="error-box"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading?<><div className="spin"/>{t('creating')}</>:<>{t('finish')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
                </button>
              </div>}
            </form>

            <div className="foot">
              {step===1?<>{t('already')} <a href="/login">{t('signin')}</a></>:<>Besoin d&apos;aide ? <a href="mailto:support@feedbackpro.ma">Contact</a></>}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
