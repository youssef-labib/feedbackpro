'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ExternalLink, LoaderCircle, MessageSquareText } from 'lucide-react'
import AppNavbar, { getPublicNavItems } from '../../../components/AppNavbar'
import { useStoredLanguage } from '../../../components/useStoredLanguage'

type Screen = 'form' | 'loading' | 'good' | 'bad'
type Business = {
  id: string
  name: string
  slug: string
  city: string
  logo_url?: string | null
  google_review_url: string | null
}
type Category = {
  id: string
  label_fr: string
  label_ar: string
  label_en?: string
  label_es?: string
}
type FeedbackForm = {
  id: string
  business_id: string
  categories: Category[]
}

const PAGE_SIZE = 5

const COPY = {
  fr: {
    intro: 'Anonyme, rapide, directement depuis votre téléphone.',
    comment: 'Commentaire optionnel',
    commentPlaceholder: 'Ajoutez un détail si vous le souhaitez...',
    next: 'Suivant',
    prev: 'Précédent',
    submit: 'Envoyer mon avis',
    sending: 'Envoi en cours...',
    rateAll: 'Notez toutes les questions pour continuer.',
    page: 'Page',
    of: 'sur',
    thankGood: 'Merci pour votre retour.',
    thankBad: 'Merci pour votre franchise.',
    goodText: 'Votre avis a bien été enregistré. Si vous avez passé un bon moment, vous pouvez aussi laisser un avis Google.',
    badText: 'Votre retour a bien été transmis à l\'équipe. Il restera privé et utile pour améliorer le service.',
    google: 'Laisser un avis Google',
    close: 'Terminer',
    tap: 'Appuyez sur une étoile pour noter',
    labels: ['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent'],
  },
  ar: {
    intro: 'سريع ومجهول ومن الهاتف مباشرة.',
    comment: 'تعليق اختياري',
    commentPlaceholder: 'أضف ملاحظة إذا كنت تريد...',
    next: 'التالي',
    prev: 'السابق',
    submit: 'إرسال الرأي',
    sending: 'جاري الإرسال...',
    rateAll: 'قم بتقييم كل الأسئلة للمتابعة.',
    page: 'الصفحة',
    of: 'من',
    thankGood: 'شكراً على رأيك.',
    thankBad: 'شكراً على صراحتك.',
    goodText: 'تم تسجيل رأيك بنجاح. إذا كانت تجربتك جيدة يمكنك إضافة تقييم في Google.',
    badText: 'وصل رأيك إلى الفريق وسيبقى خاصاً ليستفاد منه في تحسين الخدمة.',
    google: 'اترك تقييماً في Google',
    close: 'إنهاء',
    tap: 'اضغط على نجمة للتقييم',
    labels: ['', 'سيء جداً', 'سيء', 'متوسط', 'جيد', 'ممتاز'],
  },
  en: {
    intro: 'Anonymous, fast, and designed for mobile.',
    comment: 'Optional comment',
    commentPlaceholder: 'Add more detail if you want...',
    next: 'Next',
    prev: 'Previous',
    submit: 'Submit feedback',
    sending: 'Sending...',
    rateAll: 'Please rate every question to continue.',
    page: 'Page',
    of: 'of',
    thankGood: 'Thank you for your feedback.',
    thankBad: 'Thank you for being honest.',
    goodText: 'Your feedback was saved. If you had a good visit, you can also leave a Google review.',
    badText: 'Your feedback was sent privately to the team so they can improve the experience.',
    google: 'Leave a Google review',
    close: 'Finish',
    tap: 'Tap a star to rate',
    labels: ['', 'Very bad', 'Bad', 'Average', 'Good', 'Excellent'],
  },
} as const

// Color per star value: 1=red, 2=orange, 3=amber, 4=lime, 5=green
const STAR_COLORS = [
  '',
  '#ef4444', // 1 — red
  '#f97316', // 2 — orange
  '#f59e0b', // 3 — amber
  '#84cc16', // 4 — lime
  '#22c55e', // 5 — green (matches --accent)
]

const STAR_BG = [
  '',
  'rgba(239,68,68,0.10)',
  'rgba(249,115,22,0.10)',
  'rgba(245,158,11,0.10)',
  'rgba(132,204,22,0.12)',
  'rgba(34,197,94,0.12)',
]

// Emoji label per score (shows below the stars)
const SCORE_EMOJI = ['', '😞', '😕', '😐', '🙂', '😄']

const NAV_ACTIONS = {
  fr: { login: 'Connexion', register: 'Créer mon espace' },
  ar: { login: 'تسجيل الدخول', register: 'إنشاء حساب' },
  en: { login: 'Login', register: 'Create workspace' },
} as const

// Inline style for the star animation CSS (we can't use globals.css new classes here)
const starCSS = `
  @keyframes starPop {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.42) rotate(-8deg); }
    65%  { transform: scale(1.22) rotate(4deg); }
    100% { transform: scale(1.1); }
  }
  @keyframes starShake {
    0%,100% { transform: scale(1); }
    20%     { transform: scale(0.88); }
    50%     { transform: scale(1.08); }
    80%     { transform: scale(0.96); }
  }
  @keyframes fadeSlideUp {
    from { opacity:0; transform: translateY(8px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity:0; transform: scale(0.88); }
    to   { opacity:1; transform: scale(1); }
  }
  .star-btn {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    line-height: 0;
    transition: filter 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .star-btn:active { filter: brightness(1.15); }
  .star-selected { animation: starPop 0.32s cubic-bezier(.36,.07,.19,.97) forwards; }
  .star-unselect { animation: starShake 0.28s ease; }
  .score-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px 4px 6px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 800;
    animation: fadeSlideUp 0.22s ease both;
  }
  .card-enter {
    animation: scaleIn 0.24s cubic-bezier(.22,1,.36,1) both;
  }
  .progress-bar {
    height: 4px;
    border-radius: 999px;
    background: var(--border);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--accent);
    transition: width 0.35s cubic-bezier(.22,1,.36,1);
  }
  .submit-pulse {
    animation: starPop 0.3s ease both;
  }
`

function StarRating({
  categoryId,
  selected,
  onChange,
  disabled,
}: {
  categoryId: string
  selected: number
  onChange: (id: string, value: number) => void
  disabled?: boolean
}) {
  const [hovered, setHovered] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const active = hovered || selected
  const color = STAR_COLORS[active] || '#d1d5db'

  function handleClick(value: number) {
    if (disabled) return
    setAnimKey((k) => k + 1)
    onChange(categoryId, value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Stars row */}
      <div
        style={{ display: 'flex', gap: 6 }}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= active
          const isSelected = value === selected
          return (
            <button
              key={value}
              className={`star-btn ${isSelected && animKey ? 'star-selected' : ''}`}
              style={{ outline: 'none' }}
              onClick={() => handleClick(value)}
              onMouseEnter={() => !disabled && setHovered(value)}
              aria-label={`Rate ${value} out of 5`}
              disabled={disabled}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block', transition: 'transform 0.12s ease' }}
              >
                {/* Drop shadow behind for "glow" when active */}
                {isFilled && (
                  <ellipse
                    cx="22"
                    cy="38"
                    rx="10"
                    ry="3"
                    fill={STAR_COLORS[active] || 'transparent'}
                    opacity="0.18"
                  />
                )}
                <path
                  d="M22 6L25.708 15.584H36L27.788 21.416L31.236 31L22 25.168L12.764 31L16.212 21.416L8 15.584H18.292L22 6Z"
                  fill={isFilled ? STAR_COLORS[active] : 'none'}
                  stroke={isFilled ? STAR_COLORS[active] : 'var(--border-strong, #bac7d6)'}
                  strokeWidth={isFilled ? '0' : '1.8'}
                  strokeLinejoin="round"
                  style={{ transition: 'fill 0.18s ease, stroke 0.18s ease' }}
                />
              </svg>
            </button>
          )
        })}
      </div>

      {/* Score label */}
      {active > 0 ? (
        <div
          key={`${categoryId}-${active}`}
          className="score-badge"
          style={{
            background: STAR_BG[active],
            color: STAR_COLORS[active],
            border: `1px solid ${STAR_COLORS[active]}33`,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{SCORE_EMOJI[active]}</span>
          <span>{active}/5</span>
        </div>
      ) : (
        <div style={{ height: 28 }} /> // placeholder to avoid layout shift
      )}
    </div>
  )
}

export default function FeedbackFormClient({
  business,
  form,
}: {
  business: Business
  form: FeedbackForm
}) {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]
  const navActions = NAV_ACTIONS[copyLang]

  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [screen, setScreen] = useState<Screen>('form')
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(form.categories.length / PAGE_SIZE)
  const currentCategories = form.categories.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const isLastPage = page === totalPages - 1
  const pageComplete = currentCategories.every((c) => ratings[c.id] > 0)
  const formComplete = form.categories.every((c) => ratings[c.id] > 0)
  const ratedCount = Object.values(ratings).filter((v) => v > 0).length

  const initials = useMemo(
    () =>
      business.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [business.name]
  )

  function getLabel(category: Category) {
    if (lang === 'ar') return category.label_ar
    if (lang === 'en') return category.label_en || category.label_fr
    if (lang === 'es') return category.label_es || category.label_en || category.label_fr
    return category.label_fr
  }

  function handleRating(id: string, value: number) {
    setRatings((prev) => ({ ...prev, [id]: value }))
  }

  async function submitFeedback() {
    if (!formComplete) return
    setScreen('loading')

    const scores = Object.values(ratings)
    const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10

    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: form.id,
        business_id: business.id,
        ratings,
        average_score: avg,
        comment: comment.trim() || null,
      }),
    })

    setScreen(avg >= 4 ? 'good' : 'bad')
  }

  return (
    <div className="page-shell" dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{starCSS}</style>

      <AppNavbar
        lang={lang}
        setLang={setLang}
        isRTL={isRTL}
        navItems={getPublicNavItems(lang)}
        actions={[
          { href: '/login', label: navActions.login, variant: 'secondary' },
          { href: '/register', label: navActions.register, variant: 'primary' },
        ]}
        mobileEyebrow="Feedback"
      />

      <main className="feedback-shell">
        <div className="container" style={{ maxWidth: 680 }}>
          {/* Business header */}
          <header className="feedback-header">
            <div className="topbar-actions" style={{ gap: 14 }}>
              {business.logo_url ? (
                <span className="logo-preview">
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </span>
              ) : (
                <span
                  className="logo-preview"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent-strong)',
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: 24,
                  }}
                >
                  {initials}
                </span>
              )}
              <div>
                <h1 className="page-title" style={{ fontSize: 'clamp(24px, 5vw, 36px)' }}>
                  {business.name}
                </h1>
                <p className="page-subtitle" style={{ marginTop: 4 }}>
                  {business.city} · {copy.intro}
                </p>
              </div>
            </div>
          </header>

          {/* ── FORM SCREEN ────────────────────────────────────── */}
          {screen === 'form' && (
            <section className="surface-card card-enter" style={{ padding: '28px 24px' }}>
              {/* Progress bar */}
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${form.categories.length > 0
                      ? (ratedCount / form.categories.length) * 100
                      : 0}%`,
                  }}
                />
              </div>

              {totalPages > 1 && (
                <div className="field-row" style={{ marginBottom: 20 }}>
                  <div className="pill">
                    {copy.page} {page + 1} {copy.of} {totalPages}
                  </div>
                  <div className="pill">
                    {ratedCount}/{form.categories.length}
                  </div>
                </div>
              )}

              {/* Category cards */}
              <div className="stack">
                {currentCategories.map((category) => {
                  const selected = ratings[category.id] || 0
                  const isRated = selected > 0

                  return (
                    <article
                      key={category.id}
                      className="review-card card-enter"
                      style={{
                        padding: '20px 20px 16px',
                        border: isRated
                          ? `1px solid ${STAR_COLORS[selected]}44`
                          : '1px solid var(--border)',
                        background: isRated ? STAR_BG[selected] : 'var(--panel)',
                        transition: 'border-color 0.22s ease, background 0.22s ease',
                      }}
                    >
                      {/* Category label + "tap to rate" hint */}
                      <div style={{ marginBottom: 14, textAlign: 'center' }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 18,
                            color: 'var(--text)',
                            lineHeight: 1.3,
                            marginBottom: 4,
                          }}
                        >
                          {getLabel(category)}
                        </div>
                        {!isRated && (
                          <div className="help-text" style={{ fontSize: 13 }}>
                            {copy.tap}
                          </div>
                        )}
                        {isRated && (
                          <div
                            style={{
                              fontSize: 13,
                              color: STAR_COLORS[selected],
                              fontWeight: 700,
                              animation: 'fadeSlideUp 0.2s ease both',
                            }}
                          >
                            {copy.labels[selected]}
                          </div>
                        )}
                      </div>

                      {/* Stars */}
                      <StarRating
                        categoryId={category.id}
                        selected={selected}
                        onChange={handleRating}
                      />
                    </article>
                  )
                })}
              </div>

              {/* Comment (last page only) */}
              {isLastPage && (
                <div className="field" style={{ marginTop: 22 }}>
                  <label className="label">{copy.comment}</label>
                  <textarea
                    className="textarea"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={copy.commentPlaceholder}
                    rows={3}
                  />
                </div>
              )}

              {/* Nav buttons */}
              <div className="inline-actions" style={{ marginTop: 22 }}>
                {page > 0 && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ArrowLeft size={16} />
                    {copy.prev}
                  </button>
                )}

                {!isLastPage ? (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pageComplete}
                    style={{ flex: 1 }}
                  >
                    {copy.next}
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`button button-primary${formComplete ? ' submit-pulse' : ''}`}
                    onClick={submitFeedback}
                    disabled={!formComplete}
                    style={{ flex: 1 }}
                  >
                    {copy.submit}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {!pageComplete && (
                <p className="help-text" style={{ marginTop: 12, textAlign: 'center' }}>
                  {copy.rateAll}
                </p>
              )}
            </section>
          )}

          {/* ── LOADING SCREEN ─────────────────────────────────── */}
          {screen === 'loading' && (
            <section className="surface-card empty-state card-enter">
              <LoaderCircle
                size={32}
                style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }}
              />
              <h2 className="empty-title">{copy.sending}</h2>
            </section>
          )}

          {/* ── GOOD SCREEN ────────────────────────────────────── */}
          {screen === 'good' && (
            <section className="surface-card empty-state card-enter" style={{ gap: 18 }}>
              {/* Big animated star burst */}
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'var(--accent-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
                    <path
                      d="M22 6L25.708 15.584H36L27.788 21.416L31.236 31L22 25.168L12.764 31L16.212 21.416L8 15.584H18.292L22 6Z"
                      fill="#22c55e"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="empty-title" style={{ marginBottom: 8 }}>
                  {copy.thankGood}
                </h2>
                <p className="empty-copy">{copy.goodText}</p>
              </div>
              <div className="inline-actions" style={{ justifyContent: 'center' }}>
                {business.google_review_url && (
                  <a
                    href={business.google_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-primary"
                  >
                    {copy.google}
                    <ExternalLink size={16} />
                  </a>
                )}
                <Link href="/" className="button button-secondary">
                  {copy.close}
                </Link>
              </div>
            </section>
          )}

          {/* ── BAD SCREEN ─────────────────────────────────────── */}
          {screen === 'bad' && (
            <section className="surface-card empty-state card-enter" style={{ gap: 18 }}>
              <div className="feature-icon" style={{ margin: '0 auto', width: 80, height: 80 }}>
                <MessageSquareText size={28} />
              </div>
              <div>
                <h2 className="empty-title" style={{ marginBottom: 8 }}>
                  {copy.thankBad}
                </h2>
                <p className="empty-copy">{copy.badText}</p>
              </div>
              <div className="inline-actions" style={{ justifyContent: 'center' }}>
                <Link href="/" className="button button-secondary">
                  {copy.close}
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
