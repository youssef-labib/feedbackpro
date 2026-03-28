'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleAlert,
  Copy,
  Download,
  ExternalLink,
  ImageUp,
  LayoutDashboard,
  Link2,
  ListChecks,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Save,
  Search,
  Settings2,
  Star,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import FlagLangSelector from '../../components/FlagLangSelector'
import ThemeToggle from '../../components/ThemeToggle'
import { useStoredLanguage } from '../../components/useStoredLanguage'
import styles from './dashboard.module.css'
import {
  buildCategoryInsights,
  buildFeedbackRows,
  buildRatingDistribution,
  buildTrendSeries,
  compareWindowMetrics,
  compactNumber,
  excerpt,
  filterSubmissionsByRange,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  percent,
  planDescription,
  planLabel,
  questionLabel,
  questionsDirty,
  recurringIssueSummary,
  scoreTone,
  sectorLabel,
  summarizeSubmissions,
  toneLabel,
  type DashboardBusiness,
  type DashboardCategory,
  type DashboardForm,
  type DashboardRange,
  type DashboardSection,
  type DashboardSubmission,
  type FeedbackFilter,
  type FeedbackRow,
  type FeedbackSort,
  type ScoreTone,
  type TrendPoint,
  type TrendResolution,
} from './dashboard-data'

type Notice = {
  tone: 'success' | 'error'
  text: string
}

type DraftQuestion = {
  label_fr: string
  label_ar: string
  label_en: string
  label_es: string
}

type QuestionLocaleField = 'label_fr' | 'label_ar' | 'label_en' | 'label_es'

type SectionMeta = {
  id: DashboardSection
  label: string
  description: string
  icon: LucideIcon
}

type DashboardClientProps = {
  business: DashboardBusiness
  form: DashboardForm | null
  submissions: DashboardSubmission[]
  userEmail: string
}

const SECTION_META: SectionMeta[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Executive KPIs, service alerts, and a fast read on customer satisfaction.',
    icon: LayoutDashboard,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Trends, score distribution, and question-level feedback analysis.',
    icon: BarChart3,
  },
  {
    id: 'feedback',
    label: 'Feedback',
    description: 'Search, filter, and inspect every customer submission in detail.',
    icon: MessageSquare,
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Location readiness, service issues, and operational follow-up.',
    icon: CircleAlert,
  },
  {
    id: 'collection',
    label: 'Collection',
    description: 'Public form access, QR assets, and form question management.',
    icon: QrCode,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Business profile, branding, plan visibility, and workspace controls.',
    icon: Settings2,
  },
]

const RANGE_OPTIONS: DashboardRange[] = [7, 30, 90]
const RESOLUTION_OPTIONS: TrendResolution[] = ['day', 'week', 'month']
const FEEDBACK_FILTER_OPTIONS: FeedbackFilter[] = ['all', 'attention', 'positive', 'commented']
const FEEDBACK_SORT_OPTIONS: FeedbackSort[] = ['newest', 'oldest', 'highest', 'lowest']
const SIDEBAR_STORAGE_KEY = 'feedbackpro-dashboard-sidebar-collapsed'
const QUESTION_LANGUAGE_FIELDS: Array<{
  key: QuestionLocaleField
  label: string
  shortLabel: string
  helper: string
  dir?: 'rtl'
  required?: boolean
}> = [
  {
    key: 'label_fr',
    label: 'French label',
    shortLabel: 'FR',
    helper: 'Primary live label and required source field.',
    required: true,
  },
  {
    key: 'label_ar',
    label: 'Arabic label',
    shortLabel: 'AR',
    helper: 'Shown to Arabic-speaking guests and should read naturally in RTL.',
    dir: 'rtl',
  },
  {
    key: 'label_en',
    label: 'English label',
    shortLabel: 'EN',
    helper: 'Optional localized wording for English-speaking guests.',
  },
  {
    key: 'label_es',
    label: 'Spanish label',
    shortLabel: 'ES',
    helper: 'Optional localized wording for Spanish-speaking guests.',
  },
]

function cn(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

function cloneCategories(categories: DashboardCategory[]) {
  return categories.map((category) => ({ ...category }))
}

function flashNotice(
  setter: Dispatch<SetStateAction<Notice | null>>,
  notice: Notice,
  duration = 3200
) {
  setter(notice)
  window.setTimeout(() => setter(null), duration)
}

function formatDelta(current: number, previous: number, suffix = '') {
  const diff = Math.round((current - previous) * 10) / 10

  if (!previous && !current) {
    return { label: 'Flat vs previous period', tone: 'neutral' as const }
  }

  if (!previous && current) {
    return { label: `+${current}${suffix} vs previous period`, tone: 'positive' as const }
  }

  if (diff === 0) {
    return { label: 'Flat vs previous period', tone: 'neutral' as const }
  }

  return {
    label: `${diff > 0 ? '+' : ''}${diff}${suffix} vs previous period`,
    tone: diff > 0 ? ('positive' as const) : ('negative' as const),
  }
}

function statusClassName(tone: ScoreTone) {
  if (tone === 'positive') return styles.statusPositive
  if (tone === 'neutral') return styles.statusNeutral
  return styles.statusNegative
}

function MetricCard({
  label,
  value,
  note,
  badge,
  icon: Icon,
}: {
  label: string
  value: string
  note: string
  badge?: { label: string; tone: 'positive' | 'negative' | 'neutral' }
  icon: LucideIcon
}) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricHead}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricIcon}>
          <Icon size={18} />
        </span>
      </div>

      <div className={styles.metricValue}>{value}</div>

      <div className={styles.metricFoot}>
        {badge ? (
          <span
            className={cn(
              styles.inlineBadge,
              badge.tone === 'positive' && styles.inlineBadgePositive,
              badge.tone === 'negative' && styles.inlineBadgeNegative,
              badge.tone === 'neutral' && styles.inlineBadgeNeutral
            )}
          >
            {badge.label}
          </span>
        ) : null}

        <span className={styles.metricNote}>{note}</span>
      </div>
    </article>
  )
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>{title}</h2>
          <p className={styles.panelDescription}>{description}</p>
        </div>

        {action ? <div className={styles.panelAction}>{action}</div> : null}
      </header>

      {children}
    </section>
  )
}

function SegmentedControl({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className={styles.segmented} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(styles.segmentedButton, value === option.value && styles.segmentedButtonActive)}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function TonePill({ tone, label }: { tone: ScoreTone; label?: string }) {
  return (
    <span className={cn(styles.statusPill, statusClassName(tone))}>
      {label || toneLabel(tone)}
    </span>
  )
}

function EmptyState({
  icon: Icon,
  title,
  copy,
}: {
  icon: LucideIcon
  title: string
  copy: string
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icon size={18} />
      </div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyCopy}>{copy}</p>
    </div>
  )
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  const maxCount = Math.max(...points.map((point) => point.count), 1)
  const maxScore = 5

  const linePath = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100
      const y = 100 - (point.averageScore / maxScore) * 100
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <div className={styles.trendChart}>
      <div className={styles.trendPlot}>
        <div className={styles.trendBars} aria-hidden="true">
          {points.map((point) => (
            <div key={point.id} className={styles.trendBarWrap}>
              <span className={styles.trendBarTrack}>
                <span
                  className={styles.trendBarFill}
                  style={{ height: `${(point.count / maxCount) * 100}%` }}
                />
              </span>
            </div>
          ))}
        </div>

        <svg viewBox="0 0 100 100" className={styles.trendLine} preserveAspectRatio="none" aria-hidden="true">
          <path d={linePath} className={styles.trendLinePath} />
          {points.map((point, index) => {
            const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100
            const y = 100 - (point.averageScore / maxScore) * 100

            return <circle key={point.id} cx={x} cy={y} r="2.2" className={styles.trendLinePoint} />
          })}
        </svg>
      </div>

      <div className={styles.trendLabels}>
        {points.map((point) => (
          <div key={point.id} className={styles.trendLabel}>
            <strong>{point.label}</strong>
            <span>{point.count} responses</span>
            <span>{point.count ? `${point.averageScore}/5 average` : 'No data'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DistributionChart({
  distribution,
  total,
}: {
  distribution: Array<{ score: number; count: number }>
  total: number
}) {
  const peak = Math.max(...distribution.map((item) => item.count), 1)

  return (
    <div className={styles.distributionList}>
      {distribution.map((item) => (
        <div key={item.score} className={styles.distributionRow}>
          <div className={styles.distributionLabel}>
            <strong>{item.score} stars</strong>
            <span>{item.count} responses</span>
          </div>

          <span className={styles.distributionTrack}>
            <span
              className={styles.distributionFill}
              style={{ width: `${peak ? (item.count / peak) * 100 : 0}%` }}
            />
          </span>

          <span className={styles.distributionPercent}>
            {total ? percent(item.count / total) : percent(0)}
          </span>
        </div>
      ))}
    </div>
  )
}

function FeedbackDrawer({
  feedback,
  categories,
  onClose,
}: {
  feedback: FeedbackRow | null
  categories: DashboardCategory[]
  onClose: () => void
}) {
  if (!feedback) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className={cn(styles.drawerBackdrop, styles.sidebarBackdropOpen)}
        onClick={onClose}
        aria-label="Close feedback details"
      />

      <aside className={styles.drawer} aria-label="Feedback details">
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerEyebrow}>Feedback details</div>
            <h2 className={styles.drawerTitle}>{feedback.average_score}/5 overall score</h2>
            <div className={styles.drawerMeta}>
              Submitted {formatDateTime(feedback.created_at)} - {formatRelativeDate(feedback.created_at)}
            </div>
          </div>

          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close feedback details">
            <X size={16} />
          </button>
        </div>

        <div className={styles.drawerSection}>
          <div className={styles.drawerSummaryGrid}>
            <div className={styles.summaryCell}>
              <span>Status</span>
              <strong>{toneLabel(feedback.tone)}</strong>
            </div>
            <div className={styles.summaryCell}>
              <span>Weakest question</span>
              <strong>{feedback.lowestCategoryLabel}</strong>
            </div>
          </div>
        </div>

        <div className={styles.drawerSection}>
          <span className={styles.drawerSectionTitle}>Question scores</span>

          <div className={styles.scoreList}>
            {categories.length ? (
              categories.map((category) => {
                const score = Number(feedback.ratings?.[category.id] || 0)

                return (
                  <div key={category.id} className={styles.scoreRow}>
                    <div className={styles.scoreRowHead}>
                      <strong>{questionLabel(category)}</strong>
                      <TonePill tone={scoreTone(score || 5)} label={score ? `${score}/5` : 'No score'} />
                    </div>
                    <span className={styles.scoreTrack}>
                      <span className={styles.scoreFill} style={{ width: `${(score / 5) * 100}%` }} />
                    </span>
                  </div>
                )
              })
            ) : (
              <EmptyState
                icon={ListChecks}
                title="No structured ratings"
                copy="This feedback entry only contains the overall score and any written comment."
              />
            )}
          </div>
        </div>

        <div className={styles.drawerSection}>
          <span className={styles.drawerSectionTitle}>Customer comment</span>
          <div className={styles.commentCard}>
            {feedback.hasComment ? feedback.commentText : 'No written comment was left on this response.'}
          </div>
        </div>
      </aside>
    </>
  )
}

export default function DashboardClient({
  business,
  form,
  submissions,
  userEmail,
}: DashboardClientProps) {
  const router = useRouter()
  const { lang, setLang } = useStoredLanguage('fr')
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarReady, setSidebarReady] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DashboardRange>(30)
  const [trendResolution, setTrendResolution] = useState<TrendResolution>('day')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all')
  const [feedbackSort, setFeedbackSort] = useState<FeedbackSort>('newest')
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null)
  const [businessState, setBusinessState] = useState<DashboardBusiness>({ ...business })
  const [logoPreview, setLogoPreview] = useState(business.logo_url || '')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [qrVersion, setQrVersion] = useState(0)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isPublishingQuestions, setIsPublishingQuestions] = useState(false)
  const [isRefreshingQr, setIsRefreshingQr] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [settingsNotice, setSettingsNotice] = useState<Notice | null>(null)
  const [questionNotice, setQuestionNotice] = useState<Notice | null>(null)
  const [origin, setOrigin] = useState('')
  const [isViewPending, startViewTransition] = useTransition()
  const [publishedQuestions, setPublishedQuestions] = useState<DashboardCategory[]>(() =>
    cloneCategories(form?.categories || [])
  )
  const [draftQuestions, setDraftQuestions] = useState<DashboardCategory[]>(() =>
    cloneCategories(form?.categories || [])
  )
  const [newQuestion, setNewQuestion] = useState<DraftQuestion>({
    label_fr: '',
    label_ar: '',
    label_en: '',
    label_es: '',
  })

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored === 'true') {
      setSidebarCollapsed(true)
    }
    setSidebarReady(true)
  }, [])

  useEffect(() => {
    if (!sidebarReady) {
      return
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed))
  }, [sidebarCollapsed, sidebarReady])

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileNavOpen(false)
        setSelectedFeedbackId(null)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  useEffect(() => {
    const shouldLock = mobileNavOpen || Boolean(selectedFeedbackId)
    const previousOverflow = document.body.style.overflow

    if (shouldLock) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen, selectedFeedbackId])

  const livePath = `/r/${business.slug}`
  const liveUrl = origin ? `${origin}${livePath}` : livePath
  const qrUrl = `/api/qr?url=${encodeURIComponent(liveUrl)}&v=${qrVersion}`

  const visibleSubmissions = filterSubmissionsByRange(submissions, selectedRange)
  const summary = summarizeSubmissions(visibleSubmissions)
  const comparison = compareWindowMetrics(submissions, selectedRange)
  const distribution = buildRatingDistribution(visibleSubmissions)
  const categoryInsights = buildCategoryInsights(visibleSubmissions, publishedQuestions)
  const recurringIssues = recurringIssueSummary(categoryInsights)
  const trendPoints = buildTrendSeries(visibleSubmissions, trendResolution, selectedRange)
  const allFeedbackRows = buildFeedbackRows(visibleSubmissions, publishedQuestions, {
    query: '',
    filter: 'all',
    sort: 'newest',
  })
  const feedbackRows = buildFeedbackRows(visibleSubmissions, publishedQuestions, {
    query: deferredSearch,
    filter: feedbackFilter,
    sort: feedbackSort,
  })
  const selectedFeedback = allFeedbackRows.find((item) => item.id === selectedFeedbackId) || null
  const sectionMeta = SECTION_META.find((section) => section.id === activeSection) || SECTION_META[0]
  const averageDelta = formatDelta(comparison.current.averageScore, comparison.previous.averageScore, '/5')
  const feedbackDelta = formatDelta(comparison.current.totalFeedback, comparison.previous.totalFeedback)
  const satisfactionDelta = formatDelta(
    Math.round(comparison.current.satisfactionRate * 100),
    Math.round(comparison.previous.satisfactionRate * 100),
    ' pts'
  )
  const attentionDelta = formatDelta(comparison.current.attentionCount, comparison.previous.attentionCount)
  const strongestCategory = [...categoryInsights].reverse().find((item) => item.responses > 0) || null
  const weakestCategory = categoryInsights.find((item) => item.responses > 0) || null
  const positiveCount = visibleSubmissions.filter((item) => scoreTone(item.average_score) === 'positive').length
  const neutralCount = visibleSubmissions.filter((item) => scoreTone(item.average_score) === 'neutral').length
  const negativeCount = visibleSubmissions.filter((item) => scoreTone(item.average_score) === 'negative').length
  const questionChangesPending = questionsDirty(draftQuestions, publishedQuestions)
  const planCopy = planDescription(businessState.plan)

  useEffect(() => {
    if (selectedFeedbackId && !allFeedbackRows.some((item) => item.id === selectedFeedbackId)) {
      setSelectedFeedbackId(null)
    }
  }, [allFeedbackRows, selectedFeedbackId])

  function navigateToSection(section: DashboardSection) {
    setMobileNavOpen(false)
    startViewTransition(() => setActiveSection(section))
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => !current)
  }

  async function copyLiveFormLink() {
    try {
      await navigator.clipboard.writeText(liveUrl)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 2200)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 2200)
    }
  }

  async function refreshQrAsset() {
    setIsRefreshingQr(true)
    setQrVersion((current) => current + 1)
    window.setTimeout(() => setIsRefreshingQr(false), 500)
  }

  async function downloadQrAsset() {
    const response = await fetch(qrUrl, { cache: 'no-store' })
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${business.slug}-feedback-qr.png`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }

  async function saveSettings() {
    setIsSavingSettings(true)

    try {
      const response = await fetch('/api/business/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessState.id,
          name: businessState.name,
          google_review_url: businessState.google_review_url || '',
          plan: businessState.plan,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Could not save business settings.')
      }

      flashNotice(setSettingsNotice, {
        tone: 'success',
        text: 'Business settings updated successfully.',
      })
      router.refresh()
    } catch (error) {
      flashNotice(setSettingsNotice, {
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not save business settings.',
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessState.id)

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Could not upload logo.')
      }

      setLogoPreview(payload.url || '')
      setBusinessState((current) => ({
        ...current,
        logo_url: payload.url || '',
      }))

      flashNotice(setSettingsNotice, {
        tone: 'success',
        text: 'Brand logo updated successfully.',
      })
      router.refresh()
    } catch (error) {
      flashNotice(setSettingsNotice, {
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not upload logo.',
      })
    } finally {
      event.target.value = ''
      setIsUploadingLogo(false)
    }
  }

  function addQuestion() {
    if (draftQuestions.length >= 10) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: 'The form can contain up to 10 questions.',
      })
      return
    }

    if (!newQuestion.label_fr.trim()) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: 'A French label is required before adding a new question.',
      })
      return
    }

    const nextQuestion: DashboardCategory = {
      id: String(draftQuestions.length + 1),
      label_fr: newQuestion.label_fr.trim(),
      label_ar: newQuestion.label_ar.trim() || newQuestion.label_fr.trim(),
      label_en: newQuestion.label_en.trim() || newQuestion.label_fr.trim(),
      label_es: newQuestion.label_es.trim() || newQuestion.label_en.trim() || newQuestion.label_fr.trim(),
    }

    setDraftQuestions((current) => [...current, nextQuestion])
    setNewQuestion({
      label_fr: '',
      label_ar: '',
      label_en: '',
      label_es: '',
    })

    flashNotice(setQuestionNotice, {
      tone: 'success',
      text: 'Question added to the draft form.',
    })
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= draftQuestions.length) {
      return
    }

    setDraftQuestions((current) => {
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next.map((question, questionIndex) => ({
        ...question,
        id: String(questionIndex + 1),
      }))
    })
  }

  function removeQuestion(index: number) {
    if (draftQuestions.length === 1) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: 'The form must keep at least one question.',
      })
      return
    }

    setDraftQuestions((current) =>
      current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((question, questionIndex) => ({
          ...question,
          id: String(questionIndex + 1),
        }))
    )
  }

  function updateQuestionField(index: number, field: keyof DashboardCategory, value: string) {
    setDraftQuestions((current) =>
      current.map((question, currentIndex) =>
        currentIndex === index
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    )
  }

  async function publishQuestions() {
    if (!form) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: 'No feedback form exists for this workspace yet.',
      })
      return
    }

    if (!draftQuestions.length) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: 'Add at least one question before publishing.',
      })
      return
    }

    setIsPublishingQuestions(true)

    try {
      const response = await fetch('/api/forms/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          categories: draftQuestions,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Could not publish form questions.')
      }

      const nextQuestions = Array.isArray(payload.categories)
        ? (payload.categories as DashboardCategory[])
        : cloneCategories(draftQuestions)

      setPublishedQuestions(cloneCategories(nextQuestions))
      setDraftQuestions(cloneCategories(nextQuestions))

      flashNotice(setQuestionNotice, {
        tone: 'success',
        text: 'Live form questions updated successfully.',
      })
      router.refresh()
    } catch (error) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not publish form questions.',
      })
    } finally {
      setIsPublishingQuestions(false)
    }
  }

  async function logout() {
    setIsLoggingOut(true)

    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  const watchlist = [
    summary.attentionCount > 0
      ? {
          id: 'attention',
          title: `${summary.attentionCount} low-rating submission${summary.attentionCount === 1 ? '' : 's'} require follow-up`,
          copy: 'Scores below 3/5 signal service recovery opportunities that should be reviewed quickly.',
          tone: 'negative' as const,
        }
      : null,
    weakestCategory && weakestCategory.averageScore < 4
      ? {
          id: 'weakest-category',
          title: `${weakestCategory.label} is the weakest service area`,
          copy: `${weakestCategory.averageScore}/5 average with ${percent(weakestCategory.lowScoreRate)} low-score share in the selected window.`,
          tone: weakestCategory.tone,
        }
      : null,
    comparison.previous.totalFeedback > 0 && comparison.current.averageScore < comparison.previous.averageScore
      ? {
          id: 'rating-drift',
          title: 'Average rating is softening vs the previous period',
          copy: `${averageDelta.label}. Review the most recent negative comments for context.`,
          tone: 'neutral' as const,
        }
      : null,
    summary.commentCoverage < 0.25 && summary.totalFeedback >= 6
      ? {
          id: 'comment-coverage',
          title: 'Written comments are still sparse',
          copy: `Only ${percent(summary.commentCoverage)} of customers left written context, which limits issue diagnosis.`,
          tone: 'neutral' as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string
    title: string
    copy: string
    tone: ScoreTone
  }>

  function renderOverviewSection() {
    return (
      <div className={styles.sectionStack}>
        <div className={styles.kpiGrid}>
          <MetricCard
            label="Average rating"
            value={`${summary.averageScore || 0}/5`}
            note="Overall satisfaction trend for the selected reporting window."
            badge={{ label: averageDelta.label, tone: averageDelta.tone }}
            icon={Star}
          />
          <MetricCard
            label="Total feedback"
            value={compactNumber(summary.totalFeedback)}
            note="Every submission received in the current reporting window."
            badge={{ label: feedbackDelta.label, tone: feedbackDelta.tone }}
            icon={MessageSquare}
          />
          <MetricCard
            label="Satisfaction rate"
            value={percent(summary.satisfactionRate)}
            note="Share of responses scoring 4/5 or higher."
            badge={{ label: satisfactionDelta.label, tone: satisfactionDelta.tone }}
            icon={CheckCircle2}
          />
          <MetricCard
            label="Negative alerts"
            value={String(summary.attentionCount)}
            note="Low-rating responses that deserve fast operational review."
            badge={{ label: attentionDelta.label, tone: attentionDelta.tone }}
            icon={CircleAlert}
          />
        </div>

        <div className={styles.twoColumnGrid}>
          <Panel
            title="Response trend"
            description="Submission volume and average rating over the selected reporting window."
            action={
              <SegmentedControl
                ariaLabel="Trend resolution"
                value={trendResolution}
                onChange={(value) => setTrendResolution(value as TrendResolution)}
                options={RESOLUTION_OPTIONS.map((option) => ({
                  label: option.charAt(0).toUpperCase() + option.slice(1),
                  value: option,
                }))}
              />
            }
          >
            {visibleSubmissions.length ? (
              <TrendChart points={trendPoints} />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No feedback in this range"
                copy="Widen the date range or wait for new responses to start filling the dashboard."
              />
            )}
          </Panel>

          <Panel
            title="Operational watchlist"
            description="The most important service and experience signals to review right now."
          >
            {watchlist.length ? (
              <div className={styles.alertList}>
                {watchlist.map((item) => (
                  <div key={item.id} className={styles.alertRow}>
                    <div className={cn(styles.alertIcon, statusClassName(item.tone))}>
                      <CircleAlert size={18} />
                    </div>
                    <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                      <strong>{item.title}</strong>
                      <p className={styles.drawerMeta}>{item.copy}</p>
                    </div>
                    <TonePill tone={item.tone} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No urgent service issues"
                copy="The current data window looks healthy. New risks will appear here as feedback changes."
              />
            )}
          </Panel>
        </div>

        <div className={styles.twoColumnGrid}>
          <Panel
            title="Recent feedback"
            description="Latest customer responses with the fastest path into detailed review."
          >
            {allFeedbackRows.length ? (
              <div className={styles.latestList}>
                {allFeedbackRows.slice(0, 4).map((feedback) => (
                  <button
                    key={feedback.id}
                    type="button"
                    className={styles.latestRow}
                    onClick={() => {
                      setSelectedFeedbackId(feedback.id)
                      navigateToSection('feedback')
                    }}
                  >
                    <div className={styles.latestRowHead}>
                      <div>
                        <span>{formatDate(feedback.created_at)}</span>
                        <div className={styles.latestRowLabel}>{feedback.lowestCategoryLabel}</div>
                      </div>
                      <TonePill tone={feedback.tone} label={`${feedback.average_score}/5`} />
                    </div>
                    <p>{excerpt(feedback.commentText, 110)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No recent feedback yet"
                copy="Once customers submit feedback, the latest responses will be surfaced here."
              />
            )}
          </Panel>

          <Panel
            title="Performance snapshot"
            description="A concise summary of service health, category quality, and comment coverage."
          >
            <div className={styles.summaryList}>
              <div className={styles.summaryCell}>
                <span>Strongest category</span>
                <strong>
                  {strongestCategory
                    ? `${strongestCategory.label} (${strongestCategory.averageScore}/5)`
                    : 'No category data yet'}
                </strong>
              </div>
              <div className={styles.summaryCell}>
                <span>Weakest category</span>
                <strong>
                  {weakestCategory
                    ? `${weakestCategory.label} (${weakestCategory.averageScore}/5)`
                    : 'No category data yet'}
                </strong>
              </div>
              <div className={styles.summaryCell}>
                <span>Comment coverage</span>
                <strong>{percent(summary.commentCoverage)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>Feedback mix</span>
                <strong>
                  {positiveCount} positive - {neutralCount} neutral - {negativeCount} attention
                </strong>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  function renderAnalyticsSection() {
    return (
      <div className={styles.sectionStack}>
        <div className={styles.twoColumnGrid}>
          <Panel
            title="Ratings trend"
            description="Track response volume and average score over time by day, week, or month."
            action={
              <SegmentedControl
                ariaLabel="Analytics trend resolution"
                value={trendResolution}
                onChange={(value) => setTrendResolution(value as TrendResolution)}
                options={RESOLUTION_OPTIONS.map((option) => ({
                  label: option.charAt(0).toUpperCase() + option.slice(1),
                  value: option,
                }))}
              />
            }
          >
            {visibleSubmissions.length ? (
              <TrendChart points={trendPoints} />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Trend analytics need fresh data"
                copy="There is not enough feedback in the selected window to build a reliable trend."
              />
            )}
          </Panel>

          <Panel
            title="Ratings distribution"
            description="A score-by-score breakdown of the overall rating experience."
          >
            {visibleSubmissions.length ? (
              <div className={styles.sectionStack}>
                <DistributionChart distribution={distribution} total={visibleSubmissions.length} />

                <div className={styles.mixCard}>
                  <div className={styles.mixBar} aria-label="Feedback sentiment mix">
                    <span
                      className={cn(styles.mixSegment, styles.mixPositive)}
                      style={{ width: `${visibleSubmissions.length ? (positiveCount / visibleSubmissions.length) * 100 : 0}%` }}
                    />
                    <span
                      className={cn(styles.mixSegment, styles.mixNeutral)}
                      style={{ width: `${visibleSubmissions.length ? (neutralCount / visibleSubmissions.length) * 100 : 0}%` }}
                    />
                    <span
                      className={cn(styles.mixSegment, styles.mixNegative)}
                      style={{ width: `${visibleSubmissions.length ? (negativeCount / visibleSubmissions.length) * 100 : 0}%` }}
                    />
                  </div>

                  <div className={styles.mixLegend}>
                    <div className={styles.mixLegendRow}>
                      <span className={cn(styles.legendSwatch, styles.mixPositive)} />
                      <span>Positive</span>
                      <strong>{positiveCount}</strong>
                    </div>
                    <div className={styles.mixLegendRow}>
                      <span className={cn(styles.legendSwatch, styles.mixNeutral)} />
                      <span>Neutral</span>
                      <strong>{neutralCount}</strong>
                    </div>
                    <div className={styles.mixLegendRow}>
                      <span className={cn(styles.legendSwatch, styles.mixNegative)} />
                      <span>Attention</span>
                      <strong>{negativeCount}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Star}
                title="Distribution unavailable"
                copy="Score distribution becomes useful once the selected date range contains real feedback."
              />
            )}
          </Panel>
        </div>

        <Panel
          title="Question performance"
          description="Question-by-question scoring to pinpoint what customers value and where service slips."
        >
          {categoryInsights.some((item) => item.responses > 0) ? (
            <div className={styles.categoryList}>
              {categoryInsights.map((item) => (
                <div key={item.id} className={styles.categoryRow}>
                  <div className={styles.categoryCopy}>
                    <div className={styles.categoryTitleRow}>
                      <strong>{item.label}</strong>
                      <TonePill tone={item.tone} label={`${item.averageScore || 0}/5`} />
                    </div>
                    <p>{item.responses} responses - {percent(item.lowScoreRate)} low-score share</p>
                  </div>
                  <span className={styles.scoreTrack}>
                    <span className={styles.scoreFill} style={{ width: `${(item.averageScore / 5) * 100}%` }} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ListChecks}
              title="Question analytics need more data"
              copy="Question-level insights will appear as soon as customers rate the live form questions."
            />
          )}
        </Panel>

        <div className={styles.twoColumnGrid}>
          <Panel
            title="Recurring issues"
            description="Weak categories that are showing up often enough to deserve operational action."
          >
            {recurringIssues.length ? (
              <div className={styles.issueList}>
                {recurringIssues.map((issue) => (
                  <div key={issue.id} className={styles.issueRow}>
                    <div>
                      <strong>{issue.label}</strong>
                      <p>{issue.responses} responses - {percent(issue.lowScoreRate)} low-score share</p>
                    </div>
                    <span className={cn(styles.issueScore, statusClassName(issue.tone))}>
                      {issue.averageScore}/5
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No recurring issue pattern"
                copy="As soon as a question becomes a consistent problem, it will be highlighted here."
              />
            )}
          </Panel>

          <Panel
            title="Executive summary"
            description="A compact view for weekly reporting and stakeholder check-ins."
          >
            <div className={styles.summaryList}>
              <div className={styles.summaryCell}>
                <span>Average rating</span>
                <strong>{summary.averageScore || 0}/5</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>Feedback count</span>
                <strong>{summary.totalFeedback}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>Satisfaction rate</span>
                <strong>{percent(summary.satisfactionRate)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>Current window</span>
                <strong>Last {selectedRange} days</strong>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  function renderFeedbackSection() {
    return (
      <div className={styles.sectionStack}>
        <Panel
          title="Feedback list"
          description="Search comments, sort by score or date, and open full submission details in a side drawer."
          action={<span className={styles.feedbackCount}>{feedbackRows.length} result{feedbackRows.length === 1 ? '' : 's'}</span>}
        >
          <div className={styles.feedbackControls}>
            <label className={styles.searchField}>
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search comments or question names"
                aria-label="Search feedback"
              />
            </label>

            <div className={styles.inlineControls}>
              <select
                className={styles.select}
                value={feedbackFilter}
                onChange={(event) => setFeedbackFilter(event.target.value as FeedbackFilter)}
                aria-label="Filter feedback"
              >
                {FEEDBACK_FILTER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                value={feedbackSort}
                onChange={(event) => setFeedbackSort(event.target.value as FeedbackSort)}
                aria-label="Sort feedback"
              >
                {FEEDBACK_SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Sort: {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {feedbackRows.length ? (
            <div className={styles.feedbackTable}>
              <div className={styles.feedbackHead}>
                <span>Date</span>
                <span>Score</span>
                <span>Weakest area</span>
                <span>Comment</span>
                <span>Status</span>
              </div>

              <div className={styles.feedbackBody}>
                {feedbackRows.map((feedback) => (
                  <button
                    key={feedback.id}
                    type="button"
                    className={cn(styles.feedbackRow, selectedFeedbackId === feedback.id && styles.feedbackRowActive)}
                    onClick={() => setSelectedFeedbackId(feedback.id)}
                  >
                    <span className={styles.feedbackCell}>
                      <strong>{formatDate(feedback.created_at)}</strong>
                      <small>{formatRelativeDate(feedback.created_at)}</small>
                    </span>
                    <span className={styles.feedbackCell}>
                      <strong>{feedback.average_score}/5</strong>
                      <small>{Object.keys(feedback.ratings || {}).length} rated areas</small>
                    </span>
                    <span className={styles.feedbackCell}>
                      <strong>{feedback.lowestCategoryLabel}</strong>
                      <small>{feedback.lowestCategoryScore}/5</small>
                    </span>
                    <span className={styles.feedbackCell}>
                      <strong>{feedback.hasComment ? excerpt(feedback.commentText, 84) : 'No written comment'}</strong>
                    </span>
                    <span className={styles.feedbackCell}>
                      <TonePill tone={feedback.tone} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No feedback matches these filters"
              copy="Try a wider date range or clear the active search, filter, and sort combination."
            />
          )}
        </Panel>
      </div>
    )
  }

  function renderOperationsSection() {
    return (
      <div className={styles.sectionStack}>
        <div className={styles.twoColumnGrid}>
          <Panel
            title="Current location snapshot"
            description="Today the workspace maps to a single business entity, so this panel acts as the live location overview."
          >
            <div className={styles.summaryList}>
              <div className={styles.summaryCell}>
                <span>Location</span>
                <strong>{businessState.name}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>City</span>
                <strong>{businessState.city}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>Sector</span>
                <strong>{sectorLabel(businessState.sector)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>Latest feedback</span>
                <strong>{allFeedbackRows[0] ? formatRelativeDate(allFeedbackRows[0].created_at) : 'No feedback yet'}</strong>
              </div>
            </div>
          </Panel>

          <Panel
            title="Branches and locations"
            description="Prepared for multi-location analytics, while staying honest about the current backend limits."
          >
            <EmptyState
              icon={Building2}
              title="Branch comparison is not available yet"
              copy="The backend currently stores a single business workspace without branch entities or per-location submission ownership. Once those models exist, this area can show top and worst-performing locations."
            />
          </Panel>
        </div>

        <div className={styles.twoColumnGrid}>
          <Panel
            title="Service insights"
            description="Operational reading of the weakest categories, even before staff-level tracking exists."
          >
            {categoryInsights.some((item) => item.responses > 0) ? (
              <div className={styles.issueList}>
                {categoryInsights
                  .filter((item) => item.responses > 0)
                  .slice(0, 4)
                  .map((item) => (
                    <div key={item.id} className={styles.issueRow}>
                      <div>
                        <strong>{item.label}</strong>
                        <p>{item.responses} responses - {percent(item.lowScoreRate)} low-score share</p>
                      </div>
                      <span className={cn(styles.issueScore, statusClassName(item.tone))}>
                        {item.averageScore}/5
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="Not enough operational signal"
                copy="As more responses arrive, service issues and recurring weak spots will be easier to separate from noise."
              />
            )}
          </Panel>

          <Panel
            title="Operational checklist"
            description="Action prompts for managers based on current product and data readiness."
          >
            <div className={styles.checklist}>
              <div className={styles.checklistRow}>
                <div className={cn(styles.checkIcon, summary.attentionCount === 0 ? styles.checkIconReady : styles.checkIconMuted)}>
                  <CheckCircle2 size={18} />
                </div>
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <strong>Review low-scoring feedback daily</strong>
                  <p className={styles.drawerMeta}>
                    {summary.attentionCount
                      ? `${summary.attentionCount} item${summary.attentionCount === 1 ? '' : 's'} still need attention in the selected window.`
                      : 'No low-scoring submissions are currently surfacing in this reporting window.'}
                  </p>
                </div>
              </div>

              <div className={styles.checklistRow}>
                <div className={cn(styles.checkIcon, publishedQuestions.length ? styles.checkIconReady : styles.checkIconMuted)}>
                  <ListChecks size={18} />
                </div>
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <strong>Keep the live form aligned with operations</strong>
                  <p className={styles.drawerMeta}>
                    {publishedQuestions.length
                      ? `${publishedQuestions.length} live question${publishedQuestions.length === 1 ? '' : 's'} currently drive customer feedback collection.`
                      : 'No live questions are configured yet.'}
                  </p>
                </div>
              </div>

              <div className={styles.checklistRow}>
                <div className={cn(styles.checkIcon, summary.commentCoverage >= 0.3 ? styles.checkIconReady : styles.checkIconMuted)}>
                  <MessageSquare size={18} />
                </div>
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <strong>Improve written context from guests</strong>
                  <p className={styles.drawerMeta}>
                    {summary.commentCoverage >= 0.3
                      ? `Written feedback coverage is at ${percent(summary.commentCoverage)}, which gives better qualitative detail.`
                      : `Written feedback coverage is only ${percent(summary.commentCoverage)}, so issue diagnosis still depends heavily on score patterns.`}
                  </p>
                </div>
              </div>

              <div className={styles.checklistRow}>
                <div className={cn(styles.checkIcon, styles.checkIconMuted)}>
                  <Building2 size={18} />
                </div>
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <strong>Prepare branch and staff dimensions</strong>
                  <p className={styles.drawerMeta}>
                    Multi-branch and staff performance views need backend tables for locations, staff members, and submission relationships.
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  function renderCollectionSection() {
    const remainingQuestionSlots = Math.max(0, 10 - draftQuestions.length)

    return (
      <div className={styles.sectionStack}>
        <Panel
          title="Distribution and QR"
          description="Keep collection assets compact, accessible, and easy to distribute without crowding the editor."
        >
          <div className={styles.collectionUtilityRail}>
            <article className={cn(styles.collectionUtilityCard, styles.collectionUtilityStatusCard)}>
              <div className={styles.collectionUtilityHeader}>
                <span className={styles.collectionUtilityEyebrow}>Collection status</span>
                <span
                  className={cn(
                    styles.inlineBadge,
                    form ? styles.inlineBadgePositive : styles.inlineBadgeNeutral
                  )}
                >
                  {form ? 'Live form ready' : 'Setup needed'}
                </span>
              </div>
              <div className={styles.collectionUtilityBody}>
                <strong>Feedback form access</strong>
                <p>
                  {form
                    ? 'Guests can open the live form immediately through the public URL and QR access.'
                    : 'No feedback form is currently attached to this workspace.'}
                </p>
              </div>
              <div className={cn(styles.collectionUtilityFooter, styles.collectionUtilityMeta)}>
                <span>{draftQuestions.length} drafted question{draftQuestions.length === 1 ? '' : 's'}</span>
                <span>{questionChangesPending ? 'Changes waiting to publish' : 'Draft synced with live form'}</span>
              </div>
            </article>

            <article className={cn(styles.collectionUtilityCard, styles.collectionUtilityLinkCard)}>
              <div className={styles.collectionUtilityHeader}>
                <span className={styles.collectionUtilityEyebrow}>Live form URL</span>
                <span className={cn(styles.inlineBadge, styles.inlineBadgePositive)}>Public access</span>
              </div>
              <div className={styles.collectionUtilityBody}>
                <strong>Share the public feedback flow</strong>
                <div className={styles.collectionUtilityUrlBlock}>
                  <span className={styles.collectionUtilityUrlLabel}>Public URL</span>
                  <p className={styles.collectionUtilityLink}>{liveUrl}</p>
                </div>
              </div>
              <div className={cn(styles.collectionUtilityFooter, styles.compactActionRow)}>
                <button
                  type="button"
                  className={cn(styles.primaryButton, styles.compactButton)}
                  onClick={copyLiveFormLink}
                >
                  {copyState === 'copied' ? 'Copied link' : copyState === 'error' ? 'Copy failed' : 'Copy form link'}
                  <Copy size={16} />
                </button>
                <Link
                  href={livePath}
                  className={cn(styles.secondaryButton, styles.compactButton)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open live form
                  <ExternalLink size={16} />
                </Link>
              </div>
            </article>

            <article className={cn(styles.collectionUtilityCard, styles.collectionUtilityReviewCard)}>
              <div className={styles.collectionUtilityHeader}>
                <span className={styles.collectionUtilityEyebrow}>Review channel</span>
                <span
                  className={cn(
                    styles.inlineBadge,
                    businessState.google_review_url ? styles.inlineBadgePositive : styles.inlineBadgeNeutral
                  )}
                >
                  {businessState.google_review_url ? 'Connected' : 'Optional'}
                </span>
              </div>
              <div className={styles.collectionUtilityBody}>
                <strong>Google review destination</strong>
                <p>
                  {businessState.google_review_url
                    ? 'Send guests to an external review page after they complete the feedback flow.'
                    : 'Add a Google review link when you want to pair private feedback collection with public reviews.'}
                </p>
              </div>
              <div className={cn(styles.collectionUtilityFooter, styles.compactActionRow)}>
                {businessState.google_review_url ? (
                  <Link
                    href={businessState.google_review_url}
                    className={cn(styles.secondaryButton, styles.compactButton)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Google reviews
                    <ExternalLink size={16} />
                  </Link>
                ) : (
                  <span className={styles.feedbackCount}>
                    Configure in Settings
                  </span>
                )}
              </div>
            </article>

            <article className={cn(styles.collectionUtilityCard, styles.collectionUtilityQrCard)}>
              <div className={styles.collectionUtilityQrPreview} style={{ backgroundImage: `url("${qrUrl}")` }} />
              <div className={styles.collectionUtilityQrBody}>
                <div className={styles.collectionUtilityHeader}>
                  <span className={styles.collectionUtilityEyebrow}>QR utility</span>
                  <span
                    className={cn(
                      styles.inlineBadge,
                      business.qr_generated ? styles.inlineBadgePositive : styles.inlineBadgeNeutral
                    )}
                  >
                    {business.qr_generated ? 'Generated' : 'Preview available'}
                  </span>
                </div>
                <div className={styles.collectionUtilityBody}>
                  <strong>Printable QR access</strong>
                  <p>Refresh the preview or download a PNG without leaving the builder.</p>
                </div>
                <div className={cn(styles.collectionUtilityFooter, styles.compactActionRow)}>
                  <button
                    type="button"
                    className={cn(styles.secondaryButton, styles.compactButton)}
                    onClick={refreshQrAsset}
                  >
                    {isRefreshingQr ? <LoaderCircle size={16} className={styles.spin} /> : <QrCode size={16} />}
                    Refresh
                  </button>
                  <button
                    type="button"
                    className={cn(styles.primaryButton, styles.compactButton)}
                    onClick={downloadQrAsset}
                  >
                    Download PNG
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </Panel>

        <Panel
          title="Question builder"
          description="Build and localize the live feedback form with a cleaner editor designed for fast scanning and confident publishing."
          action={
            <button
              type="button"
              className={styles.primaryButton}
              onClick={publishQuestions}
              disabled={!form || isPublishingQuestions || !questionChangesPending}
            >
              {isPublishingQuestions ? <LoaderCircle size={16} className={styles.spin} /> : <Save size={16} />}
              Publish changes
            </button>
          }
        >
          {questionNotice ? (
            <div className={cn(styles.notice, questionNotice.tone === 'success' ? styles.noticeSuccess : styles.noticeError)}>
              {questionNotice.text}
            </div>
          ) : null}

          <div className={styles.questionBuilder}>
            <div className={styles.questionBuilderHeader}>
              <div className={styles.questionBuilderLead}>
                <span className={styles.collectionUtilityEyebrow}>Form builder</span>
                <strong>Design the question flow guests will rate</strong>
                <p>
                  French stays the required source label. Arabic, English, and Spanish can be refined before publishing without leaving this workspace.
                </p>
              </div>

              <div className={styles.questionBuilderMeta}>
                <span className={styles.feedbackCount}>{publishedQuestions.length} live question{publishedQuestions.length === 1 ? '' : 's'}</span>
                <span className={styles.feedbackCount}>{remainingQuestionSlots} slot{remainingQuestionSlots === 1 ? '' : 's'} remaining</span>
                <span
                  className={cn(
                    styles.inlineBadge,
                    questionChangesPending ? styles.inlineBadgeNeutral : styles.inlineBadgePositive
                  )}
                >
                  {questionChangesPending ? 'Unpublished changes' : 'Live form synced'}
                </span>
              </div>
            </div>

            <section className={styles.questionComposerCard}>
              <div className={styles.questionComposerHeader}>
                <div className={styles.questionComposerLead}>
                  <span className={styles.collectionUtilityEyebrow}>New question</span>
                  <strong>Compose the next prompt before adding it to the draft</strong>
                  <p>Draft the main wording once, then tighten the localized versions so guests see a polished form in every language.</p>
                </div>

                <div className={styles.questionComposerActions}>
                  <span className={styles.feedbackCount}>Up to 10 total questions</span>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={addQuestion}
                    disabled={remainingQuestionSlots === 0 || !newQuestion.label_fr.trim()}
                  >
                    Add question
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.localeEditorGrid}>
                {QUESTION_LANGUAGE_FIELDS.map((locale) => (
                  <label key={locale.key} className={styles.localeEditorCard}>
                    <div className={styles.localeEditorHead}>
                      <div>
                        <span className={styles.localeTag}>{locale.shortLabel}</span>
                        <strong>{locale.label}</strong>
                      </div>
                      {locale.required ? <span className={styles.requiredTag}>Required</span> : null}
                    </div>
                    <span className={styles.localeHelper}>{locale.helper}</span>
                    <textarea
                      className={cn(styles.input, styles.textarea)}
                      dir={locale.dir}
                      rows={3}
                      value={newQuestion[locale.key]}
                      onChange={(event) =>
                        setNewQuestion((current) => ({
                          ...current,
                          [locale.key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </section>

            {draftQuestions.length ? (
              <div className={styles.questionBuilderList}>
                {draftQuestions.map((question, index) => {
                  const localizedCount = QUESTION_LANGUAGE_FIELDS.filter((locale) => question[locale.key]?.trim()).length

                  return (
                    <article key={`${question.id}-${index}`} className={styles.builderQuestionCard}>
                      <div className={styles.builderQuestionRail}>
                        <span className={styles.builderQuestionOrder}>{String(index + 1).padStart(2, '0')}</span>
                        <div className={styles.builderQuestionMoves}>
                          <button
                            type="button"
                            className={cn(styles.iconButton, styles.questionMoveButton)}
                            onClick={() => moveQuestion(index, 'up')}
                            disabled={index === 0}
                            aria-label={`Move question ${index + 1} up`}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            className={cn(styles.iconButton, styles.questionMoveButton)}
                            onClick={() => moveQuestion(index, 'down')}
                            disabled={index === draftQuestions.length - 1}
                            aria-label={`Move question ${index + 1} down`}
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.builderQuestionBody}>
                        <div className={styles.builderQuestionHeader}>
                          <div className={styles.builderQuestionTitle}>
                            <span className={styles.questionIndex}>Question {String(index + 1).padStart(2, '0')}</span>
                            <strong>{questionLabel(question)}</strong>
                            <div className={styles.builderQuestionMeta}>
                              <span>{localizedCount}/4 language labels filled</span>
                              <span>{index === 0 ? 'First question in the live form' : `Position ${index + 1} in the live order`}</span>
                            </div>
                          </div>

                          <div className={styles.builderQuestionActions}>
                            <button
                              type="button"
                              className={cn(styles.ghostButton, styles.questionDeleteButton)}
                              onClick={() => removeQuestion(index)}
                              aria-label={`Remove question ${index + 1}`}
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className={styles.localeEditorGrid}>
                          {QUESTION_LANGUAGE_FIELDS.map((locale) => (
                            <label key={`${question.id}-${locale.key}`} className={styles.localeEditorCard}>
                              <div className={styles.localeEditorHead}>
                                <div>
                                  <span className={styles.localeTag}>{locale.shortLabel}</span>
                                  <strong>{locale.label}</strong>
                                </div>
                                {locale.required ? <span className={styles.requiredTag}>Required</span> : null}
                              </div>
                              <span className={styles.localeHelper}>{locale.helper}</span>
                              <textarea
                                className={cn(styles.input, styles.textarea)}
                                dir={locale.dir}
                                rows={3}
                                value={question[locale.key] || ''}
                                onChange={(event) => updateQuestionField(index, locale.key, event.target.value)}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={ListChecks}
                title="No questions configured"
                copy="Start with the composer above to create the first multilingual question for the live feedback form."
              />
            )}
          </div>
        </Panel>
      </div>
    )
  }

  function renderSettingsSection() {
    return (
      <div className={styles.sectionStack}>
        <div className={styles.twoColumnGrid}>
          <Panel
            title="Business settings"
            description="Core workspace details used across the feedback experience."
            action={
              <button type="button" className={styles.primaryButton} onClick={saveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? <LoaderCircle size={16} className={styles.spin} /> : <Save size={16} />}
                Save settings
              </button>
            }
          >
            {settingsNotice ? (
              <div className={cn(styles.notice, settingsNotice.tone === 'success' ? styles.noticeSuccess : styles.noticeError)}>
                {settingsNotice.text}
              </div>
            ) : null}

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Business name</span>
                <input
                  className={styles.input}
                  value={businessState.name}
                  onChange={(event) =>
                    setBusinessState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Plan</span>
                <select
                  className={styles.select}
                  value={businessState.plan}
                  onChange={(event) =>
                    setBusinessState((current) => ({
                      ...current,
                      plan: event.target.value,
                    }))
                  }
                >
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Google review URL</span>
                <input
                  className={styles.input}
                  value={businessState.google_review_url || ''}
                  onChange={(event) =>
                    setBusinessState((current) => ({
                      ...current,
                      google_review_url: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </label>

              <div className={styles.readOnlyBlock}>
                <span>Plan status</span>
                <strong>{businessState.plan_status.replace(/[_-]+/g, ' ')}</strong>
              </div>

              <div className={styles.readOnlyBlock}>
                <span>City</span>
                <strong>{businessState.city}</strong>
              </div>

              <div className={styles.readOnlyBlock}>
                <span>Sector</span>
                <strong>{sectorLabel(businessState.sector)}</strong>
              </div>
            </div>
          </Panel>

          <Panel
            title="Branding and workspace"
            description="Keep the admin workspace polished and aligned with the business brand."
          >
            <div className={styles.brandingCard}>
              <div className={styles.workspaceCard}>
                <div
                  className={styles.brandPreview}
                  style={logoPreview ? { backgroundImage: `url("${logoPreview}")` } : undefined}
                >
                  {!logoPreview ? businessState.name.slice(0, 2).toUpperCase() : null}
                </div>

                <div className={styles.workspaceCopy}>
                  <strong>{businessState.name}</strong>
                  <span>{sectorLabel(businessState.sector)} - {businessState.city}</span>
                </div>

                <div className={styles.workspaceMeta}>
                  <span>{planLabel(businessState.plan)}</span>
                  <span>{logoPreview ? 'Logo uploaded' : 'No logo yet'}</span>
                </div>

                <div className={styles.actionRow}>
                  <label className={styles.secondaryButton}>
                    {isUploadingLogo ? <LoaderCircle size={16} className={styles.spin} /> : <ImageUp size={16} />}
                    {logoPreview ? 'Replace logo' : 'Upload logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div className={styles.sessionCard}>
                <div className={styles.sessionMeta}>
                  <strong>Workspace owner</strong>
                  <span>{userEmail || 'Signed in user'}</span>
                </div>

                <div className={styles.sessionMeta}>
                  <strong>Plan guidance</strong>
                  <span>{planCopy}</span>
                </div>

                <button type="button" className={styles.ghostButton} onClick={logout} disabled={isLoggingOut}>
                  {isLoggingOut ? <LoaderCircle size={16} className={styles.spin} /> : <LogOut size={16} />}
                  Sign out
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  function renderSectionContent() {
    if (activeSection === 'overview') return renderOverviewSection()
    if (activeSection === 'analytics') return renderAnalyticsSection()
    if (activeSection === 'feedback') return renderFeedbackSection()
    if (activeSection === 'operations') return renderOperationsSection()
    if (activeSection === 'collection') return renderCollectionSection()
    return renderSettingsSection()
  }

  return (
    <div className={cn(styles.shell, sidebarCollapsed && styles.shellCollapsed)}>
      <button
        type="button"
        className={cn(styles.sidebarBackdrop, mobileNavOpen && styles.sidebarBackdropOpen)}
        onClick={() => setMobileNavOpen(false)}
        aria-label="Close navigation"
      />

      <aside className={cn(styles.sidebar, mobileNavOpen && styles.sidebarOpen)}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.brand}>
            <span className={styles.brandMark}>FP</span>
            <span className={styles.brandCopy}>
              <strong>FeedbackPro</strong>
              <span>Customer feedback workspace</span>
            </span>
          </Link>

          <div className={styles.sidebarHeaderActions}>
            <button
              type="button"
              className={cn(styles.iconButton, styles.sidebarCollapseButton)}
              onClick={toggleSidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            <button
              type="button"
              className={cn(styles.iconButton, styles.sidebarCloseButton)}
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className={styles.workspaceCard}>
          <div
            className={styles.workspaceLogo}
            style={logoPreview ? { backgroundImage: `url("${logoPreview}")` } : undefined}
          >
            {!logoPreview ? businessState.name.slice(0, 2).toUpperCase() : null}
          </div>

          <div className={styles.workspaceCopy}>
            <strong>{businessState.name}</strong>
            <span>{businessState.city} - {sectorLabel(businessState.sector)}</span>
          </div>

          <div className={styles.workspaceMeta}>
            <span>{planLabel(businessState.plan)}</span>
            <span>{submissions.length} total feedback</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {SECTION_META.map((section) => {
            const Icon = section.icon

            return (
              <button
                key={section.id}
                type="button"
                className={cn(styles.navButton, activeSection === section.id && styles.navButtonActive)}
                onClick={() => navigateToSection(section.id)}
                data-tooltip={section.label}
                title={sidebarCollapsed ? section.label : undefined}
                aria-label={section.label}
              >
                <span className={styles.navIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.navCopy}>
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <div className={styles.sidebarHint}>
            <strong>Data limitations</strong>
            <p>Branch and staff analytics remain placeholder-first until the backend exposes those entities explicitly.</p>
          </div>
        </div>
      </aside>

      <div className={styles.canvas}>
        <div className={styles.mobileBar}>
          <button type="button" className={styles.iconButton} onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
            <Menu size={16} />
          </button>

          <div className={styles.mobileBarCopy}>
            <strong>{sectionMeta.label}</strong>
            <span>{businessState.name}</span>
          </div>

          <div className={styles.mobileBarControls}>
            <FlagLangSelector lang={lang} setLang={setLang} />
            <ThemeToggle />
          </div>
        </div>

        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <div className={styles.headerEyebrow}>
              {isViewPending ? 'Updating workspace view' : 'Workspace dashboard'}
            </div>
            <h1 className={styles.headerTitle}>{sectionMeta.label}</h1>
            <p className={styles.headerDescription}>{sectionMeta.description}</p>
          </div>

          <div className={styles.headerActions}>
            <SegmentedControl
              ariaLabel="Reporting range"
              value={String(selectedRange)}
              onChange={(value) => setSelectedRange(Number(value) as DashboardRange)}
              options={RANGE_OPTIONS.map((range) => ({
                label: `${range}d`,
                value: String(range),
              }))}
            />

            <div className={styles.utilityControls}>
              <FlagLangSelector lang={lang} setLang={setLang} />
              <ThemeToggle />
            </div>

            <Link href={livePath} className={styles.secondaryButton} target="_blank" rel="noreferrer">
              Open form
              <ExternalLink size={16} />
            </Link>

            <button type="button" className={styles.primaryButton} onClick={copyLiveFormLink}>
              {copyState === 'copied' ? 'Copied link' : copyState === 'error' ? 'Copy failed' : 'Copy form link'}
              <Link2 size={16} />
            </button>
          </div>
        </header>

        <main className={styles.main}>{renderSectionContent()}</main>
      </div>

      <FeedbackDrawer
        feedback={selectedFeedback}
        categories={publishedQuestions}
        onClose={() => setSelectedFeedbackId(null)}
      />
    </div>
  )
}

