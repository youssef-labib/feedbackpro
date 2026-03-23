'use client'

import { useState } from 'react'

type Business = {
  id: string; name: string; slug: string; sector: string; city: string
  google_review_url: string | null; plan: string; plan_status: string; created_at: string; owner_id: string
}

const SC = (s: number) => s >= 4 ? '#10B981' : s >= 3 ? '#F59E0B' : '#EF4444'
const PLAN_COLOR: Record<string, { bg: string; color: string }> = {
  trial:    { bg: 'rgba(99,153,34,.12)', color: '#639922' },
  starter:  { bg: 'rgba(0,180,200,.1)', color: '#00b4c8' },
  pro:      { bg: 'rgba(2,128,144,.15)', color: '#028090' },
  business: { bg: 'rgba(124,58,237,.12)', color: '#a78bfa' },
}
const STATUS_COLOR: Record<string, { bg: string; color: string; dot: string }> = {
  active:    { bg: 'rgba(16,185,129,.12)', color: '#10B981', dot: '#10B981' },
  trial:     { bg: 'rgba(0,180,200,.1)', color: '#00b4c8', dot: '#00b4c8' },
  suspended: { bg: 'rgba(239,68,68,.1)', color: '#EF4444', dot: '#EF4444' },
  past_due:  { bg: 'rgba(245,158,11,.1)', color: '#F59E0B', dot: '#F59E0B' },
}

export default function AdminClient({ businesses, submissionCounts, avgScores }: {
  businesses: Business[]
  submissionCounts: Record<string, number>
  avgScores: Record<string, number>
}) {
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState<Business | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')

  const active = businesses.filter(b => b.plan_status === 'active' || b.plan_status === 'trial').length
  const suspended = businesses.filter(b => b.plan_status === 'suspended').length
  const mrr = businesses.filter(b => b.plan_status === 'active').reduce((acc, b) => {
    if (b.plan === 'pro') return acc + 299
    if (b.plan === 'business') return acc + 699
    if (b.plan === 'starter') return acc + 149
    return acc
  }, 0)
  const totalReviews = Object.values(submissionCounts).reduce((a, b) => a + b, 0)

  const filtered = businesses.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q) || b.slug.includes(q)
    const matchPlan = filterPlan === 'all' || b.plan === filterPlan
    const matchStatus = filterStatus === 'all' || b.plan_status === filterStatus
    return matchSearch && matchPlan && matchStatus
  })

  async function updateBusiness(id: string, updates: Record<string, string>) {
    setUpdating(true)
    const res = await fetch('/api/admin/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    if (res.ok) {
      setUpdateMsg('Mis à jour ✓')
      setTimeout(() => { setUpdateMsg(''); setSelected(null); window.location.reload() }, 1200)
    } else {
      setUpdateMsg('Erreur')
    }
    setUpdating(false)
  }

  const sc = selected ? STATUS_COLOR[selected.plan_status] || STATUS_COLOR.active : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif;color:#8899b0}
        .adm{min-height:100vh;background:#07101f}
        .adm-top{background:#0a1422;border-bottom:1px solid rgba(255,255,255,.07);padding:0 28px;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
        .adm-brand{display:flex;align-items:center;gap:10px}
        .adm-mark{width:32px;height:32px;border-radius:9px;background:#028090;display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:14px;color:#fff}
        .adm-title{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:15px;color:#e8f0fa;letter-spacing:-.2px}
        .adm-badge{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(239,68,68,.1);color:#EF4444;border:1px solid rgba(239,68,68,.2)}
        .body{padding:24px 28px}
        .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:11px;margin-bottom:22px}
        .metric{background:#0d1927;border:1px solid rgba(255,255,255,.07);border-radius:15px;padding:16px 18px}
        .ml{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#2a3a52;margin-bottom:8px}
        .mv{font-family:'Cabinet Grotesk',sans-serif;font-size:28px;font-weight:900;letter-spacing:-1.5px;color:#e8f0fa}
        .ms{font-size:10px;color:#2a3a52;margin-top:4px}
        .filters{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
        .search{flex:1;min-width:200px;padding:9px 13px;background:#0d1927;border:1px solid rgba(255,255,255,.08);border-radius:10px;font-size:13px;color:#e8f0fa;font-family:inherit;outline:none;transition:border-color .2s}
        .search:focus{border-color:#028090}
        .search::placeholder{color:#2a3a52}
        .flt{padding:8px 13px;background:#0d1927;border:1px solid rgba(255,255,255,.08);border-radius:9px;font-size:12px;color:#6b7c94;font-family:inherit;outline:none;cursor:pointer;transition:border-color .2s}
        .flt:focus{border-color:#028090}
        .table-wrap{background:#0d1927;border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden}
        .table-head{padding:10px 18px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
        .th-title{font-family:'Cabinet Grotesk',sans-serif;font-size:13px;font-weight:700;color:#e8f0fa}
        .th-count{font-size:11px;color:#2a3a52}
        table{width:100%;border-collapse:collapse}
        th{text-align:left;padding:10px 18px;font-size:10px;font-weight:700;color:#2a3a52;text-transform:uppercase;letter-spacing:.7px;border-bottom:1px solid rgba(255,255,255,.05);background:#070f1d}
        td{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
        tr:last-child td{border-bottom:none}
        tr:hover td{background:rgba(255,255,255,.02);cursor:pointer}
        .biz-cell{display:flex;align-items:center;gap:9px}
        .biz-ic{width:32px;height:32px;border-radius:9px;background:rgba(0,180,200,.1);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#00b4c8;flex-shrink:0;font-family:'Cabinet Grotesk',sans-serif}
        .biz-nm{font-weight:600;color:#e8f0fa;font-size:13px}
        .biz-sl{font-size:10px;color:#2a3a52}
        .plan-chip{padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
        .sp{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:700}
        .sp-dot{width:5px;height:5px;border-radius:50%}
        .act-btn{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;border:1px solid rgba(0,180,200,.2);background:rgba(0,180,200,.08);color:#00b4c8}
        .act-btn:hover{background:rgba(0,180,200,.15)}
        .empty-row{padding:48px;text-align:center;color:#2a3a52;font-size:13px}

        /* MODAL */
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:#0d1927;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto}
        .modal-title{font-family:'Cabinet Grotesk',sans-serif;font-size:18px;font-weight:800;color:#e8f0fa;letter-spacing:-.3px;margin-bottom:20px}
        .m-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)}
        .m-row:last-of-type{border-bottom:none}
        .m-lbl{font-size:11px;color:#3d4e62;text-transform:uppercase;letter-spacing:.5px;font-weight:700}
        .m-val{font-size:13px;color:#8899b0}
        .m-actions{margin-top:20px;display:flex;flex-direction:column;gap:8px}
        .m-btn{width:100%;padding:11px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;border:none;display:flex;align-items:center;justify-content:center;gap:6px}
        .m-btn-teal{background:#028090;color:#fff}
        .m-btn-teal:hover{background:#00b4c8}
        .m-btn-warn{background:rgba(245,158,11,.1);color:#F59E0B;border:1px solid rgba(245,158,11,.2)}
        .m-btn-warn:hover{background:rgba(245,158,11,.15)}
        .m-btn-red{background:rgba(239,68,68,.1);color:#EF4444;border:1px solid rgba(239,68,68,.2)}
        .m-btn-red:hover{background:rgba(239,68,68,.15)}
        .m-btn-ghost{background:rgba(255,255,255,.04);color:#5a6a82;border:1px solid rgba(255,255,255,.08)}
        .m-btn-ghost:hover{color:#e8f0fa}
        .m-sep{height:1px;background:rgba(255,255,255,.06);margin:16px 0}
        .m-section{font-size:11px;font-weight:700;color:#2a3a52;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
        .m-select{width:100%;padding:9px 12px;background:#070f1d;border:1px solid rgba(255,255,255,.08);border-radius:9px;font-size:13px;color:#e8f0fa;font-family:inherit;outline:none;cursor:pointer;appearance:none}
        .m-select:focus{border-color:#028090}
        .update-msg{text-align:center;padding:8px;font-size:13px;color:#10B981;font-weight:600}

        @media(max-width:768px){.body{padding:16px}.filters{flex-direction:column}.search{min-width:0;width:100%}}
      `}</style>

      <div className="adm">
        <div className="adm-top">
          <div className="adm-brand">
            <div className="adm-mark">F</div>
            <span className="adm-title">FeedbackPro Admin</span>
          </div>
          <span className="adm-badge">Super Admin</span>
        </div>

        <div className="body">
          <div className="metrics">
            {[
              { l: 'Total clients', v: businesses.length, s: `${active} actifs`, c: '#e8f0fa' },
              { l: 'MRR estimé', v: `${mrr.toLocaleString()} MAD`, s: 'abonnements actifs', c: '#00b4c8' },
              { l: 'Suspendus', v: suspended, s: 'action requise', c: suspended > 0 ? '#EF4444' : '#2a3a52' },
              { l: 'Total avis', v: totalReviews.toLocaleString(), s: 'toutes sources', c: '#10B981' },
            ].map((m, i) => (
              <div key={i} className="metric">
                <div className="ml">{m.l}</div>
                <div className="mv" style={{ color: m.c }}>{m.v}</div>
                <div className="ms">{m.s}</div>
              </div>
            ))}
          </div>

          <div className="filters">
            <input className="search" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)}/>
            <select className="flt" value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
              <option value="all">Tous les plans</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
            <select className="flt" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspendu</option>
              <option value="past_due">En retard</option>
            </select>
          </div>

          <div className="table-wrap">
            <div className="table-head">
              <span className="th-title">Clients</span>
              <span className="th-count">{filtered.length} résultats</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Ville</th>
                    <th>Plan</th>
                    <th>Statut</th>
                    <th>Avis</th>
                    <th>Score</th>
                    <th>Créé le</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8}><div className="empty-row">Aucun client trouvé</div></td></tr>
                  ) : filtered.map(b => {
                    const st = STATUS_COLOR[b.plan_status] || STATUS_COLOR.active
                    const pc = PLAN_COLOR[b.plan] || PLAN_COLOR.trial
                    const score = avgScores[b.id]
                    return (
                      <tr key={b.id} onClick={() => setSelected(b)}>
                        <td>
                          <div className="biz-cell">
                            <div className="biz-ic">{b.name.slice(0,2).toUpperCase()}</div>
                            <div>
                              <div className="biz-nm">{b.name}</div>
                              <div className="biz-sl">{b.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: '#5a6a82' }}>{b.city || '—'}</td>
                        <td>
                          <span className="plan-chip" style={{ background: pc.bg, color: pc.color }}>{b.plan}</span>
                        </td>
                        <td>
                          <span className="sp" style={{ background: st.bg, color: st.color }}>
                            <span className="sp-dot" style={{ background: st.dot }}></span>
                            {b.plan_status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#e8f0fa', fontSize: 13 }}>{submissionCounts[b.id] || 0}</td>
                        <td style={{ color: score ? SC(score) : '#2a3a52', fontWeight: 700, fontSize: 13 }}>{score ? score.toFixed(1) : '—'}</td>
                        <td style={{ fontSize: 11, color: '#2a3a52' }}>{new Date(b.created_at).toLocaleDateString('fr-FR')}</td>
                        <td><button className="act-btn" onClick={e => { e.stopPropagation(); setSelected(b) }}>Gérer</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selected && sc && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,180,200,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 900, fontSize: 16, color: '#00b4c8' }}>
                {selected.name.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div className="modal-title" style={{ marginBottom: 2 }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: '#2a3a52' }}>{selected.city} · {selected.sector}</div>
              </div>
            </div>

            {[
              { l: 'Slug / lien', v: selected.slug },
              { l: 'Plan actuel', v: selected.plan },
              { l: 'Statut', v: selected.plan_status },
              { l: 'Avis reçus', v: String(submissionCounts[selected.id] || 0) },
              { l: 'Score moyen', v: avgScores[selected.id] ? avgScores[selected.id].toFixed(1) + '/5' : '—' },
              { l: 'Créé le', v: new Date(selected.created_at).toLocaleDateString('fr-FR') },
            ].map((r, i) => (
              <div key={i} className="m-row">
                <span className="m-lbl">{r.l}</span>
                <span className="m-val">{r.v}</span>
              </div>
            ))}

            <div className="m-sep"/>
            <div className="m-section">Changer le plan</div>
            <select className="m-select" defaultValue={selected.plan}
              onChange={e => updateBusiness(selected.id, { plan: e.target.value })}>
              <option value="trial">Trial</option>
              <option value="starter">Starter — 149 MAD</option>
              <option value="pro">Pro — 299 MAD</option>
              <option value="business">Business — 699 MAD</option>
            </select>

            <div className="m-actions" style={{ marginTop: 16 }}>
              {selected.plan_status !== 'active' && (
                <button className="m-btn m-btn-teal" disabled={updating}
                  onClick={() => updateBusiness(selected.id, { plan_status: 'active' })}>
                  ✓ Activer le compte
                </button>
              )}
              {selected.plan_status === 'active' && (
                <button className="m-btn m-btn-warn" disabled={updating}
                  onClick={() => updateBusiness(selected.id, { plan_status: 'past_due' })}>
                  ⚠ Marquer en retard
                </button>
              )}
              {selected.plan_status !== 'suspended' && (
                <button className="m-btn m-btn-red" disabled={updating}
                  onClick={() => updateBusiness(selected.id, { plan_status: 'suspended' })}>
                  Suspendre le compte
                </button>
              )}
              {selected.plan_status === 'suspended' && (
                <button className="m-btn m-btn-teal" disabled={updating}
                  onClick={() => updateBusiness(selected.id, { plan_status: 'active' })}>
                  Réactiver le compte
                </button>
              )}
              <a href={`/r/${selected.slug}`} target="_blank" rel="noopener noreferrer"
                className="m-btn m-btn-ghost" style={{ textDecoration: 'none' }}>
                Voir le formulaire client →
              </a>
              <button className="m-btn m-btn-ghost" onClick={() => setSelected(null)}>Fermer</button>
            </div>

            {updateMsg && <div className="update-msg">{updateMsg}</div>}
          </div>
        </div>
      )}
    </>
  )
}
