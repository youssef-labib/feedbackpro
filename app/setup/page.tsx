'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import AppLogo from '../../components/AppLogo'
import FlagLangSelector from '../../components/FlagLangSelector'
import ThemeToggle from '../../components/ThemeToggle'
import { useStoredLanguage } from '../../components/useStoredLanguage'

type Question = {
  id: string
  fr: string
  ar: string
  en: string
  es: string
}

const SUGGESTIONS: Record<string, Array<Omit<Question, 'id'>>> = {
  restaurant: [
    { fr: 'Qualite de la nourriture', ar: 'جودة الاكل', en: 'Food quality', es: 'Food quality' },
    { fr: 'Service et attente', ar: 'الخدمة ومدة الانتظار', en: 'Service and wait time', es: 'Service and wait time' },
    { fr: 'Proprete', ar: 'النظافة', en: 'Cleanliness', es: 'Cleanliness' },
    { fr: 'Ambiance generale', ar: 'الاجواء العامة', en: 'Overall atmosphere', es: 'Overall atmosphere' },
    { fr: 'Rapport qualite prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Value for money' },
  ],
  gym: [
    { fr: 'Qualite des equipements', ar: 'جودة المعدات', en: 'Equipment quality', es: 'Equipment quality' },
    { fr: 'Proprete des locaux', ar: 'نظافة المكان', en: 'Cleanliness', es: 'Cleanliness' },
    { fr: 'Qualite des coachs', ar: 'جودة المدربين', en: 'Coach quality', es: 'Coach quality' },
    { fr: 'Ambiance', ar: 'الاجواء', en: 'Atmosphere', es: 'Atmosphere' },
    { fr: 'Rapport qualite prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Value for money' },
  ],
  hotel: [
    { fr: 'Confort de la chambre', ar: 'راحة الغرفة', en: 'Room comfort', es: 'Room comfort' },
    { fr: 'Accueil a la reception', ar: 'الاستقبال', en: 'Reception welcome', es: 'Reception welcome' },
    { fr: 'Proprete', ar: 'النظافة', en: 'Cleanliness', es: 'Cleanliness' },
    { fr: 'Petit dejeuner', ar: 'الفطور', en: 'Breakfast', es: 'Breakfast' },
    { fr: 'Rapport qualite prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Value for money' },
  ],
  car_rental: [
    { fr: 'Etat du vehicule', ar: 'حالة السيارة', en: 'Vehicle condition', es: 'Vehicle condition' },
    { fr: 'Proprete du vehicule', ar: 'نظافة السيارة', en: 'Vehicle cleanliness', es: 'Vehicle cleanliness' },
    { fr: 'Qualite du service', ar: 'جودة الخدمة', en: 'Service quality', es: 'Service quality' },
    { fr: 'Facilite du process', ar: 'سهولة الاجراءات', en: 'Process ease', es: 'Process ease' },
    { fr: 'Rapport qualite prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Value for money' },
  ],
  default: [
    { fr: 'Qualite du service', ar: 'جودة الخدمة', en: 'Service quality', es: 'Service quality' },
    { fr: 'Accueil', ar: 'الاستقبال', en: 'Welcome', es: 'Welcome' },
    { fr: 'Proprete', ar: 'النظافة', en: 'Cleanliness', es: 'Cleanliness' },
    { fr: 'Rapport qualite prix', ar: 'القيمة مقابل السعر', en: 'Value for money', es: 'Value for money' },
    { fr: 'Satisfaction generale', ar: 'الرضا العام', en: 'Overall satisfaction', es: 'Overall satisfaction' },
  ],
}

const COPY = {
  fr: {
    title: 'Configurez vos questions.',
    subtitle: 'Choisissez entre 1 et 10 questions. Elles seront affichees dans le formulaire public.',
    step: 'Etape 3 sur 3',
    current: 'Questions actuelles',
    suggestions: 'Suggestions',
    addCustom: 'Ajouter une question',
    save: 'Enregistrer et ouvrir le dashboard',
    saving: 'Enregistrement...',
    min: 'Minimum 1 question requise.',
    max: 'Maximum 10 questions.',
    frRequired: 'Le champ francais est requis.',
    loadError: 'Impossible de charger la configuration.',
  },
  ar: {
    title: 'جهز الاسئلة.',
    subtitle: 'اختر بين سؤال واحد و 10 اسئلة لتظهر في النموذج العام.',
    step: 'الخطوة 3 من 3',
    current: 'الاسئلة الحالية',
    suggestions: 'اقتراحات',
    addCustom: 'اضافة سؤال',
    save: 'حفظ وفتح لوحة التحكم',
    saving: 'جاري الحفظ...',
    min: 'يلزم سؤال واحد على الاقل.',
    max: 'الحد الاقصى 10 اسئلة.',
    frRequired: 'حقل الفرنسية مطلوب.',
    loadError: 'تعذر تحميل الاعدادات.',
  },
  en: {
    title: 'Configure your questions.',
    subtitle: 'Choose between 1 and 10 questions. They will appear in the public form.',
    step: 'Step 3 of 3',
    current: 'Current questions',
    suggestions: 'Suggestions',
    addCustom: 'Add question',
    save: 'Save and open dashboard',
    saving: 'Saving...',
    min: 'At least one question is required.',
    max: 'Maximum 10 questions.',
    frRequired: 'French field is required.',
    loadError: 'Could not load setup data.',
  },
} as const

export default function SetupPage() {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formId, setFormId] = useState<string | null>(null)
  const [sector, setSector] = useState('default')
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState({ fr: '', ar: '', en: '', es: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState('')

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id, sector')
        .eq('owner_id', user.id)
        .single()

      if (!active) return

      if (!business) {
        setError(copy.loadError)
        setLoading(false)
        return
      }

      setSector(business.sector || 'default')

      const { data: form } = await supabase
        .from('feedback_forms')
        .select('id, categories')
        .eq('business_id', business.id)
        .single()

      if (!active) return

      if (form) {
        setFormId(form.id)
        if (Array.isArray(form.categories) && form.categories.length > 0) {
          setQuestions(
            form.categories.map((item: Record<string, string>, index: number) => ({
              id: item.id || String(index + 1),
              fr: item.label_fr || '',
              ar: item.label_ar || '',
              en: item.label_en || '',
              es: item.label_es || '',
            }))
          )
        } else {
          const defaults = SUGGESTIONS[business.sector] || SUGGESTIONS.default
          setQuestions(defaults.map((item, index) => ({ id: String(index + 1), ...item })))
        }
      }

      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [copy.loadError, supabase])

  const availableSuggestions = (SUGGESTIONS[sector] || SUGGESTIONS.default).filter(
    (item) => !questions.some((question) => question.fr === item.fr)
  )

  function moveQuestion(index: number, direction: 'up' | 'down') {
    setQuestions((current) => {
      const next = [...current]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function removeQuestion(id: string) {
    if (questions.length <= 1) {
      setError(copy.min)
      return
    }

    setQuestions((current) => current.filter((item) => item.id !== id))
    setError('')
  }

  function addSuggestion(question: Omit<Question, 'id'>) {
    if (questions.length >= 10) {
      setError(copy.max)
      return
    }

    setQuestions((current) => [...current, { id: String(Date.now()), ...question }])
    setError('')
  }

  function addCustomQuestion() {
    if (!newQuestion.fr.trim()) {
      setError(copy.frRequired)
      return
    }

    if (questions.length >= 10) {
      setError(copy.max)
      return
    }

    setQuestions((current) => [
      ...current,
      {
        id: String(Date.now()),
        fr: newQuestion.fr.trim(),
        ar: newQuestion.ar.trim() || newQuestion.fr.trim(),
        en: newQuestion.en.trim() || newQuestion.fr.trim(),
        es: newQuestion.es.trim() || newQuestion.en.trim() || newQuestion.fr.trim(),
      },
    ])
    setNewQuestion({ fr: '', ar: '', en: '', es: '' })
    setShowAdd(false)
    setError('')
  }

  async function saveQuestions() {
    if (questions.length < 1) {
      setError(copy.min)
      return
    }

    setSaving(true)
    setError('')

    const categories = questions.map((question, index) => ({
      id: String(index + 1),
      label_fr: question.fr,
      label_ar: question.ar || question.fr,
      label_en: question.en || question.fr,
      label_es: question.es || question.en || question.fr,
    }))

    const response = await fetch('/api/forms/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, categories }),
    })
    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Save failed')
      setSaving(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="page-shell" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="topbar">
        <div className="container topbar-inner">
          <AppLogo />
          <div className="topbar-actions">
            <div className="pill accent-pill">{copy.step}</div>
            <ThemeToggle />
            <FlagLangSelector lang={lang} setLang={setLang} options={['fr', 'ar', 'en', 'es']} />
          </div>
        </div>
      </header>

      <main className="section">
        <div className="container">
          <div className="section-head">
            <div className="section-eyebrow">Onboarding</div>
            <h1 className="section-title" style={{ fontSize: 'clamp(30px, 4vw, 42px)' }}>{copy.title}</h1>
            <p className="section-subtitle">{copy.subtitle}</p>
          </div>

          {loading ? (
            <div className="surface-card empty-state">
              <div className="empty-title">Loading...</div>
              <p className="empty-copy">We are preparing your setup data.</p>
            </div>
          ) : (
            <div className="two-col" style={{ alignItems: 'start' }}>
              <section className="settings-card">
                <div className="field-row" style={{ marginBottom: 18 }}>
                  <h2 className="card-title" style={{ margin: 0 }}>{copy.current}</h2>
                  <div className="pill">{questions.length}/10</div>
                </div>

                <div className="stack">
                  {questions.map((question, index) => (
                    <div key={question.id} className="question-row" style={{ paddingTop: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                        <div className="feature-icon" style={{ width: 34, height: 34, borderRadius: 999 }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{question.fr}</div>
                          <div className="help-text" style={{ marginTop: 4 }}>
                            AR: {question.ar || '-'} | EN: {question.en || '-'}
                          </div>
                        </div>
                      </div>

                      <div className="topbar-actions">
                        <button
                          type="button"
                          className="mini-button"
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="mini-button"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button type="button" className="mini-button" onClick={() => removeQuestion(question.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {showAdd ? (
                  <div className="stack" style={{ marginTop: 18 }}>
                    <div className="field">
                      <label className="label">Francais</label>
                      <input
                        className="input"
                        value={newQuestion.fr}
                        onChange={(event) => setNewQuestion((current) => ({ ...current, fr: event.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label className="label">Arabic</label>
                      <input
                        className="input"
                        value={newQuestion.ar}
                        onChange={(event) => setNewQuestion((current) => ({ ...current, ar: event.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label className="label">English</label>
                      <input
                        className="input"
                        value={newQuestion.en}
                        onChange={(event) => setNewQuestion((current) => ({ ...current, en: event.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label className="label">Spanish</label>
                      <input
                        className="input"
                        value={newQuestion.es}
                        onChange={(event) => setNewQuestion((current) => ({ ...current, es: event.target.value }))}
                      />
                    </div>
                    <div className="inline-actions">
                      <button type="button" className="button button-primary" onClick={addCustomQuestion}>
                        <Plus size={16} />
                        {copy.addCustom}
                      </button>
                      <button type="button" className="button button-secondary" onClick={() => setShowAdd(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="button button-secondary" onClick={() => setShowAdd(true)} style={{ marginTop: 18 }}>
                    <Plus size={16} />
                    {copy.addCustom}
                  </button>
                )}
              </section>

              <aside className="settings-card">
                <h2 className="card-title" style={{ marginTop: 0 }}>{copy.suggestions}</h2>
                <p className="card-copy">
                  Start with a short list. You can always come back later from the dashboard and update the wording.
                </p>

                <div className="stack" style={{ marginTop: 18 }}>
                  {availableSuggestions.map((question) => (
                    <button
                      key={question.fr}
                      type="button"
                      className="mini-button"
                      onClick={() => addSuggestion(question)}
                      style={{ justifyContent: 'space-between', width: '100%', minHeight: 50 }}
                    >
                      <span style={{ textAlign: 'start' }}>{question.fr}</span>
                      <Plus size={16} />
                    </button>
                  ))}
                </div>

                {error ? <div className="message message-error" style={{ marginTop: 18 }}>{error}</div> : null}

                <div className="save-banner" style={{ marginTop: 22, position: 'static' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{questions.length} question(s) ready</div>
                    <div className="help-text">Your public form will use this order after save.</div>
                  </div>
                  <button type="button" className="button button-primary" onClick={saveQuestions} disabled={saving}>
                    <Save size={16} />
                    {saving ? copy.saving : copy.save}
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
