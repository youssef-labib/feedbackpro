'use client'

import { useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  ExternalLink,
  ImageUp,
  LogOut,
  Plus,
  QrCode,
  Save,
  Trash2,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import AppLogo from '../../components/AppLogo'
import FlagLangSelector from '../../components/FlagLangSelector'
import { useStoredLanguage } from '../../components/useStoredLanguage'

type Business = {
  id: string
  name: string
  slug: string
  sector: string
  city: string
  google_review_url: string | null
  plan: string
  plan_status: string
  qr_generated?: boolean
  logo_url?: string | null
}

type Category = {
  id: string
  label_fr: string
  label_ar: string
  label_en?: string
  label_es?: string
}

type Form = { id: string; business_id: string; categories: Category[] }
type Submission = { id: string; ratings: Record<string, number>; average_score: number; comment: string | null; created_at: string }
type Tab = 'overview' | 'reviews' | 'questions' | 'qr' | 'settings'

function scoreStyle(score: number) {
  if (score >= 4) return { color: '#22c55e', bg: 'rgba(34,197,94,.14)' }
  if (score >= 3) return { color: '#f59e0b', bg: 'rgba(245,158,11,.14)' }
  return { color: '#ef4444', bg: 'rgba(239,68,68,.14)' }
}

function planLabel(plan: string) {
  if (plan === 'starter') return 'Starter - 149 MAD'
  if (plan === 'pro') return 'Pro - 299 MAD'
  if (plan === 'business') return 'Business - 699 MAD'
  return 'Trial'
}

export default function DashboardClient({
  business,
  form,
  submissions,
  userEmail,
}: {
  business: Business
  form: Form | null
  submissions: Submission[]
  userEmail: string
}) {
  const router = useRouter()
  const { lang, setLang, isRTL } = useStoredLanguage('fr')
  const [tab, setTab] = useState<Tab>('overview')
  const [businessName, setBusinessName] = useState(business.name)
  const [selectedPlan, setSelectedPlan] = useState(business.plan)
  const [googleUrl, setGoogleUrl] = useState(business.google_review_url || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [qrGenerated, setQrGenerated] = useState(Boolean(business.qr_generated))
  const [qrLoading, setQrLoading] = useState(false)
  const [questions, setQuestions] = useState<Category[]>(form?.categories || [])
  const [baselineQuestions, setBaselineQuestions] = useState<Category[]>(form?.categories || [])
  const [questionsDirty, setQuestionsDirty] = useState(false)
  const [questionsSaving, setQuestionsSaving] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({ fr: '', ar: '', en: '', es: '' })
  const [questionError, setQuestionError] = useState('')
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '')
  const [logoPreview, setLogoPreview] = useState(business.logo_url || '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoSaved, setLogoSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const averageScore = submissions.length
    ? Math.round((submissions.reduce((sum, item) => sum + item.average_score, 0) / submissions.length) * 10) / 10
    : 0
  const weekSubmissions = submissions.filter((item) => Date.now() - new Date(item.created_at).getTime() < 7 * 864e5)
  const categoryScores: Record<string, number[]> = {}
  submissions.forEach((submission) => {
    Object.entries(submission.ratings || {}).forEach(([id, value]) => {
      if (!categoryScores[id]) categoryScores[id] = []
      categoryScores[id].push(value)
    })
  })
  const categoryAverages = Object.entries(categoryScores)
    .map(([id, values]) => ({
      id,
      label: (form?.categories || questions).find((item) => item.id === id)?.label_fr || id,
      average: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10,
    }))
    .sort((a, b) => a.average - b.average)

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/r/${business.slug}` : `/r/${business.slug}`
  const qrUrl = `/api/qr?url=${encodeURIComponent(formUrl)}`

  function localQuestionLabel(question: Category) {
    if (lang === 'ar') return question.label_ar
    if (lang === 'en') return question.label_en || question.label_fr
    if (lang === 'es') return question.label_es || question.label_en || question.label_fr
    return question.label_fr
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function saveBusinessSettings() {
    setSaving(true)
    const response = await fetch('/api/business/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, name: businessName, google_review_url: googleUrl, plan: selectedPlan }),
    })
    const data = await response.json()
    setSaving(false)
    if (!response.ok) return alert(data.error || 'Save failed')
    setSaved(true)
    router.refresh()
    window.setTimeout(() => setSaved(false), 2200)
  }

  async function generateQr() {
    setQrLoading(true)
    try {
      const response = await fetch(qrUrl)
      if (!response.ok) throw new Error('failed')
      await supabase.from('businesses').update({ qr_generated: true }).eq('id', business.id)
      setQrGenerated(true)
    } catch {
      alert('Could not generate QR code')
    }
    setQrLoading(false)
  }

  function downloadQr() {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `feedbackpro-${business.slug}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return alert('Please choose an image file')
    if (file.size > 2 * 1024 * 1024) return alert('Image must stay under 2MB')

    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)

    setLogoUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('businessId', business.id)
    try {
      const response = await fetch('/api/upload-logo', { method: 'POST', body: formData })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Upload failed')
      setLogoUrl(data.url)
      setLogoSaved(true)
      window.setTimeout(() => setLogoSaved(false), 2200)
    } catch {
      setLogoPreview(logoUrl)
      alert('Upload failed')
    }
    setLogoUploading(false)
  }

  async function removeLogo() {
    await supabase.from('businesses').update({ logo_url: null }).eq('id', business.id)
    setLogoUrl('')
    setLogoPreview('')
  }

  function updateQuestions(next: Category[]) {
    setQuestions(next)
    setQuestionsDirty(true)
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateQuestions(next)
  }

  function removeQuestion(id: string) {
    if (questions.length <= 1) return setQuestionError('At least one question is required.')
    updateQuestions(questions.filter((item) => item.id !== id))
    setQuestionError('')
  }

  function addQuestion() {
    if (!newQuestion.fr.trim()) return setQuestionError('French field is required.')
    if (questions.length >= 10) return setQuestionError('Maximum 10 questions.')
    updateQuestions([
      ...questions,
      {
        id: String(Date.now()),
        label_fr: newQuestion.fr.trim(),
        label_ar: newQuestion.ar.trim() || newQuestion.fr.trim(),
        label_en: newQuestion.en.trim() || newQuestion.fr.trim(),
        label_es: newQuestion.es.trim() || newQuestion.en.trim() || newQuestion.fr.trim(),
      },
    ])
    setNewQuestion({ fr: '', ar: '', en: '', es: '' })
    setShowAddQuestion(false)
    setQuestionError('')
  }

  async function saveQuestions() {
    setQuestionsSaving(true)
    const response = await fetch('/api/forms/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId: form?.id, categories: questions }),
    })
    const data = await response.json()
    setQuestionsSaving(false)
    if (!response.ok) return setQuestionError(data.error || 'Save failed')
    const normalized = Array.isArray(data.categories) ? data.categories : questions
    setQuestions(normalized)
    setBaselineQuestions(normalized)
    setQuestionsDirty(false)
    setQuestionError('')
    router.refresh()
  }

  return (
    <div className="page-shell" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="dashboard-shell">
        <div className="container">
          <header className="dashboard-header">
            <div>
              <div className="pill accent-pill" style={{ marginBottom: 14 }}>{business.plan} · {business.plan_status}</div>
              <h1 className="page-title">{business.name}</h1>
              <p className="page-subtitle">{userEmail} · {business.city} · {business.sector}</p>
            </div>
            <div className="topbar-actions">
              <AppLogo href="/dashboard" caption="Business workspace" />
              <FlagLangSelector lang={lang} setLang={setLang} options={['fr', 'ar', 'en', 'es']} />
              <button type="button" className="button button-secondary" onClick={logout}><LogOut size={16} />Sign out</button>
            </div>
          </header>

          <div className="tab-row">
            {(['overview', 'reviews', 'questions', 'qr', 'settings'] as Tab[]).map((item) => (
              <button key={item} type="button" className={`tab-button${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <div className="stack">
              <section className="stats-grid">
                {[['Total reviews', submissions.length], ['This week', weekSubmissions.length], ['Average score', averageScore ? `${averageScore}/5` : '-'], ['Weakest area', categoryAverages[0]?.label || '-']].map(([label, value]) => (
                  <article key={String(label)} className="metric-card">
                    <div className="metric-label">{label}</div>
                    <div className="metric-value" style={{ fontSize: 30 }}>{value}</div>
                  </article>
                ))}
              </section>
              <div className="two-col">
                <section className="settings-card">
                  <h2 className="card-title" style={{ marginTop: 0 }}>Scores by category</h2>
                  {categoryAverages.length === 0 ? <p className="card-copy">No reviews yet. Share your QR code to start collecting feedback.</p> : (
                    <div className="stack">
                      {categoryAverages.map((item) => {
                        const style = scoreStyle(item.average)
                        return (
                          <div key={item.id} className="category-row">
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800 }}>{item.label}</div>
                              <div style={{ height: 8, marginTop: 10, borderRadius: 999, background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(item.average / 5) * 100}%`, background: style.color }} />
                              </div>
                            </div>
                            <div className="score-pill" style={{ background: style.bg, color: style.color }}>{item.average}/5</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
                <section className="settings-card">
                  <h2 className="card-title" style={{ marginTop: 0 }}>Recent reviews</h2>
                  {submissions.length === 0 ? <p className="card-copy">No reviews yet. Share your QR code to start collecting feedback.</p> : (
                    <div className="stack">
                      {submissions.slice(0, 4).map((submission) => {
                        const style = scoreStyle(submission.average_score)
                        return (
                          <article key={submission.id} className="review-card">
                            <div className="field-row" style={{ marginBottom: 12 }}>
                              <div className="score-pill" style={{ background: style.bg, color: style.color }}>{submission.average_score}/5</div>
                              <div className="help-text">{new Date(submission.created_at).toLocaleDateString('en-US')}</div>
                            </div>
                            <div className="topbar-links" style={{ gap: 8 }}>
                              {Object.entries(submission.ratings || {}).map(([id, value]) => <span key={id} className="pill">{(form?.categories || questions).find((item) => item.id === id)?.label_fr || id}: {value}/5</span>)}
                            </div>
                            {submission.comment ? <p className="card-copy" style={{ marginTop: 12 }}>{submission.comment}</p> : null}
                          </article>
                        )
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : null}

          {tab === 'reviews' ? (
            <section className="settings-card">
              <h2 className="card-title" style={{ marginTop: 0 }}>All reviews</h2>
              {submissions.length === 0 ? <p className="card-copy">No reviews yet. Share your QR code to start collecting feedback.</p> : (
                <div className="stack">
                  {submissions.map((submission) => {
                    const style = scoreStyle(submission.average_score)
                    return (
                      <article key={submission.id} className="review-card">
                        <div className="field-row" style={{ marginBottom: 12 }}>
                          <div className="score-pill" style={{ background: style.bg, color: style.color }}>{submission.average_score}/5</div>
                          <div className="help-text">{new Date(submission.created_at).toLocaleDateString('en-US')}</div>
                        </div>
                        <div className="topbar-links" style={{ gap: 8 }}>
                          {Object.entries(submission.ratings || {}).map(([id, value]) => <span key={id} className="pill">{(form?.categories || questions).find((item) => item.id === id)?.label_fr || id}: {value}/5</span>)}
                        </div>
                        {submission.comment ? <p className="card-copy" style={{ marginTop: 12 }}>{submission.comment}</p> : null}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null}

          {tab === 'questions' ? (
            <div className="stack">
              <section className="settings-card">
                <div className="field-row" style={{ marginBottom: 18 }}>
                  <h2 className="card-title" style={{ margin: 0 }}>Form questions</h2>
                  <div className="pill">{questions.length}/10</div>
                </div>
                <div className="stack">
                  {questions.map((question, index) => (
                    <div key={question.id} className="question-row">
                      <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                        <div className="feature-icon" style={{ width: 34, height: 34, borderRadius: 999 }}>{index + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800 }}>{localQuestionLabel(question)}</div>
                          <div className="help-text" style={{ marginTop: 4 }}>FR: {question.label_fr} | AR: {question.label_ar}</div>
                        </div>
                      </div>
                      <div className="topbar-actions">
                        <button type="button" className="mini-button" onClick={() => moveQuestion(index, 'up')} disabled={index === 0}><ArrowUp size={16} /></button>
                        <button type="button" className="mini-button" onClick={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1}><ArrowDown size={16} /></button>
                        <button type="button" className="mini-button" onClick={() => removeQuestion(question.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {showAddQuestion ? (
                  <div className="stack" style={{ marginTop: 18 }}>
                    {(['fr', 'ar', 'en', 'es'] as const).map((field) => (
                      <div key={field} className="field">
                        <label className="label">{field.toUpperCase()}</label>
                        <input className="input" value={newQuestion[field]} onChange={(event) => setNewQuestion((current) => ({ ...current, [field]: event.target.value }))} />
                      </div>
                    ))}
                    <div className="inline-actions">
                      <button type="button" className="button button-primary" onClick={addQuestion}><Plus size={16} />Add question</button>
                      <button type="button" className="button button-secondary" onClick={() => setShowAddQuestion(false)}>Cancel</button>
                    </div>
                  </div>
                ) : <button type="button" className="button button-secondary" onClick={() => setShowAddQuestion(true)} style={{ marginTop: 18 }}><Plus size={16} />Add question</button>}
                {questionError ? <div className="message message-error" style={{ marginTop: 18 }}>{questionError}</div> : null}
              </section>
              {questionsDirty ? (
                <div className="save-banner">
                  <div>
                    <div style={{ fontWeight: 800 }}>Unsaved changes</div>
                    <div className="help-text">Save these edits so your public form uses the new question list.</div>
                  </div>
                  <div className="inline-actions">
                    <button type="button" className="button button-secondary" onClick={() => { setQuestions(baselineQuestions); setQuestionsDirty(false); setQuestionError('') }}>Cancel</button>
                    <button type="button" className="button button-primary" onClick={saveQuestions} disabled={questionsSaving}><Save size={16} />{questionsSaving ? 'Saving...' : 'Apply changes'}</button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'qr' ? (
            <div className="two-col">
              <section className="settings-card">
                <h2 className="card-title" style={{ marginTop: 0 }}>Public link</h2>
                <div className="input" style={{ display: 'flex', alignItems: 'center' }}>{formUrl}</div>
                <div className="inline-actions" style={{ marginTop: 18 }}>
                  <button type="button" className="button button-secondary" onClick={() => navigator.clipboard.writeText(formUrl)}><Copy size={16} />Copy link</button>
                  <a href={formUrl} target="_blank" rel="noopener noreferrer" className="button button-primary">Open form<ExternalLink size={16} /></a>
                </div>
              </section>
              <section className="settings-card">
                {!qrGenerated ? (
                  <div className="empty-state" style={{ boxShadow: 'none', background: 'transparent' }}>
                    <h3 className="empty-title">Generate QR code</h3>
                    <p className="empty-copy">Create your printable QR code when you are ready to share the form.</p>
                    <button type="button" className="button button-primary" onClick={generateQr} disabled={qrLoading} style={{ marginTop: 18 }}><QrCode size={16} />{qrLoading ? 'Generating...' : 'Generate QR'}</button>
                  </div>
                ) : (
                  <div className="stack">
                    <div className="qr-box"><img src={qrUrl} alt="QR code" width={180} height={180} /></div>
                    <div className="inline-actions">
                      <button type="button" className="button button-primary" onClick={downloadQr}><Download size={16} />Download QR</button>
                      <button type="button" className="button button-secondary" onClick={generateQr} disabled={qrLoading}><QrCode size={16} />{qrLoading ? 'Generating...' : 'Regenerate QR'}</button>
                    </div>
                    <p className="help-text">The public link never changes, even if you regenerate the QR.</p>
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {tab === 'settings' ? (
            <div className="two-col">
              <section className="settings-card">
                <h2 className="card-title" style={{ marginTop: 0 }}>Business logo</h2>
                <div className="inline-actions" style={{ alignItems: 'center' }}>
                  <div className="logo-preview">{logoPreview ? <img src={logoPreview} alt={businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : businessName.slice(0, 2).toUpperCase()}</div>
                  <div><div style={{ fontWeight: 800 }}>{businessName}</div><div className="help-text">{logoPreview ? 'Custom logo active' : 'Default initials preview'}</div></div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                <div className="inline-actions" style={{ marginTop: 18 }}>
                  <button type="button" className="button button-primary" onClick={() => fileInputRef.current?.click()} disabled={logoUploading}><ImageUp size={16} />{logoUploading ? 'Uploading...' : 'Choose image'}</button>
                  {logoPreview ? <button type="button" className="button button-secondary" onClick={removeLogo}><Trash2 size={16} />Remove logo</button> : null}
                </div>
                {logoSaved ? <div className="message message-success" style={{ marginTop: 18 }}>Saved</div> : null}
              </section>

              <section className="settings-card">
                <h2 className="card-title" style={{ marginTop: 0 }}>Business profile</h2>
                <div className="field"><label className="label">Business name</label><input className="input" value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></div>
                <div className="field"><label className="label">Google Reviews URL</label><input className="input" value={googleUrl} onChange={(event) => setGoogleUrl(event.target.value)} /></div>
                <div className="field"><label className="label">Plan</label><select className="select" value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)}><option value="trial">Trial</option><option value="starter">Starter - 149 MAD</option><option value="pro">Pro - 299 MAD</option><option value="business">Business - 699 MAD</option></select></div>
                <p className="help-text">Payments will be connected later. For now, changing the plan here stays manual.</p>
                <div className="inline-actions" style={{ marginTop: 18 }}>
                  <button type="button" className="button button-primary" onClick={saveBusinessSettings} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save'}</button>
                  {saved ? <div className="message message-success" style={{ marginBottom: 0 }}>Saved</div> : null}
                </div>
              </section>

              <section className="settings-card">
                <h2 className="card-title" style={{ marginTop: 0 }}>Information</h2>
                <div className="stack">
                  {[
                    ['Business name', businessName],
                    ['City', business.city],
                    ['Sector', business.sector],
                    ['Plan', planLabel(selectedPlan)],
                  ].map(([label, value]) => <div key={label} className="info-row"><div className="metric-label" style={{ color: 'var(--muted)' }}>{label}</div><div>{value}</div></div>)}
                </div>
              </section>

              <section className="settings-card">
                <h2 className="card-title" style={{ marginTop: 0 }}>Session</h2>
                <p className="card-copy">Use this action to sign out from the current dashboard session.</p>
                <button type="button" className="button button-danger" onClick={logout} style={{ marginTop: 18 }}><LogOut size={16} />Sign out</button>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
