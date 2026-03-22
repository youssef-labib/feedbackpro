'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const SUGGESTIONS: Record<string, { fr: string; ar: string; en: string; es: string }[]> = {
  restaurant: [
    { fr: 'Qualité de la nourriture', ar: 'جودة الطعام', en: 'Food quality', es: 'Calidad de la comida' },
    { fr: 'Service & attente', ar: 'الخدمة والانتظار', en: 'Service & wait time', es: 'Servicio y espera' },
    { fr: 'Propreté', ar: 'النظافة', en: 'Cleanliness', es: 'Limpieza' },
    { fr: 'Ambiance', ar: 'الأجواء', en: 'Ambiance', es: 'Ambiente' },
    { fr: 'Rapport qualité-prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Relación calidad-precio' },
    { fr: 'Présentation des plats', ar: 'تقديم الأطباق', en: 'Food presentation', es: 'Presentación de los platos' },
    { fr: 'Rapidité du service', ar: 'سرعة الخدمة', en: 'Speed of service', es: 'Velocidad del servicio' },
    { fr: 'Accueil & sourire', ar: 'الترحيب والابتسامة', en: 'Welcome & friendliness', es: 'Bienvenida y amabilidad' },
  ],
  gym: [
    { fr: 'Équipements & machines', ar: 'الأجهزة والمعدات', en: 'Equipment & machines', es: 'Equipos y máquinas' },
    { fr: 'Propreté des locaux', ar: 'نظافة المكان', en: 'Cleanliness', es: 'Limpieza' },
    { fr: 'Qualité des coachs', ar: 'جودة المدربين', en: 'Coach quality', es: 'Calidad de entrenadores' },
    { fr: 'Ambiance & motivation', ar: 'الأجواء والتحفيز', en: 'Ambiance & motivation', es: 'Ambiente y motivación' },
    { fr: 'Vestiaires & douches', ar: 'غرف تبديل الملابس والحمامات', en: 'Locker rooms & showers', es: 'Vestuarios y duchas' },
    { fr: 'Rapport qualité-prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Relación calidad-precio' },
    { fr: 'Horaires & disponibilité', ar: 'المواعيد والتوفر', en: 'Hours & availability', es: 'Horarios y disponibilidad' },
    { fr: 'Cours collectifs', ar: 'الدروس الجماعية', en: 'Group classes', es: 'Clases colectivas' },
  ],
  hotel: [
    { fr: 'Confort de la chambre', ar: 'راحة الغرفة', en: 'Room comfort', es: 'Confort de la habitación' },
    { fr: 'Accueil & réception', ar: 'الاستقبال', en: 'Reception & welcome', es: 'Recepción y bienvenida' },
    { fr: 'Propreté', ar: 'النظافة', en: 'Cleanliness', es: 'Limpieza' },
    { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast', es: 'Desayuno' },
    { fr: 'Rapport qualité-prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Relación calidad-precio' },
    { fr: 'Localisation', ar: 'الموقع', en: 'Location', es: 'Ubicación' },
    { fr: 'Wi-Fi & équipements', ar: 'الواي فاي والمرافق', en: 'Wi-Fi & facilities', es: 'Wi-Fi y servicios' },
    { fr: 'Piscine & espace détente', ar: 'المسبح والاسترخاء', en: 'Pool & relaxation', es: 'Piscina y relajación' },
  ],
  car_rental: [
    { fr: 'État du véhicule', ar: 'حالة السيارة', en: 'Vehicle condition', es: 'Estado del vehículo' },
    { fr: 'Propreté du véhicule', ar: 'نظافة السيارة', en: 'Vehicle cleanliness', es: 'Limpieza del vehículo' },
    { fr: 'Qualité du service', ar: 'جودة الخدمة', en: 'Service quality', es: 'Calidad del servicio' },
    { fr: 'Rapport qualité-prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Relación calidad-precio' },
    { fr: 'Facilité des démarches', ar: 'سهولة الإجراءات', en: 'Process ease', es: 'Facilidad del proceso' },
    { fr: 'Accueil & conseil', ar: 'الاستقبال والمشورة', en: 'Welcome & advice', es: 'Bienvenida y asesoramiento' },
  ],
  default: [
    { fr: 'Qualité du service', ar: 'جودة الخدمة', en: 'Service quality', es: 'Calidad del servicio' },
    { fr: 'Accueil & amabilité', ar: 'الاستقبال واللطف', en: 'Welcome & friendliness', es: 'Bienvenida y amabilidad' },
    { fr: 'Propreté', ar: 'النظافة', en: 'Cleanliness', es: 'Limpieza' },
    { fr: 'Rapport qualité-prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Relación calidad-precio' },
    { fr: 'Rapidité', ar: 'السرعة', en: 'Speed', es: 'Rapidez' },
    { fr: 'Satisfaction globale', ar: 'الرضا العام', en: 'Overall satisfaction', es: 'Satisfacción general' },
  ],
}

type Question = {
  id: string
  fr: string
  ar: string
  en: string
  es: string
}

export default function SetupPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [formId, setFormId] = useState<string | null>(null)
  const [sector, setSector] = useState('default')
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQ, setNewQ] = useState({ fr: '', ar: '', en: '', es: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: biz } = await supabase
        .from('businesses')
        .select('id, sector')
        .eq('owner_id', user.id)
        .single()

      if (!biz) { window.location.href = '/register'; return }
      setBusinessId(biz.id)
      setSector(biz.sector || 'default')

      const { data: form } = await supabase
        .from('feedback_forms')
        .select('id, categories')
        .eq('business_id', biz.id)
        .single()

      if (form) {
        setFormId(form.id)
        if (form.categories && form.categories.length > 0) {
          setQuestions(form.categories.map((c: Record<string, string>) => ({
            id: c.id || String(Math.random()),
            fr: c.label_fr || '',
            ar: c.label_ar || '',
            en: c.label_en || '',
            es: c.label_es || '',
          })))
        } else {
          // Pre-fill with sector suggestions (first 5)
          const sug = SUGGESTIONS[biz.sector] || SUGGESTIONS.default
          setQuestions(sug.slice(0, 5).map((s, i) => ({ id: String(i + 1), ...s })))
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  function addSuggestion(s: { fr: string; ar: string; en: string; es: string }) {
    if (questions.length >= 10) { setError('Maximum 10 questions.'); return }
    if (questions.some(q => q.fr === s.fr)) return
    setQuestions(prev => [...prev, { id: String(Date.now()), ...s }])
    setError('')
  }

  function removeQuestion(id: string) {
    if (questions.length <= 1) { setError('Minimum 1 question requise.'); return }
    setQuestions(prev => prev.filter(q => q.id !== id))
    setError('')
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const arr = [...questions]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    setQuestions(arr)
  }

  function moveDown(idx: number) {
    if (idx === questions.length - 1) return
    const arr = [...questions]
      ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    setQuestions(arr)
  }

  function addCustom() {
    if (!newQ.fr.trim()) { setError('Le champ français est requis.'); return }
    if (questions.length >= 10) { setError('Maximum 10 questions.'); return }
    setQuestions(prev => [...prev, {
      id: String(Date.now()),
      fr: newQ.fr.trim(),
      ar: newQ.ar.trim() || newQ.fr.trim(),
      en: newQ.en.trim() || newQ.fr.trim(),
      es: newQ.es.trim() || newQ.fr.trim(),
    }])
    setNewQ({ fr: '', ar: '', en: '', es: '' })
    setShowAdd(false)
    setError('')
  }

  async function handleSave() {
    if (questions.length < 1) { setError('Ajoutez au moins 1 question.'); return }
    if (questions.length > 10) { setError('Maximum 10 questions.'); return }
    setSaving(true)
    setError('')

    const categories = questions.map((q, i) => ({
      id: String(i + 1),
      label_fr: q.fr,
      label_ar: q.ar || q.fr,
      label_en: q.en || q.fr,
      label_es: q.es || q.fr,
    }))

    const { error } = await supabase
      .from('feedback_forms')
      .update({ categories })
      .eq('id', formId)

    if (error) { setError(error.message); setSaving(false); return }
    window.location.href = '/dashboard'
  }

  const sug = SUGGESTIONS[sector] || SUGGESTIONS.default
  const available = sug.filter(s => !questions.some(q => q.fr === s.fr))

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#07101f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,.07)', borderTopColor: '#028090', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus{border-color:#028090 !important;background:#060d1a !important;outline:none}
        input::placeholder{color:#2a3a52}
        .q-item{display:flex;align-items:center;gap:10px;padding:11px 14px;background:#070f1d;border:1px solid rgba(255,255,255,.08);border-radius:11px;margin-bottom:7px;transition:border-color .15s;animation:fadeUp .3s ease}
        .q-item:hover{border-color:rgba(0,180,200,.2)}
        .sug-btn{padding:7px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:#070f1d;cursor:pointer;font-size:12px;color:#8899b0;font-family:inherit;transition:all .15s;text-align:left}
        .sug-btn:hover{border-color:rgba(0,180,200,.3);color:#e8f0fa;background:rgba(0,180,200,.05)}
      `}</style>

      <div style={{ minHeight: '100vh', background: '#07101f', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,180,200,.1), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Nav */}
        <nav style={{ padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 900, fontSize: 13, color: '#fff' }}>F</div>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: '#e8f0fa', letterSpacing: -.3 }}>FeedbackPro</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, color: '#2a3a52', background: 'rgba(0,180,200,.06)', border: '1px solid rgba(0,180,200,.14)', borderRadius: 20, padding: '4px 12px' }}>Étape 3 sur 3</div>
          </div>
        </nav>

        <main style={{ flex: 1, padding: '32px 20px 80px', position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>❓</div>
            <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 26, fontWeight: 900, color: '#e8f0fa', letterSpacing: -.5, marginBottom: 8 }}>
              Configurez vos questions
            </div>
            <div style={{ fontSize: 14, color: '#4a5a72', lineHeight: 1.65, maxWidth: 460, margin: '0 auto' }}>
              Ces questions apparaîtront dans votre formulaire de feedback. Choisissez entre <strong style={{ color: '#e8f0fa' }}>1 et 10 questions</strong>. Si vous en ajoutez plus de 5, elles seront réparties sur 2 pages dans le formulaire.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* LEFT — Current questions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f0fa' }}>
                  Vos questions
                </div>
                <div style={{ fontSize: 12, color: questions.length >= 10 ? '#EF4444' : questions.length >= 5 ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                  {questions.length}/10
                  {questions.length > 5 && <span style={{ fontSize: 10, color: '#4a5a72', marginLeft: 6 }}>• 2 pages</span>}
                </div>
              </div>

              {/* Progress */}
              <div style={{ height: 4, background: 'rgba(255,255,255,.05)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: questions.length >= 10 ? '#EF4444' : questions.length >= 5 ? '#10B981' : '#F59E0B', width: `${(questions.length / 10) * 100}%`, transition: 'width .3s ease, background .3s' }} />
              </div>

              {/* Page preview */}
              {questions.length > 5 && (
                <div style={{ padding: '8px 12px', background: 'rgba(0,180,200,.06)', border: '1px solid rgba(0,180,200,.14)', borderRadius: 9, fontSize: 11, color: '#7dd8e0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Page 1: questions 1–5 · Page 2: questions {questions.length > 5 ? `6–${questions.length}` : ''}
                </div>
              )}

              {/* Question list */}
              {questions.map((q, idx) => (
                <div key={q.id} className="q-item">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? '#2a3a52' : '#4a5a72', padding: 1, display: 'flex', transition: 'color .15s' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === questions.length - 1} style={{ background: 'none', border: 'none', cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer', color: idx === questions.length - 1 ? '#2a3a52' : '#4a5a72', padding: 1, display: 'flex', transition: 'color .15s' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                  </div>

                  <div style={{ width: 22, height: 22, borderRadius: 6, background: idx < 5 ? 'rgba(0,180,200,.12)' : 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: idx < 5 ? '#00b4c8' : '#F59E0B', flexShrink: 0 }}>
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f0fa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.fr}</div>
                    {q.ar && q.ar !== q.fr && <div style={{ fontSize: 10, color: '#3d4e62', direction: 'rtl', textAlign: 'right' }}>{q.ar}</div>}
                  </div>

                  <button onClick={() => removeQuestion(q.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a3a52', padding: 4, display: 'flex', flexShrink: 0, transition: 'color .15s', borderRadius: 6 }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#EF4444')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#2a3a52')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                  </button>
                </div>
              ))}

              {/* Add custom question */}
              {questions.length < 10 && (
                <div>
                  {!showAdd ? (
                    <button onClick={() => setShowAdd(true)}
                      style={{ width: '100%', padding: '10px', border: '1px dashed rgba(255,255,255,.12)', borderRadius: 11, background: 'transparent', color: '#4a5a72', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', marginTop: 4 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,180,200,.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#e8f0fa' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#4a5a72' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Ajouter une question personnalisée
                    </button>
                  ) : (
                    <div style={{ background: '#070f1d', border: '1px solid rgba(0,180,200,.2)', borderRadius: 12, padding: 14, marginTop: 8, animation: 'fadeUp .2s ease' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5a72', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Nouvelle question</div>
                      {[
                        { key: 'fr', label: '🇫🇷 Français (requis)' },
                        { key: 'ar', label: '🇸🇦 Arabe' },
                        { key: 'en', label: '🇬🇧 Anglais' },
                        { key: 'es', label: '🇪🇸 Espagnol' },
                      ].map(f => (
                        <input key={f.key} placeholder={f.label} value={newQ[f.key as keyof typeof newQ]}
                          onChange={e => setNewQ(prev => ({ ...prev, [f.key]: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', background: '#0a1525', border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 9, fontSize: 13, color: '#e8f0fa', fontFamily: 'inherit', outline: 'none', marginBottom: 7, display: 'block', transition: 'border-color .2s' }}
                        />
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button onClick={addCustom} style={{ flex: 1, padding: '9px', background: '#028090', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Ajouter</button>
                        <button onClick={() => { setShowAdd(false); setNewQ({ fr: '', ar: '', en: '', es: '' }) }} style={{ padding: '9px 16px', background: 'transparent', color: '#4a5a72', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — Suggestions */}
            <div>
              <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f0fa', marginBottom: 12 }}>
                Suggestions
              </div>
              <div style={{ fontSize: 12, color: '#3d4e62', marginBottom: 12 }}>Cliquez pour ajouter à votre liste</div>

              {available.length === 0 ? (
                <div style={{ fontSize: 13, color: '#2a3a52', textAlign: 'center', padding: '24px 0' }}>
                  Toutes les suggestions ont été ajoutées ✓
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {available.map((s, i) => (
                    <button key={i} className="sug-btn" onClick={() => addSuggestion(s)} disabled={questions.length >= 10}>
                      <span style={{ color: '#028090', marginRight: 6, fontSize: 11 }}>+</span>
                      {s.fr}
                      {s.ar && <div style={{ fontSize: 10, color: '#2a3a52', direction: 'rtl', marginTop: 1 }}>{s.ar}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ margin: '16px 0', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}

          {/* Save button */}
          <div style={{ marginTop: 28, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={handleSave} disabled={saving || questions.length < 1}
              style={{ padding: '13px 40px', background: saving ? 'rgba(255,255,255,.05)' : 'linear-gradient(135deg,#028090,#00a8bc)', color: saving ? '#4a5a72' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, boxShadow: saving ? 'none' : '0 4px 16px rgba(0,180,200,.2)', transition: 'all .2s' }}>
              {saving
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />Enregistrement...</>
                : <>Enregistrer et accéder au dashboard <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>
              }
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#2a3a52', marginTop: 10 }}>
            Vous pourrez modifier vos questions à tout moment depuis le dashboard
          </div>
        </main>
      </div>
    </>
  )
}
