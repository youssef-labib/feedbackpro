'use client'

import { useState } from 'react'

type Lang = 'fr' | 'ar' | 'en' | 'es'
type Screen = 'form' | 'loading' | 'good' | 'bad'

type Business = { id: string; name: string; slug: string; city: string; google_review_url: string | null; plan_status: string }
type Category = { id: string; label_fr: string; label_ar: string; label_en?: string; label_es?: string }
type FeedbackForm = { id: string; business_id: string; categories: Category[] }
type RatingMap = Record<string, number>

const LANG_LABELS: Record<Lang, string> = { fr: 'FR', ar: 'ع', en: 'EN', es: 'ES' }

const T: Record<string, Record<Lang, string | string[]>> = {
  anon:       { fr: 'Anonyme · 60 secondes', ar: 'مجهول · 60 ثانية', en: 'Anonymous · 60s', es: 'Anónimo · 60s' },
  tap:        { fr: 'Touchez pour noter', ar: 'اضغط للتقييم', en: 'Tap to rate', es: 'Toca para valorar' },
  comment_l:  { fr: 'Commentaire (optionnel)', ar: 'تعليق (اختياري)', en: 'Comment (optional)', es: 'Comentario (opcional)' },
  comment_ph: { fr: 'Votre avis nous aide à nous améliorer...', ar: 'رأيك يساعدنا على التحسين...', en: 'Your feedback helps us improve...', es: 'Tu opinión nos ayuda a mejorar...' },
  submit:     { fr: 'Envoyer mon avis', ar: 'إرسال رأيي', en: 'Submit review', es: 'Enviar opinión' },
  sending:    { fr: 'Envoi...', ar: 'جاري الإرسال...', en: 'Sending...', es: 'Enviando...' },
  privacy:    { fr: 'Anonyme · Données jamais vendues', ar: 'مجهول · بياناتك لا تُباع', en: 'Anonymous · Data never sold', es: 'Anónimo · Datos nunca vendidos' },
  ty_good:    { fr: 'Merci beaucoup !', ar: 'شكراً جزيلاً!', en: 'Thank you!', es: '¡Muchas gracias!' },
  ty_bad:     { fr: 'Merci pour votre retour', ar: 'شكراً على ملاحظاتك', en: 'Thank you for your feedback', es: 'Gracias por tu opinión' },
  ty_good_s:  { fr: 'Votre avis a bien été reçu. Vous avez passé un bon moment ?', ar: 'تم استلام رأيك. هل استمتعت بزيارتك؟', en: 'Your review was received. Did you enjoy your visit?', es: 'Tu opinión fue recibida. ¿Disfrutaste tu visita?' },
  ty_bad_s:   { fr: "Votre retour a été transmis à l'équipe. Nous allons nous améliorer.", ar: 'تم إرسال ملاحظاتك للفريق. سنعمل على التحسين.', en: 'Your feedback was sent to the team. We will improve.', es: 'Tu opinión fue enviada al equipo. Vamos a mejorar.' },
  google:     { fr: 'Laisser un avis Google', ar: 'ترك تقييم على Google', en: 'Leave a Google review', es: 'Dejar reseña en Google' },
  skip:       { fr: 'Non merci', ar: 'لا شكراً', en: 'No thanks', es: 'No, gracias' },
  hope:       { fr: 'Nous espérons vous revoir bientôt et vous montrer nos améliorations.', ar: 'نأمل رؤيتك مجدداً وإظهار تحسيناتنا.', en: 'We hope to welcome you again soon.', es: 'Esperamos verte de nuevo pronto.' },
  hints:      {
    fr: ['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent'],
    ar: ['', 'سيء جداً', 'سيء', 'متوسط', 'جيد', 'ممتاز'],
    en: ['', 'Very bad', 'Bad', 'Average', 'Good', 'Excellent'],
    es: ['', 'Muy malo', 'Malo', 'Regular', 'Bien', 'Excelente'],
  },
}

const SC = ['', '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#10B981']
const SB = ['', '#FEE2E2', '#FFEDD5', '#FEF3C7', '#DCFCE7', '#D1FAE5']
const SE = ['', '#FCA5A5', '#FDBA74', '#FCD34D', '#86EFAC', '#6EE7B7']

function t(key: string, lang: Lang): string {
  const v = T[key]?.[lang] ?? T[key]?.fr ?? key
  return Array.isArray(v) ? v[0] : v as string
}
function hints(lang: Lang): string[] {
  const v = T.hints[lang]; return Array.isArray(v) ? v as string[] : []
}

function StarRow({ catLabel, value, onChange, lang }: {
  catLabel: string; value: number; onChange: (v: number) => void; lang: Lang
}) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  const h = hints(lang)

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e8f0fa', fontFamily: 'Cabinet Grotesk, sans-serif', letterSpacing: -.2 }}>
          {catLabel}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: active > 0 ? SC[active] : '#3d4e62', transition: 'color .2s', minWidth: 72, textAlign: 'right' }}>
          {active > 0 ? h[active] : t('tap', lang)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        {[1,2,3,4,5].map(i => (
          <button key={i} type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            style={{
              flex: 1, height: 52, borderRadius: 13,
              border: `1.5px solid ${i <= active ? SE[active] : 'rgba(255,255,255,.08)'}`,
              background: i <= active ? SB[active] : 'rgba(255,255,255,.03)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              transition: 'all .15s cubic-bezier(.34,1.56,.64,1)',
              transform: hover === i ? 'scale(1.1) translateY(-2px)' : i <= active ? 'scale(1.03)' : 'scale(1)',
              boxShadow: i <= active ? `0 3px 10px ${SB[active]}` : 'none',
            }}>
            <svg width="19" height="19" viewBox="0 0 24 24"
              fill={i <= active ? SC[active] : 'none'}
              stroke={i <= active ? SC[active] : 'rgba(255,255,255,.2)'}
              strokeWidth="1.5" style={{ transition: 'all .15s' }}>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: i <= active ? SC[active] : 'rgba(255,255,255,.15)', transition: 'color .15s' }}>{i}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 2, background: 'rgba(255,255,255,.04)', borderRadius: 1, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 1, background: active > 0 ? SC[active] : 'transparent', width: active > 0 ? `${(active/5)*100}%` : '0%', transition: 'width .3s ease, background .2s' }}/>
      </div>
    </div>
  )
}

function GoogleBtn({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px',
      border: '1px solid rgba(255,255,255,.1)', borderRadius: 13,
      background: 'rgba(255,255,255,.03)', textDecoration: 'none',
      marginBottom: 10, transition: 'all .15s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(66,133,244,.4)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(66,133,244,.05)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,.1)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.03)' }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {['#4285F4','#EA4335','#FBBC05','#34A853'].map(c => (
          <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }}/>
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#e8f0fa' }}>{label}</span>
      <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" strokeLinecap="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </a>
  )
}

export default function FeedbackFormClient({ business, form }: { business: Business; form: FeedbackForm }) {
  const [lang, setLang] = useState<Lang>('fr')
  const [ratings, setRatings] = useState<RatingMap>({})
  const [comment, setComment] = useState('')
  const [screen, setScreen] = useState<Screen>('form')
  const [avg, setAvg] = useState(0)
  const isRTL = lang === 'ar'
  const allRated = form.categories.every(c => ratings[c.id] > 0)
  const rated = form.categories.filter(c => ratings[c.id] > 0).length

  async function submit() {
    if (!allRated) return
    setScreen('loading')
    const scores = Object.values(ratings)
    const a = Math.round((scores.reduce((x,y) => x+y, 0) / scores.length) * 10) / 10
    setAvg(a)
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_id: form.id, business_id: business.id, ratings, average_score: a, comment: comment.trim() || null }),
    })
    setScreen(a >= 4 ? 'good' : 'bad')
  }

  function catLabel(cat: Category) {
    if (lang === 'ar') return cat.label_ar
    if (lang === 'en') return cat.label_en || cat.label_fr
    if (lang === 'es') return (cat as Record<string,string>).label_es || cat.label_en || cat.label_fr
    return cat.label_fr
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#07101f;font-family:'Instrument Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fb-page{min-height:100vh;background:linear-gradient(160deg,#070d1a 0%,#0a1525 50%,#070d1a 100%);display:flex;align-items:flex-start;justify-content:center;padding:28px 16px 56px}
        .fb-page::before{content:'';position:fixed;top:0;left:50%;transform:translateX(-50%);width:600px;height:350px;background:radial-gradient(ellipse at 50% 0%,rgba(0,180,200,.08),transparent 70%);pointer-events:none}
        .fb-card{width:100%;max-width:440px;background:#0d1927;border:1px solid rgba(255,255,255,.08);border-radius:24px;box-shadow:0 24px 64px rgba(0,0,0,.5);overflow:hidden;animation:fadeUp .5s ease}
        .fb-header{padding:20px 22px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
        .fb-biz-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
        .fb-av{width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,#028090,#00b4c8);display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:16px;color:#fff;flex-shrink:0;box-shadow:0 4px 12px rgba(0,180,200,.25)}
        .fb-biz-name{font-family:'Cabinet Grotesk',sans-serif;font-size:15px;font-weight:800;color:#e8f0fa;letter-spacing:-.2px}
        .fb-biz-sub{font-size:11px;color:#3d4e62;margin-top:2px}
        .fb-lang{display:flex;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:3px;gap:2px;margin-left:auto;flex-shrink:0}
        .fb-lang-b{padding:4px 8px;border-radius:6px;border:none;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;transition:all .15s;background:transparent;color:#3d4e62}
        .fb-lang-b.on{background:#028090;color:#fff}
        .fb-lang-b:hover:not(.on){color:#8899b0}
        .fb-prog{display:flex;align-items:center;gap:8px}
        .fb-prog-bar{flex:1;height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden}
        .fb-prog-fill{height:100%;background:#028090;border-radius:2px;transition:width .4s ease}
        .fb-prog-txt{font-size:10px;font-weight:700;color:#028090;min-width:28px;text-align:right}
        .fb-body{padding:22px}
        .fb-comment label{font-size:12px;font-weight:700;color:#5a6a82;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:8px}
        .fb-comment textarea{width:100%;padding:11px 13px;background:#070f1d;border:1px solid rgba(255,255,255,.08);border-radius:11px;font-size:13px;color:#e8f0fa;font-family:inherit;resize:none;outline:none;transition:border-color .2s;line-height:1.55;height:72px}
        .fb-comment textarea::placeholder{color:#2a3a52}
        .fb-comment textarea:focus{border-color:#028090}
        .fb-submit{width:100%;padding:14px;background:linear-gradient(135deg,#028090,#00a8bc);color:#fff;border:none;border-radius:13px;font-size:14.5px;font-weight:700;cursor:pointer;font-family:'Cabinet Grotesk',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(0,180,200,.2);margin-top:16px;letter-spacing:-.1px}
        .fb-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,180,200,.3)}
        .fb-submit:disabled{background:rgba(255,255,255,.06);color:rgba(255,255,255,.2);cursor:not-allowed;box-shadow:none;transform:none}
        .fb-privacy{text-align:center;font-size:11px;color:#2a3a52;margin-top:10px}
        .fb-footer{padding:10px 22px 14px;border-top:1px solid rgba(255,255,255,.05);text-align:center}
        .fb-brand{font-size:10px;color:#2a3a52}
        .fb-brand span{color:#028090;font-weight:700}
        .fb-success{padding:44px 28px;text-align:center;animation:fadeUp .4s ease}
        .fb-success-icon{animation:pop .4s cubic-bezier(.34,1.56,.64,1)}
        .fb-loading{padding:72px 24px;text-align:center}
        .spinner{width:40px;height:40px;border-radius:50%;border:3px solid rgba(255,255,255,.07);border-top-color:#028090;animation:spin .8s linear infinite;margin:0 auto 16px}
      `}</style>

      <div className="fb-page" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="fb-card">

          {screen === 'form' && (
            <>
              <div className="fb-header">
                <div className="fb-biz-row">
                  <div className="fb-av">{business.name.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fb-biz-name">{business.name}</div>
                    <div className="fb-biz-sub">{business.city} · {t('anon', lang)}</div>
                  </div>
                  <div className="fb-lang">
                    {(['fr','ar','en','es'] as Lang[]).map(l => (
                      <button key={l} className={`fb-lang-b${lang===l?' on':''}`} onClick={() => setLang(l)}>
                        {LANG_LABELS[l]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="fb-prog">
                  <div className="fb-prog-bar">
                    <div className="fb-prog-fill" style={{ width: `${(rated/form.categories.length)*100}%` }}/>
                  </div>
                  <span className="fb-prog-txt">{rated}/{form.categories.length}</span>
                </div>
              </div>

              <div className="fb-body">
                {form.categories.map(cat => (
                  <StarRow key={cat.id} catLabel={catLabel(cat)} value={ratings[cat.id]||0}
                    onChange={v => setRatings(r => ({...r,[cat.id]:v}))} lang={lang}/>
                ))}
                <div className="fb-comment">
                  <label>{t('comment_l', lang)}</label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)}
                    placeholder={t('comment_ph', lang)}/>
                </div>
                <button className="fb-submit" disabled={!allRated} onClick={submit}>
                  {t('submit', lang)}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
                <div className="fb-privacy">🔒 {t('privacy', lang)}</div>
              </div>
            </>
          )}

          {screen === 'loading' && (
            <div className="fb-loading">
              <div className="spinner"/>
              <p style={{ fontSize: 13, color: '#4a5a72' }}>{t('sending', lang)}</p>
            </div>
          )}

          {screen === 'good' && (
            <div className="fb-success">
              <div className="fb-success-icon">
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 40, fontWeight: 900, color: '#e8f0fa', letterSpacing: -2, marginBottom: 4 }}>
                {avg.toFixed(1)}<span style={{ fontSize: 18, fontWeight: 400, color: '#3d4e62' }}>/5</span>
              </div>
              <div style={{ fontSize: 22, color: '#F59E0B', letterSpacing: 4, marginBottom: 18 }}>
                {'★'.repeat(Math.round(avg))}{'☆'.repeat(5-Math.round(avg))}
              </div>
              <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 22, fontWeight: 900, color: '#e8f0fa', marginBottom: 8, letterSpacing: -.5 }}>{t('ty_good', lang)}</h2>
              <p style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 24px' }}>{t('ty_good_s', lang)}</p>
              {business.google_review_url && (
                <>
                  <GoogleBtn url={business.google_review_url} label={t('google', lang)}/>
                  <p style={{ fontSize: 11, color: '#2a3a52', cursor: 'pointer' }}>{t('skip', lang)}</p>
                </>
              )}
            </div>
          )}

          {screen === 'bad' && (
            <div className="fb-success">
              <div className="fb-success-icon">
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="13"/>
                    <circle cx="12" cy="16" r="1" fill="#F59E0B" stroke="none"/>
                  </svg>
                </div>
              </div>
              <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontSize: 22, fontWeight: 900, color: '#e8f0fa', marginBottom: 10, letterSpacing: -.5 }}>{t('ty_bad', lang)}</h2>
              <p style={{ fontSize: 13, color: '#4a5a72', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 20px' }}>{t('ty_bad_s', lang)}</p>
              <div style={{ padding: 16, background: 'rgba(255,255,255,.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', fontSize: 13, color: '#5a6a82', lineHeight: 1.6, textAlign: isRTL ? 'right' : 'left' }}>
                🙏 {t('hope', lang)}
              </div>
            </div>
          )}

          <div className="fb-footer">
            <div className="fb-brand">Powered by <span>FeedbackPro.ma</span></div>
          </div>
        </div>
      </div>
    </>
  )
}
