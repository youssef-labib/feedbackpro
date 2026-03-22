'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Business = { id:string; name:string; slug:string; sector:string; city:string; google_review_url:string|null; plan:string; plan_status:string }
type Category = { id:string; label_fr:string; label_ar:string; label_en?:string }
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
  const [tab, setTab] = useState<'overview'|'reviews'|'qr'|'settings'>('overview')
  const [googleUrl, setGoogleUrl] = useState(business.google_review_url||'')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  async function logout() {
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await s.auth.signOut()
    window.location.href = '/'
  }

  async function saveGoogle() {
    setSaving(true)
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await s.from('businesses').update({google_review_url:googleUrl}).eq('id',business.id)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  const TABS = [
    {id:'overview',label:'Vue générale',icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
    {id:'reviews',label:`Avis (${submissions.length})`,icon:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'},
    {id:'qr',label:'QR & lien',icon:'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'},
    {id:'settings',label:'Paramètres',icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'},
  ] as const

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif;color:#8899b0}
        .d{display:flex;min-height:100vh}
        .sb{width:232px;flex-shrink:0;background:#0a1422;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto}
        .sb-brand{padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px}
        .sb-av{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#028090,#00b4c8);display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:13px;color:#fff;flex-shrink:0}
        .sb-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:13px;color:#e8f0fa;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sb-city{font-size:10px;color:#2a3a52;margin-top:1px}
        .sb-nav{padding:10px 8px;flex:1}
        .sb-btn{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:10px;cursor:pointer;transition:all .15s;margin-bottom:2px;border:none;background:transparent;width:100%;text-align:left;font-family:'Instrument Sans',sans-serif}
        .sb-btn:hover{background:rgba(255,255,255,.04)}
        .sb-btn.on{background:rgba(0,180,200,.1);border:1px solid rgba(0,180,200,.14)}
        .sb-btn svg{width:15px;height:15px;flex-shrink:0;stroke:rgba(255,255,255,.25)}
        .sb-btn.on svg{stroke:#00b4c8}
        .sb-lbl{font-size:12.5px;color:#4a5a72;font-weight:500}
        .sb-btn.on .sb-lbl{color:#7dd8e0;font-weight:600}
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
        .url-box{padding:11px 14px;background:#070f1d;border:1px solid rgba(255,255,255,.07);border-radius:10px;font-size:12px;color:#00b4c8;font-weight:500;word-break:break-all;margin-bottom:13px}
        .qa{display:flex;gap:7px;flex-wrap:wrap}
        .qb{padding:9px 16px;border-radius:9px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;text-decoration:none;display:inline-flex;align-items:center;gap:5px}
        .qb-p{background:#028090;color:#fff;border:none}
        .qb-p:hover{background:#00b4c8}
        .qb-g{background:transparent;color:#6b7c94;border:1px solid rgba(255,255,255,.1)}
        .qb-g:hover{border-color:rgba(0,180,200,.3);color:#e8f0fa}
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
        @media(max-width:768px){.sb{display:none}.g2{grid-template-columns:1fr}.content{padding:14px}.topbar{padding:0 14px}}
      `}</style>

      <div className="d">
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

        <div className="main">
          <div className="topbar">
            <div>
              <div className="pg-title">
                {tab==='overview'?'Vue générale':tab==='reviews'?'Tous les avis':tab==='qr'?'QR & lien':'Paramètres'}
              </div>
              <div className="pg-sub">
                {tab==='overview'&&`${week.length} avis cette semaine · ${submissions.length} au total`}
                {tab==='reviews'&&`${submissions.length} avis au total`}
                {tab==='qr'&&business.slug}
                {tab==='settings'&&'Gérez votre compte'}
              </div>
            </div>
            <span className="plan-pill">{business.plan}</span>
          </div>

          <div className="content">

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

            {tab==='qr'&&<>
              <div className="card">
                <div className="ch"><span className="ct">Votre lien de feedback</span></div>
                <div className="url-box">{formUrl}</div>
                <div className="qa">
                  <button className="qb qb-p" onClick={()=>navigator.clipboard.writeText(formUrl)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Copier
                  </button>
                  <a href={formUrl} target="_blank" rel="noopener noreferrer" className="qb qb-g">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Voir le formulaire
                  </a>
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Créer votre QR code</span></div>
                <p style={{fontSize:13,color:'#4a5a72',lineHeight:1.65,marginBottom:14}}>Copiez le lien ci-dessus et allez sur <strong style={{color:'#e8f0fa'}}>qr-code-generator.com</strong> pour générer votre QR code gratuit haute résolution.</p>
                <ol style={{paddingLeft:16,display:'flex',flexDirection:'column',gap:7}}>
                  {['Copiez le lien','Allez sur qr-code-generator.com','Collez et générez','Téléchargez en PNG haute résolution','Imprimez et placez sur vos tables (min 3×3 cm)'].map((s,i)=>(
                    <li key={i} style={{fontSize:12.5,color:'#5a6a82'}}><span style={{color:'#028090',fontWeight:700}}>{i+1}. </span>{s}</li>
                  ))}
                </ol>
                <div style={{marginTop:14,padding:'11px 13px',background:'rgba(0,180,200,.06)',border:'1px solid rgba(0,180,200,.14)',borderRadius:9,fontSize:12,color:'#7dd8e0'}}>
                  💡 Ajoutez votre logo dans le QR pour plus de professionnalisme.
                </div>
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

            {tab==='settings'&&<>
              <div className="card">
                <div className="ch"><span className="ct">Lien Google Reviews</span></div>
                <p style={{fontSize:13,color:'#4a5a72',lineHeight:1.6,marginBottom:14}}>Quand un client donne 4+ étoiles, il sera redirigé vers votre page Google. Collez l&apos;URL de votre fiche Google Business.</p>
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
                <div className="ch"><span className="ct">Informations du business</span></div>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {[{l:'Nom',v:business.name},{l:'Ville',v:business.city},{l:'Secteur',v:business.sector},{l:'Plan',v:business.plan}].map((f,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                      <span style={{fontSize:12,color:'#3d4e62',textTransform:'uppercase',letterSpacing:'.5px',fontWeight:700}}>{f.l}</span>
                      <span style={{fontSize:13,color:'#8899b0'}}>{f.v}</span>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:11,color:'#2a3a52',marginTop:12}}>Pour modifier ces informations, contactez support@feedbackpro.ma</p>
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
    </>
  )
}
