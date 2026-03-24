'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  MessageSquareText,
  QrCode,
  ShieldCheck,
} from 'lucide-react'
import AppLogo from '../components/AppLogo'
import FlagLangSelector from '../components/FlagLangSelector'
import ThemeToggle from '../components/ThemeToggle'
import { useStoredLanguage } from '../components/useStoredLanguage'

const COPY = {
  fr: {
    nav: { features: 'Fonctions', how: 'Comment ca marche', pricing: 'Tarifs', login: 'Connexion' },
    badge: 'Pensé pour les restaurants, cafes, salons et services au Maroc',
    title: 'Collectez plus de feedback sans compliquer le parcours client.',
    subtitle:
      'Un QR code sur place, un formulaire rapide en plusieurs langues, un tableau de bord simple pour voir ce qui bloque et ce qui marche.',
    primary: 'Commencer gratuitement',
    secondary: 'Voir les tarifs',
    heroStats: [
      { label: 'mise en place', value: '15 min' },
      { label: 'langues', value: '4' },
      { label: 'temps moyen', value: '60 sec' },
    ],
    previewTitle: 'Le systeme reste simple',
    previewPoints: [
      'Les clients scannent et notent en quelques secondes.',
      'Les mauvais retours restent prives pour votre equipe.',
      'Les bons retours peuvent aller vers Google Reviews.',
    ],
    featuresTitle: 'Un produit simple, propre et pret pour le terrain',
    featuresSubtitle:
      'Le but est de faire moins, mais mieux: moins de friction pour le client et plus de clarte pour le business.',
    features: [
      {
        title: 'QR code instantane',
        desc: 'Chaque business obtient un lien public et un QR pret a imprimer.',
      },
      {
        title: 'Questions personnalisables',
        desc: 'Choisissez les questions qui comptent vraiment pour votre activite.',
      },
      {
        title: 'Dashboard clair',
        desc: 'Suivez les notes, les commentaires, les points faibles et vos volumes.',
      },
      {
        title: 'Google review routing',
        desc: 'Redirigez les clients satisfaits vers votre page Google au bon moment.',
      },
      {
        title: 'Espace admin',
        desc: 'Gerez les plans, le statut des comptes et les clients depuis un seul endroit.',
      },
      {
        title: 'Supabase ready',
        desc: 'Le produit garde une base propre et un flow rapide pour les operations.',
      },
    ],
    howTitle: 'Comment FeedbackPro fonctionne',
    howSteps: [
      'Creez votre compte puis configurez vos questions.',
      'Imprimez le QR code et placez-le sur table, caisse ou reception.',
      'Recevez les retours dans votre dashboard sans perdre du temps.',
    ],
    pricingTitle: 'Des plans faciles a comprendre',
    pricingSubtitle: 'Vous pourrez brancher le paiement plus tard. La structure du produit est deja prete.',
    pricing: [
      {
        name: 'Starter',
        price: '149 MAD',
        note: 'Pour un seul point de vente',
        features: ['1 business', 'Questions personnalisables', 'Dashboard essentiel'],
      },
      {
        name: 'Pro',
        price: '299 MAD',
        note: 'Le meilleur point de depart',
        features: ['Jusqu a 3 business', 'QR illimites', 'Plus de suivi et de gestion'],
      },
      {
        name: 'Business',
        price: '699 MAD',
        note: 'Pour les operations plus larges',
        features: ['Multi-sites', 'Priorite admin', 'Suite plus complete'],
      },
    ],
    ctaTitle: 'Un site simple, pro et pret a faire avancer le projet.',
    ctaSubtitle: 'Commencez par la mise en place du produit, puis on continue ensemble sur chaque detail.',
  },
  ar: {
    nav: { features: 'المميزات', how: 'كيف يعمل', pricing: 'الاسعار', login: 'تسجيل الدخول' },
    badge: 'مناسب للمطاعم والمقاهي والخدمات في المغرب',
    title: 'اجمع اراء العملاء بشكل بسيط واحترافي.',
    subtitle:
      'QR في المكان، نموذج سريع بعدة لغات، ولوحة تحكم واضحة لمعرفة ما الذي يجب تحسينه.',
    primary: 'ابدأ مجانا',
    secondary: 'شاهد الاسعار',
    heroStats: [
      { label: 'وقت الاعداد', value: '15 دقيقة' },
      { label: 'اللغات', value: '4' },
      { label: 'متوسط الاجابة', value: '60 ثانية' },
    ],
    previewTitle: 'الفكرة تبقى بسيطة',
    previewPoints: [
      'العميل يمسح ويقيم بسرعة.',
      'الاراء السلبية تبقى داخلية لفريقك.',
      'الاراء الجيدة يمكن توجيهها الى Google Reviews.',
    ],
    featuresTitle: 'منتج بسيط وواضح وجاهز للاستعمال',
    featuresSubtitle:
      'الهدف هو تقليل التعقيد للعميل واعطاء صورة اوضح لصاحب النشاط.',
    features: [
      {
        title: 'QR فوري',
        desc: 'كل نشاط يحصل على رابط عام و QR جاهز للطباعة.',
      },
      {
        title: 'اسئلة قابلة للتخصيص',
        desc: 'اختر الاسئلة التي تناسب نشاطك الحقيقي.',
      },
      {
        title: 'لوحة تحكم واضحة',
        desc: 'تابع النقاط والتعليقات والمشاكل الرئيسية بسهولة.',
      },
      {
        title: 'توجيه نحو Google',
        desc: 'العميل الراضي يمكن توجيهه مباشرة نحو صفحتك في Google.',
      },
      {
        title: 'لوحة ادارة',
        desc: 'تحكم في الخطط والحسابات والعملاء من مكان واحد.',
      },
      {
        title: 'جاهز مع Supabase',
        desc: 'المنتج مبني ليستمر بشكل منظم وسريع.',
      },
    ],
    howTitle: 'كيف يعمل FeedbackPro',
    howSteps: [
      'انشئ حسابك ثم جهز الاسئلة.',
      'اطبع QR وضعه في الطاولة او الاستقبال او نقطة البيع.',
      'تابع كل الاراء من لوحة التحكم بدون تعقيد.',
    ],
    pricingTitle: 'خطط سهلة وواضحة',
    pricingSubtitle: 'يمكنك ربط الدفع لاحقا. المهم ان بنية المنتج جاهزة.',
    pricing: [
      {
        name: 'Starter',
        price: '149 MAD',
        note: 'لنشاط واحد',
        features: ['نشاط واحد', 'اسئلة مخصصة', 'لوحة تحكم اساسية'],
      },
      {
        name: 'Pro',
        price: '299 MAD',
        note: 'افضل نقطة بداية',
        features: ['حتى 3 نشاطات', 'QR غير محدود', 'متابعة وادارة اكثر'],
      },
      {
        name: 'Business',
        price: '699 MAD',
        note: 'للعمليات الاكبر',
        features: ['عدة مواقع', 'اولوية في الادارة', 'خصائص اكثر'],
      },
    ],
    ctaTitle: 'موقع بسيط واحترافي وجاهز لتطوير المشروع.',
    ctaSubtitle: 'ابدأ بالنسخة الاساسية القوية وبعدها نكمل كل التحسينات التي تريدها.',
  },
  en: {
    nav: { features: 'Features', how: 'How it works', pricing: 'Pricing', login: 'Login' },
    badge: 'Built for restaurants, cafes, salons, and service businesses in Morocco',
    title: 'Collect customer feedback without adding friction.',
    subtitle:
      'One QR code on site, one fast multilingual form, and one clean dashboard to understand what needs attention.',
    primary: 'Start free',
    secondary: 'View pricing',
    heroStats: [
      { label: 'setup time', value: '15 min' },
      { label: 'languages', value: '4' },
      { label: 'avg response', value: '60 sec' },
    ],
    previewTitle: 'The product stays focused',
    previewPoints: [
      'Customers scan and rate in seconds.',
      'Low scores stay private for your team.',
      'High scores can flow toward Google Reviews.',
    ],
    featuresTitle: 'A simple product that already covers the important parts',
    featuresSubtitle:
      'The goal is to keep the experience lightweight for customers and useful for operators.',
    features: [
      {
        title: 'Instant QR setup',
        desc: 'Every business gets a public link and a QR that is ready to print.',
      },
      {
        title: 'Custom questions',
        desc: 'Choose the questions that matter for your business type.',
      },
      {
        title: 'Clear dashboard',
        desc: 'Track scores, comments, weak points, and review volume in one place.',
      },
      {
        title: 'Google review routing',
        desc: 'Send happy customers to Google Reviews at the right moment.',
      },
      {
        title: 'Admin control',
        desc: 'Manage plans, account status, and clients from a single admin area.',
      },
      {
        title: 'Supabase ready',
        desc: 'The app structure stays clean and operationally simple.',
      },
    ],
    howTitle: 'How FeedbackPro works',
    howSteps: [
      'Create your account and configure the right questions.',
      'Print the QR code and place it on tables, counters, or reception.',
      'Watch feedback flow into your dashboard with no extra steps.',
    ],
    pricingTitle: 'Pricing that is easy to read',
    pricingSubtitle: 'You can connect payments later. The product structure is already ready for it.',
    pricing: [
      {
        name: 'Starter',
        price: '149 MAD',
        note: 'For one location',
        features: ['1 business', 'Custom questions', 'Essential dashboard'],
      },
      {
        name: 'Pro',
        price: '299 MAD',
        note: 'Best starting point',
        features: ['Up to 3 businesses', 'Unlimited QR codes', 'Stronger management flow'],
      },
      {
        name: 'Business',
        price: '699 MAD',
        note: 'For larger operations',
        features: ['Multiple locations', 'Admin priority', 'Broader suite'],
      },
    ],
    ctaTitle: 'A clean, simple product foundation you can keep building on.',
    ctaSubtitle: 'Start with the essential experience, then we can keep refining every detail together.',
  },
} as const

const FEATURES = [
  MessageSquareText,
  QrCode,
  LayoutDashboard,
  ShieldCheck,
  MessageSquareText,
  LayoutDashboard,
]

export default function HomePage() {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]

  return (
    <div className="page-shell" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="topbar">
        <div className="container topbar-inner">
          <AppLogo />
          <div className="topbar-links">
            <a href="#features" className="nav-link">{copy.nav.features}</a>
            <a href="#how" className="nav-link">{copy.nav.how}</a>
            <a href="#pricing" className="nav-link">{copy.nav.pricing}</a>
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            <FlagLangSelector lang={lang} setLang={setLang} options={['fr', 'ar', 'en', 'es']} />
            <Link href="/login" className="nav-link">{copy.nav.login}</Link>
            <Link href="/register" className="button button-primary">{copy.primary}</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container hero-grid">
          <div className="hero-copy">
            <div>
              <div className="pill accent-pill" style={{ marginBottom: 18 }}>{copy.badge}</div>
              <h1 className="section-title">{copy.title}</h1>
              <p className="section-subtitle">{copy.subtitle}</p>
            </div>

            <div className="hero-actions">
              <Link href="/register" className="button button-primary">
                {copy.primary}
                <ArrowRight size={16} />
              </Link>
              <a href="#pricing" className="button button-secondary">
                {copy.secondary}
              </a>
            </div>

            <div className="three-col">
              {copy.heroStats.map((item) => (
                <div key={item.label} className="metric-card">
                  <div className="metric-label">{item.label}</div>
                  <div className="metric-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="hero-card">
            <div className="section-eyebrow">Feedback loop</div>
            <h2 className="card-title" style={{ marginTop: 0 }}>{copy.previewTitle}</h2>
            <p className="card-copy">
              FeedbackPro helps you collect, filter, and act on feedback without making the customer do extra work.
            </p>
            <div className="list" style={{ marginTop: 22 }}>
              {copy.previewPoints.map((item) => (
                <div key={item} className="list-row">
                  <span className="list-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="two-col" style={{ marginTop: 22 }}>
              <div className="summary-card">
                <div className="metric-label">Form</div>
                <div className="metric-value" style={{ fontSize: 24 }}>QR + 5 taps</div>
                <div className="metric-note">Fast enough to finish on mobile.</div>
              </div>
              <div className="summary-card">
                <div className="metric-label">Ops</div>
                <div className="metric-value" style={{ fontSize: 24 }}>1 dashboard</div>
                <div className="metric-note">Questions, QR, reviews, settings, and admin.</div>
              </div>
            </div>
          </aside>
        </section>

        <section id="features" className="section">
          <div className="container">
            <div className="section-head">
              <div className="section-eyebrow">Product</div>
              <h2 className="section-title" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>{copy.featuresTitle}</h2>
              <p className="section-subtitle">{copy.featuresSubtitle}</p>
            </div>

            <div className="feature-grid">
              {copy.features.map((feature, index) => {
                const Icon = FEATURES[index]
                return (
                  <article key={feature.title} className="feature-card">
                    <div className="feature-icon">
                      <Icon size={18} />
                    </div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-copy">{feature.desc}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="how" className="section">
          <div className="container two-col">
            <div className="info-card">
              <div className="section-eyebrow">Flow</div>
              <h2 className="card-title" style={{ marginTop: 0 }}>{copy.howTitle}</h2>
              <div className="list" style={{ marginTop: 18 }}>
                {copy.howSteps.map((step, index) => (
                  <div key={step} className="list-row">
                    <span className="feature-icon" style={{ width: 34, height: 34, borderRadius: 999, fontWeight: 800 }}>
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-card">
              <div className="section-eyebrow">Why it works</div>
              <h2 className="card-title" style={{ marginTop: 0 }}>Built to stay practical in the field.</h2>
              <div className="list" style={{ marginTop: 18 }}>
                {[
                  'No overloaded landing page patterns.',
                  'Simple auth and onboarding.',
                  'Dashboard and admin remain readable on laptop or phone.',
                  'The same language selector stays available across views.',
                ].map((item) => (
                  <div key={item} className="list-row">
                    <Check size={18} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="container">
            <div className="section-head">
              <div className="section-eyebrow">Pricing</div>
              <h2 className="section-title" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>{copy.pricingTitle}</h2>
              <p className="section-subtitle">{copy.pricingSubtitle}</p>
            </div>

            <div className="price-grid">
              {copy.pricing.map((plan, index) => (
                <article
                  key={plan.name}
                  className="price-card"
                  style={index === 1 ? { borderColor: 'rgba(34, 197, 94, 0.28)' } : undefined}
                >
                  <div className={index === 1 ? 'pill accent-pill' : 'pill'} style={{ marginBottom: 18 }}>
                    {plan.name}
                  </div>
                  <div className="metric-value" style={{ fontSize: 32 }}>{plan.price}</div>
                  <div className="metric-note">{plan.note}</div>
                  <div className="list" style={{ marginTop: 22 }}>
                    {plan.features.map((feature) => (
                      <div key={feature} className="list-row">
                        <Check size={18} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="surface-card" style={{ padding: 28 }}>
              <div className="two-col" style={{ alignItems: 'center' }}>
                <div>
                  <div className="section-eyebrow">Ready</div>
                  <h2 className="card-title" style={{ marginTop: 0 }}>{copy.ctaTitle}</h2>
                  <p className="card-copy">{copy.ctaSubtitle}</p>
                </div>
                <div className="hero-actions" style={{ justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                  <Link href="/register" className="button button-primary">
                    {copy.primary}
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/login" className="button button-secondary">
                    {copy.nav.login}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
