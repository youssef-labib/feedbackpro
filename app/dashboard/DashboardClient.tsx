'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

type Lang = 'fr' | 'ar' | 'en' | 'es'
type Business = { id:string; name:string; slug:string; sector:string; city:string; google_review_url:string|null; plan:string; plan_status:string; qr_generated?:boolean; logo_url?:string|null }
type Category = { id:string; label_fr:string; label_ar:string; label_en?:string; label_es?:string }
type Form = { id:string; business_id:string; categories:Category[] }
type Sub = { id:string; ratings:Record<string,number>; average_score:number; comment:string|null; created_at:string }

const LANG_OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'ar', flag: '🇲🇦', label: 'العربية' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
]

const DT: Record<string, Partial<Record<Lang, string>>> = {
  overview:   { fr: 'Vue générale', ar: 'نظرة عامة', en: 'Overview' },
  reviews:    { fr: 'Avis', ar: 'التقييمات', en: 'Reviews' },
  questions:  { fr: 'Questions', ar: 'الأسئلة', en: 'Questions' },
  qr:         { fr: 'QR code', ar: 'كود QR', en: 'QR code' },
  settings:   { fr: 'Paramètres', ar: 'الإعدادات', en: 'Settings' },
  week:       { fr: 'Cette semaine', ar: 'هذا الأسبوع', en: 'This week' },
  total:      { fr: 'Total avis', ar: 'مجموع التقييمات', en: 'Total reviews' },
  score:      { fr: 'Score semaine', ar: 'نقاط الأسبوع', en: 'Weekly score' },
  weak:       { fr: '⚠ Point faible', ar: '⚠ نقطة ضعف', en: '⚠ Weak point' },
  all_reviews:{ fr: 'Tous les avis', ar: 'جميع التقييمات', en: 'All reviews' },
  see_all:    { fr: 'Voir tout →', ar: 'عرض الكل →', en: 'See all →' },
  recent:     { fr: 'Derniers avis', ar: 'آخر التقييمات', en: 'Recent reviews' },
  no_reviews: { fr: 'Aucun avis pour le moment', ar: 'لا توجد تقييمات', en: 'No reviews yet' },
  no_rev_sub: { fr: 'Partagez votre QR pour commencer', ar: 'شارك كود QR الخاص بك', en: 'Share your QR to get started' },
  by_cat:     { fr: 'Score par catégorie', ar: 'النقاط حسب الفئة', en: 'Score by category' },
  days7:      { fr: '7 derniers jours', ar: 'آخر 7 أيام', en: 'Last 7 days' },
  feedback_link: { fr: 'Votre lien de feedback', ar: 'رابط التقييم', en: 'Your feedback link' },
  copy:       { fr: 'Copier le lien', ar: 'نسخ الرابط', en: 'Copy link' },
  see_form:   { fr: 'Voir le formulaire', ar: 'عرض النموذج', en: 'View form' },
  qr_ready:   { fr: '✓ Votre QR code est prêt !', ar: '✓ كود QR جاهز!', en: '✓ Your QR code is ready!' },
  qr_desc:    { fr: 'Téléchargez en PNG haute résolution. Taille minimale : 3×3 cm.', ar: 'تحميل بجودة عالية. الحجم الأدنى: 3×3 سم.', en: 'Download in high-res PNG. Min size: 3×3 cm.' },
  download:   { fr: 'Télécharger le QR (PNG)', ar: 'تحميل كود QR', en: 'Download QR (PNG)' },
  regen:      { fr: 'Régénérer le QR code', ar: 'إعادة إنشاء كود QR', en: 'Regenerate QR code' },
  gen_qr:     { fr: 'Générer mon QR code', ar: 'إنشاء كود QR', en: 'Generate my QR code' },
  gen_sub:    { fr: 'Format PNG haute résolution, prêt à imprimer.', ar: 'بجودة عالية، جاهز للطباعة.', en: 'High-res PNG, ready to print.' },
  generating: { fr: 'Génération...', ar: 'جاري الإنشاء...', en: 'Generating...' },
  stats:      { fr: 'Statistiques', ar: 'الإحصائيات', en: 'Statistics' },
  total_scans:{ fr: 'Total scans', ar: 'إجمالي المسح', en: 'Total scans' },
  this_week:  { fr: 'Cette semaine', ar: 'هذا الأسبوع', en: 'This week' },
  avg_score:  { fr: 'Score moyen', ar: 'متوسط النقاط', en: 'Average score' },
  my_q:       { fr: 'Mes questions de feedback', ar: 'أسئلتي', en: 'My feedback questions' },
  add_q:      { fr: 'Ajouter une question', ar: 'إضافة سؤال', en: 'Add a question' },
  save_q:     { fr: 'Appliquer les changements', ar: 'تطبيق التغييرات', en: 'Apply changes' },
  saving_q:   { fr: 'Enregistrement...', ar: 'جاري الحفظ...', en: 'Saving...' },
  unsaved:    { fr: 'Modifications non enregistrées', ar: 'تغييرات غير محفوظة', en: 'Unsaved changes' },
  cancel:     { fr: 'Annuler', ar: 'إلغاء', en: 'Cancel' },
  google_url: { fr: 'Lien Google Reviews', ar: 'رابط Google Reviews', en: 'Google Reviews URL' },
  google_desc:{ fr: "Quand un client donne 4+ étoiles, il sera redirigé vers votre page Google.", ar: 'عندما يعطي عميل 4+ نجوم يتم توجيهه لصفحتك على Google.', en: 'When a customer gives 4+ stars, they are redirected to your Google page.' },
  save:       { fr: 'Enregistrer', ar: 'حفظ', en: 'Save' },
  saved:      { fr: '✓ Enregistré', ar: '✓ تم الحفظ', en: '✓ Saved' },
  saving:     { fr: 'Enregistrement...', ar: 'جاري الحفظ...', en: 'Saving...' },
  info:       { fr: 'Informations', ar: 'المعلومات', en: 'Information' },
  name:       { fr: 'Nom', ar: 'الاسم', en: 'Name' },
  city:       { fr: 'Ville', ar: 'المدينة', en: 'City' },
  sector_lbl: { fr: 'Secteur', ar: 'القطاع', en: 'Sector' },
  plan_lbl:   { fr: 'Plan', ar: 'الخطة', en: 'Plan' },
  contact_us: { fr: 'Pour modifier, contactez support@feedbackpro.ma', ar: 'للتعديل، تواصل مع support@feedbackpro.ma', en: 'To modify, contact support@feedbackpro.ma' },
  danger:     { fr: 'Zone de danger', ar: 'منطقة الخطر', en: 'Danger zone' },
  logout:     { fr: 'Se déconnecter', ar: 'تسجيل الخروج', en: 'Sign out' },
  new_q:      { fr: 'Nouvelle question', ar: 'سؤال جديد', en: 'New question' },
  fr_label:   { fr: '🇫🇷 Français (requis)', ar: '🇫🇷 الفرنسية (مطلوب)', en: '🇫🇷 French (required)' },
  ar_label:   { fr: '🇲🇦 Arabe', ar: '🇲🇦 العربية', en: '🇲🇦 Arabic' },
  en_label:   { fr: '🇬🇧 Anglais', ar: '🇬🇧 الإنجليزية', en: '🇬🇧 English' },
  add:        { fr: 'Ajouter', ar: 'إضافة', en: 'Add' },
  regen_warn: { fr: 'Régénérer le QR code ?', ar: 'إعادة إنشاء كود QR؟', en: 'Regenerate QR code?' },
  regen_body: { fr: "Vos QR déjà imprimés continueront de fonctionner — le lien ne change jamais.", ar: 'كودات QR المطبوعة ستستمر في العمل — الرابط لا يتغير أبداً.', en: 'Already printed QR codes will keep working — the link never changes.' },
  regen_btn:  { fr: 'Régénérer quand même', ar: 'إعادة الإنشاء على أي حال', en: 'Regenerate anyway' },
  page_info:  { fr: '2 pages', ar: 'صفحتان', en: '2 pages' },
  tip_qr:     { fr: '💡 Le lien du QR ne change jamais.', ar: '💡 رابط QR لا يتغير أبداً.', en: '💡 The QR link never changes.' },
  min_q:      { fr: 'Minimum 1 question requise.', ar: 'مطلوب سؤال واحد على الأقل.', en: 'Minimum 1 question required.' },
  max_q:      { fr: 'Maximum 10 questions.', ar: 'الحد الأقصى 10 أسئلة.', en: 'Maximum 10 questions.' },
  fr_req:     { fr: 'Le champ français est requis.', ar: 'حقل الفرنسية مطلوب.', en: 'French field is required.' },
  branding:   { fr: 'Personnalisation', ar: 'التخصيص', en: 'Branding' },
  logo:       { fr: 'Logo du business', ar: 'شعار النشاط التجاري', en: 'Business logo' },
  logo_desc:  { fr: 'Affiché sur votre formulaire de feedback. PNG ou JPG, max 2MB.', ar: 'يظهر على نموذج التقييم. PNG أو JPG، 2MB كحد أقصى.', en: 'Shown on your feedback form. PNG or JPG, max 2MB.' },
  upload:     { fr: 'Choisir une image', ar: 'اختر صورة', en: 'Choose image' },
  uploading:  { fr: 'Envoi...', ar: 'جاري الرفع...', en: 'Uploading...' },
  logo_saved: { fr: '✓ Logo mis à jour', ar: '✓ تم تحديث الشعار', en: '✓ Logo updated' },
  remove_logo:{ fr: 'Supprimer le logo', ar: 'حذف الشعار', en: 'Remove logo' },
}

const SC = (s:number) => s>=4?'#10B981':s>=3?'#F59E0B':'#EF4444'
const SBg = (s:number) => s>=4?'rgba(16,185,129,.12)':s>=3?'rgba(245,158,11,.12)':'rgba(239,68,68,.12)'

function Ring({ score }: { score:number }) {
  const r=28, c=2*Math.PI*r, f=(score/5)*c
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="5"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={SC(score)} strokeWidth="5"
        strokeDasharray={`${f} ${c}`} strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{transition:'stroke-dasharray .6s ease'}}/>
      <text x="36" y="40" textAnchor="middle" fontSize="15" fontWeight="800"
        fill={SC(score)} fontFamily="Cabinet Grotesk,sans-serif">
        {score>0?score.toFixed(1):'—'}
      </text>
    </svg>
  )
}

function LangSelect({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const current = LANG_OPTIONS.find(l => l.code === lang)!
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ position: 'absolute', left: 9, fontSize: 16, pointerEvents: 'none', zIndex: 1 }}>{current.flag}</span>
      <select
        value={lang}
        onChange={e => setLang(e.target.value as Lang)}
        style={{
          paddingLeft: 32, paddingRight: 28, paddingTop: 7, paddingBottom: 7,
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 9, color: '#e8f0fa',
          fontSize: 12, fontWeight: 600,
          fontFamily: 'Instrument Sans, sans-serif',
          cursor: 'pointer', outline: 'none',
          WebkitAppearance: 'none', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%234a5a72' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {LANG_OPTIONS.map(l => (
          <option key={l.code} value={l.code} style={{ background: '#0d1927', color: '#e8f0fa' }}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function DashboardClient({ business, form, submissions, userEmail }:
  { business:Business; form:Form|null; submissions:Sub[]; userEmail:string }) {

  const router = useRouter()
  const [lang, setLang] = useState<Lang>('fr')
  const [tab, setTab] = useState<'overview'|'reviews'|'qr'|'questions'|'settings'>('overview')
  const [googleUrl, setGoogleUrl] = useState(business.google_review_url||'')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [qrGenerated, setQrGenerated] = useState(business.qr_generated||false)
  const [qrLoading, setQrLoading] = useState(false)
  const [showRegenWarning, setShowRegenWarning] = useState(false)
  const [qrKey, setQrKey] = useState(0)
  const [questions, setQuestions] = useState<Category[]>(form?.categories||[])
  const [questionsDirty, setQuestionsDirty] = useState(false)
  const [questionsSaving, setQuestionsSaving] = useState(false)
  const [showAddQ, setShowAddQ] = useState(false)
  const [newQ, setNewQ] = useState({ fr:'', ar:'', en:'', es:'' })
  const [qError, setQError] = useState('')

  // Logo state
  const [logoUrl, setLogoUrl] = useState(business.logo_url||'')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoSaved, setLogoSaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState(business.logo_url||'')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isRTL = lang === 'ar'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const dt = (k: string) => DT[k]?.[lang] || DT[k]?.fr || k

  const avg = submissions.length>0 ? Math.round((submissions.reduce((a,b)=>a+b.average_score,0)/submissions.length)*10)/10 : 0
  const week = submissions.filter(s=>Date.now()-new Date(s.created_at).getTime()<7*864e5)
  const lastWk = submissions.filter(s=>{const age=Date.now()-new Date(s.created_at).getTime();return age>=7*864e5&&age<14*864e5})
  const wAvg = week.length>0?Math.round((week.reduce((a,b)=>a+b.average_score,0)/week.length)*10)/10:0
  const lwAvg = lastWk.length>0?Math.round((lastWk.reduce((a,b)=>a+b.average_score,0)/lastWk.length)*10)/10:0
  const delta = wAvg>0&&lwAvg>0?wAvg-lwAvg:null

  const catScores:Record<string,number[]>={}
  submissions.forEach(s=>Object.entries(s.ratings||{}).forEach(([id,score])=>{
    if(!catScores[id])catScores[id]=[];catScores[id].push(score as number)
  }))
  const cats = Object.entries(catScores).map(([id,scores])=>({
    id, label:form?.categories.find(c=>c.id===id)?.label_fr||id,
    avg:Math.round((scores.reduce((a,b)=>a+b,0)/scores.length)*10)/10
  })).sort((a,b)=>a.avg-b.avg)

  const formUrl = typeof window!=='undefined'?`${window.location.origin}/r/${business.slug}`:`/r/${business.slug}`
  const qrUrl = `/api/qr?url=${encodeURIComponent(formUrl)}`

  async function logout() { await supabase.auth.signOut(); window.location.href = '/' }

  async function saveGoogle() {
    setSaving(true)
    await supabase.from('businesses').update({google_review_url:googleUrl}).eq('id',business.id)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  async function generateQR() {
    setQrLoading(true); setShowRegenWarning(false)
    try {
      const res = await fetch(qrUrl)
      if (!res.ok) throw new Error('failed')
      await supabase.from('businesses').update({qr_generated:true}).eq('id',business.id)
      setQrGenerated(true); setQrKey(k=>k+1)
    } catch { /* ignore */ }
    setQrLoading(false)
  }

  function downloadQR() {
    const a = document.createElement('a'); a.href=qrUrl; a.download=`feedbackpro-qr-${business.slug}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return }
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return }

    // Preview immediately
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)

    setLogoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('businessId', business.id)

    try {
      const res = await fetch('/api/upload-logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setLogoUrl(data.url)
        setLogoSaved(true)
        setTimeout(() => setLogoSaved(false), 3000)
      } else {
        alert(data.error || 'Upload failed')
        setLogoPreview(logoUrl) // revert preview
      }
    } catch {
      alert('Upload failed')
      setLogoPreview(logoUrl)
    }
    setLogoUploading(false)
  }

  async function removeLogo() {
    await supabase.from('businesses').update({ logo_url: null }).eq('id', business.id)
    setLogoUrl(''); setLogoPreview('')
  }

  function modQ(fn:(p:Category[])=>Category[]) { setQuestions(fn); setQuestionsDirty(true) }
  function moveUp(idx:number) { if(idx===0)return; modQ(p=>{const a=[...p];[a[idx-1],a[idx]]=[a[idx],a[idx-1]];return a}) }
  function moveDown(idx:number) { if(idx===questions.length-1)return; modQ(p=>{const a=[...p];[a[idx],a[idx+1]]=[a[idx+1],a[idx]];return a}) }
  function removeQ(id:string) { if(questions.length<=1){setQError(dt('min_q'));return}; modQ(p=>p.filter(q=>q.id!==id)); setQError('') }
  function addQ() {
    if(!newQ.fr.trim()){setQError(dt('fr_req'));return}
    if(questions.length>=10){setQError(dt('max_q'));return}
    modQ(p=>[...p,{
      id:String(Date.now()),
      label_fr:newQ.fr.trim(),
      label_ar:newQ.ar.trim()||newQ.fr.trim(),
      label_en:newQ.en.trim()||newQ.fr.trim(),
      label_es:newQ.es.trim()||newQ.en.trim()||newQ.fr.trim(),
    }])
    setNewQ({fr:'',ar:'',en:'',es:''}); setShowAddQ(false); setQError('')
  }
  async function saveQ() {
    if(!form)return; setQuestionsSaving(true)
    const categories = questions.map((q,i)=>({
      id: String(i+1),
      label_fr: q.label_fr,
      label_ar: q.label_ar || q.label_fr,
      label_en: q.label_en || q.label_fr,
      label_es: q.label_es || q.label_en || q.label_fr,
    }))
    const { error } = await supabase.from('feedback_forms').update({categories}).eq('id',form.id)
    if (!error) {
      setQuestions(categories)
      setQuestionsDirty(false)
      router.refresh()
    } else {
      alert('Erreur: ' + error.message)
    }
    setQuestionsSaving(false)
  }

  const TABS = [
    {id:'overview',icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
    {id:'reviews',icon:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'},
    {id:'questions',icon:'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'},
    {id:'qr',icon:'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'},
    {id:'settings',icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'},
  ] as const

  const tabLabel = (id: string) => {
    const map: Record<string,string> = {
      overview: dt('overview'),
      reviews: `${dt('reviews')} (${submissions.length})`,
      questions: dt('questions'),
      qr: dt('qr'),
      settings: dt('settings'),
    }
    return map[id] || id
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#07101f;font-family:'Instrument Sans',sans-serif;color:#8899b0;overflow-x:hidden}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .d{display:flex;min-height:100vh}
        .sb{width:220px;flex-shrink:0;background:#0a1422;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto}
        .sb-brand{padding:16px 16px 12px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:9px}
        .sb-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#028090,#00b4c8);display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:12px;color:#fff;flex-shrink:0;overflow:hidden}
        .sb-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:12.5px;color:#e8f0fa;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sb-city{font-size:10px;color:#2a3a52;margin-top:1px}
        .sb-nav{padding:8px 6px;flex:1}
        .sb-btn{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:9px;cursor:pointer;transition:all .15s;margin-bottom:2px;border:none;background:transparent;width:100%;text-align:left;font-family:'Instrument Sans',sans-serif;position:relative}
        .sb-btn:hover{background:rgba(255,255,255,.04)}
        .sb-btn.on{background:rgba(0,180,200,.1);border:1px solid rgba(0,180,200,.14)}
        .sb-btn svg{width:14px;height:14px;flex-shrink:0;stroke:rgba(255,255,255,.25)}
        .sb-btn.on svg{stroke:#00b4c8}
        .sb-lbl{font-size:12px;color:#4a5a72;font-weight:500}
        .sb-btn.on .sb-lbl{color:#7dd8e0;font-weight:600}
        .ddot{width:6px;height:6px;border-radius:50%;background:#F59E0B;position:absolute;right:9px;top:50%;transform:translateY(-50%)}
        .sb-foot{padding:10px 6px;border-top:1px solid rgba(255,255,255,.06)}
        .sb-user{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:8px}
        .sb-uav{width:24px;height:24px;border-radius:50%;background:rgba(0,180,200,.12);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#00b4c8;flex-shrink:0}
        .sb-email{font-size:9px;color:#2a3a52;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
        .lg-btn{background:none;border:none;cursor:pointer;color:#2a3a52;padding:4px;border-radius:5px;transition:color .15s;display:flex}
        .lg-btn:hover{color:#8899b0}
        .main{flex:1;min-width:0;display:flex;flex-direction:column}
        .topbar{padding:0 22px;height:56px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;background:#07101f;position:sticky;top:0;z-index:50;gap:12px}
        .pg-title{font-family:'Cabinet Grotesk',sans-serif;font-size:14px;font-weight:800;color:#e8f0fa;letter-spacing:-.3px}
        .pg-sub{font-size:10px;color:#2a3a52;margin-top:1px}
        .plan-pill{padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(0,180,200,.1);color:#00b4c8;border:1px solid rgba(0,180,200,.18);white-space:nowrap}
        .content{padding:20px;flex:1}
        .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
        .metric{background:#0d1927;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:16px;transition:border-color .2s}
        .metric:hover{border-color:rgba(0,180,200,.18)}
        .mlbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#2a3a52;margin-bottom:9px}
        .mval{font-family:'Cabinet Grotesk',sans-serif;font-size:28px;font-weight:900;letter-spacing:-1.5px;line-height:1}
        .msub{font-size:10px;color:#2a3a52;margin-top:4px}
        .up{color:#10B981}.dn{color:#EF4444}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
        .card{background:#0d1927;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:16px;margin-bottom:10px}
        .card:last-child{margin-bottom:0}
        .ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .ct{font-family:'Cabinet Grotesk',sans-serif;font-size:13px;font-weight:700;color:#e8f0fa;letter-spacing:-.2px}
        .ca{font-size:11px;color:#028090;cursor:pointer;font-weight:500}
        .cat-r{display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .cat-n{font-size:11.5px;color:#6b7c94;width:100px;flex-shrink:0}
        .cat-b{flex:1;height:5px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
        .cat-f{height:100%;border-radius:3px;transition:width .6s ease}
        .cat-s{font-size:10.5px;font-weight:700;width:24px;text-align:right}
        .rv{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .rv:last-child{border-bottom:none}
        .sp{padding:3px 7px;border-radius:20px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;flex-shrink:0}
        .rv-meta{flex:1;min-width:0}
        .rv-cats{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:3px}
        .rv-tag{font-size:9.5px;color:#2a3a52;padding:2px 6px;background:rgba(255,255,255,.03);border-radius:4px}
        .rv-cmt{font-size:11.5px;color:#5a6a82;line-height:1.45;font-style:italic}
        .rv-time{font-size:9.5px;color:#2a3a52;flex-shrink:0;padding-top:2px}
        .mc{height:56px;display:flex;align-items:flex-end;gap:3px}
        .mb{flex:1;border-radius:2px 2px 0 0;background:rgba(0,180,200,.12);min-height:3px;transition:background .15s}
        .mb.td{background:#028090}
        .cd{display:flex;gap:3px;margin-top:4px}
        .cdl{flex:1;text-align:center;font-size:9px;color:#2a3a52}
        .url-box{padding:10px 13px;background:#070f1d;border:1px solid rgba(255,255,255,.07);border-radius:9px;font-size:11.5px;color:#00b4c8;font-weight:500;word-break:break-all;margin-bottom:11px;font-family:monospace}
        .qb{padding:9px 14px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;text-decoration:none;display:inline-flex;align-items:center;gap:5px;border:none}
        .qbp{background:#028090;color:#fff}.qbp:hover{background:#00b4c8}
        .qbg{background:transparent;color:#6b7c94;border:1px solid rgba(255,255,255,.1)!important}.qbg:hover{border-color:rgba(0,180,200,.3)!important;color:#e8f0fa}
        .qbw{background:rgba(245,158,11,.1);color:#F59E0B;border:1px solid rgba(245,158,11,.2)!important}
        .sf{margin-bottom:16px}
        .sl{font-size:10px;font-weight:700;color:#4a5a72;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}
        .si{width:100%;padding:9px 12px;background:#070f1d;border:1px solid rgba(255,255,255,.08);border-radius:9px;font-size:13px;color:#e8f0fa;font-family:inherit;outline:none;transition:border-color .2s}
        .si:focus{border-color:#028090}
        .si::placeholder{color:#2a3a52}
        .sv-btn{padding:9px 20px;background:#028090;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
        .sv-btn:hover{background:#00b4c8}
        .saved-b{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;background:rgba(16,185,129,.1);border-radius:20px;font-size:10px;color:#10B981;font-weight:700}
        .empty{text-align:center;padding:36px 16px}
        .empty-i{font-size:32px;margin-bottom:8px;opacity:.3}
        .empty-t{font-family:'Cabinet Grotesk',sans-serif;font-size:13px;font-weight:700;color:#2a3a52;margin-bottom:4px}
        .empty-s{font-size:11px;color:#1e2e42;max-width:220px;margin:0 auto;line-height:1.6}
        .q-row{display:flex;align-items:center;gap:9px;padding:10px 12px;background:#070f1d;border:1px solid rgba(255,255,255,.07);border-radius:10px;margin-bottom:6px;transition:border-color .15s;animation:fadeUp .3s ease}
        .q-row:hover{border-color:rgba(0,180,200,.2)}
        .save-bar{position:sticky;bottom:0;left:0;right:0;background:rgba(10,20,34,.96);backdrop-filter:blur(12px);border-top:1px solid rgba(0,180,200,.2);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:100;animation:fadeUp .3s ease}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:#0d1927;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:24px;width:100%;max-width:380px}
        .logo-zone{display:flex;align-items:center;gap:16px;padding:16px;background:#070f1d;border:1px solid rgba(255,255,255,.08);border-radius:12px;margin-bottom:12px}
        .logo-prev{width:64px;height:64px;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#028090,#00b4c8);display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:20px;color:#fff;flex-shrink:0}
        .upload-btn{padding:9px 16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:9px;color:#8899b0;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
        .upload-btn:hover{border-color:rgba(0,180,200,.3);color:#e8f0fa}
        .mob-topbar{display:none;padding:0 16px;height:54px;border-bottom:1px solid rgba(255,255,255,.06);align-items:center;justify-content:space-between;background:#07101f;position:sticky;top:0;z-index:100}
        .mob-bottom{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(10,20,34,.97);backdrop-filter:blur(16px);border-top:1px solid rgba(255,255,255,.07);padding:8px 0 max(8px,env(safe-area-inset-bottom));z-index:90}
        .mob-tabs{display:flex;justify-content:space-around}
        .mob-tab{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;border:none;background:none;cursor:pointer;min-width:0;flex:1}
        .mob-tab svg{width:20px;height:20px;stroke:rgba(255,255,255,.25);transition:stroke .15s}
        .mob-tab.on svg{stroke:#00b4c8}
        .mob-tab-lbl{font-size:9px;color:#3d4e62;font-family:'Instrument Sans',sans-serif;transition:color .15s}
        .mob-tab.on .mob-tab-lbl{color:#7dd8e0}
        @media(max-width:768px){
          .sb{display:none}.topbar{display:none}
          .mob-topbar{display:flex}.mob-bottom{display:block}
          .content{padding:14px;padding-bottom:80px}
          .g2{grid-template-columns:1fr}.metrics{grid-template-columns:1fr 1fr}
        }
        @media(min-width:769px){.mob-topbar,.mob-bottom{display:none!important}}
      `}</style>

      <div className="d" dir={isRTL?'rtl':'ltr'}>

        {/* SIDEBAR */}
        <aside className="sb">
          <div className="sb-brand">
            <div className="sb-av">
              {logoPreview
                ? <img src={logoPreview} alt="logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : business.name.slice(0,2).toUpperCase()
              }
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div className="sb-name">{business.name}</div>
              <div className="sb-city">{business.city} · {business.plan}</div>
            </div>
          </div>
          <nav className="sb-nav">
            {TABS.map(item => (
              <button key={item.id} className={`sb-btn${tab===item.id?' on':''}`} onClick={()=>setTab(item.id as typeof tab)}>
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={item.icon}/></svg>
                <span className="sb-lbl">{tabLabel(item.id)}</span>
                {item.id==='questions'&&questionsDirty&&<span className="ddot"/>}
              </button>
            ))}
          </nav>
          <div className="sb-foot">
            <div className="sb-user">
              <div className="sb-uav">{userEmail[0]?.toUpperCase()}</div>
              <div className="sb-email">{userEmail}</div>
              <button className="lg-btn" onClick={logout}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE TOPBAR */}
        <div className="mob-topbar">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,overflow:'hidden',background:'linear-gradient(135deg,#028090,#00b4c8)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cabinet Grotesk,sans-serif',fontWeight:900,fontSize:11,color:'#fff'}}>
              {logoPreview ? <img src={logoPreview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : business.name.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{fontFamily:'Cabinet Grotesk,sans-serif',fontWeight:700,fontSize:12,color:'#e8f0fa'}}>{business.name}</div>
              <div style={{fontSize:9,color:'#2a3a52'}}>{business.city}</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <LangSelect lang={lang} setLang={setLang}/>
            <button onClick={logout} style={{background:'none',border:'none',cursor:'pointer',color:'#3d4e62',padding:4,display:'flex'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div>
              <div className="pg-title">{tabLabel(tab)}</div>
              <div className="pg-sub">
                {tab==='overview'&&`${week.length} ${dt('this_week').toLowerCase()}`}
                {tab==='reviews'&&`${submissions.length} ${dt('total').toLowerCase()}`}
                {tab==='questions'&&`${questions.length} questions${questionsDirty?` · ${dt('unsaved')}`:''}`}
                {tab==='qr'&&dt('gen_sub')}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
              <LangSelect lang={lang} setLang={setLang}/>
              <span className="plan-pill">{business.plan}</span>
            </div>
          </div>

          <div className="content">

            {/* OVERVIEW */}
            {tab==='overview'&&<>
              <div className="metrics">
                <div className="metric">
                  <div className="mlbl">{dt('overview')}</div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <Ring score={avg}/>
                    <div>
                      <div style={{fontSize:9,color:'#2a3a52'}}>{submissions.length} {dt('total').toLowerCase()}</div>
                      {delta!==null&&<div className={`msub ${delta>=0?'up':'dn'}`}>{delta>=0?'↑':'↓'} {Math.abs(delta).toFixed(1)}</div>}
                    </div>
                  </div>
                </div>
                <div className="metric"><div className="mlbl">{dt('week')}</div><div className="mval" style={{color:'#e8f0fa'}}>{week.length}</div>{lastWk.length>0&&<div className="msub"><span className={week.length>=lastWk.length?'up':'dn'}>{week.length>=lastWk.length?'↑':'↓'} {Math.abs(week.length-lastWk.length)}</span></div>}</div>
                <div className="metric"><div className="mlbl">{dt('score')}</div><div className="mval" style={{color:wAvg>0?SC(wAvg):'#2a3a52'}}>{wAvg>0?wAvg.toFixed(1):'—'}</div><div className="msub">/ 5</div></div>
                {cats.length>0&&<div className="metric" style={{borderColor:'rgba(239,68,68,.18)'}}><div className="mlbl">{dt('weak')}</div><div className="mval" style={{color:SC(cats[0].avg),fontSize:24}}>{cats[0].avg.toFixed(1)}</div><div className="msub" style={{color:'#EF4444'}}>{cats[0].label}</div></div>}
              </div>
              <div className="g2">
                <div className="card">
                  <div className="ch"><span className="ct">{dt('by_cat')}</span></div>
                  {cats.length===0?<div className="empty"><div className="empty-i">⭐</div><div className="empty-t">{dt('no_reviews')}</div></div>:cats.map(c=>(
                    <div key={c.id} className="cat-r"><span className="cat-n">{c.label}</span><div className="cat-b"><div className="cat-f" style={{width:`${(c.avg/5)*100}%`,background:SC(c.avg)}}/></div><span className="cat-s" style={{color:SC(c.avg)}}>{c.avg.toFixed(1)}</span></div>
                  ))}
                </div>
                <div className="card">
                  <div className="ch"><span className="ct">{dt('days7')}</span></div>
                  {(()=>{const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const ss=submissions.filter(s=>new Date(s.created_at).toDateString()===d.toDateString());return{label:d.toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,3),count:ss.length,isToday:d.toDateString()===new Date().toDateString()}});const mx=Math.max(...days.map(d=>d.count),1);return<><div className="mc">{days.map((d,i)=><div key={i} className={`mb${d.isToday?' td':''}`} style={{height:`${Math.max((d.count/mx)*100,5)}%`}}/>)}</div><div className="cd">{days.map((d,i)=><div key={i} className="cdl" style={{color:d.isToday?'#028090':undefined}}>{d.label}</div>)}</div></>})()}
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">{dt('recent')}</span><span className="ca" onClick={()=>setTab('reviews')}>{dt('see_all')}</span></div>
                {submissions.length===0?<div className="empty"><div className="empty-i">💬</div><div className="empty-t">{dt('no_reviews')}</div><div className="empty-s">{dt('no_rev_sub')}</div></div>:submissions.slice(0,4).map(s=>(
                  <div key={s.id} className="rv"><div className="sp" style={{background:SBg(s.average_score),color:SC(s.average_score)}}>★ {s.average_score.toFixed(1)}</div><div className="rv-meta"><div className="rv-cats">{Object.entries(s.ratings||{}).map(([id,v])=>{const cat=form?.categories.find(c=>c.id===id);return<span key={id} className="rv-tag">{cat?.label_fr||id}: {v as number}/5</span>})}</div>{s.comment&&<div className="rv-cmt">&quot;{s.comment}&quot;</div>}</div><div className="rv-time">{new Date(s.created_at).toLocaleDateString('fr-FR')}</div></div>
                ))}
              </div>
            </>}

            {/* REVIEWS */}
            {tab==='reviews'&&<div className="card">
              <div className="ch"><span className="ct">{dt('all_reviews')} ({submissions.length})</span></div>
              {submissions.length===0?<div className="empty"><div className="empty-i">💬</div><div className="empty-t">{dt('no_reviews')}</div><div className="empty-s">{dt('no_rev_sub')}</div></div>:submissions.map(s=>(
                <div key={s.id} className="rv"><div className="sp" style={{background:SBg(s.average_score),color:SC(s.average_score)}}>★ {s.average_score.toFixed(1)}</div><div className="rv-meta"><div className="rv-cats">{Object.entries(s.ratings||{}).map(([id,v])=>{const cat=form?.categories.find(c=>c.id===id);return<span key={id} className="rv-tag">{cat?.label_fr||id}: {v as number}/5</span>})}</div>{s.comment&&<div className="rv-cmt">&quot;{s.comment}&quot;</div>}</div><div className="rv-time">{new Date(s.created_at).toLocaleDateString('fr-FR')}</div></div>
              ))}
            </div>}

            {/* QUESTIONS */}
            {tab==='questions'&&<>
              <div className="card">
                <div className="ch"><span className="ct">{dt('my_q')}</span><div style={{display:'flex',alignItems:'center',gap:7}}><span style={{fontSize:11,color:questions.length>=10?'#EF4444':questions.length>=5?'#10B981':'#F59E0B',fontWeight:700}}>{questions.length}/10</span>{questions.length>5&&<span style={{fontSize:9,color:'#7dd8e0',padding:'2px 7px',background:'rgba(0,180,200,.06)',border:'1px solid rgba(0,180,200,.14)',borderRadius:20}}>{dt('page_info')}</span>}</div></div>
                <div style={{height:3,background:'rgba(255,255,255,.05)',borderRadius:2,marginBottom:12,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:questions.length>=10?'#EF4444':questions.length>=5?'#10B981':'#F59E0B',width:`${(questions.length/10)*100}%`,transition:'width .3s ease'}}/></div>
                {questions.map((q,idx)=>(
                  <div key={q.id} className="q-row">
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      <button onClick={()=>moveUp(idx)} disabled={idx===0} style={{background:'none',border:'none',cursor:idx===0?'not-allowed':'pointer',color:idx===0?'#1e2e42':'#4a5a72',padding:1,display:'flex'}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg></button>
                      <button onClick={()=>moveDown(idx)} disabled={idx===questions.length-1} style={{background:'none',border:'none',cursor:idx===questions.length-1?'not-allowed':'pointer',color:idx===questions.length-1?'#1e2e42':'#4a5a72',padding:1,display:'flex'}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg></button>
                    </div>
                    <div style={{width:20,height:20,borderRadius:5,background:idx<5?'rgba(0,180,200,.12)':'rgba(245,158,11,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:idx<5?'#00b4c8':'#F59E0B',flexShrink:0}}>{idx+1}</div>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:'#e8f0fa',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{q.label_fr}</div><div style={{fontSize:9.5,color:'#3d4e62',marginTop:1}}>🇲🇦 {q.label_ar||'—'} · 🇬🇧 {q.label_en||'—'}</div></div>
                    <button onClick={()=>removeQ(q.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#2a3a52',padding:4,display:'flex',flexShrink:0,transition:'color .15s',borderRadius:6}} onMouseEnter={e=>((e.currentTarget as HTMLButtonElement).style.color='#EF4444')} onMouseLeave={e=>((e.currentTarget as HTMLButtonElement).style.color='#2a3a52')}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
                  </div>
                ))}
                {questions.length<10&&(
                  <div style={{marginTop:7}}>
                    {!showAddQ?(
                      <button onClick={()=>setShowAddQ(true)} style={{width:'100%',padding:'9px',border:'1px dashed rgba(255,255,255,.1)',borderRadius:10,background:'transparent',color:'#4a5a72',cursor:'pointer',fontSize:12,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:5,transition:'all .15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(0,180,200,.3)';(e.currentTarget as HTMLButtonElement).style.color='#e8f0fa'}} onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,.1)';(e.currentTarget as HTMLButtonElement).style.color='#4a5a72'}}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>{dt('add_q')}
                      </button>
                    ):(
                      <div style={{background:'#070f1d',border:'1px solid rgba(0,180,200,.2)',borderRadius:11,padding:12,animation:'fadeUp .2s ease'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'#4a5a72',textTransform:'uppercase',letterSpacing:.5,marginBottom:9}}>{dt('new_q')}</div>
                        {[{k:'fr',l:dt('fr_label')},{k:'ar',l:dt('ar_label')},{k:'en',l:dt('en_label')},{k:'es',l:'🇪🇸 Spanish'}].map(f=>(
                          <input key={f.k} placeholder={f.l} value={newQ[f.k as keyof typeof newQ]} onChange={e=>setNewQ(p=>({...p,[f.k]:e.target.value}))} style={{width:'100%',padding:'8px 11px',background:'#0a1525',border:'1.5px solid rgba(255,255,255,.08)',borderRadius:8,fontSize:12,color:'#e8f0fa',fontFamily:'inherit',outline:'none',marginBottom:6,display:'block'}}/>
                        ))}
                        <div style={{display:'flex',gap:7,marginTop:3}}>
                          <button onClick={addQ} style={{flex:1,padding:'8px',background:'#028090',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{dt('add')}</button>
                          <button onClick={()=>{setShowAddQ(false);setNewQ({fr:'',ar:'',en:'',es:''})}} style={{padding:'8px 14px',background:'transparent',color:'#4a5a72',border:'1px solid rgba(255,255,255,.08)',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>{dt('cancel')}</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {qError&&<div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,padding:'9px 12px',fontSize:12,color:'#fca5a5',marginTop:9}}>{qError}</div>}
              </div>
              {questionsDirty&&(
                <div className="save-bar">
                  <div><div style={{fontSize:12.5,fontWeight:700,color:'#F59E0B',display:'flex',alignItems:'center',gap:5}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{dt('unsaved')}</div><div style={{fontSize:10,color:'#4a5a72',marginTop:2}}>Appliquez pour que vos clients voient les changements</div></div>
                  <div style={{display:'flex',gap:7,flexShrink:0}}>
                    <button onClick={()=>{setQuestions(form?.categories||[]);setQuestionsDirty(false)}} style={{padding:'8px 14px',background:'transparent',color:'#5a6a82',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>{dt('cancel')}</button>
                    <button onClick={saveQ} disabled={questionsSaving} style={{padding:'8px 18px',background:'linear-gradient(135deg,#028090,#00a8bc)',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:questionsSaving?'not-allowed':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                      {questionsSaving?<><div style={{width:13,height:13,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>{dt('saving_q')}</>:<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>{dt('save_q')}</>}
                    </button>
                  </div>
                </div>
              )}
            </>}

            {/* QR */}
            {tab==='qr'&&<>
              <div className="card"><div className="ch"><span className="ct">{dt('feedback_link')}</span></div><div className="url-box">{formUrl}</div><div style={{display:'flex',gap:7,flexWrap:'wrap'}}><button className="qb qbp" onClick={()=>navigator.clipboard.writeText(formUrl)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>{dt('copy')}</button><a href={formUrl} target="_blank" rel="noopener noreferrer" className="qb qbg" style={{textDecoration:'none'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>{dt('see_form')}</a></div></div>
              <div className="card"><div className="ch"><span className="ct">QR Code</span></div>
                {!qrGenerated?(
                  <div style={{textAlign:'center',padding:'28px 0'}}><div style={{fontSize:44,marginBottom:14,opacity:.2}}>📱</div><div style={{fontSize:13,color:'#4a5a72',marginBottom:6}}>{dt('gen_qr')}</div><div style={{fontSize:11,color:'#2a3a52',marginBottom:20}}>{dt('gen_sub')}</div><button className="qb qbp" onClick={generateQR} disabled={qrLoading} style={{padding:'11px 24px',fontSize:13}}>{qrLoading?<><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>{dt('generating')}</>:<>📱 {dt('gen_qr')}</>}</button></div>
                ):(
                  <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
                    <div style={{flexShrink:0}}><div style={{background:'#fff',borderRadius:14,padding:14,display:'inline-block',boxShadow:'0 4px 20px rgba(0,0,0,.4)'}}><img key={qrKey} src={`${qrUrl}&v=${qrKey}`} alt="QR Code" width={180} height={180} style={{display:'block',borderRadius:3}}/></div><div style={{textAlign:'center',fontSize:9,color:'#2a3a52',marginTop:6}}>{business.slug}</div></div>
                    <div style={{flex:1,minWidth:180}}><div style={{fontFamily:'Cabinet Grotesk,sans-serif',fontSize:14,fontWeight:700,color:'#e8f0fa',marginBottom:5}}>{dt('qr_ready')}</div><div style={{fontSize:12,color:'#4a5a72',lineHeight:1.6,marginBottom:16}}>{dt('qr_desc')}</div><div style={{display:'flex',flexDirection:'column',gap:7}}><button className="qb qbp" onClick={downloadQR} style={{justifyContent:'flex-start'}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>{dt('download')}</button><button className="qb qbw" onClick={()=>setShowRegenWarning(true)} style={{justifyContent:'flex-start'}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.53-8.94"/></svg>{dt('regen')}</button></div><div style={{marginTop:12,padding:'9px 11px',background:'rgba(0,180,200,.06)',border:'1px solid rgba(0,180,200,.14)',borderRadius:8,fontSize:10.5,color:'#7dd8e0',lineHeight:1.6}}>{dt('tip_qr')}</div></div>
                  </div>
                )}
              </div>
              <div className="card"><div className="ch"><span className="ct">{dt('stats')}</span></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[{l:dt('total_scans'),v:submissions.length},{l:dt('this_week'),v:week.length},{l:dt('avg_score'),v:avg>0?avg.toFixed(1)+'/5':'—'}].map((m,i)=><div key={i} style={{background:'#070f1d',borderRadius:8,padding:'11px',textAlign:'center',border:'1px solid rgba(255,255,255,.05)'}}><div style={{fontFamily:'Cabinet Grotesk,sans-serif',fontSize:20,fontWeight:900,color:'#e8f0fa',letterSpacing:-1}}>{m.v}</div><div style={{fontSize:9,color:'#2a3a52',marginTop:3}}>{m.l}</div></div>)}</div></div>
            </>}

            {/* SETTINGS */}
            {tab==='settings'&&<>
              {/* BRANDING */}
              <div className="card">
                <div className="ch"><span className="ct">{dt('branding')}</span></div>
                <label className="sl">{dt('logo')}</label>
                <p style={{fontSize:12,color:'#4a5a72',marginBottom:12,lineHeight:1.6}}>{dt('logo_desc')}</p>
                <div className="logo-zone">
                  <div className="logo-prev">
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : <span style={{fontSize:22}}>{business.name.slice(0,2).toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <div style={{fontSize:12,color:'#e8f0fa',fontWeight:600,marginBottom:3}}>{business.name}</div>
                    <div style={{fontSize:10.5,color:'#4a5a72',marginBottom:10}}>{logoPreview ? 'Logo personnalisé actif' : 'Logo par défaut (initiales)'}</div>
                    <div style={{display:'flex', gap: 7}}>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{display:'none'}}/>
                      <button className="upload-btn" onClick={()=>fileInputRef.current?.click()} disabled={logoUploading}>
                        {logoUploading
                          ? <><div style={{width:13,height:13,border:'2px solid rgba(255,255,255,.2)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>{dt('uploading')}</>
                          : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>{dt('upload')}</>
                        }
                      </button>
                      {logoPreview && (
                        <button onClick={removeLogo} style={{padding:'9px 12px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.15)',borderRadius:9,color:'#EF4444',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                          {dt('remove_logo')}
                        </button>
                      )}
                    </div>
                    {logoSaved&&<div className="saved-b" style={{marginTop:8}}>{dt('logo_saved')}</div>}
                  </div>
                </div>
              </div>

              {/* GOOGLE */}
              <div className="card"><div className="ch"><span className="ct">{dt('google_url')}</span></div><p style={{fontSize:12.5,color:'#4a5a72',lineHeight:1.6,marginBottom:12}}>{dt('google_desc')}</p><div className="sf"><label className="sl">URL Google Reviews</label><input className="si" value={googleUrl} onChange={e=>setGoogleUrl(e.target.value)} placeholder="https://g.page/r/votre-restaurant/review"/></div><div style={{display:'flex',alignItems:'center',gap:9}}><button className="sv-btn" onClick={saveGoogle} disabled={saving}>{saving?dt('saving'):dt('save')}</button>{saved&&<div className="saved-b">{dt('saved')}</div>}</div></div>

              {/* INFO */}
              <div className="card"><div className="ch"><span className="ct">{dt('info')}</span></div>{[{l:dt('name'),v:business.name},{l:dt('city'),v:business.city},{l:dt('sector_lbl'),v:business.sector},{l:dt('plan_lbl'),v:business.plan}].map((f,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}><span style={{fontSize:10.5,color:'#3d4e62',textTransform:'uppercase',letterSpacing:'.5px',fontWeight:700}}>{f.l}</span><span style={{fontSize:12.5,color:'#8899b0'}}>{f.v}</span></div>)}<p style={{fontSize:10,color:'#2a3a52',marginTop:10}}>{dt('contact_us')}</p></div>

              {/* DANGER */}
              <div className="card" style={{borderColor:'rgba(239,68,68,.14)'}}><div className="ch"><span className="ct" style={{color:'#EF4444'}}>{dt('danger')}</span></div><button onClick={logout} style={{padding:'8px 16px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,color:'#EF4444',fontSize:12.5,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{dt('logout')}</button></div>
            </>}

          </div>
        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="mob-bottom">
          <div className="mob-tabs">
            {TABS.map(item=>(
              <button key={item.id} className={`mob-tab${tab===item.id?' on':''}`} onClick={()=>setTab(item.id as typeof tab)}>
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={item.icon}/></svg>
                <span className="mob-tab-lbl">{tabLabel(item.id).split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* REGEN MODAL */}
      {showRegenWarning&&<div className="overlay" onClick={()=>setShowRegenWarning(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div style={{display:'flex',alignItems:'center',gap:11,marginBottom:14}}><div style={{width:40,height:40,borderRadius:11,background:'rgba(245,158,11,.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div style={{fontFamily:'Cabinet Grotesk,sans-serif',fontSize:15,fontWeight:800,color:'#e8f0fa'}}>{dt('regen_warn')}</div></div><div style={{fontSize:12.5,color:'#5a6a82',lineHeight:1.65,marginBottom:18,padding:'11px',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:9}}>{dt('regen_body')}</div><div style={{display:'flex',gap:7}}><button onClick={generateQR} disabled={qrLoading} style={{flex:1,padding:'10px',background:'#028090',color:'#fff',border:'none',borderRadius:9,fontSize:12.5,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>{qrLoading?<><div style={{width:13,height:13,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>{dt('generating')}</>:<>{dt('regen_btn')}</>}</button><button onClick={()=>setShowRegenWarning(false)} style={{padding:'10px 14px',background:'transparent',color:'#5a6a82',border:'1px solid rgba(255,255,255,.08)',borderRadius:9,fontSize:12.5,cursor:'pointer',fontFamily:'inherit'}}>{dt('cancel')}</button></div></div></div>}
    </>
  )
}
