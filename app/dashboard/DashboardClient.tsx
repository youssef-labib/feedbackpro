'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  ImageUp,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  QrCode,
  Save,
  Settings2,
  Star,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import AppLogo from '../../components/AppLogo'
import FlagLangSelector from '../../components/FlagLangSelector'
import ThemeToggle from '../../components/ThemeToggle'
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
type Submission = {
  id: string
  ratings: Record<string, number>
  average_score: number
  comment: string | null
  created_at: string
}
type DashboardTab = 'overview' | 'reviews' | 'questions' | 'share' | 'settings'
type MessageState = { type: 'success' | 'error'; text: string } | null

const DASHBOARD_NAV: Array<{
  id: DashboardTab
  label: string
  hint: string
  icon: LucideIcon
}> = [
  { id: 'overview', label: 'Overview', hint: 'Live metrics and recent signals', icon: LayoutDashboard },
  { id: 'reviews', label: 'Reviews', hint: 'Every response in one place', icon: MessageSquare },
  { id: 'questions', label: 'Questions', hint: 'Shape the form and publish changes', icon: ListChecks },
  { id: 'share', label: 'Share and QR', hint: 'Public link, QR, and readiness', icon: QrCode },
  { id: 'settings', label: 'Settings', hint: 'Branding, plan, and session', icon: Settings2 },
]

function scoreStyle(score: number) {
  if (score >= 4) return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)' }
  if (score >= 3) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)' }
  return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.16)' }
}

function planMeta(plan: string) {
  if (plan === 'starter') return { label: 'Starter', price: '149 MAD', description: 'Best for one location getting started fast.' }
  if (plan === 'pro') return { label: 'Pro', price: '299 MAD', description: 'Best balance for growing operators.' }
  if (plan === 'business') return { label: 'Business', price: '699 MAD', description: 'Built for larger multi-site operations.' }
  return { label: 'Trial', price: 'Free', description: 'A simple trial workspace before activation.' }
}

function humanizeStatus(value: string) {
  if (!value) return 'Unknown'
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function localeFromLang(lang: 'fr' | 'ar' | 'en' | 'es') {
  if (lang === 'ar') return 'ar-MA'
  if (lang === 'fr') return 'fr-FR'
  if (lang === 'es') return 'es-ES'
  return 'en-US'
}

function questionLabel(question: Category, lang: 'fr' | 'ar' | 'en' | 'es') {
  if (lang === 'ar') return question.label_ar || question.label_fr
  if (lang === 'en') return question.label_en || question.label_fr
  if (lang === 'es') return question.label_es || question.label_en || question.label_fr
  return question.label_fr
}

function buildWeeklySeries(submissions: Submission[], locale: string) {
  const counts = new Map<string, number>()

  submissions.forEach((submission) => {
    const date = new Date(submission.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const days: Array<{ label: string; count: number }> = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    days.push({ label: formatter.format(date), count: counts.get(key) || 0 })
  }

  return days
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
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [businessState, setBusinessState] = useState(business)
  const [businessName, setBusinessName] = useState(business.name)
  const [selectedPlan, setSelectedPlan] = useState(business.plan)
  const [googleUrl, setGoogleUrl] = useState(business.google_review_url || '')
  const [saving, setSaving] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<MessageState>(null)
  const [qrGenerated, setQrGenerated] = useState(Boolean(business.qr_generated))
  const [qrLoading, setQrLoading] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [questions, setQuestions] = useState<Category[]>(form?.categories || [])
  const [baselineQuestions, setBaselineQuestions] = useState<Category[]>(form?.categories || [])
  const [questionsDirty, setQuestionsDirty] = useState(false)
  const [questionsSaving, setQuestionsSaving] = useState(false)
  const [questionMessage, setQuestionMessage] = useState<MessageState>(null)
  const [newQuestion, setNewQuestion] = useState({ fr: '', ar: '', en: '', es: '' })
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(form?.categories?.[0]?.id || null)
  const [logoPreview, setLogoPreview] = useState(business.logo_url || '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoMessage, setLogoMessage] = useState<MessageState>(null)
  const [formUrl, setFormUrl] = useState(`/r/${business.slug}`)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const nextFormPath = `/r/${businessState.slug}`
    if (typeof window === 'undefined') {
      setFormUrl(nextFormPath)
      return
    }
    setFormUrl(new URL(nextFormPath, window.location.origin).toString())
  }, [businessState.slug])

  useEffect(() => {
    if (!sidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sidebarOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('feedbackpro-dashboard-sidebar')
    setSidebarCollapsed(stored === 'collapsed')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      'feedbackpro-dashboard-sidebar',
      sidebarCollapsed ? 'collapsed' : 'expanded'
    )
  }, [sidebarCollapsed])

  useEffect(() => {
    if (questions.length === 0) {
      setSelectedQuestionId(null)
      return
    }

    const exists = questions.some((question) => question.id === selectedQuestionId)
    if (!exists) {
      setSelectedQuestionId(questions[0].id)
    }
  }, [questions, selectedQuestionId])

  const locale = localeFromLang(lang)
  const publishedQuestions = questionsDirty ? baselineQuestions : questions
  const averageScore = submissions.length
    ? Math.round((submissions.reduce((sum, item) => sum + item.average_score, 0) / submissions.length) * 10) / 10
    : 0
  const weekSubmissions = submissions.filter((item) => Date.now() - new Date(item.created_at).getTime() < 7 * 864e5)
  const reviewsWithComments = submissions.filter((submission) => submission.comment?.trim()).length
  const positiveReviews = submissions.filter((submission) => submission.average_score >= 4).length
  const neutralReviews = submissions.filter((submission) => submission.average_score >= 3 && submission.average_score < 4).length
  const attentionReviews = submissions.filter((submission) => submission.average_score < 3).length
  const weeklySeries = buildWeeklySeries(submissions, locale)
  const maxWeeklyCount = Math.max(...weeklySeries.map((item) => item.count), 1)
  const weeklyTotal = weeklySeries.reduce((sum, item) => sum + item.count, 0)
  const bestDay = weeklySeries.reduce(
    (best, item) => (item.count > best.count ? item : best),
    weeklySeries[0] || { label: '-', count: 0 }
  )
  const quietDays = weeklySeries.filter((item) => item.count === 0).length

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
      label: questionLabel(
        publishedQuestions.find((item) => item.id === id) || { id, label_fr: id, label_ar: id, label_en: id, label_es: id },
        lang
      ),
      average: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10,
    }))
    .sort((a, b) => a.average - b.average)

  const readinessItems = [
    { label: 'At least 3 form questions', ready: questions.length >= 3 },
    { label: 'QR code generated', ready: qrGenerated },
    { label: 'Google review link added', ready: Boolean(googleUrl.trim()) },
    { label: 'Logo uploaded', ready: Boolean(logoPreview) },
  ]
  const readinessCount = readinessItems.filter((item) => item.ready).length
  const currentPlan = planMeta(selectedPlan)
  const currentTab = DASHBOARD_NAV.find((item) => item.id === activeTab) || DASHBOARD_NAV[0]
  const selectedQuestion =
    questions.find((question) => question.id === selectedQuestionId) || questions[0] || null
  const selectedQuestionIndex = selectedQuestion
    ? questions.findIndex((question) => question.id === selectedQuestion.id)
    : -1
  const qrUrl = `/api/qr?url=${encodeURIComponent(formUrl)}`

  function flashMessage(
    setter: React.Dispatch<React.SetStateAction<MessageState>>,
    value: MessageState,
    delay = 2400
  ) {
    setter(value)
    if (value) {
      window.setTimeout(() => setter(null), delay)
    }
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => !current)
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function copyFormLink() {
    try {
      await navigator.clipboard.writeText(formUrl)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 2200)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 2200)
    }
  }

  async function saveBusinessSettings() {
    setSaving(true)
    setSettingsMessage(null)
    try {
      const response = await fetch('/api/business/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessState.id,
          name: businessName,
          google_review_url: googleUrl,
          plan: selectedPlan,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        flashMessage(setSettingsMessage, { type: 'error', text: data.error || 'Could not save your changes.' })
        return
      }

      const nextName = businessName.trim() || businessState.name
      setBusinessName(nextName)
      setBusinessState((current) => ({
        ...current,
        name: nextName,
        google_review_url: googleUrl.trim(),
        plan: selectedPlan,
      }))
      flashMessage(setSettingsMessage, { type: 'success', text: 'Business settings updated.' })
      router.refresh()
    } catch {
      flashMessage(setSettingsMessage, { type: 'error', text: 'Could not save your changes.' })
    } finally {
      setSaving(false)
    }
  }

  async function generateQr() {
    setQrLoading(true)
    try {
      const response = await fetch(qrUrl)
      if (!response.ok) throw new Error('failed')
      await supabase.from('businesses').update({ qr_generated: true }).eq('id', businessState.id)
      setQrGenerated(true)
      setBusinessState((current) => ({ ...current, qr_generated: true }))
      router.refresh()
    } catch {
      flashMessage(setSettingsMessage, { type: 'error', text: 'QR generation failed. Please try again.' })
    } finally {
      setQrLoading(false)
    }
  }

  function downloadQr() {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `feedbackpro-${businessState.slug}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      flashMessage(setLogoMessage, { type: 'error', text: 'Please choose an image file.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      flashMessage(setLogoMessage, { type: 'error', text: 'Image must stay under 2 MB.' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
    setLogoUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessState.id)
      const response = await fetch('/api/upload-logo', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Upload failed')
      setLogoPreview(data.url)
      setBusinessState((current) => ({ ...current, logo_url: data.url }))
      flashMessage(setLogoMessage, { type: 'success', text: 'Logo updated.' })
      router.refresh()
    } catch {
      setLogoPreview(businessState.logo_url || '')
      flashMessage(setLogoMessage, { type: 'error', text: 'Upload failed. Please try again.' })
    } finally {
      setLogoUploading(false)
    }
  }

  async function removeLogo() {
    await supabase.from('businesses').update({ logo_url: null }).eq('id', businessState.id)
    setLogoPreview('')
    setBusinessState((current) => ({ ...current, logo_url: null }))
    flashMessage(setLogoMessage, { type: 'success', text: 'Logo removed.' })
    router.refresh()
  }

  function updateQuestions(next: Category[]) {
    setQuestions(next)
    setQuestionsDirty(true)
    setQuestionMessage(null)
  }

  function updateQuestionField(id: string, field: 'label_fr' | 'label_ar' | 'label_en' | 'label_es', value: string) {
    updateQuestions(questions.map((question) => (question.id === id ? { ...question, [field]: value } : question)))
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateQuestions(next)
  }

  function removeQuestion(id: string) {
    if (questions.length <= 1) {
      flashMessage(setQuestionMessage, { type: 'error', text: 'At least one question is required.' })
      return
    }
    updateQuestions(questions.filter((item) => item.id !== id))
  }

  function addQuestion() {
    if (!newQuestion.fr.trim()) {
      flashMessage(setQuestionMessage, { type: 'error', text: 'The French field is required.' })
      return
    }
    if (questions.length >= 10) {
      flashMessage(setQuestionMessage, { type: 'error', text: 'You can keep up to 10 questions.' })
      return
    }
    const nextId = String(Date.now())
    updateQuestions([
      ...questions,
      {
        id: nextId,
        label_fr: newQuestion.fr.trim(),
        label_ar: newQuestion.ar.trim() || newQuestion.fr.trim(),
        label_en: newQuestion.en.trim() || newQuestion.fr.trim(),
        label_es: newQuestion.es.trim() || newQuestion.en.trim() || newQuestion.fr.trim(),
      },
    ])
    setSelectedQuestionId(nextId)
    setNewQuestion({ fr: '', ar: '', en: '', es: '' })
    flashMessage(setQuestionMessage, { type: 'success', text: 'New question added. Publish when you are ready.' })
  }

  async function saveQuestions() {
    if (!form?.id) {
      flashMessage(setQuestionMessage, { type: 'error', text: 'No feedback form is connected to this business yet.' })
      return
    }

    setQuestionsSaving(true)
    try {
      const response = await fetch('/api/forms/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: form.id, categories: questions }),
      })
      const data = await response.json()
      if (!response.ok) {
        flashMessage(setQuestionMessage, { type: 'error', text: data.error || 'Could not save your questions.' })
        return
      }
      const normalized = Array.isArray(data.categories) ? data.categories : questions
      setQuestions(normalized)
      setBaselineQuestions(normalized)
      setQuestionsDirty(false)
      flashMessage(setQuestionMessage, { type: 'success', text: 'Questions published to your public form.' })
      router.refresh()
    } catch {
      flashMessage(setQuestionMessage, { type: 'error', text: 'Could not save your questions.' })
    } finally {
      setQuestionsSaving(false)
    }
  }

  return (
    <div
      className={`page-shell dashboard-v2-page${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`dashboard-v2-backdrop${sidebarOpen ? ' is-open' : ''}`}
        aria-hidden={!sidebarOpen}
        onClick={closeSidebar}
      />

      <div className="dashboard-v2-frame">
        <aside className={`dashboard-v2-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="dashboard-v2-sidebar-head">
            <AppLogo href="/dashboard" title="FeedbackPro" caption="Business workspace" />
            <div className="dashboard-v2-sidebar-head-actions">
              <button
                type="button"
                className="icon-button dashboard-v2-sidebar-collapse"
                onClick={toggleSidebarCollapsed}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed
                  ? isRTL
                    ? <ChevronLeft size={18} />
                    : <ChevronRight size={18} />
                  : isRTL
                    ? <ChevronRight size={18} />
                    : <ChevronLeft size={18} />}
              </button>
              <button
                type="button"
                className="icon-button dashboard-v2-sidebar-close"
                onClick={closeSidebar}
                aria-label="Close dashboard menu"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="dashboard-v2-nav-wrap">
            <div className="dashboard-v2-sidebar-label">Navigation</div>
            <nav className="dashboard-v2-nav" aria-label="Dashboard sections">
              {DASHBOARD_NAV.map((item) => {
                const Icon = item.icon
                const active = item.id === activeTab

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`dashboard-v2-nav-button${active ? ' active' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    onClick={() => {
                      setActiveTab(item.id)
                      closeSidebar()
                    }}
                  >
                    <span className="dashboard-v2-nav-icon">
                      <Icon size={18} />
                    </span>
                    <span className="dashboard-v2-nav-copy">
                      <span className="dashboard-v2-nav-label">{item.label}</span>
                      <span className="dashboard-v2-nav-hint">{item.hint}</span>
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          <section className="dashboard-v2-sidebar-profile">
            <div className="dashboard-v2-sidebar-label">Workspace</div>
            <div className="dashboard-v2-business-row">
              <div className="dashboard-v2-avatar">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={businessName || businessState.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (businessName || businessState.name).slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="dashboard-v2-business-copy">
                <div className="dashboard-v2-business-name">{businessName || businessState.name}</div>
                <div className="dashboard-v2-business-meta">
                  {businessState.city} - {businessState.sector}
                </div>
              </div>
            </div>

            <div className="dashboard-v2-chip-row">
              <span className="pill accent-pill">{currentPlan.label}</span>
              <span className="pill">{humanizeStatus(businessState.plan_status)}</span>
            </div>

            <div className="dashboard-v2-readiness">
              <div className="dashboard-v2-readiness-head">
                <span>Workspace readiness</span>
                <strong>{readinessCount}/4</strong>
              </div>
              <div className="dashboard-v2-progress">
                <span style={{ width: `${(readinessCount / readinessItems.length) * 100}%` }} />
              </div>
              <p className="dashboard-v2-readiness-copy">
                Keep the essentials ready before you print your QR and share the form.
              </p>
            </div>
          </section>

          <div className="dashboard-v2-sidebar-tools">
            <div className="dashboard-v2-sidebar-label">Tools</div>
            <div className="dashboard-v2-sidebar-toolset">
              <ThemeToggle />
              <FlagLangSelector lang={lang} setLang={setLang} />
            </div>
          </div>

          <section className="dashboard-v2-sidebar-foot">
            <div className="dashboard-v2-sidebar-foot-note">
              <span className="dashboard-v2-sidebar-foot-dot" />
              <span>Public form linked to this workspace</span>
            </div>
            <a href={formUrl} target="_blank" rel="noopener noreferrer" className="button button-secondary">
              Open public form
              <ExternalLink size={16} />
            </a>
            <button type="button" className="button button-primary" onClick={logout}>
              Sign out
              <LogOut size={16} />
            </button>
          </section>
        </aside>

        <main className="dashboard-v2-main">
          <div className="dashboard-v2-mobilebar">
            <button
              type="button"
              className="icon-button"
              aria-label="Open dashboard menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <AppLogo href="/dashboard" title="FeedbackPro" caption="Workspace" />
            <ThemeToggle />
          </div>

          <section className="dashboard-v2-topbar">
            <div className="dashboard-v2-topbar-start">
              <button
                type="button"
                className="icon-button dashboard-v2-topbar-toggle"
                onClick={toggleSidebarCollapsed}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed
                  ? isRTL
                    ? <ChevronLeft size={18} />
                    : <ChevronRight size={18} />
                  : isRTL
                    ? <ChevronRight size={18} />
                    : <ChevronLeft size={18} />}
              </button>

              <div>
                <div className="dashboard-v2-topbar-kicker">Workspace view</div>
                <div className="dashboard-v2-topbar-title">{currentTab.label}</div>
              </div>
            </div>

            <div className="dashboard-v2-topbar-actions">
              <span className="pill accent-pill">{currentPlan.label}</span>
              <span className="pill">{submissions.length} reviews</span>
              <span className="pill">{publishedQuestions.length} questions</span>
            </div>
          </section>

          <header className="dashboard-v2-hero">
            <div className="dashboard-v2-hero-copy">
              <div className="section-eyebrow">Dashboard</div>
              <h1 className="dashboard-v2-title">{businessName || businessState.name}</h1>
              <p className="dashboard-v2-subtitle">
                Clear workspace for live feedback, quick fixes, and a public form that stays ready
                for staff and customers.
              </p>

              <div className="dashboard-v2-meta-row">
                <span className="dashboard-v2-meta-chip">
                  <Building2 size={14} />
                  {userEmail}
                </span>
                <span className="dashboard-v2-meta-chip">
                  <MapPin size={14} />
                  {businessState.city}
                </span>
                <span className="dashboard-v2-meta-chip">
                  <BadgeCheck size={14} />
                  {currentPlan.label}
                </span>
                <span className="dashboard-v2-meta-chip">
                  <Globe2 size={14} />
                  {humanizeStatus(businessState.plan_status)}
                </span>
              </div>
            </div>

            <div className="dashboard-v2-hero-side">
              <div className="dashboard-v2-hero-status">
                <div className="dashboard-v2-hero-status-head">
                  <span className="dashboard-v2-hero-status-label">Workspace status</span>
                  <strong>{readinessCount}/4 ready</strong>
                </div>
                <div className="dashboard-v2-progress">
                  <span style={{ width: `${(readinessCount / readinessItems.length) * 100}%` }} />
                </div>
                <div className="dashboard-v2-hero-status-copy">
                  <div>{categoryAverages[0] ? `Watch ${categoryAverages[0].label} first.` : 'Start by sharing your form.'}</div>
                  <div>{submissions.length ? `${submissions.length} reviews collected so far.` : 'No reviews collected yet.'}</div>
                </div>
              </div>

              <div className="dashboard-v2-hero-actions">
                <button type="button" className="button button-secondary" onClick={copyFormLink}>
                  {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy link'}
                  <Copy size={16} />
                </button>
                <a href={formUrl} target="_blank" rel="noopener noreferrer" className="button button-primary">
                  Open form
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </header>

          <section className="dashboard-v2-panel-head">
            <div>
              <div className="dashboard-v2-panel-kicker">{currentTab.label}</div>
              <h2 className="dashboard-v2-panel-title">{currentTab.hint}</h2>
            </div>
            <div className="dashboard-v2-panel-pills">
              <span className="pill accent-pill">{currentPlan.label}</span>
              <span className="pill">{submissions.length} reviews</span>
              <span className="pill">{publishedQuestions.length} questions</span>
            </div>
          </section>

          {activeTab === 'overview' ? (
            <>
              <div className="dashboard-v2-stack">
                <section className="dashboard-v2-metrics">
                  {[
                    {
                      label: 'Average score',
                      value: averageScore ? `${averageScore}/5` : '-',
                      note: submissions.length ? 'Across all collected responses' : 'No responses yet',
                      icon: Star,
                    },
                    {
                      label: 'Total reviews',
                      value: String(submissions.length),
                      note: 'Every submission stored in your workspace',
                      icon: MessageSquare,
                    },
                    {
                      label: 'This week',
                      value: String(weekSubmissions.length),
                      note: 'Fresh activity from the last 7 days',
                      icon: BarChart3,
                    },
                    {
                      label: 'Questions live',
                      value: String(publishedQuestions.length),
                      note: form ? 'Current form question count' : 'No form connected yet',
                      icon: ListChecks,
                    },
                  ].map((metric) => {
                    const Icon = metric.icon

                    return (
                      <article key={metric.label} className="dashboard-v2-card dashboard-v2-metric-card">
                        <div className="dashboard-v2-card-badge">
                          <Icon size={17} />
                        </div>
                        <div className="dashboard-v2-metric-label">{metric.label}</div>
                        <div className="dashboard-v2-metric-value">{metric.value}</div>
                        <p className="dashboard-v2-metric-note">{metric.note}</p>
                      </article>
                    )
                  })}
                </section>

                <section className="dashboard-v2-grid dashboard-v2-grid-overview">
                  <article className="dashboard-v2-card">
                    <div className="dashboard-v2-card-head">
                      <div>
                        <div className="dashboard-v2-card-title">Weekly activity</div>
                        <p className="dashboard-v2-card-copy">
                          A clearer weekly view of response volume and where the pace is strongest.
                        </p>
                      </div>
                      <span className="pill">{weekSubmissions.length} this week</span>
                    </div>

                    <div className="dashboard-v2-activity-layout">
                      <div className="dashboard-v2-chart">
                        {weeklySeries.map((item) => (
                          <div key={item.label} className="dashboard-v2-chart-item">
                            <div className="dashboard-v2-chart-value">{item.count}</div>
                            <div className="dashboard-v2-chart-track">
                              <span
                                className="dashboard-v2-chart-fill"
                                style={{
                                  height: `${Math.max((item.count / maxWeeklyCount) * 100, item.count ? 12 : 4)}%`,
                                }}
                              />
                            </div>
                            <div className="dashboard-v2-chart-label">{item.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="dashboard-v2-activity-summary">
                        {[
                          ['Weekly total', String(weeklyTotal)],
                          ['Best day', bestDay.count ? `${bestDay.label} - ${bestDay.count}` : 'No activity'],
                          ['Quiet days', String(quietDays)],
                        ].map(([label, value]) => (
                          <div key={label} className="dashboard-v2-activity-stat">
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>

                  <article className="dashboard-v2-card">
                    <div className="dashboard-v2-card-head">
                      <div>
                        <div className="dashboard-v2-card-title">Category health</div>
                        <p className="dashboard-v2-card-copy">
                          Lowest scores stay visible so your team knows what to improve next.
                        </p>
                      </div>
                      {categoryAverages[0] ? <span className="pill">{categoryAverages[0].label}</span> : null}
                    </div>

                    {categoryAverages.length === 0 ? (
                      <div className="dashboard-v2-empty">
                        <div className="dashboard-v2-empty-icon">
                          <BarChart3 size={18} />
                        </div>
                        <h3 className="dashboard-v2-empty-title">No category scores yet</h3>
                        <p className="dashboard-v2-empty-copy">
                          Share your form and the dashboard will start ranking weak and strong areas.
                        </p>
                      </div>
                    ) : (
                      <div className="dashboard-v2-list">
                        {categoryAverages.map((item) => {
                          const style = scoreStyle(item.average)

                          return (
                            <div key={item.id} className="dashboard-v2-score-row">
                              <div className="dashboard-v2-score-copy">
                                <strong>{item.label}</strong>
                                <div className="dashboard-v2-score-track">
                                  <span
                                    className="dashboard-v2-score-fill"
                                    style={{
                                      width: `${(item.average / 5) * 100}%`,
                                      background: style.color,
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="score-pill" style={{ background: style.bg, color: style.color }}>
                                {item.average}/5
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </article>
                </section>

                <article className="dashboard-v2-card">
                  <div className="dashboard-v2-card-head">
                    <div>
                      <div className="dashboard-v2-card-title">Latest feedback</div>
                      <p className="dashboard-v2-card-copy">
                        Recent comments and scores without leaving the main view.
                      </p>
                    </div>
                    {submissions.length ? <span className="pill">{submissions.length} total</span> : null}
                  </div>

                  {submissions.length === 0 ? (
                    <div className="dashboard-v2-empty">
                      <div className="dashboard-v2-empty-icon">
                        <MessageSquare size={18} />
                      </div>
                      <h3 className="dashboard-v2-empty-title">Nothing has been submitted yet</h3>
                      <p className="dashboard-v2-empty-copy">
                        Once customers submit feedback, the latest responses will show up here first.
                      </p>
                    </div>
                  ) : (
                    <div className="dashboard-v2-review-list">
                      {submissions.slice(0, 5).map((submission) => {
                        const style = scoreStyle(submission.average_score)

                        return (
                          <article key={submission.id} className="dashboard-v2-review-item">
                            <div className="dashboard-v2-review-top">
                              <span className="score-pill" style={{ background: style.bg, color: style.color }}>
                                {submission.average_score}/5
                              </span>
                              <span className="dashboard-v2-review-date">
                                {new Intl.DateTimeFormat(locale, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                }).format(new Date(submission.created_at))}
                              </span>
                            </div>

                            <div className="dashboard-v2-rating-pills">
                              {Object.entries(submission.ratings || {}).map(([id, value]) => (
                                <span key={id} className="pill">
                                  {(publishedQuestions.find((item) => item.id === id)?.label_fr || id).slice(0, 22)}:{' '}
                                  {value}/5
                                </span>
                              ))}
                            </div>

                            <p className="dashboard-v2-review-comment">
                              {submission.comment?.trim() || 'No written comment for this response.'}
                            </p>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </article>
              </div>
            </>
          ) : null}

          {activeTab === 'reviews' ? (
            <>
              <div className="dashboard-v2-stack">
                <section className="dashboard-v2-metrics dashboard-v2-metrics-compact">
                  {[
                    {
                      label: 'Positive',
                      value: positiveReviews,
                      note: '4 and 5 star average responses',
                      icon: CheckCircle2,
                    },
                    {
                      label: 'Neutral',
                      value: neutralReviews,
                      note: 'Responses around the middle',
                      icon: CircleAlert,
                    },
                    {
                      label: 'Needs attention',
                      value: attentionReviews,
                      note: 'Low scores to investigate',
                      icon: CircleAlert,
                    },
                    {
                      label: 'With comments',
                      value: reviewsWithComments,
                      note: 'Responses with written feedback',
                      icon: MessageSquare,
                    },
                  ].map((metric) => {
                    const Icon = metric.icon

                    return (
                      <article key={metric.label} className="dashboard-v2-card dashboard-v2-metric-card">
                        <div className="dashboard-v2-card-badge">
                          <Icon size={17} />
                        </div>
                        <div className="dashboard-v2-metric-label">{metric.label}</div>
                        <div className="dashboard-v2-metric-value">{metric.value}</div>
                        <p className="dashboard-v2-metric-note">{metric.note}</p>
                      </article>
                    )
                  })}
                </section>

                <article className="dashboard-v2-card">
                  <div className="dashboard-v2-card-head">
                    <div>
                      <div className="dashboard-v2-card-title">All reviews</div>
                      <p className="dashboard-v2-card-copy">
                        Full review history with the scores that came with each submission.
                      </p>
                    </div>
                  </div>

                  {submissions.length === 0 ? (
                    <div className="dashboard-v2-empty">
                      <div className="dashboard-v2-empty-icon">
                        <MessageSquare size={18} />
                      </div>
                      <h3 className="dashboard-v2-empty-title">No reviews yet</h3>
                      <p className="dashboard-v2-empty-copy">
                        Once your QR and public form are live, every new response will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="dashboard-v2-review-list">
                      {submissions.map((submission) => {
                        const style = scoreStyle(submission.average_score)

                        return (
                          <article key={submission.id} className="dashboard-v2-review-item">
                            <div className="dashboard-v2-review-top">
                              <span className="score-pill" style={{ background: style.bg, color: style.color }}>
                                {submission.average_score}/5
                              </span>
                              <span className="dashboard-v2-review-date">
                                {new Intl.DateTimeFormat(locale, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                }).format(new Date(submission.created_at))}
                              </span>
                            </div>

                            <div className="dashboard-v2-rating-pills">
                              {Object.entries(submission.ratings || {}).map(([id, value]) => (
                                <span key={id} className="pill">
                                  {(publishedQuestions.find((item) => item.id === id)?.label_fr || id).slice(0, 22)}:{' '}
                                  {value}/5
                                </span>
                              ))}
                            </div>

                            <p className="dashboard-v2-review-comment">
                              {submission.comment?.trim() || 'No written comment for this response.'}
                            </p>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </article>
              </div>
            </>
          ) : null}

          {activeTab === 'questions' ? (
            <>
              <div className="dashboard-v2-grid dashboard-v2-grid-questions">
                <section className="dashboard-v2-card">
                  <div className="dashboard-v2-card-head">
                    <div>
                      <div className="dashboard-v2-card-title">Question flow</div>
                      <p className="dashboard-v2-card-copy">
                        Choose a question, edit it on the right, and publish when the full list is ready.
                      </p>
                    </div>
                    <span className="pill">{questions.length}/10</span>
                  </div>

                  {questions.length === 0 ? (
                    <div className="dashboard-v2-empty">
                      <div className="dashboard-v2-empty-icon">
                        <ListChecks size={18} />
                      </div>
                      <h3 className="dashboard-v2-empty-title">No questions yet</h3>
                      <p className="dashboard-v2-empty-copy">
                        Add your first question from the builder panel and publish it to the form.
                      </p>
                    </div>
                  ) : (
                    <div className="dashboard-v2-question-browser">
                      {questions.map((question, index) => (
                        <button
                          key={question.id}
                          type="button"
                          className={`dashboard-v2-question-tile${selectedQuestion?.id === question.id ? ' active' : ''}`}
                          onClick={() => setSelectedQuestionId(question.id)}
                        >
                          <span className="dashboard-v2-question-order">{index + 1}</span>
                          <span className="dashboard-v2-question-tile-copy">
                            <span className="dashboard-v2-question-index">Question {index + 1}</span>
                            <span className="dashboard-v2-question-preview">
                              {questionLabel(question, lang)}
                            </span>
                            <span className="dashboard-v2-question-tile-meta">
                              FR and AR required. EN and ES optional.
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <div className="dashboard-v2-side-stack">
                  <section className="dashboard-v2-card">
                    <div className="dashboard-v2-card-head">
                      <div>
                        <div className="dashboard-v2-card-title">Question editor</div>
                        <p className="dashboard-v2-card-copy">
                          Update the selected question and keep the public form clear on mobile.
                        </p>
                      </div>
                    </div>

                    {selectedQuestion ? (
                      <div className="dashboard-v2-question-editor">
                        <div className="dashboard-v2-question-editor-top">
                          <div className="dashboard-v2-question-editor-title">
                            Editing question {selectedQuestionIndex + 1}
                          </div>
                          <div className="dashboard-v2-question-actions">
                            <button
                              type="button"
                              className="mini-button"
                              onClick={() => moveQuestion(selectedQuestionIndex, 'up')}
                              disabled={selectedQuestionIndex <= 0}
                              aria-label="Move question up"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              className="mini-button"
                              onClick={() => moveQuestion(selectedQuestionIndex, 'down')}
                              disabled={selectedQuestionIndex === questions.length - 1}
                              aria-label="Move question down"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              type="button"
                              className="mini-button"
                              onClick={() => removeQuestion(selectedQuestion.id)}
                              aria-label="Remove question"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="dashboard-v2-question-preview-box">
                          <div className="dashboard-v2-question-preview-label">Current preview</div>
                          <div className="dashboard-v2-question-preview-large">
                            {questionLabel(selectedQuestion, lang)}
                          </div>
                        </div>

                        <div className="dashboard-v2-field-grid">
                          <div className="field">
                            <label className="label">French</label>
                            <input
                              className="input"
                              value={selectedQuestion.label_fr}
                              onChange={(event) =>
                                updateQuestionField(selectedQuestion.id, 'label_fr', event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label className="label">Arabic</label>
                            <input
                              className="input"
                              value={selectedQuestion.label_ar}
                              onChange={(event) =>
                                updateQuestionField(selectedQuestion.id, 'label_ar', event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label className="label">English</label>
                            <input
                              className="input"
                              value={selectedQuestion.label_en || ''}
                              onChange={(event) =>
                                updateQuestionField(selectedQuestion.id, 'label_en', event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label className="label">Spanish</label>
                            <input
                              className="input"
                              value={selectedQuestion.label_es || ''}
                              onChange={(event) =>
                                updateQuestionField(selectedQuestion.id, 'label_es', event.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="dashboard-v2-empty">
                        <div className="dashboard-v2-empty-icon">
                          <ListChecks size={18} />
                        </div>
                        <h3 className="dashboard-v2-empty-title">Nothing selected</h3>
                        <p className="dashboard-v2-empty-copy">
                          Select a question from the list to edit its labels and order.
                        </p>
                      </div>
                    )}
                  </section>

                  <section className="dashboard-v2-card">
                    <div className="dashboard-v2-card-head">
                      <div>
                        <div className="dashboard-v2-card-title">Add a new question</div>
                        <p className="dashboard-v2-card-copy">
                          Keep it short, clear, and easy to answer before customers leave the page.
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-v2-field-grid">
                      <div className="field">
                        <label className="label">French</label>
                        <input
                          className="input"
                          value={newQuestion.fr}
                          onChange={(event) =>
                            setNewQuestion((current) => ({ ...current, fr: event.target.value }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label className="label">Arabic</label>
                        <input
                          className="input"
                          value={newQuestion.ar}
                          onChange={(event) =>
                            setNewQuestion((current) => ({ ...current, ar: event.target.value }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label className="label">English</label>
                        <input
                          className="input"
                          value={newQuestion.en}
                          onChange={(event) =>
                            setNewQuestion((current) => ({ ...current, en: event.target.value }))
                          }
                        />
                      </div>
                      <div className="field">
                        <label className="label">Spanish</label>
                        <input
                          className="input"
                          value={newQuestion.es}
                          onChange={(event) =>
                            setNewQuestion((current) => ({ ...current, es: event.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="dashboard-v2-action-row">
                      <button type="button" className="button button-primary" onClick={addQuestion}>
                        Add question
                        <Plus size={16} />
                      </button>
                    </div>
                  </section>

                  {(questionMessage || questionsDirty) ? (
                    <section className="dashboard-v2-card dashboard-v2-sticky-card">
                      <div className="dashboard-v2-card-head">
                        <div>
                          <div className="dashboard-v2-card-title">Publish changes</div>
                          <p className="dashboard-v2-card-copy">
                            Save the question list so the public feedback page reflects the new version.
                          </p>
                        </div>
                      </div>

                      {questionMessage ? (
                        <div
                          className={`message ${questionMessage.type === 'error' ? 'message-error' : 'message-success'}`}
                          style={{ marginBottom: 0 }}
                        >
                          {questionMessage.text}
                        </div>
                      ) : null}

                      {questionsDirty ? (
                        <div className="dashboard-v2-action-row" style={{ marginTop: 18 }}>
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => {
                              setQuestions(baselineQuestions)
                              setQuestionsDirty(false)
                              setQuestionMessage(null)
                            }}
                          >
                            Reset edits
                          </button>
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={saveQuestions}
                            disabled={questionsSaving}
                          >
                            {questionsSaving ? 'Saving...' : 'Publish'}
                            <Save size={16} />
                          </button>
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {activeTab === 'share' ? (
            <>
              <div className="dashboard-v2-stack">
                <section className="dashboard-v2-grid dashboard-v2-grid-share">
                  <article className="dashboard-v2-card">
                    <div className="dashboard-v2-card-head">
                      <div>
                        <div className="dashboard-v2-card-title">Share kit</div>
                        <p className="dashboard-v2-card-copy">
                          The live public form customers open after scanning the QR code.
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-v2-share-stack">
                      <div className="dashboard-v2-link-box">
                        <Link2 size={16} />
                        <span>{formUrl}</span>
                      </div>

                      <div className="dashboard-v2-action-row">
                        <button type="button" className="button button-secondary" onClick={copyFormLink}>
                          {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy link'}
                          <Copy size={16} />
                        </button>
                        <a href={formUrl} target="_blank" rel="noopener noreferrer" className="button button-primary">
                          Open form
                          <ExternalLink size={16} />
                        </a>
                      </div>

                      <div className="dashboard-v2-share-mini-grid">
                        {[
                          ['Questions live', String(publishedQuestions.length)],
                          ['Google link', googleUrl.trim() ? 'Added' : 'Missing'],
                          ['QR status', qrGenerated ? 'Ready' : 'Not generated'],
                        ].map(([label, value]) => (
                          <div key={label} className="dashboard-v2-share-mini-card">
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>

                  <article className="dashboard-v2-card">
                    <div className="dashboard-v2-card-head">
                      <div>
                        <div className="dashboard-v2-card-title">QR asset</div>
                        <p className="dashboard-v2-card-copy">
                          Generate, preview, and download the QR your team can place on site.
                        </p>
                      </div>
                      {qrGenerated ? <span className="pill accent-pill">Ready</span> : null}
                    </div>

                    {!qrGenerated ? (
                      <div className="dashboard-v2-empty">
                        <div className="dashboard-v2-empty-icon">
                          <QrCode size={18} />
                        </div>
                        <h3 className="dashboard-v2-empty-title">Generate your QR code</h3>
                        <p className="dashboard-v2-empty-copy">
                          Once generated, the same public link stays active even when you download a new file.
                        </p>
                        <button
                          type="button"
                          className="button button-primary"
                          style={{ marginTop: 18 }}
                          onClick={generateQr}
                          disabled={qrLoading}
                        >
                          {qrLoading ? 'Generating...' : 'Generate QR'}
                          <QrCode size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="dashboard-v2-qr-stack">
                        <div className="qr-box">
                          <img src={qrUrl} alt="QR code" width={220} height={220} />
                        </div>

                        <div className="dashboard-v2-share-mini-grid">
                          {[
                            ['Type', 'Printable PNG'],
                            ['Link state', 'Stable URL'],
                            ['Use', 'Tables and counters'],
                          ].map(([label, value]) => (
                            <div key={label} className="dashboard-v2-share-mini-card">
                              <span>{label}</span>
                              <strong>{value}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="dashboard-v2-action-row">
                          <button type="button" className="button button-primary" onClick={downloadQr}>
                            Download QR
                            <Download size={16} />
                          </button>
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={generateQr}
                            disabled={qrLoading}
                          >
                            {qrLoading ? 'Generating...' : 'Regenerate'}
                            <QrCode size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                </section>

                <section className="dashboard-v2-grid dashboard-v2-grid-share">
                  <article className="dashboard-v2-card">
                    <div className="dashboard-v2-card-head">
                      <div>
                        <div className="dashboard-v2-card-title">Launch checklist</div>
                        <p className="dashboard-v2-card-copy">
                          Small setup items that make the customer journey feel complete.
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-v2-checklist">
                      {readinessItems.map((item) => (
                        <div key={item.label} className="dashboard-v2-checklist-row">
                          <span className={`dashboard-v2-check-icon${item.ready ? ' ready' : ''}`}>
                            {item.ready ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
                          </span>
                          <div>
                            <div className="dashboard-v2-check-title">{item.label}</div>
                            <div className="dashboard-v2-check-copy">
                              {item.ready ? 'Done and ready to use.' : 'Still missing from the workspace.'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="dashboard-v2-card">
                    <div className="dashboard-v2-card-head">
                      <div>
                        <div className="dashboard-v2-card-title">On-site display tips</div>
                        <p className="dashboard-v2-card-copy">
                          Keep the public page easy to find and easy to complete.
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-v2-hint-list">
                      {[
                        'Place the QR where customers naturally pause: table, counter, or reception.',
                        'Use a short message near the code so people know the form takes under a minute.',
                        'Check the public link after every question update so the printed material stays accurate.',
                      ].map((item) => (
                        <div key={item} className="dashboard-v2-hint-row">
                          <span className="dashboard-v2-hint-dot" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>
              </div>
            </>
          ) : null}

          {activeTab === 'settings' ? (
            <>
              <div className="dashboard-v2-grid dashboard-v2-grid-settings">
                <section className="dashboard-v2-card">
                  <div className="dashboard-v2-card-head">
                    <div>
                      <div className="dashboard-v2-card-title">Business profile</div>
                      <p className="dashboard-v2-card-copy">
                        Update the business basics without leaving the dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="dashboard-v2-settings-banner">
                    <div className="dashboard-v2-settings-banner-copy">
                      <strong>{businessName || businessState.name}</strong>
                      <span>{businessState.city} - {businessState.sector}</span>
                    </div>
                    <div className="dashboard-v2-chip-row">
                      <span className="pill accent-pill">{currentPlan.label}</span>
                      <span className="pill">{humanizeStatus(businessState.plan_status)}</span>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Business name</label>
                    <input
                      className="input"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Google Reviews URL</label>
                    <input
                      className="input"
                      value={googleUrl}
                      onChange={(event) => setGoogleUrl(event.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Plan</label>
                    <select
                      className="select"
                      value={selectedPlan}
                      onChange={(event) => setSelectedPlan(event.target.value)}
                    >
                      <option value="trial">Trial</option>
                      <option value="starter">Starter - 149 MAD</option>
                      <option value="pro">Pro - 299 MAD</option>
                      <option value="business">Business - 699 MAD</option>
                    </select>
                  </div>

                  <p className="help-text">
                    Payments can be connected later. For now the plan change stays manual from the
                    dashboard.
                  </p>

                  {settingsMessage ? (
                    <div className={`message ${settingsMessage.type === 'error' ? 'message-error' : 'message-success'}`}>
                      {settingsMessage.text}
                    </div>
                  ) : null}

                  <div className="dashboard-v2-action-row">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={saveBusinessSettings}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                      <Save size={16} />
                    </button>
                  </div>
                </section>

                <section className="dashboard-v2-card">
                  <div className="dashboard-v2-card-head">
                    <div>
                      <div className="dashboard-v2-card-title">Branding</div>
                      <p className="dashboard-v2-card-copy">
                        Update the logo customers and staff will associate with this workspace.
                      </p>
                    </div>
                  </div>

                  <div className="dashboard-v2-logo-panel">
                    <div className="dashboard-v2-avatar dashboard-v2-avatar-large">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt={businessName || businessState.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        (businessName || businessState.name).slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="dashboard-v2-business-name">{businessName || businessState.name}</div>
                      <div className="dashboard-v2-business-meta">
                        {logoPreview ? 'Custom logo active' : 'Using the default initials preview'}
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                  />

                  <div className="dashboard-v2-action-row">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={logoUploading}
                    >
                      {logoUploading ? 'Uploading...' : 'Choose image'}
                      <ImageUp size={16} />
                    </button>
                    {logoPreview ? (
                      <button type="button" className="button button-secondary" onClick={removeLogo}>
                        Remove logo
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>

                  {logoMessage ? (
                    <div className={`message ${logoMessage.type === 'error' ? 'message-error' : 'message-success'}`}>
                      {logoMessage.text}
                    </div>
                  ) : null}
                </section>

                <section className="dashboard-v2-card">
                  <div className="dashboard-v2-card-head">
                    <div>
                      <div className="dashboard-v2-card-title">Workspace summary</div>
                      <p className="dashboard-v2-card-copy">
                        Quick read-only view of the information this dashboard is using.
                      </p>
                    </div>
                  </div>

                  <div className="dashboard-v2-info-list">
                    {[
                      ['Business name', businessName || businessState.name],
                      ['City', businessState.city],
                      ['Sector', businessState.sector],
                      ['Current plan', `${currentPlan.label} - ${currentPlan.price}`],
                      ['Plan status', humanizeStatus(businessState.plan_status)],
                      ['Questions live', String(publishedQuestions.length)],
                    ].map(([label, value]) => (
                      <div key={label} className="dashboard-v2-info-row">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="dashboard-v2-plan-note">
                    <div className="dashboard-v2-plan-note-title">{currentPlan.label}</div>
                    <p>{currentPlan.description}</p>
                  </div>
                </section>

                <section className="dashboard-v2-card">
                  <div className="dashboard-v2-card-head">
                    <div>
                      <div className="dashboard-v2-card-title">Session</div>
                      <p className="dashboard-v2-card-copy">
                        End the current session when the workspace is being used on a shared machine.
                      </p>
                    </div>
                  </div>

                  <button type="button" className="button button-danger" onClick={logout}>
                    Sign out
                    <LogOut size={16} />
                  </button>
                </section>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
