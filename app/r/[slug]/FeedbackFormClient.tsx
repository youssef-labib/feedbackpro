'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ExternalLink, LoaderCircle, MessageSquareText } from 'lucide-react'
import FlagLangSelector from '../../../components/FlagLangSelector'
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
    intro: 'Anonyme, rapide, directement depuis votre telephone.',
    rateHint: 'Choisissez une note pour continuer.',
    comment: 'Commentaire optionnel',
    commentPlaceholder: 'Ajoutez un detail si vous le souhaitez...',
    next: 'Suivant',
    prev: 'Precedent',
    submit: 'Envoyer mon avis',
    sending: 'Envoi...',
    rateAll: 'Notez toutes les questions pour continuer.',
    page: 'Page',
    of: 'sur',
    thankGood: 'Merci pour votre retour.',
    thankBad: 'Merci pour votre franchise.',
    goodText: 'Votre avis a bien ete enregistre. Si vous avez passe un bon moment, vous pouvez aussi laisser un avis Google.',
    badText: 'Votre retour a bien ete transmis a l equipe. Il restera prive et utile pour ameliorer le service.',
    google: 'Laisser un avis Google',
    close: 'Terminer',
    scale: ['', 'Tres mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent'],
  },
  ar: {
    intro: 'سريع ومجهول ومن الهاتف مباشرة.',
    rateHint: 'اختر نقطة للمتابعة.',
    comment: 'تعليق اختياري',
    commentPlaceholder: 'اضف ملاحظة اذا كنت تريد...',
    next: 'التالي',
    prev: 'السابق',
    submit: 'ارسال الراي',
    sending: 'جاري الارسال...',
    rateAll: 'قم بتقييم كل الاسئلة للمتابعة.',
    page: 'الصفحة',
    of: 'من',
    thankGood: 'شكرا على رايك.',
    thankBad: 'شكرا على صراحتك.',
    goodText: 'تم تسجيل رايك بنجاح. اذا كانت تجربتك جيدة يمكنك اضافة تقييم في Google.',
    badText: 'وصل رايك الى الفريق وسيبقى خاصا ليستفاد منه في تحسين الخدمة.',
    google: 'اترك تقييما في Google',
    close: 'انهاء',
    scale: ['', 'سيء جدا', 'سيء', 'متوسط', 'جيد', 'ممتاز'],
  },
  en: {
    intro: 'Anonymous, fast, and designed for mobile.',
    rateHint: 'Pick a score to continue.',
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
    scale: ['', 'Very bad', 'Bad', 'Average', 'Good', 'Excellent'],
  },
} as const

const SCORE_STYLE = [
  { color: '#64748b', bg: 'rgba(148, 163, 184, 0.08)' },
  { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { color: '#84cc16', bg: 'rgba(132, 204, 22, 0.14)' },
  { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)' },
]

export default function FeedbackFormClient({
  business,
  form,
}: {
  business: Business
  form: FeedbackForm
}) {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [screen, setScreen] = useState<Screen>('form')
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(form.categories.length / PAGE_SIZE)
  const currentCategories = form.categories.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const isLastPage = page === totalPages - 1
  const pageComplete = currentCategories.every((category) => ratings[category.id] > 0)
  const formComplete = form.categories.every((category) => ratings[category.id] > 0)

  const initials = useMemo(
    () =>
      business.name
        .split(' ')
        .map((chunk) => chunk[0])
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

  async function submitFeedback() {
    if (!formComplete) return

    setScreen('loading')
    const scores = Object.values(ratings)
    const nextAverage = Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10

    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: form.id,
        business_id: business.id,
        ratings,
        average_score: nextAverage,
        comment: comment.trim() || null,
      }),
    })

    setScreen(nextAverage >= 4 ? 'good' : 'bad')
  }

  return (
    <div className="page-shell" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="feedback-shell">
        <div className="container" style={{ maxWidth: 760 }}>
          <header className="feedback-header">
            <div className="topbar-actions" style={{ gap: 14 }}>
              {business.logo_url ? (
                <span className="logo-preview">
                  <img src={business.logo_url} alt={business.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </span>
              ) : (
                <span className="logo-preview">{initials}</span>
              )}
              <div>
                <h1 className="page-title" style={{ fontSize: 'clamp(28px, 5vw, 40px)' }}>{business.name}</h1>
                <p className="page-subtitle" style={{ marginTop: 6 }}>
                  {business.city} · {copy.intro}
                </p>
              </div>
            </div>
            <FlagLangSelector lang={lang} setLang={setLang} options={['fr', 'ar', 'en', 'es']} />
          </header>

          {screen === 'form' ? (
            <section className="surface-card" style={{ padding: 24 }}>
              {totalPages > 1 ? (
                <div className="field-row" style={{ marginBottom: 18 }}>
                  <div className="pill">
                    {copy.page} {page + 1} {copy.of} {totalPages}
                  </div>
                  <div className="pill">{Object.values(ratings).filter((value) => value > 0).length}/{form.categories.length}</div>
                </div>
              ) : null}

              <div className="stack">
                {currentCategories.map((category) => {
                  const selected = ratings[category.id] || 0

                  return (
                    <article key={category.id} className="review-card">
                      <div className="field-row" style={{ marginBottom: 16 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 18 }}>{getLabel(category)}</div>
                          <div className="help-text">
                            {selected > 0 ? copy.scale[selected] : copy.rateHint}
                          </div>
                        </div>
                        {selected > 0 ? (
                          <div
                            className="score-pill"
                            style={{
                              color: SCORE_STYLE[selected].color,
                              background: SCORE_STYLE[selected].bg,
                            }}
                          >
                            {selected}/5
                          </div>
                        ) : null}
                      </div>

                      <div className="five-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
                        {[1, 2, 3, 4, 5].map((value) => {
                          const active = value === selected
                          return (
                            <button
                              key={value}
                              type="button"
                              className="mini-button"
                              onClick={() => setRatings((current) => ({ ...current, [category.id]: value }))}
                              style={{
                                minHeight: 56,
                                borderRadius: 18,
                                borderColor: active ? SCORE_STYLE[value].color : 'var(--border)',
                                background: active ? SCORE_STYLE[value].bg : 'rgba(255,255,255,0.02)',
                                color: active ? SCORE_STYLE[value].color : 'var(--muted)',
                                fontWeight: 800,
                              }}
                            >
                              {value}
                            </button>
                          )
                        })}
                      </div>
                    </article>
                  )
                })}
              </div>

              {isLastPage ? (
                <div className="field" style={{ marginTop: 18 }}>
                  <label className="label">{copy.comment}</label>
                  <textarea
                    className="textarea"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={copy.commentPlaceholder}
                  />
                </div>
              ) : null}

              <div className="inline-actions" style={{ marginTop: 20 }}>
                {page > 0 ? (
                  <button type="button" className="button button-secondary" onClick={() => setPage((value) => value - 1)}>
                    <ArrowLeft size={16} />
                    {copy.prev}
                  </button>
                ) : null}

                {!isLastPage ? (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => setPage((value) => value + 1)}
                    disabled={!pageComplete}
                    style={{ flex: 1 }}
                  >
                    {copy.next}
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={submitFeedback}
                    disabled={!formComplete}
                    style={{ flex: 1 }}
                  >
                    {copy.submit}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {!pageComplete ? <p className="help-text" style={{ marginTop: 14 }}>{copy.rateAll}</p> : null}
            </section>
          ) : null}

          {screen === 'loading' ? (
            <section className="surface-card empty-state">
              <LoaderCircle size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
              <h2 className="empty-title">{copy.sending}</h2>
            </section>
          ) : null}

          {screen === 'good' ? (
            <section className="surface-card empty-state">
              <div className="feature-icon" style={{ margin: '0 auto' }}>
                <Check size={20} />
              </div>
              <h2 className="empty-title">{copy.thankGood}</h2>
              <p className="empty-copy">{copy.goodText}</p>
              <div className="inline-actions" style={{ justifyContent: 'center', marginTop: 18 }}>
                {business.google_review_url ? (
                  <a href={business.google_review_url} target="_blank" rel="noopener noreferrer" className="button button-primary">
                    {copy.google}
                    <ExternalLink size={16} />
                  </a>
                ) : null}
                <Link href="/" className="button button-secondary">{copy.close}</Link>
              </div>
            </section>
          ) : null}

          {screen === 'bad' ? (
            <section className="surface-card empty-state">
              <div className="feature-icon" style={{ margin: '0 auto' }}>
                <MessageSquareText size={20} />
              </div>
              <h2 className="empty-title">{copy.thankBad}</h2>
              <p className="empty-copy">{copy.badText}</p>
              <div className="inline-actions" style={{ justifyContent: 'center', marginTop: 18 }}>
                <Link href="/" className="button button-secondary">{copy.close}</Link>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}
