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

export type DashboardLang = 'fr' | 'ar' | 'en' | 'es'
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

function categoryLabelMap(categories: DashboardCategory[], lang: DashboardLang = 'en') {
  return new Map(
    categories.map((category) => [
      category.id,
      questionLabel(category, lang),
    ])
  )
}

export function sectorLabel(sector: string, lang: DashboardLang = 'en') {
  const labels: Record<DashboardLang, Record<string, string>> = {
    fr: {
      restaurant: 'Restaurant',
      cafe: 'Café',
      salon: 'Salon',
      hotel: 'Hôtel',
      gym: 'Salle de sport',
      car_rental: 'Location de voitures',
    },
    ar: {
      restaurant: 'مطعم',
      cafe: 'مقهى',
      salon: 'صالون',
      hotel: 'فندق',
      gym: 'قاعة رياضية',
      car_rental: 'تأجير السيارات',
    },
    en: {
      restaurant: 'Restaurant',
      cafe: 'Cafe',
      salon: 'Salon',
      hotel: 'Hotel',
      gym: 'Gym',
      car_rental: 'Car rental',
    },
    es: {
      restaurant: 'Restaurante',
      cafe: 'Cafetería',
      salon: 'Salón',
      hotel: 'Hotel',
      gym: 'Gimnasio',
      car_rental: 'Alquiler de coches',
    },
  }

  return (
    labels[lang][sector] ||
    sector.replace(/[_-]+/g, ' ').replace(/\b\w/g, (part) => part.toUpperCase())
  )
}

export function planLabel(plan: string, lang: DashboardLang = 'en') {
  const labels: Record<DashboardLang, Record<string, string>> = {
    fr: {
      trial: 'Essai',
      starter: 'Starter',
      pro: 'Pro',
      business: 'Business',
    },
    ar: {
      trial: 'تجريبي',
      starter: 'ستارتر',
      pro: 'برو',
      business: 'بيزنس',
    },
    en: {
      trial: 'Trial',
      starter: 'Starter',
      pro: 'Pro',
      business: 'Business',
    },
    es: {
      trial: 'Prueba',
      starter: 'Starter',
      pro: 'Pro',
      business: 'Business',
    },
  }

  return labels[lang][plan] || (lang === 'ar' ? 'مخصص' : lang === 'fr' ? 'Personnalisé' : lang === 'es' ? 'Personalizado' : 'Custom')
}

export function planDescription(plan: string, lang: DashboardLang = 'en') {
  const descriptions: Record<DashboardLang, Record<string, string>> = {
    fr: {
      starter: 'Configuration mono-site avec l’essentiel pour collecter et consulter les retours clients.',
      pro: 'Espace équilibré pour les équipes qui veulent mieux piloter la qualité et les tendances de service.',
      business: 'Idéal pour les marques qui se préparent à des opérations plus avancées et à un pilotage multi-sites.',
      default: 'Espace d’essai pour finaliser la configuration et valider la boucle de feedback avant activation.',
    },
    ar: {
      starter: 'تهيئة لموقع واحد مع الأساسيات اللازمة لجمع الملاحظات ومراجعتها.',
      pro: 'مساحة متوازنة للفرق التي تحتاج إلى رؤية أوضح لجودة الخدمة واتجاهات الأداء.',
      business: 'الخيار الأنسب للعلامات التي تستعد لعمليات أكثر تقدماً وتقارير متعددة الفروع.',
      default: 'مساحة تجريبية لبدء الإعداد والتحقق من دورة الملاحظات قبل التفعيل.',
    },
    en: {
      starter: 'Single-location setup with the essentials for collecting and reviewing feedback.',
      pro: 'Balanced workspace for teams that need better visibility on quality and service trends.',
      business: 'Best fit for brands preparing for more advanced operations and multi-site reporting.',
      default: 'Trial workspace for onboarding, setup, and validating the feedback loop before activation.',
    },
    es: {
      starter: 'Configuración para una sola ubicación con lo esencial para recopilar y revisar feedback.',
      pro: 'Espacio equilibrado para equipos que necesitan mayor visibilidad sobre calidad y tendencias de servicio.',
      business: 'La mejor opción para marcas que se preparan para operaciones más avanzadas y reportes multiubicación.',
      default: 'Espacio de prueba para configurar el sistema y validar el ciclo de feedback antes de activarlo.',
    },
  }

  return descriptions[lang][plan] || descriptions[lang].default
}

export function questionLabel(category: DashboardCategory, lang: DashboardLang = 'en') {
  if (lang === 'fr') return category.label_fr || category.label_en || category.label_ar || category.label_es || `Question ${category.id}`
  if (lang === 'ar') return category.label_ar || category.label_fr || category.label_en || category.label_es || `السؤال ${category.id}`
  if (lang === 'es') return category.label_es || category.label_en || category.label_fr || category.label_ar || `Pregunta ${category.id}`
  return category.label_en || category.label_fr || category.label_ar || category.label_es || `Question ${category.id}`
}

export function scoreTone(score: number): ScoreTone {
  if (score >= 4) return 'positive'
  if (score >= 3) return 'neutral'
  return 'negative'
}

export function toneLabel(tone: ScoreTone, lang: DashboardLang = 'en') {
  const labels: Record<DashboardLang, Record<ScoreTone, string>> = {
    fr: {
      positive: 'Positif',
      neutral: 'Neutre',
      negative: 'À surveiller',
    },
    ar: {
      positive: 'إيجابي',
      neutral: 'محايد',
      negative: 'يحتاج متابعة',
    },
    en: {
      positive: 'Positive',
      neutral: 'Neutral',
      negative: 'Attention',
    },
    es: {
      positive: 'Positivo',
      neutral: 'Neutral',
      negative: 'Atención',
    },
  }

  return labels[lang][tone]
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
  categories: DashboardCategory[],
  lang: DashboardLang = 'en'
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
        label: questionLabel(category, lang),
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
  categories: DashboardCategory[],
  lang: DashboardLang = 'en',
  fallbackLabel = 'No category'
) {
  const labels = categoryLabelMap(categories, lang)
  let lowestLabel = fallbackLabel
  let lowestScore = 5

  Object.entries(submission.ratings || {}).forEach(([categoryId, rawValue]) => {
    const value = Number(rawValue)
    if (value <= lowestScore) {
      lowestScore = value
      lowestLabel =
        labels.get(categoryId) ||
        (lang === 'ar'
          ? `السؤال ${categoryId}`
          : lang === 'es'
            ? `Pregunta ${categoryId}`
            : `Question ${categoryId}`)
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
    lang?: DashboardLang
    noCategoryLabel?: string
    query: string
    filter: FeedbackFilter
    sort: FeedbackSort
  }
) {
  const lang = options.lang || 'en'
  const labels = categoryLabelMap(categories, lang)
  const query = options.query.trim().toLowerCase()

  const rows = submissions.filter((submission) => {
    const tone = scoreTone(submission.average_score)
    const commentText = normalizedComment(submission.comment)

    if (options.filter === 'attention' && tone !== 'negative') return false
    if (options.filter === 'positive' && tone !== 'positive') return false
    if (options.filter === 'commented' && !commentText) return false

    if (!query) return true

    const questionText = Object.keys(submission.ratings || {})
      .map((categoryId) =>
        labels.get(categoryId) ||
        (lang === 'ar'
          ? `السؤال ${categoryId}`
          : lang === 'es'
            ? `Pregunta ${categoryId}`
            : `Question ${categoryId}`)
      )
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
    const lowest = findLowestRatedCategory(
      submission,
      categories,
      lang,
      options.noCategoryLabel || (lang === 'ar' ? 'بدون فئة' : lang === 'fr' ? 'Aucune catégorie' : lang === 'es' ? 'Sin categoría' : 'No category')
    )
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
