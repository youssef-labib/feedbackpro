'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Check,
  LayoutDashboard,
  MessageSquareText,
  QrCode,
  ScanLine,
  ShieldCheck,
  Star,
} from 'lucide-react'
import AppLogo from '../components/AppLogo'
import FlagLangSelector from '../components/FlagLangSelector'
import ThemeToggle from '../components/ThemeToggle'
import { useStoredLanguage } from '../components/useStoredLanguage'

type LandingLang = 'fr' | 'ar' | 'en'

type LandingCopy = {
  nav: {
    features: string
    workflow: string
    pricing: string
    login: string
  }
  badge: string
  title: string
  subtitle: string
  primary: string
  secondary: string
  chips: string[]
  stats: Array<{ label: string; value: string }>
  panelTitle: string
  panelBody: string
  panelHighlights: string[]
  featuresTitle: string
  featuresSubtitle: string
  features: Array<{ title: string; desc: string }>
  workflowTitle: string
  workflowSubtitle: string
  workflow: Array<{ step: string; title: string; desc: string }>
  proofTitle: string
  proofSubtitle: string
  proofCards: Array<{ title: string; desc: string }>
  pricingTitle: string
  pricingSubtitle: string
  pricing: Array<{ name: string; price: string; note: string; features: string[] }>
  ctaTitle: string
  ctaSubtitle: string
}

const COPY: Record<LandingLang, LandingCopy> = {
  fr: {
    nav: {
      features: 'Fonctions',
      workflow: 'Parcours',
      pricing: 'Tarifs',
      login: 'Connexion',
    },
    badge: 'Feedback QR simple pour restaurants, cafes, salons et services',
    title: 'Le moyen le plus simple pour capter des avis sur place et agir vite.',
    subtitle:
      'FeedbackPro aide les equipes a recuperer des retours utiles sans rallonger le parcours client: un QR code, un formulaire rapide, puis un dashboard clair.',
    primary: 'Creer mon espace',
    secondary: 'Voir les plans',
    chips: ['Restaurants', 'Cafes', 'Salons', 'Services'],
    stats: [
      { label: 'mise en place', value: '15 min' },
      { label: 'langues', value: '4' },
      { label: 'temps moyen', value: '60 sec' },
    ],
    panelTitle: 'Le client scanne, repond vite, et vous voyez tout au bon endroit.',
    panelBody:
      'Le parcours reste mobile-first et tres court. Les bons retours peuvent etre rediriges, les points faibles restent visibles pour votre equipe.',
    panelHighlights: [
      'QR sur table, comptoir ou reception',
      'Questions adaptables selon votre activite',
      'Retours prives pour mieux corriger en interne',
    ],
    featuresTitle: 'Tout le loop feedback dans une structure propre et legere',
    featuresSubtitle:
      'Le produit reste basique dans le bon sens: moins de bruit, moins de clics inutiles, plus de clarte pour le business.',
    features: [
      {
        title: 'QR pret a imprimer',
        desc: 'Chaque business obtient un lien public et un QR rapide a poser sur place.',
      },
      {
        title: 'Questions sur mesure',
        desc: 'Ajoutez vos propres questions pour mesurer accueil, rapidite, qualite et plus.',
      },
      {
        title: 'Dashboard lisible',
        desc: 'Suivez les notes, les commentaires et les tendances sans interface surchargee.',
      },
      {
        title: 'Controle et securite',
        desc: 'Gerez les plans, statuts et acces dans une structure simple a maintenir.',
      },
    ],
    workflowTitle: 'Trois etapes pour lancer le systeme',
    workflowSubtitle:
      'L objectif est d etre operationnel vite, meme pour une petite equipe qui veut juste un process propre.',
    workflow: [
      {
        step: '01',
        title: 'Creer le compte',
        desc: 'Inscrivez le business, choisissez la langue et preparez votre espace.',
      },
      {
        step: '02',
        title: 'Configurer le formulaire',
        desc: 'Ajoutez les questions utiles puis telechargez le QR code pret a diffuser.',
      },
      {
        step: '03',
        title: 'Suivre et ajuster',
        desc: 'Regardez les retours entrer dans le dashboard et corrigez vite les points faibles.',
      },
    ],
    proofTitle: 'Pense pour le terrain, pas juste pour une demo',
    proofSubtitle:
      'Chaque bloc du produit est fait pour des equipes qui veulent aller droit au but sur mobile, tablette ou laptop.',
    proofCards: [
      {
        title: 'Formulaire mobile-first',
        desc: 'Le feedback public reste court et lisible meme sur petit ecran.',
      },
      {
        title: 'Boucle de review claire',
        desc: 'Les bons retours peuvent partir vers Google Reviews au bon moment.',
      },
      {
        title: 'Equipe et operations',
        desc: 'Les responsables voient rapidement ce qui bloque sans chercher partout.',
      },
      {
        title: 'Structure facile a faire evoluer',
        desc: 'Le produit reste simple maintenant, mais pret pour paiements et automatisations ensuite.',
      },
    ],
    pricingTitle: 'Des plans simples a comprendre',
    pricingSubtitle:
      'Le systeme reste pret pour une suite plus complete, mais deja assez clair pour commencer maintenant.',
    pricing: [
      {
        name: 'Starter',
        price: '149 MAD',
        note: 'Pour un point de vente',
        features: ['1 business', 'Questions personnalisees', 'Dashboard essentiel'],
      },
      {
        name: 'Pro',
        price: '299 MAD',
        note: 'Le meilleur point de depart',
        features: ['Jusqu a 3 business', 'QR illimites', 'Suivi plus complet'],
      },
      {
        name: 'Business',
        price: '699 MAD',
        note: 'Pour les operations plus larges',
        features: ['Multi-sites', 'Support prioritaire', 'Gestion avancee'],
      },
    ],
    ctaTitle: 'Une base propre pour lancer FeedbackPro serieusement.',
    ctaSubtitle:
      'Commencez avec un produit simple, rapide a comprendre, puis on continuera les paiements et automatisations sur une base solide.',
  },
  ar: {
    nav: {
      features: 'المميزات',
      workflow: 'الخطوات',
      pricing: 'الاسعار',
      login: 'تسجيل الدخول',
    },
    badge: 'نظام QR بسيط للمطاعم والمقاهي والصالونات والخدمات',
    title: 'ابسط طريقة لجمع اراء الزبائن في المكان والتصرف بسرعة.',
    subtitle:
      'FeedbackPro يساعد الفرق تجمع ملاحظات مفيدة بدون ما تطول تجربة الزبون: QR واحد، فورم سريع، ثم لوحة تحكم واضحة.',
    primary: 'انشاء حساب',
    secondary: 'شاهد الاسعار',
    chips: ['مطاعم', 'مقاهي', 'صالونات', 'خدمات'],
    stats: [
      { label: 'وقت الاعداد', value: '15 دقيقة' },
      { label: 'اللغات', value: '4' },
      { label: 'متوسط الاجابة', value: '60 ثانية' },
    ],
    panelTitle: 'الزبون يمسح ويجاوب بسرعة وانت تشوف كل شيء في المكان الصحيح.',
    panelBody:
      'التجربة قصيرة ومناسبة للهاتف. الاراء الجيدة يمكن توجيهها، والملاحظات السلبية تبقى واضحة لفريقك داخليا.',
    panelHighlights: [
      'QR على الطاولة او الكاشير او الاستقبال',
      'اسئلة قابلة للتخصيص حسب النشاط',
      'ملاحظات داخلية لتحسين الخدمة بسرعة',
    ],
    featuresTitle: 'كل دورة الفيدباك في بنية واضحة وخفيفة',
    featuresSubtitle:
      'المنتج بسيط بالمعنى الجيد: اقل ضوضاء، اقل نقرات، وصورة اوضح لصاحب النشاط وفريقه.',
    features: [
      {
        title: 'QR جاهز للطباعة',
        desc: 'كل نشاط يحصل على رابط عام وQR سريع وجاهز للاستعمال.',
      },
      {
        title: 'اسئلة مخصصة',
        desc: 'اضف الاسئلة التي تهم الاستقبال والسرعة والجودة وكل ما تريد قياسه.',
      },
      {
        title: 'لوحة تحكم واضحة',
        desc: 'تابع التقييمات والتعليقات والاتجاهات بدون واجهة معقدة.',
      },
      {
        title: 'تحكم وحماية',
        desc: 'ادارة الخطط والحسابات والصلاحيات تبقى بسيطة وقابلة للتطوير.',
      },
    ],
    workflowTitle: 'ثلاث خطوات لاطلاق النظام',
    workflowSubtitle:
      'الهدف هو ان تبدأ بسرعة حتى لو كان الفريق صغير ويريد فقط نظاما نظيفا وواضحا.',
    workflow: [
      {
        step: '01',
        title: 'انشاء الحساب',
        desc: 'سجل النشاط، اختر اللغة، وجهز مساحتك.',
      },
      {
        step: '02',
        title: 'تجهيز الفورم',
        desc: 'اضف الاسئلة المناسبة ثم حمل QR الجاهز للمشاركة.',
      },
      {
        step: '03',
        title: 'متابعة النتائج',
        desc: 'شاهد الاراء تدخل للوحة التحكم واتخذ قرارات اسرع.',
      },
    ],
    proofTitle: 'مصمم للاستعمال اليومي وليس فقط للعرض',
    proofSubtitle:
      'كل جزء في المنتج مبني لفرق تريد تجربة واضحة على الهاتف او التابلت او الحاسوب.',
    proofCards: [
      {
        title: 'فورم مناسب للهاتف',
        desc: 'صفحة الفيدباك تبقى سريعة وواضحة حتى على الشاشات الصغيرة.',
      },
      {
        title: 'توجيه مراجعات واضح',
        desc: 'يمكن ارسال الزبائن الراضين الى Google Reviews في الوقت المناسب.',
      },
      {
        title: 'رؤية تشغيلية افضل',
        desc: 'المسؤولون يرون بسرعة ما الذي يحتاج تدخل بدون بحث طويل.',
      },
      {
        title: 'قاعدة سهلة للتطوير',
        desc: 'المنتج بسيط حاليا لكنه جاهز لاحقا للمدفوعات والاتمتة.',
      },
    ],
    pricingTitle: 'خطط واضحة وسهلة',
    pricingSubtitle:
      'البنية جاهزة لتطويرات اكبر لاحقا، لكنها من الان كافية للبدء بشكل مرتب واحترافي.',
    pricing: [
      {
        name: 'Starter',
        price: '149 MAD',
        note: 'لفرع واحد',
        features: ['نشاط واحد', 'اسئلة مخصصة', 'لوحة تحكم اساسية'],
      },
      {
        name: 'Pro',
        price: '299 MAD',
        note: 'افضل نقطة انطلاق',
        features: ['حتى 3 انشطة', 'QR غير محدود', 'متابعة افضل'],
      },
      {
        name: 'Business',
        price: '699 MAD',
        note: 'لعمليات اكبر',
        features: ['عدة مواقع', 'اولوية في الدعم', 'ادارة اوسع'],
      },
    ],
    ctaTitle: 'قاعدة نظيفة لاطلاق FeedbackPro بشكل احترافي.',
    ctaSubtitle:
      'ابدأ بمنتج بسيط وسريع الفهم، وبعدها نكمل المدفوعات والاتمتة فوق نفس القاعدة القوية.',
  },
  en: {
    nav: {
      features: 'Features',
      workflow: 'Workflow',
      pricing: 'Pricing',
      login: 'Login',
    },
    badge: 'Simple QR feedback for restaurants, cafes, salons, and service teams',
    title: 'The simplest way to collect on-site feedback and act on it fast.',
    subtitle:
      'FeedbackPro gives teams a short customer flow: one QR code, one fast form, and one clean dashboard to spot what needs attention.',
    primary: 'Create workspace',
    secondary: 'See pricing',
    chips: ['Restaurants', 'Cafes', 'Salons', 'Services'],
    stats: [
      { label: 'setup time', value: '15 min' },
      { label: 'languages', value: '4' },
      { label: 'avg response', value: '60 sec' },
    ],
    panelTitle: 'Customers scan, answer quickly, and the right insights land in one place.',
    panelBody:
      'The flow stays mobile-first and short. Great feedback can be routed outward, while weak points stay visible for your internal team.',
    panelHighlights: [
      'QR on tables, counters, or reception',
      'Questions that match each business type',
      'Private feedback flow for fast internal fixes',
    ],
    featuresTitle: 'The full feedback loop in a clean, lightweight product',
    featuresSubtitle:
      'The product stays basic in the best way: less noise, fewer unnecessary clicks, and more clarity for operators.',
    features: [
      {
        title: 'Print-ready QR',
        desc: 'Each business gets a public link and a QR code that is ready to place on site.',
      },
      {
        title: 'Custom questions',
        desc: 'Add the questions that actually matter for service, speed, quality, and more.',
      },
      {
        title: 'Readable dashboard',
        desc: 'Track scores, comments, and trends without drowning in interface clutter.',
      },
      {
        title: 'Control and security',
        desc: 'Keep plans, account status, and permissions in a simple structure you can grow later.',
      },
    ],
    workflowTitle: 'Three steps to launch the system',
    workflowSubtitle:
      'The goal is to be operational quickly, even for a small team that just wants a clean process.',
    workflow: [
      {
        step: '01',
        title: 'Create the account',
        desc: 'Set up the business, choose the working language, and prepare the workspace.',
      },
      {
        step: '02',
        title: 'Configure the form',
        desc: 'Add the right questions, then download the QR code that is ready to share.',
      },
      {
        step: '03',
        title: 'Track and improve',
        desc: 'Watch feedback arrive in the dashboard and fix weak points faster.',
      },
    ],
    proofTitle: 'Built for everyday operations, not just for a demo',
    proofSubtitle:
      'Every block is designed for teams that need a clean experience on phone, tablet, or laptop.',
    proofCards: [
      {
        title: 'Phone-first form',
        desc: 'The public feedback page stays short, readable, and fast on small screens.',
      },
      {
        title: 'Clear review routing',
        desc: 'Happy customers can be guided toward Google Reviews at the right moment.',
      },
      {
        title: 'Better operational visibility',
        desc: 'Managers can spot recurring issues quickly without digging through noise.',
      },
      {
        title: 'Easy base to extend',
        desc: 'The app is simple now, but already ready for payments and automations later.',
      },
    ],
    pricingTitle: 'Pricing that is easy to understand',
    pricingSubtitle:
      'The structure is ready for a larger SaaS flow later, but already clean enough to start using today.',
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
        features: ['Up to 3 businesses', 'Unlimited QR codes', 'Stronger tracking flow'],
      },
      {
        name: 'Business',
        price: '699 MAD',
        note: 'For larger operations',
        features: ['Multiple sites', 'Priority support', 'Broader management'],
      },
    ],
    ctaTitle: 'A clean foundation to launch FeedbackPro the right way.',
    ctaSubtitle:
      'Start with a simple product that is fast to understand, then keep layering payments and automation on top of a solid base.',
  },
}

const FEATURE_ICONS = [QrCode, MessageSquareText, LayoutDashboard, ShieldCheck]
const PROOF_ICONS = [Building2, Star, ScanLine, ShieldCheck]

export default function HomePage() {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]
  const arrowStyle = isRTL ? { transform: 'scaleX(-1)' } : undefined

  return (
    <div className="page-shell" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="topbar landing-topbar">
        <div className="container topbar-inner">
          <AppLogo />

          <nav className="landing-nav">
            <a href="#features" className="nav-link">
              {copy.nav.features}
            </a>
            <a href="#workflow" className="nav-link">
              {copy.nav.workflow}
            </a>
            <a href="#pricing" className="nav-link">
              {copy.nav.pricing}
            </a>
          </nav>

          <div className="topbar-actions">
            <ThemeToggle />
            <FlagLangSelector lang={lang} setLang={setLang} options={['fr', 'ar', 'en', 'es']} />
            <Link href="/login" className="button button-secondary landing-topbar-button">
              {copy.nav.login}
            </Link>
            <Link href="/register" className="button button-primary landing-topbar-button">
              {copy.primary}
            </Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="container landing-hero-stack">
            <div className="hero-grid landing-hero-grid">
              <div className="hero-copy landing-hero-copy" data-reveal="" data-motion-order="0">
                <div>
                  <div className="pill accent-pill" style={{ marginBottom: 18 }}>
                    {copy.badge}
                  </div>
                  <h1 className="section-title">{copy.title}</h1>
                  <p className="section-subtitle">{copy.subtitle}</p>
                </div>

                <div className="landing-kicker">
                  {copy.chips.map((chip) => (
                    <span key={chip} className="landing-chip">
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="hero-actions">
                  <Link href="/register" className="button button-primary">
                    {copy.primary}
                    <ArrowRight size={16} style={arrowStyle} />
                  </Link>
                  <a href="#pricing" className="button button-secondary">
                    {copy.secondary}
                  </a>
                </div>

                <div className="landing-stat-row">
                  {copy.stats.map((item) => (
                    <article key={item.label} className="metric-card">
                      <div className="metric-label">{item.label}</div>
                      <div className="metric-value">{item.value}</div>
                    </article>
                  ))}
                </div>
              </div>

              <aside
                className="hero-card landing-stage-card"
                data-reveal=""
                data-motion-order="1"
                data-motion-variant="right"
              >
                <div className="landing-stage-top">
                  <div className="pill accent-pill">Live product</div>
                  <div className="landing-live-pill">
                    <span className="landing-live-dot" />
                    QR flow active
                  </div>
                </div>

                <div className="landing-stage-grid">
                  <div className="landing-stage-panel">
                    <h2 className="landing-card-title">{copy.panelTitle}</h2>
                    <p className="card-copy">{copy.panelBody}</p>

                    <div className="stack" style={{ marginTop: 20 }}>
                      {copy.panelHighlights.map((item) => (
                        <div key={item} className="landing-signal">
                          <span className="feature-icon landing-signal-icon">
                            <Check size={16} />
                          </span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="landing-stage-stack">
                    {copy.features.slice(0, 2).map((feature, index) => {
                      const Icon = FEATURE_ICONS[index]
                      return (
                        <article key={feature.title} className="landing-stage-mini">
                          <div className="feature-icon">
                            <Icon size={18} />
                          </div>
                          <h3 className="landing-card-title" style={{ marginTop: 16 }}>
                            {feature.title}
                          </h3>
                          <p className="feature-copy">{feature.desc}</p>
                        </article>
                      )
                    })}
                  </div>
                </div>

                <div className="landing-feature-rail">
                  {copy.features.slice(2).map((feature, index) => {
                    const Icon = FEATURE_ICONS[index + 2]
                    return (
                      <article key={feature.title} className="landing-rail-card">
                        <div className="feature-icon">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="landing-card-title">{feature.title}</h3>
                          <p className="feature-copy">{feature.desc}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </aside>
            </div>

            <div className="landing-proof-strip">
              {copy.proofCards.map((item, index) => {
                const Icon = PROOF_ICONS[index]
                return (
                  <article
                    key={item.title}
                    className="feature-card landing-proof-card"
                    data-reveal=""
                    data-motion-order={`${index + 2}`}
                  >
                    <div className="feature-icon">
                      <Icon size={18} />
                    </div>
                    <h3 className="feature-title">{item.title}</h3>
                    <p className="feature-copy">{item.desc}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container landing-story-grid">
            <article className="surface-card landing-system-card" data-reveal="" data-motion-variant="left">
              <div>
                <div className="section-eyebrow">Feedback loop</div>
                <h2 className="card-title landing-section-title">{copy.featuresTitle}</h2>
                <p className="card-copy">{copy.featuresSubtitle}</p>
              </div>

              <div className="landing-system-map">
                {copy.workflow.map((item) => (
                  <div key={item.step} className="landing-system-step">
                    <div className="landing-step-badge">{item.step}</div>
                    <div>
                      <h3 className="landing-card-title">{item.title}</h3>
                      <p className="feature-copy">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="landing-system-foot">
                {copy.panelHighlights.map((item) => (
                  <div key={item} className="landing-badge-card">
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <div className="landing-board">
              {copy.features.map((feature, index) => {
                const Icon = FEATURE_ICONS[index]
                return (
                  <article
                    key={feature.title}
                    className="feature-card landing-proof-card"
                    data-reveal=""
                    data-motion-order={`${index + 1}`}
                  >
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

        <section id="workflow" className="section">
          <div className="container landing-workflow-layout">
            <div className="section-head" data-reveal="">
              <div className="section-eyebrow">Workflow</div>
              <h2 className="section-title" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
                {copy.workflowTitle}
              </h2>
              <p className="section-subtitle">{copy.workflowSubtitle}</p>
            </div>

            <div className="landing-flow">
              {copy.workflow.map((item, index) => (
                <article
                  key={item.step}
                  className="surface-card landing-step-card"
                  data-reveal=""
                  data-motion-order={`${index + 1}`}
                >
                  <div className="landing-step-number">{item.step}</div>
                  <h3 className="landing-card-title">{item.title}</h3>
                  <p className="feature-copy">{item.desc}</p>
                </article>
              ))}
            </div>

            <div className="surface-card landing-quote-card" data-reveal="" data-motion-variant="pop">
              <div className="landing-quote-mark">&ldquo;</div>
              <p className="landing-quote-copy">{copy.proofSubtitle}</p>
              <div className="landing-quote-meta">
                <div className="pill accent-pill">{copy.panelHighlights[0]}</div>
                <span className="muted-copy">{copy.proofTitle}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="container">
            <div className="section-head" data-reveal="">
              <div className="section-eyebrow">Pricing</div>
              <h2 className="section-title" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
                {copy.pricingTitle}
              </h2>
              <p className="section-subtitle">{copy.pricingSubtitle}</p>
            </div>

            <div className="landing-pricing-stack">
              <div className="price-grid">
                {copy.pricing.map((plan, index) => (
                  <article
                    key={plan.name}
                    className="price-card landing-price-card"
                    data-reveal=""
                    data-motion-order={`${index + 1}`}
                    style={index === 1 ? { borderColor: 'rgba(34, 197, 94, 0.3)' } : undefined}
                  >
                    <div className={index === 1 ? 'pill accent-pill' : 'pill'} style={{ marginBottom: 18 }}>
                      {plan.name}
                    </div>
                    <div className="metric-value" style={{ fontSize: 34 }}>
                      {plan.price}
                    </div>
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

              <div className="surface-card landing-pricing-note" data-reveal="" data-motion-variant="pop">
                <div className="section-eyebrow">Why it feels lighter</div>
                <h3 className="card-title landing-section-title">{copy.ctaTitle}</h3>
                <div className="landing-system-foot">
                  {copy.proofCards.slice(0, 3).map((item) => (
                    <div key={item.title} className="landing-badge-card">
                      <strong style={{ display: 'block', marginBottom: 6 }}>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="surface-card landing-cta-card" data-reveal="" data-motion-variant="pop">
              <div>
                <div className="section-eyebrow">Ready to launch</div>
                <h2 className="card-title landing-section-title">{copy.ctaTitle}</h2>
                <p className="card-copy">{copy.ctaSubtitle}</p>
              </div>

              <div className="hero-actions landing-cta-actions">
                <Link href="/register" className="button button-primary">
                  {copy.primary}
                  <ArrowRight size={16} style={arrowStyle} />
                </Link>
                <Link href="/login" className="button button-secondary">
                  {copy.nav.login}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
