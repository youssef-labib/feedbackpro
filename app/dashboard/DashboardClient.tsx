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
import { DASHBOARD_COPY, dashboardLocale } from './dashboard-copy'
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

type QuestionLocaleField = 'label_fr' | 'label_ar' | 'label_en' | 'label_es'

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
const QUESTION_LANGUAGE_FIELDS: Array<{
  key: QuestionLocaleField
  shortLabel: string
  dir?: 'rtl'
  required?: boolean
}> = [
  { key: 'label_fr', shortLabel: 'FR', required: true },
  { key: 'label_ar', shortLabel: 'AR', dir: 'rtl' },
  { key: 'label_en', shortLabel: 'EN' },
  { key: 'label_es', shortLabel: 'ES' },
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

function formatDelta(
  current: number,
  previous: number,
  common: (typeof DASHBOARD_COPY.en)['common'],
  suffix = ''
) {
  const diff = Math.round((current - previous) * 10) / 10

  if (!previous && !current) {
    return { label: common.previousPeriodFlat, tone: 'neutral' as const }
  }

  if (!previous && current) {
    return { label: `+${current}${suffix} ${common.previousPeriodSuffix}`, tone: 'positive' as const }
  }

  if (diff === 0) {
    return { label: common.previousPeriodFlat, tone: 'neutral' as const }
  }

  return {
    label: `${diff > 0 ? '+' : ''}${diff}${suffix} ${common.previousPeriodSuffix}`,
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

function TonePill({
  tone,
  label,
  lang,
}: {
  tone: ScoreTone
  label?: string
  lang?: DashboardLang
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

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

function sampleTrendPoints(points: TrendPoint[], maxMarks: number) {
  if (points.length <= maxMarks) {
    return points
  }

  const lastIndex = points.length - 1
  const indexes = new Set<number>([0, lastIndex])

  for (let step = 1; step < maxMarks - 1; step += 1) {
    indexes.add(Math.round((step * lastIndex) / (maxMarks - 1)))
  }

  return Array.from(indexes)
    .sort((left, right) => left - right)
    .map((index) => points[index])
}

function TrendChart({
  points,
  locale,
  copy,
  compact = false,
}: {
  points: TrendPoint[]
  locale: string
  copy: (typeof DASHBOARD_COPY.en)
  compact?: boolean
}) {
  const maxCount = Math.max(...points.map((point) => point.count), 1)
  const maxScore = 5
  const activePoints = points.filter((point) => point.count > 0)
  const latestPoint = activePoints.length ? activePoints[activePoints.length - 1] : points[points.length - 1]
  const peakPoint = [...points].sort((left, right) => right.count - left.count)[0] || points[0]
  const bestRatedPoint =
    [...activePoints].sort((left, right) => {
      if (right.averageScore !== left.averageScore) return right.averageScore - left.averageScore
      return right.count - left.count
    })[0] || latestPoint
  const averageResponses =
    activePoints.length > 0
      ? Math.round((activePoints.reduce((sum, point) => sum + point.count, 0) / activePoints.length) * 10) / 10
      : 0
  const recentPoints = points.slice(-(compact ? Math.min(points.length, 4) : Math.min(points.length, 6)))
  const axisPoints = sampleTrendPoints(points, compact ? 4 : 5)

  const linePath = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100
      const y = 100 - (point.averageScore / maxScore) * 100
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <div className={cn(styles.trendChart, compact && styles.trendChartCompact)}>
      <div className={styles.trendSummaryGrid}>
        <div className={styles.trendSummaryCard}>
          <span>Latest period</span>
          <span>{copy.common.latestPeriod}</span>
          <strong>{latestPoint ? latestPoint.label : copy.common.noData}</strong>
          <p>
            {latestPoint?.count
              ? `${formatCountLabel(latestPoint.count, copy.common.responseSingular, copy.common.responsePlural)} - ${latestPoint.averageScore}/5 ${copy.common.averageRatingWord}`
              : copy.common.noResponsesLatestPeriod}
          </p>
        </div>

        <div className={styles.trendSummaryCard}>
          <span>{copy.common.peakVolume}</span>
          <strong>{peakPoint ? peakPoint.label : copy.common.noData}</strong>
          <p>
            {peakPoint?.count
              ? `${formatCountLabel(peakPoint.count, copy.common.responseSingular, copy.common.responsePlural)} ${copy.common.busiestPeriodSuffix}`
              : copy.common.noPeakVolumeYet}
          </p>
        </div>

        <div className={styles.trendSummaryCard}>
          <span>{compact ? copy.common.averageVolume : copy.common.bestRatedPeriod}</span>
          <strong>
            {compact
              ? String(averageResponses || 0)
              : bestRatedPoint
                ? bestRatedPoint.label
                : copy.common.noData}
          </strong>
          <p>
            {compact
              ? copy.common.averageResponsesAcrossPeriods
              : bestRatedPoint?.count
                ? `${bestRatedPoint.averageScore}/5 ${copy.common.averageRatingWord} ${copy.common.fromResponses} ${formatCountLabel(bestRatedPoint.count, copy.common.responseSingular, copy.common.responsePlural)}`
                : copy.common.noScoredPeriodYet}
          </p>
        </div>
      </div>

      <div className={styles.trendFrame}>
        <div className={styles.trendLegend}>
          <div className={styles.trendLegendItems}>
            <span className={styles.trendLegendItem}>
              <span className={styles.trendLegendBar} />
              {copy.common.responsePlural}
            </span>
            <span className={styles.trendLegendItem}>
              <span className={styles.trendLegendLine} />
              {copy.overview.metrics.averageRating}
            </span>
          </div>
          <span className={styles.trendLegendMeta}>
            {points.length} {copy.common.periodsInView}
          </span>
        </div>

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

        <div className={styles.trendAxis}>
          {axisPoints.map((point) => (
            <span key={point.id}>{point.label}</span>
          ))}
        </div>
      </div>

      <div className={styles.trendPeriodRail}>
        {recentPoints.map((point) => (
          <div
            key={point.id}
            className={cn(styles.trendPeriodCard, latestPoint?.id === point.id && styles.trendPeriodCardActive)}
          >
            <span>{point.label}</span>
            <strong>{compactNumber(point.count, locale)}</strong>
            <small>{point.count ? `${point.averageScore}/5 ${copy.common.averageRatingWord}` : copy.common.noResponses}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function DistributionChart({
  distribution,
  total,
  locale,
  copy,
}: {
  distribution: Array<{ score: number; count: number }>
  total: number
  locale: string
  copy: (typeof DASHBOARD_COPY.en)
}) {
  const peak = Math.max(...distribution.map((item) => item.count), 1)

  return (
    <div className={styles.distributionList}>
      {distribution.map((item) => (
        <div key={item.score} className={styles.distributionRow}>
          <div className={styles.distributionLabel}>
            <strong>{item.score}/5</strong>
            <span>{formatCountLabel(item.count, copy.common.responseSingular, copy.common.responsePlural)}</span>
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
  locale,
  lang,
  copy,
  onClose,
}: {
  feedback: FeedbackRow | null
  categories: DashboardCategory[]
  locale: string
  lang: DashboardLang
  copy: (typeof DASHBOARD_COPY.en)
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
                      <TonePill tone={scoreTone(score || 5)} label={score ? `${score}/5` : copy.common.noScore} lang={lang} />
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

function QrPreviewLightbox({
  open,
  onClose,
  qrUrl,
  liveUrl,
  copy,
}: {
  open: boolean
  onClose: () => void
  qrUrl: string
  liveUrl: string
  copy: (typeof DASHBOARD_COPY.en)
}) {
  if (!open) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className={cn(styles.drawerBackdrop, styles.sidebarBackdropOpen, styles.qrLightboxBackdrop)}
        onClick={onClose}
        aria-label={copy.common.closeQrPreview}
      />

      <div className={styles.qrLightbox} role="dialog" aria-modal="true" aria-label={copy.common.qrPreviewTitle}>
        <div className={styles.qrLightboxPanel}>
          <div className={styles.qrLightboxHeader}>
            <div>
              <div className={styles.drawerEyebrow}>{copy.common.qrPreviewTitle}</div>
              <h2 className={styles.qrLightboxTitle}>{copy.common.qrPreviewHeading}</h2>
            </div>

            <button type="button" className={styles.iconButton} onClick={onClose} aria-label={copy.common.closeQrPreview}>
              <X size={16} />
            </button>
          </div>

          <div className={styles.qrLightboxPreview} style={{ backgroundImage: `url("${qrUrl}")` }} />
          <p className={styles.qrLightboxCopy}>{copy.common.qrPreviewCopy}</p>
          <div className={styles.qrLightboxUrl}>{liveUrl}</div>
        </div>
      </div>
    </>
  )
}

function PhotoPreviewLightbox({
  open,
  onClose,
  imageUrl,
  businessName,
  copy,
}: {
  open: boolean
  onClose: () => void
  imageUrl: string
  businessName: string
  copy: (typeof DASHBOARD_COPY.en)
}) {
  if (!open || !imageUrl) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className={cn(styles.drawerBackdrop, styles.sidebarBackdropOpen, styles.qrLightboxBackdrop)}
        onClick={onClose}
        aria-label={copy.common.closeBusinessPhotoPreview}
      />

      <div className={styles.qrLightbox} role="dialog" aria-modal="true" aria-label={copy.common.businessPhoto}>
        <div className={styles.qrLightboxPanel}>
          <div className={styles.qrLightboxHeader}>
            <div>
              <div className={styles.drawerEyebrow}>{copy.common.businessPhoto}</div>
              <h2 className={styles.qrLightboxTitle}>{businessName}</h2>
            </div>

            <button type="button" className={styles.iconButton} onClick={onClose} aria-label={copy.common.closeBusinessPhotoPreview}>
              <X size={16} />
            </button>
          </div>

          <div className={styles.photoLightboxPreview} style={{ backgroundImage: `url("${imageUrl}")` }} />
          <p className={styles.qrLightboxCopy}>{copy.common.businessPhotoCopy}</p>
        </div>
      </div>
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
  const dashboardLang = (lang || 'en') as DashboardLang
  const copy = DASHBOARD_COPY[dashboardLang] || DASHBOARD_COPY.en
  const locale = dashboardLocale(dashboardLang)
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
  const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false)
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false)
  const [businessState, setBusinessState] = useState<DashboardBusiness>({ ...business })
  const [logoPreview, setLogoPreview] = useState(business.logo_url || '')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [qrVersion, setQrVersion] = useState(0)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isPublishingQuestions, setIsPublishingQuestions] = useState(false)
  const [isRefreshingQr, setIsRefreshingQr] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isRemovingLogo, setIsRemovingLogo] = useState(false)
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
        setIsQrPreviewOpen(false)
        setIsPhotoPreviewOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  useEffect(() => {
    const shouldLock = mobileNavOpen || Boolean(selectedFeedbackId) || isQrPreviewOpen || isPhotoPreviewOpen
    const previousOverflow = document.body.style.overflow

    if (shouldLock) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isPhotoPreviewOpen, isQrPreviewOpen, mobileNavOpen, selectedFeedbackId])

  const livePath = `/r/${business.slug}`
  const liveUrl = origin ? `${origin}${livePath}` : livePath
  const qrUrl = `/api/qr?url=${encodeURIComponent(liveUrl)}&v=${qrVersion}`
  const questionLanguageFields = [
    {
      ...QUESTION_LANGUAGE_FIELDS[0],
      label: copy.common.frenchLabel,
      helper: copy.collection.frenchHelper,
    },
    {
      ...QUESTION_LANGUAGE_FIELDS[1],
      label: copy.common.arabicLabel,
      helper: copy.collection.arabicHelper,
    },
    {
      ...QUESTION_LANGUAGE_FIELDS[2],
      label: copy.common.englishLabel,
      helper: copy.collection.englishHelper,
    },
    {
      ...QUESTION_LANGUAGE_FIELDS[3],
      label: copy.common.spanishLabel,
      helper: copy.collection.spanishHelper,
    },
  ]
  const sections = SECTION_META.map((section) => ({
    ...section,
    label: copy.sections[section.id].label,
    description: copy.sections[section.id].description,
  }))

  const visibleSubmissions = filterSubmissionsByRange(submissions, selectedRange)
  const summary = summarizeSubmissions(visibleSubmissions)
  const comparison = compareWindowMetrics(submissions, selectedRange)
  const distribution = buildRatingDistribution(visibleSubmissions)
  const categoryInsights = buildCategoryInsights(visibleSubmissions, publishedQuestions, dashboardLang)
  const recurringIssues = recurringIssueSummary(categoryInsights)
  const overviewTrendResolution: TrendResolution = selectedRange === 90 ? 'week' : 'day'
  const overviewTrendPoints = buildTrendSeries(visibleSubmissions, overviewTrendResolution, selectedRange, locale)
  const trendPoints = buildTrendSeries(visibleSubmissions, trendResolution, selectedRange, locale)
  const allFeedbackRows = buildFeedbackRows(visibleSubmissions, publishedQuestions, {
    lang: dashboardLang,
    noCategoryLabel: copy.common.noCategory,
    query: '',
    filter: 'all',
    sort: 'newest',
  })
  const feedbackRows = buildFeedbackRows(visibleSubmissions, publishedQuestions, {
    lang: dashboardLang,
    noCategoryLabel: copy.common.noCategory,
    query: deferredSearch,
    filter: feedbackFilter,
    sort: feedbackSort,
  })
  const selectedFeedback = allFeedbackRows.find((item) => item.id === selectedFeedbackId) || null
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
  const activeTrendPeriods = trendPoints.filter((point) => point.count > 0)
  const quietTrendPeriods = trendPoints.length - activeTrendPeriods.length
  const peakTrendPoint = [...trendPoints].sort((left, right) => right.count - left.count)[0] || null
  const bestTrendPoint =
    [...activeTrendPeriods].sort((left, right) => {
      if (right.averageScore !== left.averageScore) return right.averageScore - left.averageScore
      return right.count - left.count
    })[0] || null
  const questionChangesPending = questionsDirty(draftQuestions, publishedQuestions)
  const planCopy = planDescription(businessState.plan, dashboardLang)

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

  async function removeLogo() {
    if (!logoPreview) {
      return
    }

    setIsRemovingLogo(true)

    try {
      const response = await fetch('/api/business/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessState.id,
          logo_url: null,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || copy.notices.logoRemoveError)
      }

      setLogoPreview('')
      setBusinessState((current) => ({
        ...current,
        logo_url: null,
      }))

      flashNotice(setSettingsNotice, {
        tone: 'success',
        text: copy.notices.logoRemoved,
      })
      router.refresh()
    } catch (error) {
      flashNotice(setSettingsNotice, {
        tone: 'error',
        text: error instanceof Error ? error.message : copy.notices.logoRemoveError,
      })
    } finally {
      setIsRemovingLogo(false)
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
          title: `${formatCountLabel(summary.attentionCount, copy.common.responseSingular, copy.common.responsePlural)} ${copy.overview.watchlistAttentionTitleSuffix}`,
          copy: copy.overview.watchlistAttentionCopy,
          tone: 'negative' as const,
        }
      : null,
    weakestCategory && weakestCategory.averageScore < 4
      ? {
          id: 'weakest-category',
          title: `${weakestCategory.label} ${copy.overview.watchlistWeakestTitleSuffix}`,
          copy: `${weakestCategory.averageScore}/5 ${copy.overview.watchlistWeakestCopySuffix} ${percent(weakestCategory.lowScoreRate, locale)} ${copy.common.lowScoreShare} ${copy.overview.watchlistWeakestCopyTail}`,
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
          copy: `${copy.overview.watchlistCommentCopyPrefix} ${percent(summary.commentCoverage, locale)} ${copy.overview.watchlistCommentCopySuffix}`,
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
            value={compactNumber(summary.totalFeedback, locale)}
            note={copy.overview.metrics.totalFeedbackNote}
            badge={{ label: feedbackDelta.label, tone: feedbackDelta.tone }}
            icon={MessageSquare}
          />
          <MetricCard
            label={copy.overview.metrics.satisfactionRate}
            value={percent(summary.satisfactionRate, locale)}
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
            title={copy.overview.reportingPulseTitle}
            description={`${copy.overview.reportingPulseCopy} (${copy.options.resolutions[overviewTrendResolution]})`}
          >
            {visibleSubmissions.length ? (
              <TrendChart points={overviewTrendPoints} compact locale={locale} copy={copy} />
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
                    <TonePill tone={item.tone} lang={dashboardLang} />
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
                        <span>{formatDate(feedback.created_at, locale)}</span>
                        <div className={styles.latestRowLabel}>{feedback.lowestCategoryLabel}</div>
                      </div>
                      <TonePill tone={feedback.tone} label={`${feedback.average_score}/5`} lang={dashboardLang} />
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
                <strong>{percent(summary.commentCoverage, locale)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.overview.feedbackMix}</span>
                <strong>
                  {positiveCount} {copy.common.positive.toLowerCase()} - {neutralCount} {copy.common.neutral.toLowerCase()} - {negativeCount} {copy.common.attention.toLowerCase()}
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
              <TrendChart points={trendPoints} locale={locale} copy={copy} />
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
                <DistributionChart distribution={distribution} total={visibleSubmissions.length} locale={locale} copy={copy} />

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
                      <TonePill tone={item.tone} label={`${item.averageScore || 0}/5`} lang={dashboardLang} />
                    </div>
                    <p>{formatCountLabel(item.responses, copy.common.responseSingular, copy.common.responsePlural)} - {percent(item.lowScoreRate, locale)} {copy.common.lowScoreShare}</p>
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
                      <p>{formatCountLabel(issue.responses, copy.common.responseSingular, copy.common.responsePlural)} - {percent(issue.lowScoreRate, locale)} {copy.common.lowScoreShare}</p>
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
            title={copy.analytics.takeawaysTitle}
            description={copy.analytics.takeawaysCopy}
          >
            <div className={styles.summaryList}>
              <div className={styles.summaryCell}>
                <span>{copy.common.activePeriods}</span>
                <strong>{activeTrendPeriods.length} / {trendPoints.length}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.common.quietPeriods}</span>
                <strong>{quietTrendPeriods}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.common.peakVolume}</span>
                <strong>
                  {peakTrendPoint?.count
                    ? `${peakTrendPoint.label} (${peakTrendPoint.count})`
                    : copy.common.noVolumeDataYet}
                </strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.common.bestRatedPeriod}</span>
                <strong>
                  {bestTrendPoint?.count
                    ? `${bestTrendPoint.label} (${bestTrendPoint.averageScore}/5)`
                    : copy.common.noScoredPeriodsYet}
                </strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.overview.commentCoverage}</span>
                <strong>{percent(summary.commentCoverage, locale)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.common.currentWindow}</span>
                <strong>{selectedRange}d</strong>
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
              {formatCountLabel(feedbackRows.length, copy.common.resultSingular, copy.common.resultPlural)}
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
                    <span className={styles.feedbackCell} data-label={copy.feedback.tableDate}>
                      <strong>{formatDate(feedback.created_at, locale)}</strong>
                      <small>{formatRelativeDate(feedback.created_at, locale)}</small>
                    </span>
                    <span className={styles.feedbackCell} data-label={copy.feedback.tableScore}>
                      <strong>{feedback.average_score}/5</strong>
                      <small>
                        {formatCountLabel(
                          Object.keys(feedback.ratings || {}).length,
                          copy.common.ratedAreaSingular,
                          copy.common.ratedAreaPlural
                        )}
                      </small>
                    </span>
                    <span className={styles.feedbackCell} data-label={copy.feedback.tableWeakestArea}>
                      <strong>{feedback.lowestCategoryLabel}</strong>
                      <small>{feedback.lowestCategoryScore}/5</small>
                    </span>
                    <span className={styles.feedbackCell} data-label={copy.feedback.tableComment}>
                      <strong>{feedback.hasComment ? excerpt(feedback.commentText, 84) : copy.common.noWrittenComment}</strong>
                    </span>
                    <span className={styles.feedbackCell} data-label={copy.feedback.tableStatus}>
                      <TonePill tone={feedback.tone} lang={dashboardLang} />
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
                <strong>{sectorLabel(businessState.sector, dashboardLang)}</strong>
              </div>
              <div className={styles.summaryCell}>
                <span>{copy.operations.latestFeedback}</span>
                <strong>{allFeedbackRows[0] ? formatRelativeDate(allFeedbackRows[0].created_at, locale) : copy.operations.noFeedbackYet}</strong>
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
                        <p>{formatCountLabel(item.responses, copy.common.responseSingular, copy.common.responsePlural)} - {percent(item.lowScoreRate, locale)} {copy.common.lowScoreShare}</p>
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
                      ? `${formatCountLabel(summary.attentionCount, copy.common.itemSingular, copy.common.itemPlural)} ${copy.operations.checklistLowScoreNeedsAttentionSuffix}`
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
                      ? `${formatCountLabel(publishedQuestions.length, copy.common.questionSingular, copy.common.questionPlural)} ${copy.operations.checklistFormConfiguredSuffix}`
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
                      ? `${copy.operations.checklistCommentCoveragePrefix} ${percent(summary.commentCoverage, locale)}, ${copy.operations.checklistCommentGoodTail}`
                      : `${copy.operations.checklistCommentLowPrefix} ${percent(summary.commentCoverage, locale)}, ${copy.operations.checklistCommentLowTail}`}
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
    const remainingQuestionSlots = Math.max(0, 10 - draftQuestions.length)

    return (
      <div className={styles.sectionStack}>
        <Panel
          title={copy.collection.distributionTitle}
          description={copy.collection.distributionCopy}
        >
          <div className={styles.collectionUtilityRail}>
            <article className={cn(styles.collectionUtilityCard, styles.collectionUtilityStatusCard)}>
              <div className={styles.collectionUtilityHeader}>
                <span className={styles.collectionUtilityEyebrow}>{copy.collection.collectionStatusEyebrow}</span>
                <span
                  className={cn(
                    styles.inlineBadge,
                    form ? styles.inlineBadgePositive : styles.inlineBadgeNeutral
                  )}
                >
                  {form ? copy.common.liveFormReady : copy.common.setupNeeded}
                </span>
              </div>
              <div className={styles.collectionUtilityBody}>
                <strong>{copy.collection.feedbackFormAccessTitle}</strong>
                <p>
                  {form
                    ? copy.collection.collectionStatusReadyCopy
                    : copy.collection.collectionStatusMissingCopy}
                </p>
              </div>
              <div className={cn(styles.collectionUtilityFooter, styles.collectionUtilityMeta)}>
                <span>{formatCountLabel(draftQuestions.length, copy.common.questionSingular, copy.common.questionPlural)} </span>
                <span>{questionChangesPending ? copy.common.changesWaitingToPublish : copy.common.draftSyncedWithLiveForm}</span>
              </div>
            </article>

            <article className={cn(styles.collectionUtilityCard, styles.collectionUtilityLinkCard)}>
              <div className={styles.collectionUtilityHeader}>
                <span className={styles.collectionUtilityEyebrow}>{copy.collection.liveFormUrlEyebrow}</span>
                <span className={cn(styles.inlineBadge, styles.inlineBadgePositive)}>{copy.common.publicAccess}</span>
              </div>
              <div className={styles.collectionUtilityBody}>
                <strong>{copy.collection.liveFormUrlTitle}</strong>
                <div className={styles.collectionUtilityUrlBlock}>
                  <span className={styles.collectionUtilityUrlLabel}>{copy.collection.publicUrlLabel}</span>
                  <p className={styles.collectionUtilityLink}>{liveUrl}</p>
                </div>
              </div>
              <div className={cn(styles.collectionUtilityFooter, styles.compactActionRow)}>
                <button
                  type="button"
                  className={cn(styles.primaryButton, styles.compactButton)}
                  onClick={copyLiveFormLink}
                >
                  {copyState === 'copied' ? copy.common.copiedLink : copyState === 'error' ? copy.common.copyFailed : copy.common.copyFormLink}
                  <Copy size={16} />
                </button>
                <Link
                  href={livePath}
                  className={cn(styles.secondaryButton, styles.compactButton)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.common.openLiveForm}
                  <ExternalLink size={16} />
                </Link>
              </div>
            </article>

            <article className={cn(styles.collectionUtilityCard, styles.collectionUtilityReviewCard)}>
              <div className={styles.collectionUtilityHeader}>
                <span className={styles.collectionUtilityEyebrow}>{copy.collection.reviewChannelEyebrow}</span>
                <span
                  className={cn(
                    styles.inlineBadge,
                    businessState.google_review_url ? styles.inlineBadgePositive : styles.inlineBadgeNeutral
                  )}
                >
                  {businessState.google_review_url ? copy.common.connected : copy.common.optional}
                </span>
              </div>
              <div className={styles.collectionUtilityBody}>
                <strong>{copy.collection.reviewChannelTitle}</strong>
                <p>
                  {businessState.google_review_url
                    ? copy.collection.reviewChannelConnectedCopy
                    : copy.collection.reviewChannelMissingCopy}
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
                    {copy.common.openGoogleReviews}
                    <ExternalLink size={16} />
                  </Link>
                ) : (
                  <span className={styles.feedbackCount}>{copy.common.configureInSettings}</span>
                )}
              </div>
            </article>

            <article className={cn(styles.collectionUtilityCard, styles.collectionUtilityQrCard)}>
              <button
                type="button"
                className={styles.collectionUtilityQrPreviewButton}
                onClick={() => setIsQrPreviewOpen(true)}
                aria-label={copy.common.qrPreviewTitle}
              >
                <div className={styles.collectionUtilityQrPreview} style={{ backgroundImage: `url("${qrUrl}")` }} />
              </button>
              <div className={styles.collectionUtilityQrBody}>
                <div className={styles.collectionUtilityHeader}>
                  <span className={styles.collectionUtilityEyebrow}>{copy.collection.qrUtilityEyebrow}</span>
                  <span
                    className={cn(
                      styles.inlineBadge,
                      business.qr_generated ? styles.inlineBadgePositive : styles.inlineBadgeNeutral
                    )}
                  >
                    {business.qr_generated ? copy.common.generated : copy.common.previewAvailable}
                  </span>
                </div>
                <div className={styles.collectionUtilityBody}>
                  <strong>{copy.collection.qrUtilityTitle}</strong>
                  <p>{copy.collection.qrUtilityCopy}</p>
                  <span className={styles.collectionUtilityHint}>{copy.collection.qrUtilityHint}</span>
                </div>
                <div className={cn(styles.collectionUtilityFooter, styles.compactActionRow)}>
                  <button
                    type="button"
                  className={cn(styles.secondaryButton, styles.compactButton)}
                  onClick={refreshQrAsset}
                >
                  {isRefreshingQr ? <LoaderCircle size={16} className={styles.spin} /> : <QrCode size={16} />}
                    {copy.common.refreshPreview}
                  </button>
                  <button
                    type="button"
                    className={cn(styles.primaryButton, styles.compactButton)}
                    onClick={downloadQrAsset}
                  >
                    {copy.common.downloadPng}
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </Panel>

        <Panel
          title={copy.collection.questionBuilderTitle}
          description={copy.collection.questionBuilderCopy}
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

          <div className={styles.questionBuilder}>
            <div className={styles.questionBuilderHeader}>
              <div className={styles.questionBuilderLead}>
                <span className={styles.collectionUtilityEyebrow}>{copy.collection.builderEyebrow}</span>
                <strong>{copy.collection.builderLeadTitle}</strong>
                <p>{copy.collection.builderLeadCopy}</p>
              </div>

              <div className={styles.questionBuilderMeta}>
                <span className={styles.feedbackCount}>
                  {formatCountLabel(publishedQuestions.length, copy.common.questionSingular, copy.common.questionPlural)}
                </span>
                <span className={styles.feedbackCount}>
                  {formatCountLabel(remainingQuestionSlots, copy.common.slotSingular, copy.common.slotPlural)}
                </span>
                <span
                  className={cn(
                    styles.inlineBadge,
                    questionChangesPending ? styles.inlineBadgeNeutral : styles.inlineBadgePositive
                  )}
                >
                  {questionChangesPending ? copy.common.unpublishedChanges : copy.common.liveFormSynced}
                </span>
              </div>
            </div>

            <section className={styles.questionComposerCard}>
              <div className={styles.questionComposerHeader}>
                <div className={styles.questionComposerLead}>
                  <span className={styles.collectionUtilityEyebrow}>{copy.collection.newQuestionEyebrow}</span>
                  <strong>{copy.collection.newQuestionTitle}</strong>
                  <p>{copy.collection.newQuestionCopy}</p>
                </div>

                <div className={styles.questionComposerActions}>
                  <span className={styles.feedbackCount}>{copy.collection.upToTenQuestions}</span>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={addQuestion}
                    disabled={remainingQuestionSlots === 0 || !newQuestion.label_fr.trim()}
                  >
                    {copy.common.addQuestion}
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.localeEditorGrid}>
                {questionLanguageFields.map((locale) => (
                  <label key={locale.key} className={styles.localeEditorCard}>
                    <div className={styles.localeEditorHead}>
                      <div>
                        <span className={styles.localeTag}>{locale.shortLabel}</span>
                        <strong>{locale.label}</strong>
                      </div>
                      {locale.required ? <span className={styles.requiredTag}>{copy.common.required}</span> : null}
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
                  const localizedCount = questionLanguageFields.filter((locale) => question[locale.key]?.trim()).length

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
                            aria-label={`${copy.common.moveUp} ${copy.common.questionWord} ${index + 1}`}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            className={cn(styles.iconButton, styles.questionMoveButton)}
                            onClick={() => moveQuestion(index, 'down')}
                            disabled={index === draftQuestions.length - 1}
                            aria-label={`${copy.common.moveDown} ${copy.common.questionWord} ${index + 1}`}
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.builderQuestionBody}>
                        <div className={styles.builderQuestionHeader}>
                          <div className={styles.builderQuestionTitle}>
                            <span className={styles.questionIndex}>{copy.common.questionWord} {String(index + 1).padStart(2, '0')}</span>
                            <strong>{questionLabel(question, dashboardLang)}</strong>
                            <div className={styles.builderQuestionMeta}>
                              <span>{localizedCount}/4 {localizedCount === 1 ? copy.common.languageLabelSingular : copy.common.languageLabelPlural}</span>
                              <span>{index === 0 ? copy.common.firstQuestionInLiveForm : `${copy.common.positionPrefix} ${index + 1} ${copy.common.positionInLiveOrderSuffix}`}</span>
                            </div>
                          </div>

                          <div className={styles.builderQuestionActions}>
                            <button
                              type="button"
                              className={cn(styles.ghostButton, styles.questionDeleteButton)}
                              onClick={() => removeQuestion(index)}
                              aria-label={`${copy.common.removeQuestion} ${index + 1}`}
                            >
                              <Trash2 size={16} />
                              {copy.common.removeQuestion}
                            </button>
                          </div>
                        </div>

                        <div className={styles.localeEditorGrid}>
                          {questionLanguageFields.map((locale) => (
                            <label key={`${question.id}-${locale.key}`} className={styles.localeEditorCard}>
                              <div className={styles.localeEditorHead}>
                                <div>
                                  <span className={styles.localeTag}>{locale.shortLabel}</span>
                                  <strong>{locale.label}</strong>
                                </div>
                                {locale.required ? <span className={styles.requiredTag}>{copy.common.required}</span> : null}
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
                title={copy.collection.noQuestionsTitle}
                copy={copy.collection.noQuestionsCopy}
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
                  <option value="trial">{planLabel('trial', dashboardLang)}</option>
                  <option value="starter">{planLabel('starter', dashboardLang)}</option>
                  <option value="pro">{planLabel('pro', dashboardLang)}</option>
                  <option value="business">{planLabel('business', dashboardLang)}</option>
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
                  placeholder="https://..."
                />
              </label>

              <div className={styles.readOnlyBlock}>
                <span>{copy.settings.planStatus}</span>
                <strong>
                  {copy.options.planStatuses[businessState.plan_status as keyof typeof copy.options.planStatuses] ||
                    businessState.plan_status.replace(/[_-]+/g, ' ')}
                </strong>
              </div>

              <div className={styles.readOnlyBlock}>
                <span>{copy.operations.city}</span>
                <strong>{businessState.city}</strong>
              </div>

              <div className={styles.readOnlyBlock}>
                <span>{copy.operations.sector}</span>
                <strong>{sectorLabel(businessState.sector, dashboardLang)}</strong>
              </div>
            </div>
          </Panel>

          <Panel
            title={copy.settings.brandingTitle}
            description={copy.settings.brandingCopy}
          >
            <div className={styles.brandingCard}>
              <div className={styles.workspaceCard}>
                {logoPreview ? (
                  <button
                    type="button"
                    className={styles.brandPreviewButton}
                    onClick={() => setIsPhotoPreviewOpen(true)}
                    aria-label={copy.common.openBusinessPhotoPreview}
                  >
                    <div
                      className={styles.brandPreview}
                      style={{ backgroundImage: `url("${logoPreview}")` }}
                    />
                  </button>
                ) : (
                  <div className={styles.brandPreview}>
                    {businessState.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className={styles.workspaceCopy}>
                  <strong>{businessState.name}</strong>
                  <span>{sectorLabel(businessState.sector, dashboardLang)} - {businessState.city}</span>
                </div>

                <div className={styles.workspaceMeta}>
                  <span>{planLabel(businessState.plan, dashboardLang)}</span>
                  <span>{logoPreview ? copy.common.photoUploaded : copy.common.noPhotoYet}</span>
                </div>

                {logoPreview ? <span className={styles.brandPreviewHint}>{copy.common.clickPhotoToEnlarge}</span> : null}

                <div className={styles.actionRow}>
                  <label className={styles.secondaryButton}>
                    {isUploadingLogo ? <LoaderCircle size={16} className={styles.spin} /> : <ImageUp size={16} />}
                    {logoPreview ? copy.common.replacePhoto : copy.common.uploadPhoto}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={removeLogo}
                    disabled={!logoPreview || isRemovingLogo}
                  >
                    {isRemovingLogo ? <LoaderCircle size={16} className={styles.spin} /> : <Trash2 size={16} />}
                    {copy.common.removePhoto}
                  </button>
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

            {mobileNavOpen ? (
              <button
                type="button"
                className={cn(styles.iconButton, styles.sidebarCloseButton)}
                onClick={() => setMobileNavOpen(false)}
                aria-label={copy.common.closeNavigation}
              >
                <X size={16} />
              </button>
            ) : null}
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
          <div className={styles.headerInner}>
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
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.mainInner}>{renderSectionContent()}</div>
        </main>
      </div>

      <QrPreviewLightbox
        open={isQrPreviewOpen}
        onClose={() => setIsQrPreviewOpen(false)}
        qrUrl={qrUrl}
        liveUrl={liveUrl}
        copy={copy}
      />

      <PhotoPreviewLightbox
        open={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        imageUrl={logoPreview}
        businessName={businessState.name}
        copy={copy}
      />

      <FeedbackDrawer
        feedback={selectedFeedback}
        categories={publishedQuestions}
        locale={locale}
        lang={dashboardLang}
        copy={copy}
        onClose={() => setSelectedFeedbackId(null)}
      />
    </div>
  )
}

