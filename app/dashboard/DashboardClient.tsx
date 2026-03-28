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
import { DASHBOARD_COPY, dashboardLocale, type DashboardCopy } from './dashboard-copy'
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
  type DashboardLang,
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

type SectionMeta = {
  id: DashboardSection
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
    icon: LayoutDashboard,
  },
  {
    id: 'analytics',
    icon: BarChart3,
  },
  {
    id: 'feedback',
    icon: MessageSquare,
  },
  {
    id: 'operations',
    icon: CircleAlert,
  },
  {
    id: 'collection',
    icon: QrCode,
  },
  {
    id: 'settings',
    icon: Settings2,
  },
]

const RANGE_OPTIONS: DashboardRange[] = [7, 30, 90]
const RESOLUTION_OPTIONS: TrendResolution[] = ['day', 'week', 'month']
const FEEDBACK_FILTER_OPTIONS: FeedbackFilter[] = ['all', 'attention', 'positive', 'commented']
const FEEDBACK_SORT_OPTIONS: FeedbackSort[] = ['newest', 'oldest', 'highest', 'lowest']
const SIDEBAR_STORAGE_KEY = 'feedbackpro-dashboard-sidebar-collapsed'

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

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function formatDelta(
  current: number,
  previous: number,
  copy: DashboardCopy['common'],
  suffix = ''
) {
  const diff = Math.round((current - previous) * 10) / 10

  if (!previous && !current) {
    return { label: copy.previousPeriodFlat, tone: 'neutral' as const }
  }

  if (!previous && current) {
    return { label: `+${current}${suffix} ${copy.previousPeriodSuffix}`, tone: 'positive' as const }
  }

  if (diff === 0) {
    return { label: copy.previousPeriodFlat, tone: 'neutral' as const }
  }

  return {
    label: `${diff > 0 ? '+' : ''}${diff}${suffix} ${copy.previousPeriodSuffix}`,
    tone: diff > 0 ? ('positive' as const) : ('negative' as const),
  }
}

function questionPositionLabel(index: number, copy: DashboardCopy['common']) {
  return `${copy.questionWord} ${String(index + 1).padStart(2, '0')}`
}

function questionMoveLabel(
  index: number,
  copy: DashboardCopy['common'],
  lang: DashboardLang,
  direction: 'up' | 'down'
) {
  const actionMap = {
    en: { up: 'up', down: 'down' },
    fr: { up: 'vers le haut', down: 'vers le bas' },
    ar: { up: 'الى الاعلى', down: 'الى الاسفل' },
    es: { up: 'arriba', down: 'abajo' },
  }

  return `${questionPositionLabel(index, copy)} ${actionMap[lang][direction]}`
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

function TonePill({
  tone,
  label,
  lang,
}: {
  tone: ScoreTone
  label?: string
  lang: DashboardLang
}) {
  return (
    <span className={cn(styles.statusPill, statusClassName(tone))}>
      {label || toneLabel(tone, lang)}
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

function TrendChart({
  points,
  copy,
}: {
  points: TrendPoint[]
  copy: DashboardCopy
}) {
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
            <span>
              {point.count} {pluralize(point.count, copy.common.responseSingular, copy.common.responsePlural)}
            </span>
            <span>{point.count ? `${point.averageScore}/5` : copy.common.noData}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DistributionChart({
  distribution,
  total,
  copy,
  locale,
}: {
  distribution: Array<{ score: number; count: number }>
  total: number
  copy: DashboardCopy
  locale: string
}) {
  const peak = Math.max(...distribution.map((item) => item.count), 1)

  return (
    <div className={styles.distributionList}>
      {distribution.map((item) => (
        <div key={item.score} className={styles.distributionRow}>
          <div className={styles.distributionLabel}>
            <strong>{item.score}/5</strong>
            <span>
              {item.count} {pluralize(item.count, copy.common.responseSingular, copy.common.responsePlural)}
            </span>
          </div>

          <span className={styles.distributionTrack}>
            <span
              className={styles.distributionFill}
              style={{ width: `${peak ? (item.count / peak) * 100 : 0}%` }}
            />
          </span>

          <span className={styles.distributionPercent}>
            {total ? percent(item.count / total, locale) : percent(0, locale)}
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
  copy,
  lang,
  locale,
}: {
  feedback: FeedbackRow | null
  categories: DashboardCategory[]
  onClose: () => void
  copy: DashboardCopy
  lang: DashboardLang
  locale: string
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
        aria-label={copy.common.closeFeedbackDetails}
      />

      <aside className={styles.drawer} aria-label={copy.common.feedbackDetails}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerEyebrow}>{copy.common.feedbackDetails}</div>
            <h2 className={styles.drawerTitle}>{feedback.average_score}/5 {copy.common.overallScoreSuffix}</h2>
            <div className={styles.drawerMeta}>
              {copy.common.submitted} {formatDateTime(feedback.created_at, locale)} - {formatRelativeDate(feedback.created_at, locale)}
            </div>
          </div>

          <button type="button" className={styles.iconButton} onClick={onClose} aria-label={copy.common.closeFeedbackDetails}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.drawerSection}>
          <div className={styles.drawerSummaryGrid}>
            <div className={styles.summaryCell}>
              <span>{copy.common.status}</span>
              <strong>{toneLabel(feedback.tone, lang)}</strong>
            </div>
            <div className={styles.summaryCell}>
              <span>{copy.common.weakestQuestion}</span>
              <strong>{feedback.lowestCategoryLabel}</strong>
            </div>
          </div>
        </div>

        <div className={styles.drawerSection}>
          <span className={styles.drawerSectionTitle}>{copy.common.questionScores}</span>

          <div className={styles.scoreList}>
            {categories.length ? (
              categories.map((category) => {
                const score = Number(feedback.ratings?.[category.id] || 0)

                return (
                  <div key={category.id} className={styles.scoreRow}>
                    <div className={styles.scoreRowHead}>
                      <strong>{questionLabel(category, lang)}</strong>
                      <TonePill
                        tone={scoreTone(score || 5)}
                        label={score ? `${score}/5` : copy.common.noScore}
                        lang={lang}
                      />
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
                title={copy.common.noStructuredRatingsTitle}
                copy={copy.common.noStructuredRatingsCopy}
              />
            )}
          </div>
        </div>

        <div className={styles.drawerSection}>
          <span className={styles.drawerSectionTitle}>{copy.common.customerComment}</span>
          <div className={styles.commentCard}>
            {feedback.hasComment ? feedback.commentText : copy.common.noWrittenCommentLong}
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
  const { lang, setLang } = useStoredLanguage('en')
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
  const copy = DASHBOARD_COPY[lang] || DASHBOARD_COPY.en
  const locale = dashboardLocale(lang)

  const visibleSubmissions = filterSubmissionsByRange(submissions, selectedRange)
  const summary = summarizeSubmissions(visibleSubmissions)
  const comparison = compareWindowMetrics(submissions, selectedRange)
  const distribution = buildRatingDistribution(visibleSubmissions)
  const categoryInsights = buildCategoryInsights(visibleSubmissions, publishedQuestions, lang)
  const recurringIssues = recurringIssueSummary(categoryInsights)
  const trendPoints = buildTrendSeries(visibleSubmissions, trendResolution, selectedRange, locale)
  const allFeedbackRows = buildFeedbackRows(visibleSubmissions, publishedQuestions, {
    lang,
    noCategoryLabel: copy.common.noCategory,
    query: '',
    filter: 'all',
    sort: 'newest',
  })
  const feedbackRows = buildFeedbackRows(visibleSubmissions, publishedQuestions, {
    lang,
    noCategoryLabel: copy.common.noCategory,
    query: deferredSearch,
    filter: feedbackFilter,
    sort: feedbackSort,
  })
  const selectedFeedback = allFeedbackRows.find((item) => item.id === selectedFeedbackId) || null
  const sections = SECTION_META.map((section) => ({
    ...section,
    label: copy.sections[section.id].label,
    description: copy.sections[section.id].description,
  }))
  const sectionMeta = sections.find((section) => section.id === activeSection) || sections[0]
  const averageDelta = formatDelta(comparison.current.averageScore, comparison.previous.averageScore, copy.common, '/5')
  const feedbackDelta = formatDelta(comparison.current.totalFeedback, comparison.previous.totalFeedback, copy.common)
  const satisfactionDelta = formatDelta(
    Math.round(comparison.current.satisfactionRate * 100),
    Math.round(comparison.previous.satisfactionRate * 100),
    copy.common,
    copy.common.pointsSuffix
  )
  const attentionDelta = formatDelta(comparison.current.attentionCount, comparison.previous.attentionCount, copy.common)
  const strongestCategory = [...categoryInsights].reverse().find((item) => item.responses > 0) || null
  const weakestCategory = categoryInsights.find((item) => item.responses > 0) || null
  const positiveCount = visibleSubmissions.filter((item) => scoreTone(item.average_score) === 'positive').length
  const neutralCount = visibleSubmissions.filter((item) => scoreTone(item.average_score) === 'neutral').length
  const negativeCount = visibleSubmissions.filter((item) => scoreTone(item.average_score) === 'negative').length
  const questionChangesPending = questionsDirty(draftQuestions, publishedQuestions)
  const planCopy = planDescription(businessState.plan, lang)
  const coverageCount = draftQuestions.filter(
    (question) =>
      question.label_fr.trim() &&
      question.label_ar.trim() &&
      (question.label_en || '').trim() &&
      (question.label_es || '').trim()
  ).length
  const coverageReady = draftQuestions.length > 0 && coverageCount === draftQuestions.length
  const collectionReady = Boolean(form && publishedQuestions.length)

  const formatDateValue = (value: string) => formatDate(value, locale)
  const formatRelativeValue = (value: string) => formatRelativeDate(value, locale)
  const compactValue = (value: number) => compactNumber(value, locale)
  const percentValue = (value: number) => percent(value, locale)

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
        throw new Error(payload.error || copy.notices.settingsError)
      }

      flashNotice(setSettingsNotice, {
        tone: 'success',
        text: copy.notices.settingsSaved,
      })
      router.refresh()
    } catch (error) {
      flashNotice(setSettingsNotice, {
        tone: 'error',
        text: error instanceof Error ? error.message : copy.notices.settingsError,
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
        throw new Error(payload.error || copy.notices.logoError)
      }

      setLogoPreview(payload.url || '')
      setBusinessState((current) => ({
        ...current,
        logo_url: payload.url || '',
      }))

      flashNotice(setSettingsNotice, {
        tone: 'success',
        text: copy.notices.logoSaved,
      })
      router.refresh()
    } catch (error) {
      flashNotice(setSettingsNotice, {
        tone: 'error',
        text: error instanceof Error ? error.message : copy.notices.logoError,
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
        text: copy.notices.questionLimit,
      })
      return
    }

    if (!newQuestion.label_fr.trim()) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: copy.notices.frenchRequired,
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
      text: copy.notices.questionAdded,
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
        text: copy.notices.keepOneQuestion,
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
        text: copy.notices.noForm,
      })
      return
    }

    if (!draftQuestions.length) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: copy.notices.publishNeedsQuestion,
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
        throw new Error(payload.error || copy.notices.publishError)
      }

      const nextQuestions = Array.isArray(payload.categories)
        ? (payload.categories as DashboardCategory[])
        : cloneCategories(draftQuestions)

      setPublishedQuestions(cloneCategories(nextQuestions))
      setDraftQuestions(cloneCategories(nextQuestions))

      flashNotice(setQuestionNotice, {
        tone: 'success',
        text: copy.notices.publishSuccess,
      })
      router.refresh()
    } catch (error) {
      flashNotice(setQuestionNotice, {
        tone: 'error',
        text: error instanceof Error ? error.message : copy.notices.publishError,
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
          title: `${summary.attentionCount} ${pluralize(
            summary.attentionCount,
            copy.common.itemSingular,
            copy.common.itemPlural
          )} ${copy.common.needsAttention}`,
          copy: copy.overview.watchlistAttentionCopy,
          tone: 'negative' as const,
        }
      : null,
    weakestCategory && weakestCategory.averageScore < 4
      ? {
          id: 'weakest-category',
          title: `${weakestCategory.label} ${copy.overview.watchlistWeakestTitleSuffix}`,
          copy: `${weakestCategory.averageScore}/5 ${copy.overview.watchlistWeakestCopySuffix} ${percentValue(
            weakestCategory.lowScoreRate
          )} ${copy.common.lowScoreShare} ${copy.overview.watchlistWeakestCopyTail}`,
          tone: weakestCategory.tone,
        }
      : null,
    comparison.previous.totalFeedback > 0 && comparison.current.averageScore < comparison.previous.averageScore
      ? {
          id: 'rating-drift',
          title: copy.overview.watchlistDriftTitle,
          copy: `${averageDelta.label}. ${copy.overview.watchlistDriftCopyTail}`,
          tone: 'neutral' as const,
        }
      : null,
    summary.commentCoverage < 0.25 && summary.totalFeedback >= 6
      ? {
          id: 'comment-coverage',
          title: copy.overview.watchlistCommentTitle,
          copy: `${copy.overview.watchlistCommentCopyPrefix} ${percentValue(summary.commentCoverage)} ${copy.overview.watchlistCommentCopySuffix}`,
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
            label={copy.overview.metrics.averageRating}
            value={`${summary.averageScore || 0}/5`}
            note={copy.overview.metrics.averageRatingNote}
            badge={{ label: averageDelta.label, tone: averageDelta.tone }}
            icon={Star}
          />
          <MetricCard
            label={copy.overview.metrics.totalFeedback}
            value={compactValue(summary.totalFeedback)}
            note={copy.overview.metrics.totalFeedbackNote}
            badge={{ label: feedbackDelta.label, tone: feedbackDelta.tone }}
            icon={MessageSquare}
          />
          <MetricCard
            label={copy.overview.metrics.satisfactionRate}
            value={percentValue(summary.satisfactionRate)}
            note={copy.overview.metrics.satisfactionRateNote}
            badge={{ label: satisfactionDelta.label, tone: satisfactionDelta.tone }}
            icon={CheckCircle2}
          />
          <MetricCard
            label={copy.overview.metrics.negativeAlerts}
            value={String(summary.attentionCount)}
            note={copy.overview.metrics.negativeAlertsNote}
            badge={{ label: attentionDelta.label, tone: attentionDelta.tone }}
            icon={CircleAlert}
          />
        </div>

        <div className={styles.twoColumnGrid}>
          <Panel
            title={copy.overview.responseTrendTitle}
            description={copy.overview.responseTrendCopy}
            action={
              <SegmentedControl
                ariaLabel={copy.common.trendResolution}
                value={trendResolution}
                onChange={(value) => setTrendResolution(value as TrendResolution)}
                options={RESOLUTION_OPTIONS.map((option) => ({
                  label: copy.options.resolutions[option],
                  value: option,
                }))}
              />
            }
          >
            {visibleSubmissions.length ? (
              <TrendChart points={trendPoints} copy={copy} />
            ) : (
              <EmptyState
                icon={BarChart3}
                title={copy.overview.noFeedbackTitle}
                copy={copy.overview.noFeedbackCopy}
              />
            )}
          </Panel>

          <Panel
            title={copy.overview.watchlistTitle}
            description={copy.overview.watchlistCopy}
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
                    <TonePill tone={item.tone} lang={lang} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title={copy.overview.watchlistEmptyTitle}
                copy={copy.overview.watchlistEmptyCopy}
              />
            )}
          </Panel>
        </div>

        <div className={styles.twoColumnGrid}>
          <Panel
            title={copy.overview.recentFeedbackTitle}
            description={copy.overview.recentFeedbackCopy}
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
                        <span>{formatDateValue(feedback.created_at)}</span>
                        <div className={styles.latestRowLabel}>{feedback.lowestCategoryLabel}</div>
                      </div>
                      <TonePill tone={feedback.tone} label={`${feedback.average_score}/5`} lang={lang} />
                    </div>
                    <p>{feedback.hasComment ? excerpt(feedback.commentText, 110) : copy.common.noWrittenComment}</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title={copy.overview.recentFeedbackEmptyTitle}
                copy={copy.overview.recentFeedbackEmptyCopy}
              />
            )}
          </Panel>

          <Panel
            title={copy.overview.performanceSnapshotTitle}
            description={copy.overview.performanceSnapshotCopy}
          >
            <div className={styles.summaryList}>
              <div className={styles.summaryCell}>
                <span>{copy.overview.strongestCategory}</span>
                <strong>
                  {strongestCategory
                    ? `${strongestCategory.label} (${strongestCategory.averageScore}/5)`
                    : copy.overview.noCategoryData}
                </strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.overview.weakestCategory}</span>
                <strong>
                  {weakestCategory
                    ? `${weakestCategory.label} (${weakestCategory.averageScore}/5)`
                    : copy.overview.noCategoryData}
                </strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.overview.commentCoverage}</span>
                <strong>{percentValue(summary.commentCoverage)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.overview.feedbackMix}</span>
                <strong>
                  {positiveCount} {copy.common.positive} - {neutralCount} {copy.common.neutral} - {negativeCount} {copy.common.attention}
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
            title={copy.analytics.ratingsTrendTitle}
            description={copy.analytics.ratingsTrendCopy}
            action={
              <SegmentedControl
                ariaLabel={copy.common.analyticsTrendResolution}
                value={trendResolution}
                onChange={(value) => setTrendResolution(value as TrendResolution)}
                options={RESOLUTION_OPTIONS.map((option) => ({
                  label: copy.options.resolutions[option],
                  value: option,
                }))}
              />
            }
          >
            {visibleSubmissions.length ? (
              <TrendChart points={trendPoints} copy={copy} />
            ) : (
              <EmptyState
                icon={BarChart3}
                title={copy.analytics.trendEmptyTitle}
                copy={copy.analytics.trendEmptyCopy}
              />
            )}
          </Panel>

          <Panel
            title={copy.analytics.ratingsDistributionTitle}
            description={copy.analytics.ratingsDistributionCopy}
          >
            {visibleSubmissions.length ? (
              <div className={styles.sectionStack}>
                <DistributionChart distribution={distribution} total={visibleSubmissions.length} copy={copy} locale={locale} />

                <div className={styles.mixCard}>
                  <div className={styles.mixBar} aria-label={copy.analytics.sentimentMixAria}>
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
                      <span>{copy.common.positive}</span>
                      <strong>{positiveCount}</strong>
                    </div>
                    <div className={styles.mixLegendRow}>
                      <span className={cn(styles.legendSwatch, styles.mixNeutral)} />
                      <span>{copy.common.neutral}</span>
                      <strong>{neutralCount}</strong>
                    </div>
                    <div className={styles.mixLegendRow}>
                      <span className={cn(styles.legendSwatch, styles.mixNegative)} />
                      <span>{copy.common.attention}</span>
                      <strong>{negativeCount}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Star}
                title={copy.analytics.distributionEmptyTitle}
                copy={copy.analytics.distributionEmptyCopy}
              />
            )}
          </Panel>
        </div>

        <Panel
          title={copy.analytics.questionPerformanceTitle}
          description={copy.analytics.questionPerformanceCopy}
        >
          {categoryInsights.some((item) => item.responses > 0) ? (
            <div className={styles.categoryList}>
              {categoryInsights.map((item) => (
                <div key={item.id} className={styles.categoryRow}>
                  <div className={styles.categoryCopy}>
                    <div className={styles.categoryTitleRow}>
                      <strong>{item.label}</strong>
                      <TonePill tone={item.tone} label={`${item.averageScore || 0}/5`} lang={lang} />
                    </div>
                    <p>
                      {item.responses} {pluralize(item.responses, copy.common.responseSingular, copy.common.responsePlural)} - {percentValue(item.lowScoreRate)} {copy.common.lowScoreShare}
                    </p>
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
              title={copy.analytics.questionEmptyTitle}
              copy={copy.analytics.questionEmptyCopy}
            />
          )}
        </Panel>

        <div className={styles.twoColumnGrid}>
          <Panel
            title={copy.analytics.recurringIssuesTitle}
            description={copy.analytics.recurringIssuesCopy}
          >
            {recurringIssues.length ? (
              <div className={styles.issueList}>
                {recurringIssues.map((issue) => (
                  <div key={issue.id} className={styles.issueRow}>
                    <div>
                      <strong>{issue.label}</strong>
                      <p>
                        {issue.responses} {pluralize(issue.responses, copy.common.responseSingular, copy.common.responsePlural)} - {percentValue(issue.lowScoreRate)} {copy.common.lowScoreShare}
                      </p>
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
                title={copy.analytics.recurringIssuesEmptyTitle}
                copy={copy.analytics.recurringIssuesEmptyCopy}
              />
            )}
          </Panel>

          <Panel
            title={copy.analytics.executiveSummaryTitle}
            description={copy.analytics.executiveSummaryCopy}
          >
            <div className={styles.summaryList}>
              <div className={styles.summaryCell}>
                <span>{copy.analytics.averageRating}</span>
                <strong>{summary.averageScore || 0}/5</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.analytics.feedbackCount}</span>
                <strong>{summary.totalFeedback}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.analytics.satisfactionRate}</span>
                <strong>{percentValue(summary.satisfactionRate)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.analytics.currentWindow}</span>
                <strong>{copy.common.lastDaysPrefix} {selectedRange} {copy.common.lastDaysSuffix}</strong>
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
          title={copy.feedback.title}
          description={copy.feedback.copy}
          action={
            <span className={styles.feedbackCount}>
              {feedbackRows.length} {pluralize(feedbackRows.length, copy.common.resultSingular, copy.common.resultPlural)}
            </span>
          }
        >
          <div className={styles.feedbackControls}>
            <label className={styles.searchField}>
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.common.searchPlaceholder}
                aria-label={copy.common.searchFeedback}
              />
            </label>

            <div className={styles.inlineControls}>
              <select
                className={styles.select}
                value={feedbackFilter}
                onChange={(event) => setFeedbackFilter(event.target.value as FeedbackFilter)}
                aria-label={copy.common.filterFeedback}
              >
                {FEEDBACK_FILTER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {copy.options.feedbackFilters[option]}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                value={feedbackSort}
                onChange={(event) => setFeedbackSort(event.target.value as FeedbackSort)}
                aria-label={copy.common.sortFeedback}
              >
                {FEEDBACK_SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {copy.options.feedbackSorts[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {feedbackRows.length ? (
            <div className={styles.feedbackTable}>
              <div className={styles.feedbackHead}>
                <span>{copy.feedback.tableDate}</span>
                <span>{copy.feedback.tableScore}</span>
                <span>{copy.feedback.tableWeakestArea}</span>
                <span>{copy.feedback.tableComment}</span>
                <span>{copy.feedback.tableStatus}</span>
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
                      <strong>{formatDateValue(feedback.created_at)}</strong>
                      <small>{formatRelativeValue(feedback.created_at)}</small>
                    </span>
                    <span className={styles.feedbackCell}>
                      <strong>{feedback.average_score}/5</strong>
                      <small>
                        {Object.keys(feedback.ratings || {}).length}{' '}
                        {pluralize(
                          Object.keys(feedback.ratings || {}).length,
                          copy.common.ratedAreaSingular,
                          copy.common.ratedAreaPlural
                        )}
                      </small>
                    </span>
                    <span className={styles.feedbackCell}>
                      <strong>{feedback.lowestCategoryLabel}</strong>
                      <small>{feedback.lowestCategoryScore}/5</small>
                    </span>
                    <span className={styles.feedbackCell}>
                      <strong>{feedback.hasComment ? excerpt(feedback.commentText, 84) : copy.common.noWrittenComment}</strong>
                    </span>
                    <span className={styles.feedbackCell}>
                      <TonePill tone={feedback.tone} lang={lang} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title={copy.feedback.emptyTitle}
              copy={copy.feedback.emptyCopy}
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
            title={copy.operations.currentLocationTitle}
            description={copy.operations.currentLocationCopy}
          >
            <div className={styles.summaryList}>
              <div className={styles.summaryCell}>
                <span>{copy.operations.location}</span>
                <strong>{businessState.name}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.operations.city}</span>
                <strong>{businessState.city}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.operations.sector}</span>
                <strong>{sectorLabel(businessState.sector, lang)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.operations.latestFeedback}</span>
                <strong>{allFeedbackRows[0] ? formatRelativeValue(allFeedbackRows[0].created_at) : copy.operations.noFeedbackYet}</strong>
              </div>
            </div>
          </Panel>

          <Panel
            title={copy.operations.branchesTitle}
            description={copy.operations.branchesCopy}
          >
            <EmptyState
              icon={Building2}
              title={copy.operations.branchesEmptyTitle}
              copy={copy.operations.branchesEmptyCopy}
            />
          </Panel>
        </div>

        <div className={styles.twoColumnGrid}>
          <Panel
            title={copy.operations.serviceInsightsTitle}
            description={copy.operations.serviceInsightsCopy}
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
                        <p>
                          {item.responses} {pluralize(item.responses, copy.common.responseSingular, copy.common.responsePlural)} - {percentValue(item.lowScoreRate)} {copy.common.lowScoreShare}
                        </p>
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
                title={copy.operations.serviceInsightsEmptyTitle}
                copy={copy.operations.serviceInsightsEmptyCopy}
              />
            )}
          </Panel>

          <Panel
            title={copy.operations.checklistTitle}
            description={copy.operations.checklistCopy}
          >
            <div className={styles.checklist}>
              <div className={styles.checklistRow}>
                <div className={cn(styles.checkIcon, summary.attentionCount === 0 ? styles.checkIconReady : styles.checkIconMuted)}>
                  <CheckCircle2 size={18} />
                </div>
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <strong>{copy.operations.checklistLowScoreTitle}</strong>
                  <p className={styles.drawerMeta}>
                    {summary.attentionCount
                      ? `${summary.attentionCount} ${pluralize(summary.attentionCount, copy.common.itemSingular, copy.common.itemPlural)} ${copy.common.needsAttention}.`
                      : copy.operations.checklistLowScoreNone}
                  </p>
                </div>
              </div>

              <div className={styles.checklistRow}>
                <div className={cn(styles.checkIcon, publishedQuestions.length ? styles.checkIconReady : styles.checkIconMuted)}>
                  <ListChecks size={18} />
                </div>
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <strong>{copy.operations.checklistFormTitle}</strong>
                  <p className={styles.drawerMeta}>
                    {publishedQuestions.length
                      ? `${publishedQuestions.length} ${pluralize(publishedQuestions.length, copy.common.questionSingular, copy.common.questionPlural)}`
                      : copy.operations.checklistFormNone}
                  </p>
                </div>
              </div>

              <div className={styles.checklistRow}>
                <div className={cn(styles.checkIcon, summary.commentCoverage >= 0.3 ? styles.checkIconReady : styles.checkIconMuted)}>
                  <MessageSquare size={18} />
                </div>
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <strong>{copy.operations.checklistCommentTitle}</strong>
                  <p className={styles.drawerMeta}>
                    {summary.commentCoverage >= 0.3
                      ? `${percentValue(summary.commentCoverage)} ${copy.operations.checklistCommentGoodTail}`
                      : `${percentValue(summary.commentCoverage)} ${copy.operations.checklistCommentLowTail}`}
                  </p>
                </div>
              </div>

              <div className={styles.checklistRow}>
                <div className={cn(styles.checkIcon, styles.checkIconMuted)}>
                  <Building2 size={18} />
                </div>
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <strong>{copy.operations.checklistDimensionsTitle}</strong>
                  <p className={styles.drawerMeta}>{copy.operations.checklistDimensionsCopy}</p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  function renderCollectionSection() {
    const collectionSignals = [
      {
        id: 'live-form',
        title: copy.collection.statusLiveForm,
        status: collectionReady ? copy.common.ready : copy.common.notConfigured,
        tone: collectionReady ? ('positive' as const) : ('negative' as const),
        copy: collectionReady ? copy.collection.statusLiveFormReady : copy.collection.statusLiveFormMissing,
        meta: `${publishedQuestions.length} ${pluralize(publishedQuestions.length, copy.common.questionSingular, copy.common.questionPlural)}`,
      },
      {
        id: 'public-access',
        title: copy.collection.statusPublicAccess,
        status: collectionReady ? copy.common.ready : copy.common.needsAttention,
        tone: collectionReady ? ('positive' as const) : ('neutral' as const),
        copy: collectionReady ? copy.collection.statusPublicReady : copy.collection.statusPublicMissing,
        meta: liveUrl,
      },
      {
        id: 'qr',
        title: copy.collection.statusQrAsset,
        status: business.qr_generated ? copy.common.ready : copy.common.needsAttention,
        tone: business.qr_generated ? ('positive' as const) : ('neutral' as const),
        copy: business.qr_generated ? copy.collection.statusQrReady : copy.collection.statusQrMissing,
        meta: business.qr_generated ? `${business.slug}-feedback-qr.png` : copy.common.notConfigured,
      },
      {
        id: 'channels',
        title: copy.collection.statusChannels,
        status: businessState.google_review_url && logoPreview ? copy.common.ready : copy.common.needsAttention,
        tone: businessState.google_review_url && logoPreview ? ('positive' as const) : ('neutral' as const),
        copy:
          businessState.google_review_url && logoPreview
            ? copy.collection.statusChannelsReady
            : copy.collection.statusChannelsMissing,
        meta: businessState.google_review_url || copy.common.noData,
      },
    ]

    const studioMetrics = [
      {
        id: 'live',
        label: copy.collection.questionStudioMetricLive,
        value: String(publishedQuestions.length),
        note: `${publishedQuestions.length} ${pluralize(
          publishedQuestions.length,
          copy.common.questionSingular,
          copy.common.questionPlural
        )}`,
      },
      {
        id: 'draft',
        label: copy.collection.questionStudioMetricDraft,
        value: questionChangesPending ? copy.common.needsAttention : copy.common.ready,
        note: questionChangesPending ? copy.collection.questionStudioDraftPending : copy.collection.questionStudioDraftClean,
      },
      {
        id: 'coverage',
        label: copy.collection.questionStudioMetricCoverage,
        value: draftQuestions.length ? `${coverageCount}/${draftQuestions.length}` : copy.common.noData,
        note: coverageReady ? copy.collection.questionStudioCoverageReady : copy.collection.questionStudioCoveragePartial,
      },
      {
        id: 'status',
        label: copy.collection.questionStudioMetricStatus,
        value: collectionReady ? copy.common.ready : copy.common.notConfigured,
        note: collectionReady ? copy.collection.questionStudioStatusReady : copy.collection.questionStudioStatusBlocked,
      },
    ]

    return (
      <div className={styles.sectionStack}>
        <Panel title={copy.collection.overviewTitle} description={copy.collection.overviewCopy}>
          <div className={styles.collectionOverviewGrid}>
            {collectionSignals.map((signal) => (
              <article key={signal.id} className={styles.collectionSignalCard}>
                <div className={styles.collectionSignalHeader}>
                  <div>
                    <span className={styles.questionIndex}>{signal.title}</span>
                    <strong className={styles.collectionSignalTitle}>{signal.status}</strong>
                  </div>
                  <TonePill tone={signal.tone} label={signal.status} lang={lang} />
                </div>
                <p>{signal.copy}</p>
                <span className={styles.collectionSignalMeta}>{signal.meta}</span>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title={copy.collection.distributionTitle} description={copy.collection.distributionCopy}>
          <div className={styles.collectionChannelGrid}>
            <article className={styles.collectionChannelCard}>
              <div className={styles.channelCardHead}>
                <div>
                  <span className={styles.questionIndex}>{copy.collection.liveUrlTitle}</span>
                  <strong className={styles.collectionSignalTitle}>{liveUrl}</strong>
                </div>
                <Link href={livePath} className={styles.secondaryButton} target="_blank" rel="noreferrer">
                  {copy.common.open}
                  <ExternalLink size={16} />
                </Link>
              </div>
              <p>{copy.collection.liveUrlCopy}</p>
              <span className={styles.channelHint}>{copy.collection.liveUrlHint}</span>
              <div className={styles.actionRow}>
                <button type="button" className={styles.primaryButton} onClick={copyLiveFormLink}>
                  {copyState === 'copied' ? copy.common.copiedLink : copyState === 'error' ? copy.common.copyFailed : copy.common.copyFormLink}
                  <Copy size={16} />
                </button>
              </div>
            </article>

            <article className={styles.collectionChannelCard}>
              <div className={styles.channelCardHead}>
                <div>
                  <span className={styles.questionIndex}>{copy.collection.reviewLinkTitle}</span>
                  <strong className={styles.collectionSignalTitle}>
                    {businessState.google_review_url || copy.common.notConfigured}
                  </strong>
                </div>
                {businessState.google_review_url ? (
                  <Link href={businessState.google_review_url} className={styles.secondaryButton} target="_blank" rel="noreferrer">
                    {copy.collection.openDestination}
                    <ExternalLink size={16} />
                  </Link>
                ) : null}
              </div>
              <p>{businessState.google_review_url ? copy.collection.reviewLinkCopy : copy.collection.reviewLinkMissing}</p>
              <span className={styles.channelHint}>{copy.collection.reviewLinkHint}</span>
            </article>

            <article className={styles.collectionChannelCard}>
              <div className={styles.channelCardHead}>
                <div>
                  <span className={styles.questionIndex}>{copy.collection.qrTitle}</span>
                  <strong className={styles.collectionSignalTitle}>{copy.common.qrAvailability}</strong>
                </div>
                <TonePill tone={business.qr_generated ? 'positive' : 'neutral'} label={business.qr_generated ? copy.common.ready : copy.common.needsAttention} lang={lang} />
              </div>
              <p>{copy.collection.qrCopy}</p>
              <div className={styles.qrCardPreview} style={{ backgroundImage: `url("${qrUrl}")` }} />
              <span className={styles.channelHint}>{copy.collection.qrHint}</span>
              <div className={styles.actionRow}>
                <button type="button" className={styles.secondaryButton} onClick={refreshQrAsset}>
                  {isRefreshingQr ? <LoaderCircle size={16} className={styles.spin} /> : <QrCode size={16} />}
                  {copy.common.refreshPreview}
                </button>
                <button type="button" className={styles.primaryButton} onClick={downloadQrAsset}>
                  {copy.common.downloadPng}
                  <Download size={16} />
                </button>
              </div>
            </article>
          </div>
        </Panel>

        <Panel
          title={copy.collection.questionStudioTitle}
          description={copy.collection.questionStudioCopy}
          action={
            <button
              type="button"
              className={styles.primaryButton}
              onClick={publishQuestions}
              disabled={!form || isPublishingQuestions || !questionChangesPending}
            >
              {isPublishingQuestions ? <LoaderCircle size={16} className={styles.spin} /> : <Save size={16} />}
              {copy.common.publishChanges}
            </button>
          }
        >
          {questionNotice ? (
            <div className={cn(styles.notice, questionNotice.tone === 'success' ? styles.noticeSuccess : styles.noticeError)}>
              {questionNotice.text}
            </div>
          ) : null}

          <div className={styles.questionStudio}>
            <div className={styles.questionStudioMetrics}>
              {studioMetrics.map((metric) => (
                <div key={metric.id} className={styles.questionStudioMetric}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.note}</p>
                </div>
              ))}
            </div>

            <div className={styles.questionStudioGrid}>
              <div className={styles.questionStack}>
                <div className={styles.collectionSignalCard}>
                  <span className={styles.questionIndex}>{copy.collection.questionStudioListTitle}</span>
                  <strong className={styles.collectionSignalTitle}>{copy.collection.questionStudioListCopy}</strong>
                </div>

                {draftQuestions.length ? (
                  <div className={styles.questionList}>
                    {draftQuestions.map((question, index) => (
                      <article key={`${question.id}-${index}`} className={styles.questionCard}>
                        <div className={styles.questionCardHead}>
                          <div>
                            <span className={styles.questionIndex}>{questionPositionLabel(index, copy.common)}</span>
                            <strong>{questionLabel(question, lang)}</strong>
                          </div>

                          <div className={styles.iconButtonRow}>
                            <button
                              type="button"
                              className={styles.iconButton}
                              onClick={() => moveQuestion(index, 'up')}
                              disabled={index === 0}
                              aria-label={questionMoveLabel(index, copy.common, lang, 'up')}
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              className={styles.iconButton}
                              onClick={() => moveQuestion(index, 'down')}
                              disabled={index === draftQuestions.length - 1}
                              aria-label={questionMoveLabel(index, copy.common, lang, 'down')}
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              type="button"
                              className={styles.iconButton}
                              onClick={() => removeQuestion(index)}
                              aria-label={questionPositionLabel(index, copy.common)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className={styles.questionFieldGrid}>
                          <label className={styles.field}>
                            <span>{copy.common.frenchLabel}</span>
                            <input
                              className={styles.input}
                              value={question.label_fr}
                              onChange={(event) => updateQuestionField(index, 'label_fr', event.target.value)}
                            />
                          </label>

                          <label className={styles.field}>
                            <span>{copy.common.arabicLabel}</span>
                            <input
                              className={styles.input}
                              value={question.label_ar}
                              onChange={(event) => updateQuestionField(index, 'label_ar', event.target.value)}
                            />
                          </label>

                          <label className={styles.field}>
                            <span>{copy.common.englishLabel}</span>
                            <input
                              className={styles.input}
                              value={question.label_en || ''}
                              onChange={(event) => updateQuestionField(index, 'label_en', event.target.value)}
                            />
                          </label>

                          <label className={styles.field}>
                            <span>{copy.common.spanishLabel}</span>
                            <input
                              className={styles.input}
                              value={question.label_es || ''}
                              onChange={(event) => updateQuestionField(index, 'label_es', event.target.value)}
                            />
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={ListChecks}
                    title={copy.collection.questionEmptyTitle}
                    copy={copy.collection.questionEmptyCopy}
                  />
                )}
              </div>

              <aside className={styles.questionStudioSidebar}>
                <div className={styles.questionComposerPanel}>
                  <div className={styles.questionCardHead}>
                    <div>
                      <span className={styles.questionIndex}>{copy.common.newQuestion}</span>
                      <strong>{copy.collection.questionStudioComposerTitle}</strong>
                    </div>

                    <button type="button" className={styles.secondaryButton} onClick={addQuestion}>
                      {copy.common.addQuestion}
                      <Plus size={16} />
                    </button>
                  </div>

                  <p className={styles.channelHint}>{copy.collection.questionStudioComposerCopy}</p>

                  <div className={styles.questionFieldGrid}>
                    <label className={styles.field}>
                      <span>{copy.common.frenchLabel}</span>
                      <input
                        className={styles.input}
                        value={newQuestion.label_fr}
                        onChange={(event) => setNewQuestion((current) => ({ ...current, label_fr: event.target.value }))}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{copy.common.arabicLabel}</span>
                      <input
                        className={styles.input}
                        value={newQuestion.label_ar}
                        onChange={(event) => setNewQuestion((current) => ({ ...current, label_ar: event.target.value }))}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{copy.common.englishLabel}</span>
                      <input
                        className={styles.input}
                        value={newQuestion.label_en}
                        onChange={(event) => setNewQuestion((current) => ({ ...current, label_en: event.target.value }))}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{copy.common.spanishLabel}</span>
                      <input
                        className={styles.input}
                        value={newQuestion.label_es}
                        onChange={(event) => setNewQuestion((current) => ({ ...current, label_es: event.target.value }))}
                      />
                    </label>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </Panel>

        <Panel title={copy.collection.brandingTitle} description={copy.collection.brandingCopy}>
          {settingsNotice ? (
            <div className={cn(styles.notice, settingsNotice.tone === 'success' ? styles.noticeSuccess : styles.noticeError)}>
              {settingsNotice.text}
            </div>
          ) : null}

          <div className={styles.brandGrid}>
            <div className={styles.brandIdentityPanel}>
              <div className={styles.questionCardHead}>
                <div>
                  <span className={styles.questionIndex}>{copy.collection.brandIdentityTitle}</span>
                  <strong>{businessState.name}</strong>
                </div>
                <TonePill tone={logoPreview ? 'positive' : 'neutral'} label={logoPreview ? copy.common.logoUploaded : copy.common.noLogoYet} lang={lang} />
              </div>

              <div className={styles.workspaceCard}>
                <div
                  className={styles.brandPreview}
                  style={logoPreview ? { backgroundImage: `url("${logoPreview}")` } : undefined}
                >
                  {!logoPreview ? businessState.name.slice(0, 2).toUpperCase() : null}
                </div>

                <div className={styles.workspaceCopy}>
                  <strong>{businessState.name}</strong>
                  <span>{sectorLabel(businessState.sector, lang)} - {businessState.city}</span>
                </div>

                <div className={styles.actionRow}>
                  <label className={styles.secondaryButton}>
                    {isUploadingLogo ? <LoaderCircle size={16} className={styles.spin} /> : <ImageUp size={16} />}
                    {logoPreview ? copy.common.replaceLogo : copy.common.uploadLogo}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <span className={styles.channelHint}>{copy.collection.logoHint}</span>
            </div>

            <div className={styles.channelConfigPanel}>
              <div className={styles.questionCardHead}>
                <div>
                  <span className={styles.questionIndex}>{copy.collection.channelConfigTitle}</span>
                  <strong>{copy.collection.channelConfigCopy}</strong>
                </div>
                <TonePill
                  tone={businessState.google_review_url ? 'positive' : 'neutral'}
                  label={businessState.google_review_url ? copy.common.ready : copy.common.notConfigured}
                  lang={lang}
                />
              </div>

              <label className={styles.field}>
                <span>{copy.collection.destinationLabel}</span>
                <input
                  className={styles.input}
                  value={businessState.google_review_url || ''}
                  onChange={(event) =>
                    setBusinessState((current) => ({
                      ...current,
                      google_review_url: event.target.value,
                    }))
                  }
                  placeholder={copy.collection.destinationPlaceholder}
                />
              </label>

              <span className={styles.channelHint}>{copy.collection.destinationHint}</span>

              <div className={styles.actionRow}>
                <button type="button" className={styles.primaryButton} onClick={saveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? <LoaderCircle size={16} className={styles.spin} /> : <Save size={16} />}
                  {copy.common.saveChanges}
                </button>

                {businessState.google_review_url ? (
                  <Link href={businessState.google_review_url} className={styles.secondaryButton} target="_blank" rel="noreferrer">
                    {copy.collection.openDestination}
                    <ExternalLink size={16} />
                  </Link>
                ) : null}
              </div>
            </div>
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
            title={copy.settings.businessTitle}
            description={copy.settings.businessCopy}
            action={
              <button type="button" className={styles.primaryButton} onClick={saveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? <LoaderCircle size={16} className={styles.spin} /> : <Save size={16} />}
                {copy.common.save}
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
                <span>{copy.settings.businessName}</span>
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
                <span>{copy.settings.plan}</span>
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
                  <option value="trial">{planLabel('trial', lang)}</option>
                  <option value="starter">{planLabel('starter', lang)}</option>
                  <option value="pro">{planLabel('pro', lang)}</option>
                  <option value="business">{planLabel('business', lang)}</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>{copy.settings.googleReviewUrl}</span>
                <input
                  className={styles.input}
                  value={businessState.google_review_url || ''}
                  onChange={(event) =>
                    setBusinessState((current) => ({
                      ...current,
                      google_review_url: event.target.value,
                    }))
                  }
                  placeholder={copy.collection.destinationPlaceholder}
                />
              </label>

              <div className={styles.readOnlyBlock}>
                <span>{copy.settings.planStatus}</span>
                <strong>{copy.options.planStatuses[businessState.plan_status as keyof typeof copy.options.planStatuses] || businessState.plan_status.replace(/[_-]+/g, ' ')}</strong>
              </div>

              <div className={styles.readOnlyBlock}>
                <span>{copy.operations.city}</span>
                <strong>{businessState.city}</strong>
              </div>

              <div className={styles.readOnlyBlock}>
                <span>{copy.operations.sector}</span>
                <strong>{sectorLabel(businessState.sector, lang)}</strong>
              </div>
            </div>
          </Panel>

          <Panel
            title={copy.settings.brandingTitle}
            description={copy.settings.brandingCopy}
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
                  <span>{sectorLabel(businessState.sector, lang)} - {businessState.city}</span>
                </div>

                <div className={styles.workspaceMeta}>
                  <span>{planLabel(businessState.plan, lang)}</span>
                  <span>{logoPreview ? copy.common.logoUploaded : copy.common.noLogoYet}</span>
                </div>

                <div className={styles.actionRow}>
                  <label className={styles.secondaryButton}>
                    {isUploadingLogo ? <LoaderCircle size={16} className={styles.spin} /> : <ImageUp size={16} />}
                    {logoPreview ? copy.common.replaceLogo : copy.common.uploadLogo}
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
                  <strong>{copy.settings.workspaceOwner}</strong>
                  <span>{userEmail || copy.common.signedInUser}</span>
                </div>

                <div className={styles.sessionMeta}>
                  <strong>{copy.settings.planGuidance}</strong>
                  <span>{planCopy}</span>
                </div>

                <button type="button" className={styles.ghostButton} onClick={logout} disabled={isLoggingOut}>
                  {isLoggingOut ? <LoaderCircle size={16} className={styles.spin} /> : <LogOut size={16} />}
                  {copy.common.signOut}
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
        aria-label={copy.common.closeNavigation}
      />

      <aside className={cn(styles.sidebar, mobileNavOpen && styles.sidebarOpen)}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.brand}>
            <span className={styles.brandMark}>FP</span>
            <span className={styles.brandCopy}>
              <strong>FeedbackPro</strong>
              <span>{copy.common.brandTagline}</span>
            </span>
          </Link>

          <div className={styles.sidebarHeaderActions}>
            <button
              type="button"
              className={cn(styles.iconButton, styles.sidebarCollapseButton)}
              onClick={toggleSidebarCollapsed}
              aria-label={sidebarCollapsed ? copy.common.expandSidebar : copy.common.collapseSidebar}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            <button
              type="button"
              className={cn(styles.iconButton, styles.sidebarCloseButton)}
              onClick={() => setMobileNavOpen(false)}
              aria-label={copy.common.closeNavigation}
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
            <span>{businessState.city} - {sectorLabel(businessState.sector, lang)}</span>
          </div>

          <div className={styles.workspaceMeta}>
            <span>{planLabel(businessState.plan, lang)}</span>
            <span>
              {submissions.length} {copy.overview.metrics.totalFeedback}
            </span>
          </div>
        </div>

        <nav className={styles.nav}>
          {sections.map((section) => {
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
            <strong>{copy.common.dataLimitationsTitle}</strong>
            <p>{copy.common.dataLimitationsCopy}</p>
          </div>
        </div>
      </aside>

      <div className={styles.canvas}>
        <div className={styles.mobileBar}>
          <button type="button" className={styles.iconButton} onClick={() => setMobileNavOpen(true)} aria-label={copy.common.openNavigation}>
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
              {isViewPending ? copy.header.updating : copy.header.eyebrow}
            </div>
            <h1 className={styles.headerTitle}>{sectionMeta.label}</h1>
            <p className={styles.headerDescription}>{sectionMeta.description}</p>
          </div>

          <div className={styles.headerActions}>
            <SegmentedControl
              ariaLabel={copy.common.reportingRange}
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
              {copy.common.openForm}
              <ExternalLink size={16} />
            </Link>

            <button type="button" className={styles.primaryButton} onClick={copyLiveFormLink}>
              {copyState === 'copied' ? copy.common.copiedLink : copyState === 'error' ? copy.common.copyFailed : copy.common.copyFormLink}
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
        copy={copy}
        lang={lang}
        locale={locale}
      />
    </div>
  )
}

