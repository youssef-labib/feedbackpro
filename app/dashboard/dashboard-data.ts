export type DashboardBusiness = {
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

export type DashboardCategory = {
  id: string
  label_fr: string
  label_ar: string
  label_en?: string
  label_es?: string
}

export type DashboardForm = {
  id: string
  business_id: string
  categories: DashboardCategory[]
}

export type DashboardSubmission = {
  id: string
  ratings: Record<string, number>
  average_score: number
  comment: string | null
  created_at: string
}

export type DashboardSection =
  | 'overview'
  | 'analytics'
  | 'feedback'
  | 'operations'
  | 'collection'
  | 'settings'

export type DashboardRange = 7 | 30 | 90
export type TrendResolution = 'day' | 'week' | 'month'
export type FeedbackFilter = 'all' | 'attention' | 'positive' | 'commented'
export type FeedbackSort = 'newest' | 'oldest' | 'highest' | 'lowest'
export type ScoreTone = 'positive' | 'neutral' | 'negative'

export type TrendPoint = {
  id: string
  label: string
  count: number
  averageScore: number
}

export type CategoryInsight = {
  id: string
  label: string
  responses: number
  averageScore: number
  lowScoreRate: number
  tone: ScoreTone
}

export type FeedbackRow = DashboardSubmission & {
  tone: ScoreTone
  hasComment: boolean
  commentText: string
  lowestCategoryLabel: string
  lowestCategoryScore: number
}

type SummaryMetrics = {
  averageScore: number
  totalFeedback: number
  satisfactionRate: number
  attentionCount: number
  commentCoverage: number
}

const DAY_MS = 86_400_000

function clampScore(score: number) {
  return Math.min(5, Math.max(1, score))
}

function roundToOne(value: number) {
  return Math.round(value * 10) / 10
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function getRangeStart(range: DashboardRange, now = new Date()) {
  const end = startOfDay(now)
  return new Date(end.getTime() - (range - 1) * DAY_MS)
}

function normalizedComment(comment: string | null) {
  return comment?.trim() || ''
}

function categoryLabelMap(categories: DashboardCategory[]) {
  return new Map(
    categories.map((category) => [
      category.id,
      questionLabel(category),
    ])
  )
}

export function sectorLabel(sector: string) {
  const labels: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    salon: 'Salon',
    hotel: 'Hotel',
    gym: 'Gym',
    car_rental: 'Car rental',
  }

  return labels[sector] || sector.replace(/[_-]+/g, ' ').replace(/\b\w/g, (part) => part.toUpperCase())
}

export function planLabel(plan: string) {
  const labels: Record<string, string> = {
    trial: 'Trial',
    starter: 'Starter',
    pro: 'Pro',
    business: 'Business',
  }

  return labels[plan] || 'Custom'
}

export function planDescription(plan: string) {
  if (plan === 'starter') return 'Single-location setup with the essentials for collecting and reviewing feedback.'
  if (plan === 'pro') return 'Balanced workspace for teams that need better visibility on quality and service trends.'
  if (plan === 'business') return 'Best fit for brands preparing for more advanced operations and multi-site reporting.'
  return 'Trial workspace for onboarding, setup, and validating the feedback loop before activation.'
}

export function questionLabel(category: DashboardCategory) {
  return category.label_en || category.label_fr || category.label_ar || `Question ${category.id}`
}

export function scoreTone(score: number): ScoreTone {
  if (score >= 4) return 'positive'
  if (score >= 3) return 'neutral'
  return 'negative'
}

export function toneLabel(tone: ScoreTone) {
  if (tone === 'positive') return 'Positive'
  if (tone === 'neutral') return 'Neutral'
  return 'Attention'
}

export function formatDate(value: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatRelativeDate(value: string, locale = 'en-US') {
  const diff = new Date(value).getTime() - Date.now()
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const diffInDays = Math.round(diff / DAY_MS)

  if (Math.abs(diffInDays) >= 1) {
    return formatter.format(diffInDays, 'day')
  }

  const diffInHours = Math.round(diff / 3_600_000)
  if (Math.abs(diffInHours) >= 1) {
    return formatter.format(diffInHours, 'hour')
  }

  const diffInMinutes = Math.round(diff / 60_000)
  return formatter.format(diffInMinutes, 'minute')
}

export function compactNumber(value: number, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function percent(value: number, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value)
}

export function excerpt(value: string | null, maxLength = 120) {
  const clean = normalizedComment(value)
  if (!clean) return 'No written comment'
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength).trimEnd()}...`
}

export function filterSubmissionsByRange(
  submissions: DashboardSubmission[],
  range: DashboardRange,
  now = new Date()
) {
  const start = getRangeStart(range, now).getTime()
  return submissions.filter((submission) => new Date(submission.created_at).getTime() >= start)
}

export function summarizeSubmissions(submissions: DashboardSubmission[]): SummaryMetrics {
  const totalFeedback = submissions.length
  const averageScore = totalFeedback
    ? roundToOne(submissions.reduce((sum, submission) => sum + submission.average_score, 0) / totalFeedback)
    : 0
  const satisfactionRate = totalFeedback
    ? submissions.filter((submission) => submission.average_score >= 4).length / totalFeedback
    : 0
  const attentionCount = submissions.filter((submission) => submission.average_score < 3).length
  const commentCoverage = totalFeedback
    ? submissions.filter((submission) => normalizedComment(submission.comment)).length / totalFeedback
    : 0

  return {
    averageScore,
    totalFeedback,
    satisfactionRate,
    attentionCount,
    commentCoverage,
  }
}

export function compareWindowMetrics(
  submissions: DashboardSubmission[],
  range: DashboardRange,
  now = new Date()
) {
  const windowEnd = startOfDay(now).getTime() + DAY_MS
  const currentStart = getRangeStart(range, now).getTime()
  const previousStart = currentStart - range * DAY_MS

  const current = submissions.filter((submission) => {
    const createdAt = new Date(submission.created_at).getTime()
    return createdAt >= currentStart && createdAt < windowEnd
  })

  const previous = submissions.filter((submission) => {
    const createdAt = new Date(submission.created_at).getTime()
    return createdAt >= previousStart && createdAt < currentStart
  })

  return {
    current: summarizeSubmissions(current),
    previous: summarizeSubmissions(previous),
  }
}

export function buildRatingDistribution(submissions: DashboardSubmission[]) {
  const distribution = [5, 4, 3, 2, 1].map((score) => ({ score, count: 0 }))

  submissions.forEach((submission) => {
    const rounded = clampScore(Math.round(submission.average_score))
    const bucket = distribution.find((item) => item.score === rounded)
    if (bucket) {
      bucket.count += 1
    }
  })

  return distribution
}

export function buildCategoryInsights(
  submissions: DashboardSubmission[],
  categories: DashboardCategory[]
) {
  const buckets: Record<string, { total: number; count: number; low: number }> = {}

  categories.forEach((category) => {
    buckets[category.id] = { total: 0, count: 0, low: 0 }
  })

  submissions.forEach((submission) => {
    Object.entries(submission.ratings || {}).forEach(([categoryId, rawValue]) => {
      if (!buckets[categoryId]) {
        buckets[categoryId] = { total: 0, count: 0, low: 0 }
      }

      const value = Number(rawValue)
      buckets[categoryId].total += value
      buckets[categoryId].count += 1
      if (value <= 3) {
        buckets[categoryId].low += 1
      }
    })
  })

  return categories
    .map((category) => {
      const bucket = buckets[category.id] || { total: 0, count: 0, low: 0 }
      const averageScore = bucket.count ? roundToOne(bucket.total / bucket.count) : 0
      const lowScoreRate = bucket.count ? bucket.low / bucket.count : 0

      return {
        id: category.id,
        label: questionLabel(category),
        responses: bucket.count,
        averageScore,
        lowScoreRate,
        tone: scoreTone(averageScore || 5),
      } satisfies CategoryInsight
    })
    .sort((left, right) => {
      if (left.responses === 0 && right.responses === 0) return 0
      if (left.responses === 0) return 1
      if (right.responses === 0) return -1
      if (left.averageScore !== right.averageScore) return left.averageScore - right.averageScore
      return right.responses - left.responses
    })
}

export function findLowestRatedCategory(
  submission: DashboardSubmission,
  categories: DashboardCategory[]
) {
  const labels = categoryLabelMap(categories)
  let lowestLabel = 'No category'
  let lowestScore = 5

  Object.entries(submission.ratings || {}).forEach(([categoryId, rawValue]) => {
    const value = Number(rawValue)
    if (value <= lowestScore) {
      lowestScore = value
      lowestLabel = labels.get(categoryId) || `Question ${categoryId}`
    }
  })

  return {
    label: lowestLabel,
    score: lowestScore,
  }
}

export function buildFeedbackRows(
  submissions: DashboardSubmission[],
  categories: DashboardCategory[],
  options: {
    query: string
    filter: FeedbackFilter
    sort: FeedbackSort
  }
) {
  const labels = categoryLabelMap(categories)
  const query = options.query.trim().toLowerCase()

  const rows = submissions.filter((submission) => {
    const tone = scoreTone(submission.average_score)
    const commentText = normalizedComment(submission.comment)

    if (options.filter === 'attention' && tone !== 'negative') return false
    if (options.filter === 'positive' && tone !== 'positive') return false
    if (options.filter === 'commented' && !commentText) return false

    if (!query) return true

    const questionText = Object.keys(submission.ratings || {})
      .map((categoryId) => labels.get(categoryId) || `Question ${categoryId}`)
      .join(' ')
      .toLowerCase()

    return `${commentText} ${questionText}`.includes(query)
  })

  const sorted = [...rows].sort((left, right) => {
    if (options.sort === 'oldest') {
      return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    }

    if (options.sort === 'highest') {
      return right.average_score - left.average_score
    }

    if (options.sort === 'lowest') {
      return left.average_score - right.average_score
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  })

  return sorted.map((submission) => {
    const lowest = findLowestRatedCategory(submission, categories)
    const commentText = normalizedComment(submission.comment)

    return {
      ...submission,
      tone: scoreTone(submission.average_score),
      hasComment: Boolean(commentText),
      commentText,
      lowestCategoryLabel: lowest.label,
      lowestCategoryScore: lowest.score,
    } satisfies FeedbackRow
  })
}

export function buildTrendSeries(
  submissions: DashboardSubmission[],
  resolution: TrendResolution,
  range: DashboardRange,
  locale = 'en-US',
  now = new Date()
) {
  const rangeStart = getRangeStart(range, now)
  const rangeEnd = new Date(startOfDay(now).getTime() + DAY_MS)
  const points: Array<{ start: Date; end: Date; label: string }> = []

  if (resolution === 'day') {
    for (let offset = range - 1; offset >= 0; offset -= 1) {
      const start = new Date(startOfDay(now).getTime() - offset * DAY_MS)
      const end = new Date(start.getTime() + DAY_MS)
      points.push({
        start,
        end,
        label: new Intl.DateTimeFormat(locale, {
          month: 'short',
          day: 'numeric',
        }).format(start),
      })
    }
  }

  if (resolution === 'week') {
    let start = new Date(rangeStart)

    while (start < rangeEnd) {
      const end = new Date(Math.min(start.getTime() + 7 * DAY_MS, rangeEnd.getTime()))
      points.push({
        start,
        end,
        label: new Intl.DateTimeFormat(locale, {
          month: 'short',
          day: 'numeric',
        }).format(start),
      })

      start = end
    }
  }

  if (resolution === 'month') {
    let start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)

    while (start < rangeEnd) {
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      points.push({
        start,
        end,
        label: new Intl.DateTimeFormat(locale, {
          month: 'short',
        }).format(start),
      })

      start = end
    }
  }

  return points.map((point, index) => {
    const bucket = submissions.filter((submission) => {
      const createdAt = new Date(submission.created_at).getTime()
      return createdAt >= point.start.getTime() && createdAt < point.end.getTime()
    })

    return {
      id: `${resolution}-${index}-${point.label}`,
      label: point.label,
      count: bucket.length,
      averageScore: bucket.length
        ? roundToOne(bucket.reduce((sum, submission) => sum + submission.average_score, 0) / bucket.length)
        : 0,
    } satisfies TrendPoint
  })
}

export function recurringIssueSummary(categoryInsights: CategoryInsight[]) {
  return categoryInsights.filter((item) => item.responses > 0 && (item.averageScore < 4 || item.lowScoreRate >= 0.3)).slice(0, 4)
}

export function questionsDirty(
  currentQuestions: DashboardCategory[],
  publishedQuestions: DashboardCategory[]
) {
  return JSON.stringify(currentQuestions) !== JSON.stringify(publishedQuestions)
}
