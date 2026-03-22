'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Business = { id:string; name:string; slug:string; sector:string; city:string; google_review_url:string|null; plan:string; plan_status:string; qr_generated?:boolean }
type Category = { id:string; label_fr:string; label_ar:string; label_en?:string; label_es?:string }
type Form = { id:string; business_id:string; categories:Category[] }
type Sub = { id:string; ratings:Record<string,number>; average_score:number; comment:string|null; created_at:string }

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

export default function DashboardClient({ business, form, submissions, userEmail }:
  { business:Business; form:Form|null; submissions:Sub[]; userEmail:string }) {

  const [tab, setTab] = useState<'overview'|'reviews'|'qr'|'questions'|'settings'>('overview')
  const [googleUrl, setGoogleUrl] = useState(business.google_review_url||'')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // QR state - persisted via database flag
  const [qrGenerated, setQrGenerated] = useState(business.qr_generated || false)
  const [qrLoading, setQrLoading] = useState(false)
  const [showRegenWarning, setShowRegenWarning] = useState(false)
  const [qrKey, setQrKey] = useState(0) // force img reload

  // Questions state
  const [questions, setQuestions] = useState<Category[]>(form?.categories || [])
  const [questionsDirty, setQuestionsDirty] = useState(false)
  const [questionsSaving, setQuestionsSaving] = useState(false)
  const [questionsSaved, setQuestionsSaved] = useState(false)
  const [showAddQ, setShowAddQ] = useState(false)
  const [newQ, setNewQ] = useState({ fr: '', ar: '', en: '', es: '' })
  const [qError, setQError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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

  const formUrl = typeof window!=='undefined'?`${window.location.origin}/r/${business.slug}`:`https://feedbackpro.ma/r/${business.slug}`
  const qrUrl = `/api/qr?url=${encodeURIComponent(formUrl)}`

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function saveGoogle() {
    setSaving(true)
    await supabase.from('businesses').update({google_review_url:googleUrl}).eq('id',business.id)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  async function generateQR() {
    setQrLoading(true)
    setShowRegenWarning(false)
    try {
      // Test that QR API works
      const res = await fetch(qrUrl)
      if (!res.ok) throw new Error('QR API failed')

      // Save to DB that QR has been generated
      await supabase.from('businesses').update({ qr_generated: true }).eq('id', business.id)
      setQrGenerated(true)
      setQrKey(k => k + 1) // force img to reload
    } catch (err) {
      console.error('QR generation error:', err)
    }
    setQrLoading(false)
  }

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `feedbackpro-qr-${business.slug}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Questions management
  function modifyQuestions(fn: (prev: Category[]) => Category[]) {
    setQuestions(fn)
    setQuestionsDirty(true)
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    modifyQuestions(prev => {
      const arr = [...prev]
      ;[arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]
      return arr
    })
  }
  function moveDown(idx: number) {
    if (idx === questions.length-1) return
    modifyQuestions(prev => {
      const arr = [...prev]
      ;[arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]
      return arr
    })
  }
  function removeQuestion(id: string) {
    if (questions.length <= 1) { setQError('Minimum 1 question requise.'); return }
    modifyQuestions(prev => prev.filter(q => q.id !== id))
    setQError('')
  }
  function addCustomQuestion() {
    if (!newQ.fr.trim()) { setQError('Le champ français est requis.'); return }
    if (questions.length >= 10) { setQError('Maximum 10 questions.'); return }
    const id = String(Date.now())
    modifyQuestions(prev => [...prev, {
      id, label_fr: newQ.fr.trim(),
      label_ar: newQ.ar.trim() || newQ.fr.trim(),
      label_en: newQ.en.trim() || newQ.fr.trim(),
      label_es: newQ.es.trim() || newQ.fr.trim(),
    }])
    setNewQ({ fr:'',ar:'',en:'',es:'' })
    setShowAddQ(false)
    setQError('')
  }
  async function saveQuestions() {
    if (!form) return
    setQuestionsSaving(true)
    const categories = questions.map((q,i) => ({
      id: String(i+1),
      label_fr: q.label_fr,
      label_ar: q.label_ar || q.label_fr,
      label_en: q.label_en || q.label_fr,
      label_es: q.label_es || q.label_fr,
    }))
    const { error } = await supabase.from('feedback_forms').update({ categories }).eq('id', form.id)
    if (!error) {
      setQuestions(categories)
      setQuestionsDirty(false)
      setQuestionsSaved(true)
      setTimeout(() => setQuestionsSaved(false), 2500)
    }
    setQuestionsSaving(false)
  }

  const TABS = [
    {id:'overview',label:'Vue générale',icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
    {id:'reviews',label:`Avis (${submissions.length})`,icon:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'},
    {id:'questions',label:'Questions',icon:'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'},
    {id:'qr',label:'QR code',icon:'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'},
    {id:'settings',label:'Paramètres',icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'},
  ] as const

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif;color:#8899b0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .d{display:flex;min-height:100vh}
        .sb{width:228px;flex-shrink:0;background:#0a1422;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto}
        .sb-brand{padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px}
        .sb-av{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#028090,#00b4c8);display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:13px;color:#fff;flex-shrink:0}
        .sb-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:13px;color:#e8f0fa;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sb-city{font-size:10px;color:#2a3a52;margin-top:1px}
        .sb-nav{padding:10px 8px;flex:1}
        .sb-btn{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:10px;cursor:pointer;transition:all .15s;margin-bottom:2px;border:none;background:transparent;width:100%;text-align:left;font-family:'Instrument Sans',sans-serif;position:relative}
        .sb-btn:hover{background:rgba(255,255,255,.04)}
        .sb-btn.on{background:rgba(0,180,200,.1);border:1px solid rgba(0,180,200,.14)}
        .sb-btn svg{width:15px;height:15px;flex-shrink:0;stroke:rgba(255,255,255,.25)}
        .sb-btn.on svg{stroke:#00b4c8}
        .sb-lbl{font-size:12.5px;color:#4a5a72;font-weight:500}
        .sb-btn.on .sb-lbl{color:#7dd8e0;font-weight:600}
        .dirty-dot{width:6px;height:6px;border-radius:50%;background:#F59E0B;position:absolute;right:10px;top:50%;transform:translateY(-50%)}
        .sb-foot{padding:12px 8px;border-top:1px solid rgba(255,255,255,.06)}
        .sb-user{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px}
        .sb-uav{width:26px;height:26px;border-radius:50%;background:rgba(0,180,200,.12);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#00b4c8;flex-shrink:0}
        .sb-email{font-size:10px;color:#2a3a52;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
        .lg-btn{background:none;border:none;cursor:pointer;color:#2a3a52;padding:4px;border-radius:5px;transition:color .15s;display:flex}
        .lg-btn:hover{color:#8899b0}
        .main{flex:1;min-width:0;display:flex;flex-direction:column}
        .topbar{padding:0 26px;height:56px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;background:#07101f;position:sticky;top:0;z-index:50}
        .pg-title{font-family:'Cabinet Grotesk',sans-serif;font-size:15px;font-weight:800;color:#e8f0fa;letter-spacing:-.3px}
        .pg-sub{font-size:10px;color:#2a3a52;margin-top:1px}
        .plan-pill{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(0,180,200,.1);color:#00b4c8;border:1px solid rgba(0,180,200,.18)}
        .content{padding:24px;flex:1}
        .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:11px;margin-bottom:20px}
        .metric{background:#0d1927;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px;transition:border-color .2s}
        .metric:hover{border-color:rgba(0,180,200,.18)}
        .metric-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#2a3a52;margin-bottom:10px}
        .metric-val{font-family:'Cabinet Grotesk',sans-serif;font-size:30px;font-weight:900;letter-spacing:-1.5px;line-height:1}
        .metric-sub{font-size:10px;color:#2a3a52;margin-top:5px}
        .up{color:#10B981}.dn{color:#EF4444}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
        .card{background:#0d1927;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px;margin-bottom:12px}
        .card:last-child{margin-bottom:0}
        .ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
        .ct{font-family:'Cabinet Grotesk',sans-serif;font-size:13px;font-weight:700;color:#e8f0fa;letter-spacing:-.2px}
        .ca{font-size:11px;color:#028090;cursor:pointer;font-weight:500}
        .ca:hover{color:#00b4c8}
        .cat-r{display:flex;align-items:center;gap:9px;margin-bottom:9px}
        .cat-r:last-child{margin-bottom:0}
        .cat-n{font-size:12px;color:#6b7c94;width:110px;flex-shrink:0}
        .cat-b{flex:1;height:6px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
        .cat-f{height:100%;border-radius:3px;transition:width .6s ease}
        .cat-s{font-size:11px;font-weight:700;width:26px;text-align:right}
        .rv{display:flex;gap:11px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .rv:last-child{border-bottom:none}
        .sp{padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:3px;flex-shrink:0}
        .rv-meta{flex:1;min-width:0}
        .rv-cats{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px}
        .rv-tag{font-size:10px;color:#2a3a52;padding:2px 6px;background:rgba(255,255,255,.03);border-radius:4px}
        .rv-cmt{font-size:12px;color:#5a6a82;line-height:1.45;font-style:italic}
        .rv-time{font-size:10px;color:#2a3a52;flex-shrink:0;padding-top:2px}
        .mc{height:60px;display:flex;align-items:flex-end;gap:3px}
        .mb{flex:1;border-radius:2px 2px 0 0;background:rgba(0,180,200,.12);min-height:3px;cursor:pointer;transition:background .15s}
        .mb:hover,.mb.td{background:#028090}
        .cd{display:flex;gap:3px;margin-top:4px}
        .cdl{flex:1;text-align:center;font-size:9px;color:#2a3a52}
        .url-box{padding:11px 14px;background:#070f1d;border:1px solid rgba(255,255,255,.07);border-radius:10px;font-size:12px;color:#00b4c8;font-weight:500;word-break:break-all;margin-bottom:13px;font-family:monospace}
        .qa{display:flex;gap:7px;flex-wrap:wrap}
        .qb{padding:9px 16px;border-radius:9px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;text-decoration:none;display:inline-flex;align-items:center;gap:5px;border:none}
        .qb-p{background:#028090;color:#fff}
        .qb-p:hover:not(:disabled){background:#00b4c8}
        .qb-p:disabled{opacity:.5;cursor:not-allowed}
        .qb-g{background:transparent;color:#6b7c94;border:1px solid rgba(255,255,255,.1)!important}
        .qb-g:hover{border-color:rgba(0,180,200,.3)!important;color:#e8f0fa}
        .qb-warn{background:rgba(245,158,11,.1);color:#F59E0B;border:1px solid rgba(245,158,11,.2)!important}
        .qb-warn:hover{background:rgba(245,158,11,.15)}
        .sf{margin-bottom:18px}
        .sl{font-size:11px;font-weight:700;color:#4a5a72;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:7px}
        .si{width:100%;padding:10px 13px;background:#070f1d;border:1px solid rgba(255,255,255,.08);border-radius:10px;font-size:13px;color:#e8f0fa;font-family:inherit;outline:none;transition:border-color .2s}
        .si:focus{border-color:#028090}
        .si::placeholder{color:#2a3a52}
        .sv-btn{padding:10px 22px;background:#028090;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
        .sv-btn:hover{background:#00b4c8;transform:translateY(-1px)}
        .saved-b{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:rgba(16,185,129,.1);border-radius:20px;font-size:10px;color:#10B981;font-weight:700}
        .empty{text-align:center;padding:40px 20px}
        .empty-i{font-size:36px;margin-bottom:10px;opacity:.3}
        .empty-t{font-family:'Cabinet Grotesk',sans-serif;font-size:14px;font-weight:700;color:#2a3a52;margin-bottom:5px}
        .empty-s{font-size:12px;color:#1e2e42;max-width:260px;margin:0 auto;line-height:1.6}
        .q-row{display:flex;align-items:center;gap:10px;padding:11px 13px;background:#070f1d;border:1px solid rgba(255,255,255,.07);border-radius:11px;margin-bottom:7px;transition:border-color .15s;animation:fadeUp .3s ease}
        .q-row:hover{border-color:rgba(0,180,200,.2)}
        /* Sticky save bar */
        .save-bar{position:sticky;bottom:0;left:0;right:0;background:rgba(10,20,34,.95);backdrop-filter:blur(12px);border-top:1px solid rgba(0,180,200,.2);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:100;animation:fadeUp .3s ease}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:#0d1927;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:400px}
        @media(max-width:768px){.sb{display:none}.g2{grid-template-columns:1fr}.content{padding:14px}.topbar{padding:0 14px}}
      `}</style>

      <div className="d">
        {/* SIDEBAR */}
        <aside className="sb">
          <div className="sb-brand">
            <div className="sb-av">{business.name.slice(0,2).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="sb-name">{business.name}</div>
              <div className="sb-city">{business.city} · {business.plan}</div>
            </div>
          </div>
          <nav className="sb-nav">
            {TABS.map(item => (
              <button key={item.id} className={`sb-btn${tab===item.id?' on':''}`} onClick={()=>setTab(item.id as typeof tab)}>
                <svg fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d={item.icon}/>
                </svg>
                <span className="sb-lbl">{item.label}</span>
                {item.id === 'questions' && questionsDirty && <span className="dirty-dot" title="Modifications non enregistrées"/>}
              </button>
            ))}
          </nav>
          <div className="sb-foot">
            <div className="sb-user">
              <div className="sb-uav">{userEmail[0]?.toUpperCase()}</div>
              <div className="sb-email">{userEmail}</div>
              <button className="lg-btn" onClick={logout} title="Déconnexion">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div>
              <div className="pg-title">
                {tab==='overview'?'Vue générale':tab==='reviews'?'Tous les avis':tab==='qr'?'QR code':tab==='questions'?'Mes questions':'Paramètres'}
              </div>
              <div className="pg-sub">
                {tab==='overview'&&`${week.length} avis cette semaine`}
                {tab==='reviews'&&`${submissions.length} avis total`}
                {tab==='qr'&&'Générez et téléchargez votre QR code'}
                {tab==='questions'&&`${questions.length} question${questions.length>1?'s':''} · ${questions.length>5?'2 pages':'1 page'}${questionsDirty?' · Modifications non enregistrées':''}`}
                {tab==='settings'&&'Gérez votre compte'}
              </div>
            </div>
            <span className="plan-pill">{business.plan}</span>
          </div>

          <div className="content">

            {/* ── OVERVIEW ── */}
            {tab==='overview'&&<>
              <div className="metrics">
                <div className="metric">
                  <div className="metric-lbl">Score global</div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <Ring score={avg}/>
                    <div>
                      <div style={{fontSize:10,color:'#2a3a52'}}>{submissions.length} avis total</div>
                      {delta!==null&&<div className={`metric-sub ${delta>=0?'up':'dn'}`}>{delta>=0?'↑':'↓'} {Math.abs(delta).toFixed(1)} vs sem. passée</div>}
                    </div>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-lbl">Cette semaine</div>
                  <div className="metric-val" style={{color:'#e8f0fa'}}>{week.length}</div>
                  <div className="metric-sub">
                    {lastWk.length>0?<><span className={week.length>=lastWk.length?'up':'dn'}>{week.length>=lastWk.length?'↑':'↓'} {Math.abs(week.length-lastWk.length)}</span> vs sem. passée</>:'avis reçus'}
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-lbl">Score semaine</div>
                  <div className="metric-val" style={{color:wAvg>0?SC(wAvg):'#2a3a52'}}>{wAvg>0?wAvg.toFixed(1):'—'}</div>
                  <div className="metric-sub">/ 5 cette semaine</div>
                </div>
                {cats.length>0&&<div className="metric" style={{borderColor:'rgba(239,68,68,.18)'}}>
                  <div className="metric-lbl">⚠ Point faible</div>
                  <div className="metric-val" style={{color:SC(cats[0].avg),fontSize:26}}>{cats[0].avg.toFixed(1)}</div>
                  <div className="metric-sub" style={{color:'#EF4444'}}>{cats[0].label}</div>
                </div>}
              </div>
              <div className="g2">
                <div className="card">
                  <div className="ch"><span className="ct">Score par catégorie</span></div>
                  {cats.length===0?<div className="empty"><div className="empty-i">⭐</div><div className="empty-t">Pas encore de données</div></div>:
                    cats.map(c=>(
                      <div key={c.id} className="cat-r">
                        <span className="cat-n">{c.label}</span>
                        <div className="cat-b"><div className="cat-f" style={{width:`${(c.avg/5)*100}%`,background:SC(c.avg)}}/></div>
                        <span className="cat-s" style={{color:SC(c.avg)}}>{c.avg.toFixed(1)}</span>
                      </div>
                    ))
                  }
                </div>
                <div className="card">
                  <div className="ch"><span className="ct">7 derniers jours</span></div>
                  {(()=>{
                    const days=Array.from({length:7},(_,i)=>{
                      const d=new Date();d.setDate(d.getDate()-(6-i))
                      const ss=submissions.filter(s=>new Date(s.created_at).toDateString()===d.toDateString())
                      return{label:d.toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,3),count:ss.length,isToday:d.toDateString()===new Date().toDateString()}
                    })
                    const mx=Math.max(...days.map(d=>d.count),1)
                    return<>
                      <div className="mc">{days.map((d,i)=><div key={i} title={`${d.count} avis`} className={`mb${d.isToday?' td':''}`} style={{height:`${Math.max((d.count/mx)*100,5)}%`}}/>)}</div>
                      <div className="cd">{days.map((d,i)=><div key={i} className="cdl" style={{color:d.isToday?'#028090':undefined}}>{d.label}</div>)}</div>
                    </>
                  })()}
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Derniers avis</span><span className="ca" onClick={()=>setTab('reviews')}>Voir tout →</span></div>
                {submissions.length===0?<div className="empty"><div className="empty-i">💬</div><div className="empty-t">Aucun avis pour le moment</div><div className="empty-s">Partagez votre QR code pour recevoir vos premiers avis</div></div>:
                  submissions.slice(0,5).map(s=>(
                    <div key={s.id} className="rv">
                      <div className="sp" style={{background:SBg(s.average_score),color:SC(s.average_score)}}>★ {s.average_score.toFixed(1)}</div>
                      <div className="rv-meta">
                        <div className="rv-cats">{Object.entries(s.ratings||{}).map(([id,v])=>{
                          const cat=form?.categories.find(c=>c.id===id)
                          return<span key={id} className="rv-tag">{cat?.label_fr||id}: {v as number}/5</span>
                        })}</div>
                        {s.comment&&<div className="rv-cmt">"{s.comment}"</div>}
                      </div>
                      <div className="rv-time">{new Date(s.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                  ))
                }
              </div>
            </>}

            {/* ── REVIEWS ── */}
            {tab==='reviews'&&<div className="card">
              <div className="ch"><span className="ct">Tous les avis ({submissions.length})</span></div>
              {submissions.length===0?<div className="empty"><div className="empty-i">💬</div><div className="empty-t">Aucun avis</div><div className="empty-s">Partagez votre QR pour commencer</div></div>:
                submissions.map(s=>(
                  <div key={s.id} className="rv">
                    <div className="sp" style={{background:SBg(s.average_score),color:SC(s.average_score)}}>★ {s.average_score.toFixed(1)}</div>
                    <div className="rv-meta">
                      <div className="rv-cats">{Object.entries(s.ratings||{}).map(([id,v])=>{
                        const cat=form?.categories.find(c=>c.id===id)
                        return<span key={id} className="rv-tag">{cat?.label_fr||id}: {v as number}/5</span>
                      })}</div>
                      {s.comment&&<div className="rv-cmt">"{s.comment}"</div>}
                    </div>
                    <div className="rv-time">{new Date(s.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                ))
              }
            </div>}

            {/* ── QUESTIONS ── */}
            {tab==='questions'&&<>
              <div className="card">
                <div className="ch">
                  <span className="ct">Mes questions de feedback</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:11,color:questions.length>=10?'#EF4444':questions.length>=5?'#10B981':'#F59E0B',fontWeight:700}}>{questions.length}/10</span>
                    {questions.length>5&&<span style={{fontSize:10,color:'#7dd8e0',padding:'2px 8px',background:'rgba(0,180,200,.06)',border:'1px solid rgba(0,180,200,.14)',borderRadius:20}}>2 pages</span>}
                  </div>
                </div>

                <div style={{height:4,background:'rgba(255,255,255,.05)',borderRadius:2,marginBottom:14,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:2,background:questions.length>=10?'#EF4444':questions.length>=5?'#10B981':'#F59E0B',width:`${(questions.length/10)*100}%`,transition:'width .3s ease, background .3s'}}/>
                </div>

                {questions.length>5&&(
                  <div style={{padding:'8px 12px',background:'rgba(0,180,200,.06)',border:'1px solid rgba(0,180,200,.14)',borderRadius:9,fontSize:11,color:'#7dd8e0',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Page 1: questions 1–5 &nbsp;·&nbsp; Page 2: questions 6–{questions.length}
                  </div>
                )}

                {questions.map((q, idx) => (
                  <div key={q.id} className="q-row">
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      <button onClick={()=>moveUp(idx)} disabled={idx===0} style={{background:'none',border:'none',cursor:idx===0?'not-allowed':'pointer',color:idx===0?'#1e2e42':'#4a5a72',padding:1,display:'flex'}}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button onClick={()=>moveDown(idx)} disabled={idx===questions.length-1} style={{background:'none',border:'none',cursor:idx===questions.length-1?'not-allowed':'pointer',color:idx===questions.length-1?'#1e2e42':'#4a5a72',padding:1,display:'flex'}}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                    <div style={{width:22,height:22,borderRadius:6,background:idx<5?'rgba(0,180,200,.12)':'rgba(245,158,11,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:idx<5?'#00b4c8':'#F59E0B',flexShrink:0}}>
                      {idx+1}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#e8f0fa',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{q.label_fr}</div>
                      <div style={{fontSize:10,color:'#3d4e62',marginTop:1}}>AR: {q.label_ar||'—'} · EN: {q.label_en||'—'}</div>
                    </div>
                    <button onClick={()=>removeQuestion(q.id)}
                      style={{background:'none',border:'none',cursor:'pointer',color:'#2a3a52',padding:4,display:'flex',flexShrink:0,transition:'color .15s',borderRadius:6}}
                      onMouseEnter={e=>((e.currentTarget as HTMLButtonElement).style.color='#EF4444')}
                      onMouseLeave={e=>((e.currentTarget as HTMLButtonElement).style.color='#2a3a52')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                ))}

                {questions.length < 10 && (
                  <div style={{marginTop:8}}>
                    {!showAddQ ? (
                      <button onClick={()=>setShowAddQ(true)}
                        style={{width:'100%',padding:'10px',border:'1px dashed rgba(255,255,255,.1)',borderRadius:11,background:'transparent',color:'#4a5a72',cursor:'pointer',fontSize:12.5,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .15s'}}
                        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(0,180,200,.3)';(e.currentTarget as HTMLButtonElement).style.color='#e8f0fa'}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,.1)';(e.currentTarget as HTMLButtonElement).style.color='#4a5a72'}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Ajouter une question
                      </button>
                    ) : (
                      <div style={{background:'#070f1d',border:'1px solid rgba(0,180,200,.2)',borderRadius:12,padding:14,animation:'fadeUp .2s ease'}}>
                        <div style={{fontSize:11,fontWeight:700,color:'#4a5a72',textTransform:'uppercase',letterSpacing:.5,marginBottom:10}}>Nouvelle question</div>
                        {[{k:'fr',l:'🇫🇷 Français (requis)'},{k:'ar',l:'🇸🇦 Arabe'},{k:'en',l:'🇬🇧 Anglais'},{k:'es',l:'🇪🇸 Espagnol'}].map(f=>(
                          <input key={f.k} placeholder={f.l} value={newQ[f.k as keyof typeof newQ]}
                            onChange={e=>setNewQ(prev=>({...prev,[f.k]:e.target.value}))}
                            style={{width:'100%',padding:'9px 12px',background:'#0a1525',border:'1.5px solid rgba(255,255,255,.08)',borderRadius:9,fontSize:12.5,color:'#e8f0fa',fontFamily:'inherit',outline:'none',marginBottom:7,display:'block',transition:'border-color .2s'}}
                          />
                        ))}
                        <div style={{display:'flex',gap:8,marginTop:4}}>
                          <button onClick={addCustomQuestion} style={{flex:1,padding:'9px',background:'#028090',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Ajouter</button>
                          <button onClick={()=>{setShowAddQ(false);setNewQ({fr:'',ar:'',en:'',es:''})}} style={{padding:'9px 16px',background:'transparent',color:'#4a5a72',border:'1px solid rgba(255,255,255,.08)',borderRadius:9,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {qError&&<div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:9,padding:'10px 13px',fontSize:12.5,color:'#fca5a5',marginTop:10,display:'flex',alignItems:'center',gap:7}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{qError}</div>}
              </div>

              {/* STICKY SAVE BAR — appears when there are unsaved changes */}
              {questionsDirty && (
                <div className="save-bar">
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#F59E0B',display:'flex',alignItems:'center',gap:6}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Modifications non enregistrées
                    </div>
                    <div style={{fontSize:11,color:'#4a5a72',marginTop:2}}>Appliquez pour que vos clients voient les nouvelles questions</div>
                  </div>
                  <div style={{display:'flex',gap:8,flexShrink:0}}>
                    <button onClick={()=>{setQuestions(form?.categories||[]);setQuestionsDirty(false);setQError('')}}
                      style={{padding:'9px 16px',background:'transparent',color:'#5a6a82',border:'1px solid rgba(255,255,255,.1)',borderRadius:9,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                      Annuler
                    </button>
                    <button onClick={saveQuestions} disabled={questionsSaving}
                      style={{padding:'9px 22px',background:questionsSaving?'#028090':'linear-gradient(135deg,#028090,#00a8bc)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:questionsSaving?'not-allowed':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 14px rgba(0,180,200,.25)'}}>
                      {questionsSaving
                        ? <><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Enregistrement...</>
                        : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Appliquer les changements</>
                      }
                    </button>
                  </div>
                </div>
              )}

              {questionsSaved && !questionsDirty && (
                <div style={{textAlign:'center',padding:'12px',color:'#10B981',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Questions enregistrées avec succès
                </div>
              )}
            </>}

            {/* ── QR CODE ── */}
            {tab==='qr'&&<>
              <div className="card">
                <div className="ch"><span className="ct">Votre lien de feedback</span></div>
                <div className="url-box">{formUrl}</div>
                <div className="qa">
                  <button className="qb qb-p" onClick={()=>navigator.clipboard.writeText(formUrl)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Copier le lien
                  </button>
                  <a href={formUrl} target="_blank" rel="noopener noreferrer" className="qb qb-g" style={{textDecoration:'none'}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Voir le formulaire
                  </a>
                </div>
              </div>

              <div className="card">
                <div className="ch"><span className="ct">QR Code</span></div>

                {!qrGenerated ? (
                  <div style={{textAlign:'center',padding:'32px 0'}}>
                    <div style={{fontSize:56,marginBottom:16,opacity:.2}}>📱</div>
                    <div style={{fontSize:14,color:'#4a5a72',marginBottom:8,lineHeight:1.6}}>Générez votre QR code pour le placer sur vos tables et menus.</div>
                    <div style={{fontSize:12,color:'#2a3a52',marginBottom:24}}>Format PNG haute résolution, prêt à imprimer.</div>
                    <button className="qb qb-p" onClick={generateQR} disabled={qrLoading}
                      style={{padding:'12px 28px',fontSize:14,margin:'0 auto'}}>
                      {qrLoading
                        ? <><div style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Génération...</>
                        : <>📱 Générer mon QR code</>
                      }
                    </button>
                  </div>
                ) : (
                  <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap'}}>
                    {/* QR Preview — direct img src, no FileReader needed */}
                    <div style={{flexShrink:0}}>
                      <div style={{background:'#fff',borderRadius:16,padding:16,display:'inline-block',boxShadow:'0 4px 20px rgba(0,0,0,.4)'}}>
                        <img
                          key={qrKey}
                          src={`${qrUrl}&v=${qrKey}`}
                          alt="QR Code"
                          width={200}
                          height={200}
                          style={{display:'block',borderRadius:4}}
                          onError={e => {
                            // If image fails, show placeholder
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                      <div style={{textAlign:'center',fontSize:10,color:'#2a3a52',marginTop:8}}>{business.slug}</div>
                    </div>

                    {/* Actions */}
                    <div style={{flex:1,minWidth:200}}>
                      <div style={{fontFamily:'Cabinet Grotesk, sans-serif',fontSize:15,fontWeight:700,color:'#e8f0fa',marginBottom:6}}>✓ Votre QR code est prêt !</div>
                      <div style={{fontSize:12.5,color:'#4a5a72',lineHeight:1.65,marginBottom:20}}>
                        Téléchargez en PNG haute résolution.<br/>
                        Taille minimale recommandée : <strong style={{color:'#e8f0fa'}}>3×3 cm</strong>.
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <button className="qb qb-p" onClick={downloadQR}
                          style={{justifyContent:'flex-start',padding:'11px 18px'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Télécharger le QR (PNG)
                        </button>
                        <button className="qb qb-warn" onClick={()=>setShowRegenWarning(true)}
                          style={{justifyContent:'flex-start',padding:'11px 18px'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.53-8.94"/></svg>
                          Régénérer le QR code
                        </button>
                      </div>
                      <div style={{marginTop:14,padding:'10px 12px',background:'rgba(0,180,200,.06)',border:'1px solid rgba(0,180,200,.14)',borderRadius:9,fontSize:11,color:'#7dd8e0',lineHeight:1.6}}>
                        💡 Le lien du QR ne change jamais. Régénérer crée juste un nouveau fichier image.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="ch"><span className="ct">Statistiques</span></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                  {[{l:'Total scans',v:submissions.length},{l:'Cette semaine',v:week.length},{l:'Score moyen',v:avg>0?avg.toFixed(1)+'/5':'—'}].map((m,i)=>(
                    <div key={i} style={{background:'#070f1d',borderRadius:9,padding:'13px',textAlign:'center',border:'1px solid rgba(255,255,255,.05)'}}>
                      <div style={{fontFamily:'Cabinet Grotesk,sans-serif',fontSize:22,fontWeight:900,color:'#e8f0fa',letterSpacing:-1}}>{m.v}</div>
                      <div style={{fontSize:10,color:'#2a3a52',marginTop:3}}>{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {/* ── SETTINGS ── */}
            {tab==='settings'&&<>
              <div className="card">
                <div className="ch"><span className="ct">Lien Google Reviews</span></div>
                <p style={{fontSize:13,color:'#4a5a72',lineHeight:1.6,marginBottom:14}}>
                  Quand un client donne 4+ étoiles, il sera redirigé vers votre page Google.
                </p>
                <div className="sf">
                  <label className="sl">URL Google Reviews</label>
                  <input className="si" value={googleUrl} onChange={e=>setGoogleUrl(e.target.value)} placeholder="https://g.page/r/votre-restaurant/review"/>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <button className="sv-btn" onClick={saveGoogle} disabled={saving}>{saving?'Enregistrement...':'Enregistrer'}</button>
                  {saved&&<div className="saved-b">✓ Enregistré</div>}
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Informations</span></div>
                {[{l:'Nom',v:business.name},{l:'Ville',v:business.city},{l:'Secteur',v:business.sector},{l:'Plan',v:business.plan}].map((f,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <span style={{fontSize:11,color:'#3d4e62',textTransform:'uppercase',letterSpacing:'.5px',fontWeight:700}}>{f.l}</span>
                    <span style={{fontSize:13,color:'#8899b0'}}>{f.v}</span>
                  </div>
                ))}
                <p style={{fontSize:11,color:'#2a3a52',marginTop:12}}>Pour modifier, contactez support@feedbackpro.ma</p>
              </div>
              <div className="card" style={{borderColor:'rgba(239,68,68,.14)'}}>
                <div className="ch"><span className="ct" style={{color:'#EF4444'}}>Zone de danger</span></div>
                <button onClick={logout} style={{padding:'9px 18px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:9,color:'#EF4444',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                  Se déconnecter
                </button>
              </div>
            </>}

          </div>
        </div>
      </div>

      {/* REGEN WARNING MODAL */}
      {showRegenWarning && (
        <div className="overlay" onClick={()=>setShowRegenWarning(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{width:44,height:44,borderRadius:12,background:'rgba(245,158,11,.12)',border:'1px solid rgba(245,158,11,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{fontFamily:'Cabinet Grotesk, sans-serif',fontSize:16,fontWeight:800,color:'#e8f0fa',marginBottom:3}}>Régénérer le QR code ?</div>
                <div style={{fontSize:12,color:'#4a5a72'}}>Confirmation requise</div>
              </div>
            </div>
            <div style={{fontSize:13,color:'#5a6a82',lineHeight:1.65,marginBottom:20,padding:'12px',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:10}}>
              ⚠️ Si vous avez déjà imprimé des QR codes, <strong style={{color:'#e8f0fa'}}>ils continueront de fonctionner</strong> car le lien ne change jamais. Régénérer crée juste un nouveau fichier image à télécharger.
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={generateQR} disabled={qrLoading}
                style={{flex:1,padding:'11px',background:'#028090',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                {qrLoading
                  ? <><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Génération...</>
                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.53-8.94"/></svg>Régénérer quand même</>
                }
              </button>
              <button onClick={()=>setShowRegenWarning(false)} style={{padding:'11px 18px',background:'transparent',color:'#5a6a82',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
