'use client'

import { useState, useEffect } from 'react'

type Lang = 'fr' | 'ar' | 'en' | 'es'

const LANG_LABELS: Record<Lang, string> = { fr: 'FR', ar: 'عربي', en: 'EN', es: 'ES' }

const C: Record<Lang, {
  dir: 'ltr' | 'rtl'
  badge: string
  h1a: string; h1b: string; h1c: string
  sub: string; cta1: string; cta2: string
  s1: string; s2: string; s3: string; s4: string
  feat_label: string; feat_title: string; feat_sub: string
  cards: { icon: string; title: string; desc: string }[]
  how_label: string; how_title: string
  steps: { title: string; desc: string }[]
  price_label: string; price_title: string; price_sub: string
  plans: { name: string; price: string; period: string; features: string[]; cta: string; featured: boolean }[]
  band_title: string; band_sub: string; band_cta: string
  nav: { features: string; pricing: string; how: string; login: string; cta: string }
}> = {
  fr: {
    dir: 'ltr',
    badge: 'Conçu pour le marché marocain',
    h1a: 'Sachez ce que pensent', h1b: 'vos clients,', h1c: "avant qu'il soit trop tard",
    sub: 'Un QR code sur votre table. Vos clients donnent leur avis en 60 secondes. Vous recevez des insights IA chaque semaine.',
    cta1: 'Démarrer gratuitement', cta2: 'Voir la démo',
    s1: 'pour donner un avis', s2: 'pour commencer', s3: 'langues supportées', s4: 'automatique',
    feat_label: 'Fonctionnalités', feat_title: 'Tout ce dont vous avez besoin',
    feat_sub: 'De la collecte au rapport IA — tout est automatique. Vous vous concentrez sur votre business.',
    cards: [
      { icon: '📲', title: 'QR code instantané', desc: 'Un QR unique par établissement. Vos clients scannent et donnent leur avis en 60 secondes, sans application.' },
      { icon: '⭐', title: 'Notes par catégorie', desc: 'Nourriture, service, propreté — configurez les catégories selon votre secteur. Tout est personnalisable.' },
      { icon: '🧠', title: 'Analyse IA chaque semaine', desc: 'Chaque lundi, Claude analyse vos avis et vous envoie le problème principal et 1 action concrète.' },
      { icon: '🌍', title: '4 langues supportées', desc: 'FR / AR / EN / ES — le formulaire détecte automatiquement la langue. Vos touristes sont couverts.' },
      { icon: '🔒', title: 'Protégez votre réputation', desc: 'Score ≥ 4 → redirection Google. Score < 2.5 → feedback capturé en privé. Jamais publié sans vous.' },
      { icon: '📊', title: 'Dashboard en temps réel', desc: 'Scores, tendances, comparaison semaine par semaine. Voyez exactement quoi améliorer.' },
    ],
    how_label: 'Comment ça marche', how_title: 'En place en 15 minutes',
    steps: [
      { title: 'Créez votre compte', desc: 'Inscrivez-vous, entrez le nom de votre business, choisissez vos catégories.' },
      { title: 'Imprimez le QR', desc: 'Téléchargez votre QR code et placez-le sur vos tables ou menus.' },
      { title: 'Les clients notent', desc: 'Ils scannent, donnent leurs étoiles, et soumettent en 60 secondes.' },
      { title: 'Recevez les insights', desc: 'Chaque semaine, un rapport IA vous dit quoi améliorer en priorité.' },
    ],
    price_label: 'Tarifs', price_title: 'Simple et transparent',
    price_sub: 'Commencez gratuitement pendant 14 jours. Aucune carte requise.',
    plans: [
      { name: 'Starter', price: '149', period: 'MAD / mois', featured: false, cta: 'Commencer', features: ['1 établissement', "Jusqu'à 3 QR codes", 'Dashboard de base', 'Rapport email hebdo'] },
      { name: 'Pro', price: '299', period: 'MAD / mois', featured: true, cta: 'Le plus populaire', features: ["Jusqu'à 3 établissements", 'QR codes illimités', 'Insights IA hebdomadaires', 'Module staff', 'Push Google reviews', 'Alertes WhatsApp'] },
      { name: 'Business', price: '699', period: 'MAD / mois', featured: false, cta: 'Contacter', features: ['Établissements illimités', 'Suite IA complète', 'Benchmark concurrents', 'QR white-label', 'Accès API', 'Support prioritaire'] },
    ],
    band_title: 'Prêt à connaître vraiment vos clients ?',
    band_sub: '14 jours gratuits. Pas de carte bancaire. Installation en 15 minutes.',
    band_cta: 'Créer mon compte gratuit →',
    nav: { features: 'Fonctionnalités', pricing: 'Tarifs', how: 'Comment ça marche', login: 'Connexion', cta: 'Essai gratuit' },
  },
  ar: {
    dir: 'rtl',
    badge: 'مصمم للسوق المغربي',
    h1a: 'اعرف ما يفكر فيه', h1b: 'عملاؤك،', h1c: 'قبل فوات الأوان',
    sub: 'كود QR على طاولتك. يعطي عملاؤك رأيهم في 60 ثانية. تستقبل تقارير ذكاء اصطناعي كل أسبوع.',
    cta1: 'ابدأ مجاناً', cta2: 'شاهد العرض',
    s1: 'لإعطاء رأي', s2: 'للبدء', s3: 'لغات مدعومة', s4: 'أوتوماتيكي',
    feat_label: 'المميزات', feat_title: 'كل ما تحتاجه',
    feat_sub: 'من الجمع إلى تقرير الذكاء الاصطناعي — كل شيء تلقائي. ركز على عملك.',
    cards: [
      { icon: '📲', title: 'كود QR فوري', desc: 'كود QR فريد لكل مؤسسة. يمسحه العملاء ويعطون رأيهم في أقل من 60 ثانية بدون تطبيق.' },
      { icon: '⭐', title: 'تقييم حسب الفئة', desc: 'الطعام، الخدمة، النظافة — خصص الفئات حسب قطاعك. كل شيء قابل للتخصيص.' },
      { icon: '🧠', title: 'تحليل ذكاء اصطناعي أسبوعي', desc: 'كل إثنين، يحلل كلود تقييماتك ويرسل لك المشكلة الرئيسية وإجراءً واحداً محدداً.' },
      { icon: '🌍', title: '4 لغات مدعومة', desc: 'FR / AR / EN / ES — يكشف النموذج اللغة تلقائياً. سياحك مغطون.' },
      { icon: '🔒', title: 'احمِ سمعتك', desc: 'نقاط ≥ 4 → إعادة توجيه Google. نقاط < 2.5 → التعليقات محفوظة بشكل خاص.' },
      { icon: '📊', title: 'لوحة تحكم فورية', desc: 'نقاط، اتجاهات، مقارنة أسبوع بأسبوع. اعرف بالضبط ما يجب تحسينه.' },
    ],
    how_label: 'كيف يعمل', how_title: 'جاهز في 15 دقيقة',
    steps: [
      { title: 'أنشئ حسابك', desc: 'سجل، أدخل اسم عملك، اختر فئاتك.' },
      { title: 'اطبع كود QR', desc: 'حمّل كود QR وضعه على طاولاتك أو قوائمك.' },
      { title: 'العملاء يقيّمون', desc: 'يمسحون الكود، يعطون نجومهم، ويرسلون في 60 ثانية.' },
      { title: 'استقبل التقارير', desc: 'كل أسبوع، تقرير ذكاء اصطناعي يخبرك بأولوية التحسين.' },
    ],
    price_label: 'الأسعار', price_title: 'بسيط وشفاف',
    price_sub: 'ابدأ مجاناً لمدة 14 يوماً. لا بطاقة مطلوبة.',
    plans: [
      { name: 'Starter', price: '149', period: 'درهم / شهر', featured: false, cta: 'ابدأ', features: ['مؤسسة واحدة', 'حتى 3 أكواد QR', 'لوحة تحكم أساسية', 'تقرير بريد أسبوعي'] },
      { name: 'Pro', price: '299', period: 'درهم / شهر', featured: true, cta: 'الأكثر شعبية', features: ['حتى 3 مؤسسات', 'أكواد QR غير محدودة', 'تقارير ذكاء اصطناعي', 'وحدة الموظفين', 'دفع Google reviews', 'تنبيهات واتساب'] },
      { name: 'Business', price: '699', period: 'درهم / شهر', featured: false, cta: 'تواصل معنا', features: ['مؤسسات غير محدودة', 'مجموعة ذكاء اصطناعي كاملة', 'مقارنة المنافسين', 'QR بالعلامة التجارية', 'وصول API', 'دعم أولوي'] },
    ],
    band_title: 'هل أنت مستعد لمعرفة ما يفكر فيه عملاؤك؟',
    band_sub: '14 يوماً مجاناً. بدون بطاقة بنكية. إعداد في 15 دقيقة.',
    band_cta: 'أنشئ حسابي المجاني →',
    nav: { features: 'المميزات', pricing: 'الأسعار', how: 'كيف يعمل', login: 'تسجيل الدخول', cta: 'تجربة مجانية' },
  },
  en: {
    dir: 'ltr',
    badge: 'Built for the Moroccan market',
    h1a: 'Know what your', h1b: 'customers think,', h1c: "before it's too late",
    sub: 'One QR code on your table. Customers give feedback in 60 seconds. You get AI insights every week.',
    cta1: 'Start for free', cta2: 'View demo',
    s1: 'to give feedback', s2: 'to get started', s3: 'languages supported', s4: 'automatic',
    feat_label: 'Features', feat_title: 'Everything you need',
    feat_sub: 'From collection to AI report — everything is automatic. You focus on your business.',
    cards: [
      { icon: '📲', title: 'Instant QR code', desc: 'A unique QR per location. Customers scan and give feedback in under 60 seconds, no app required.' },
      { icon: '⭐', title: 'Category ratings', desc: 'Food, service, cleanliness — configure categories for your sector. Restaurants, gyms, hotels, all customizable.' },
      { icon: '🧠', title: 'Weekly AI analysis', desc: 'Every Monday, Claude analyzes your reviews and sends you the main issue and 1 concrete action.' },
      { icon: '🌍', title: '4 languages supported', desc: 'FR / AR / EN / ES — the form auto-detects the language. Your tourists are fully covered.' },
      { icon: '🔒', title: 'Protect your reputation', desc: 'Score ≥ 4 → Google redirect. Score < 2.5 → feedback captured privately. Never published without you.' },
      { icon: '📊', title: 'Real-time dashboard', desc: 'Scores, trends, week-by-week comparison. See exactly what to improve to boost your rating.' },
    ],
    how_label: 'How it works', how_title: 'Live in 15 minutes',
    steps: [
      { title: 'Create your account', desc: 'Sign up, enter your business name, choose your categories.' },
      { title: 'Print the QR', desc: 'Download your QR code and place it on your tables or menus.' },
      { title: 'Customers rate', desc: 'They scan, give their stars, and submit in 60 seconds.' },
      { title: 'Receive insights', desc: 'Every week, an AI report tells you what to improve first.' },
    ],
    price_label: 'Pricing', price_title: 'Simple and transparent',
    price_sub: 'Start free for 14 days. No credit card required.',
    plans: [
      { name: 'Starter', price: '149', period: 'MAD / month', featured: false, cta: 'Get started', features: ['1 location', 'Up to 3 QR codes', 'Basic dashboard', 'Weekly email report'] },
      { name: 'Pro', price: '299', period: 'MAD / month', featured: true, cta: 'Most popular', features: ['Up to 3 locations', 'Unlimited QR codes', 'Weekly AI insights', 'Staff module', 'Google review push', 'WhatsApp alerts'] },
      { name: 'Business', price: '699', period: 'MAD / month', featured: false, cta: 'Contact us', features: ['Unlimited locations', 'Full AI suite', 'Competitor benchmarking', 'White-label QR', 'API access', 'Priority support'] },
    ],
    band_title: 'Ready to truly know your customers?',
    band_sub: '14 days free. No credit card. Setup in 15 minutes.',
    band_cta: 'Create my free account →',
    nav: { features: 'Features', pricing: 'Pricing', how: 'How it works', login: 'Login', cta: 'Free Trial' },
  },
  es: {
    dir: 'ltr',
    badge: 'Diseñado para el mercado marroquí',
    h1a: 'Sabe lo que piensan', h1b: 'tus clientes,', h1c: 'antes de que sea tarde',
    sub: 'Un código QR en tu mesa. Tus clientes dan su opinión en 60 segundos. Recibes informes de IA cada semana.',
    cta1: 'Empezar gratis', cta2: 'Ver demo',
    s1: 'para dar opinión', s2: 'para empezar', s3: 'idiomas soportados', s4: 'automático',
    feat_label: 'Funciones', feat_title: 'Todo lo que necesitas',
    feat_sub: 'Desde la recopilación hasta el informe IA — todo automático. Tú te centras en tu negocio.',
    cards: [
      { icon: '📲', title: 'Código QR instantáneo', desc: 'Un QR único por establecimiento. Los clientes escanean y dan su opinión en menos de 60 segundos, sin app.' },
      { icon: '⭐', title: 'Valoraciones por categoría', desc: 'Comida, servicio, limpieza — configura las categorías según tu sector. Todo personalizable.' },
      { icon: '🧠', title: 'Análisis IA semanal', desc: 'Cada lunes, Claude analiza tus reseñas y te envía el problema principal y 1 acción concreta.' },
      { icon: '🌍', title: '4 idiomas soportados', desc: 'FR / AR / EN / ES — el formulario detecta el idioma automáticamente. Tus turistas están cubiertos.' },
      { icon: '🔒', title: 'Protege tu reputación', desc: 'Puntuación ≥ 4 → redirige a Google. Puntuación < 2.5 → opinión capturada de forma privada.' },
      { icon: '📊', title: 'Panel en tiempo real', desc: 'Puntuaciones, tendencias, comparativa semana a semana. Ve exactamente qué mejorar.' },
    ],
    how_label: 'Cómo funciona', how_title: 'Listo en 15 minutos',
    steps: [
      { title: 'Crea tu cuenta', desc: 'Regístrate, introduce el nombre de tu negocio, elige tus categorías.' },
      { title: 'Imprime el QR', desc: 'Descarga tu código QR y colócalo en tus mesas o menús.' },
      { title: 'Los clientes valoran', desc: 'Escanean, dan sus estrellas y envían en 60 segundos.' },
      { title: 'Recibe los informes', desc: 'Cada semana, un informe IA te dice qué mejorar primero.' },
    ],
    price_label: 'Precios', price_title: 'Simple y transparente',
    price_sub: 'Empieza gratis durante 14 días. Sin tarjeta requerida.',
    plans: [
      { name: 'Starter', price: '149', period: 'MAD / mes', featured: false, cta: 'Empezar', features: ['1 establecimiento', 'Hasta 3 códigos QR', 'Panel básico', 'Informe email semanal'] },
      { name: 'Pro', price: '299', period: 'MAD / mes', featured: true, cta: 'El más popular', features: ['Hasta 3 establecimientos', 'QR ilimitados', 'Informes IA semanales', 'Módulo empleados', 'Push Google reviews', 'Alertas WhatsApp'] },
      { name: 'Business', price: '699', period: 'MAD / mes', featured: false, cta: 'Contactar', features: ['Establecimientos ilimitados', 'Suite IA completa', 'Benchmark competidores', 'QR white-label', 'Acceso API', 'Soporte prioritario'] },
    ],
    band_title: '¿Listo para conocer de verdad a tus clientes?',
    band_sub: '14 días gratis. Sin tarjeta de crédito. Instalación en 15 minutos.',
    band_cta: 'Crear mi cuenta gratis →',
    nav: { features: 'Funciones', pricing: 'Precios', how: 'Cómo funciona', login: 'Iniciar sesión', cta: 'Prueba gratis' },
  },
}

function smoothScrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('fr')
  const [scrolled, setScrolled] = useState(false)
  const c = C[lang]

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#07101f}
        .fp{font-family:'Instrument Sans',sans-serif;color:#8899b0;overflow-x:hidden}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .65s ease forwards}
        .fu2{animation:fadeUp .65s .12s ease forwards;opacity:0}
        .fu3{animation:fadeUp .65s .22s ease forwards;opacity:0}
        .fu4{animation:fadeUp .65s .32s ease forwards;opacity:0}
        .nav{position:sticky;top:0;z-index:200;padding:0 44px;height:62px;display:flex;align-items:center;justify-content:space-between;gap:16px;transition:background .3s,box-shadow .3s}
        .nav.scrolled{background:rgba(7,16,31,.93);backdrop-filter:blur(18px);box-shadow:0 1px 0 rgba(255,255,255,.06)}
        .nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}
        .nav-mark{width:33px;height:33px;border-radius:10px;background:#028090;display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:14px;color:#fff}
        .nav-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:15px;color:#e8f0fa;letter-spacing:-.3px}
        .nav-links{display:flex;align-items:center;gap:2px}
        .nav-link{padding:7px 13px;border-radius:8px;font-size:13px;font-weight:500;color:#6b7c94;background:none;border:none;cursor:pointer;font-family:'Instrument Sans',sans-serif;transition:color .15s}
        .nav-link:hover{color:#e8f0fa}
        .nav-right{display:flex;align-items:center;gap:8px}
        .lang-sw{display:flex;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:3px;gap:2px}
        .lang-b{padding:4px 9px;border-radius:7px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:'Instrument Sans',sans-serif;transition:all .15s;background:transparent;color:#6b7c94}
        .lang-b.on{background:#028090;color:#fff}
        .lang-b:hover:not(.on){color:#e8f0fa}
        .btn-ghost{padding:8px 16px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:transparent;color:#8899b0;font-size:13px;font-weight:500;text-decoration:none;transition:all .15s;font-family:'Instrument Sans',sans-serif}
        .btn-ghost:hover{border-color:rgba(0,180,200,.4);color:#e8f0fa}
        .btn-teal{padding:9px 18px;border-radius:9px;background:#028090;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:all .15s;font-family:'Instrument Sans',sans-serif}
        .btn-teal:hover{background:#00b4c8;transform:translateY(-1px)}
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px 60px;text-align:center;position:relative}
        .hero::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:800px;height:480px;background:radial-gradient(ellipse at 50% 0%,rgba(0,180,200,.12),transparent 68%);pointer-events:none}
        .hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,180,200,.2),transparent)}
        .badge{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:20px;background:rgba(0,180,200,.08);border:1px solid rgba(0,180,200,.22);font-size:12px;font-weight:500;color:#7dd8e0;letter-spacing:.3px;margin-bottom:28px}
        .badge-dot{width:6px;height:6px;border-radius:50%;background:#00b4c8}
        .hero h1{font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:clamp(40px,5.5vw,70px);color:#e8f0fa;line-height:1.06;letter-spacing:-2.5px;max-width:760px}
        .accent{color:#00b4c8}
        .dim-line{display:block;color:#4a5a72;font-weight:500;font-size:.72em;letter-spacing:-1px;margin-top:6px}
        .hero-sub{font-size:17px;color:#5a6a82;line-height:1.75;max-width:500px;margin:22px auto 40px}
        .hero-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:72px}
        .cta-main{padding:14px 32px;border-radius:13px;background:#028090;color:#fff;font-size:15px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .2s;font-family:'Instrument Sans',sans-serif}
        .cta-main:hover{background:#00b4c8;transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,180,200,.28)}
        .cta-sec{padding:14px 26px;border-radius:13px;border:1px solid rgba(255,255,255,.1);color:#6b7c94;font-size:15px;font-weight:500;text-decoration:none;transition:all .15s;font-family:'Instrument Sans',sans-serif}
        .cta-sec:hover{border-color:rgba(0,180,200,.35);color:#e8f0fa}
        .stats{display:flex;justify-content:center;gap:52px;flex-wrap:wrap}
        .stat-n{font-family:'Cabinet Grotesk',sans-serif;font-size:32px;font-weight:900;color:#e8f0fa;letter-spacing:-1.5px}
        .stat-l{font-size:12px;color:#3d4e62;margin-top:4px}
        .browser{max-width:840px;margin:80px auto 0;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:#0d1927;box-shadow:0 24px 64px rgba(0,0,0,.4)}
        .browser-bar{padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:7px;background:#0a1422}
        .b-dot{width:10px;height:10px;border-radius:50%}
        .b-url{flex:1;background:rgba(255,255,255,.04);border-radius:5px;padding:4px 12px;font-size:11px;color:#3d4e62}
        .browser-sc{background:#eef3f8;padding:18px;display:flex;gap:12px}
        .bs-card{background:#fff;border-radius:11px;border:1px solid #e4ecf4;padding:15px;box-shadow:0 2px 6px rgba(10,22,40,.05)}
        .bs-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#028090,#02A8BE);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;flex-shrink:0}
        .bs-bar-bg{height:5px;border-radius:3px;background:#eaeff5;overflow:hidden;margin:3px 0}
        .bs-bar-fill{height:100%;border-radius:3px}
        .sec{padding:96px 40px;max-width:1060px;margin:0 auto}
        .sec-lbl{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#028090;margin-bottom:10px}
        .sec-title{font-family:'Cabinet Grotesk',sans-serif;font-size:clamp(28px,3.5vw,44px);font-weight:900;color:#e8f0fa;letter-spacing:-1.5px;line-height:1.08;margin-bottom:12px}
        .sec-sub{font-size:16px;color:#4a5a72;line-height:1.7;max-width:460px;margin-bottom:52px}
        .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
        .feat-card{background:#0d1927;border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:26px;transition:all .25s}
        .feat-card:hover{border-color:rgba(0,180,200,.28);background:#101f33;transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.2)}
        .feat-ico{width:42px;height:42px;border-radius:12px;background:rgba(0,180,200,.1);border:1px solid rgba(0,180,200,.18);display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:14px}
        .feat-t{font-family:'Cabinet Grotesk',sans-serif;font-size:15px;font-weight:700;color:#e8f0fa;margin-bottom:7px}
        .feat-d{font-size:13.5px;color:#4a5a72;line-height:1.65}
        .how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;position:relative}
        .how-grid::before{content:'';position:absolute;top:21px;left:9%;right:9%;height:1px;background:linear-gradient(90deg,transparent,rgba(0,180,200,.25),transparent)}
        .step{text-align:center;padding:0 18px}
        .step-n{width:42px;height:42px;border-radius:50%;border:1px solid rgba(0,180,200,.35);background:#0d1927;display:flex;align-items:center;justify-content:center;font-family:'Cabinet Grotesk',sans-serif;font-size:15px;font-weight:900;color:#00b4c8;margin:0 auto 14px;position:relative;z-index:1}
        .step-t{font-weight:700;color:#e8f0fa;font-size:14px;margin-bottom:6px;font-family:'Cabinet Grotesk',sans-serif}
        .step-d{font-size:12.5px;color:#4a5a72;line-height:1.6}
        .plan-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-top:48px}
        .plan{background:#0d1927;border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:30px 24px;position:relative;transition:all .25s}
        .plan:hover{border-color:rgba(0,180,200,.28);transform:translateY(-3px)}
        .plan.feat{background:rgba(0,180,200,.06);border-color:#028090}
        .plan-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#028090;color:#fff;font-size:10px;font-weight:700;padding:3px 12px;border-radius:20px;white-space:nowrap;letter-spacing:.5px}
        .plan-name{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3d4e62;margin-bottom:10px}
        .plan-price{font-family:'Cabinet Grotesk',sans-serif;font-size:44px;font-weight:900;color:#e8f0fa;letter-spacing:-2px;margin-bottom:4px}
        .plan-period{font-size:12px;color:#3d4e62;margin-bottom:22px}
        .plan-feats{list-style:none;margin-bottom:24px}
        .plan-feats li{font-size:13px;color:#5a6a82;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:7px}
        .plan-feats li::before{content:'✓';color:#00b4c8;font-weight:700;font-size:11px}
        .plan-btn{display:block;text-align:center;padding:11px;border-radius:10px;font-size:13.5px;font-weight:600;text-decoration:none;transition:all .15s;font-family:'Instrument Sans',sans-serif}
        .plan.feat .plan-btn{background:#028090;color:#fff}
        .plan.feat .plan-btn:hover{background:#00b4c8}
        .plan:not(.feat) .plan-btn{background:rgba(255,255,255,.05);color:#5a6a82;border:1px solid rgba(255,255,255,.08)}
        .plan:not(.feat) .plan-btn:hover{color:#e8f0fa;border-color:rgba(0,180,200,.3)}
        .band{margin:0 40px 80px;border-radius:20px;background:#0d1927;border:1px solid rgba(0,180,200,.2);padding:56px 48px;text-align:center;position:relative;overflow:hidden}
        .band::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(0,180,200,.08),transparent 60%);pointer-events:none}
        .band-t{font-family:'Cabinet Grotesk',sans-serif;font-size:clamp(24px,3.5vw,38px);font-weight:900;color:#e8f0fa;letter-spacing:-1px;margin-bottom:12px;position:relative}
        .band-s{font-size:15px;color:#4a5a72;margin-bottom:28px;position:relative}
        .band-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 36px;background:#028090;color:#fff;border-radius:13px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Instrument Sans',sans-serif;transition:all .2s;position:relative}
        .band-btn:hover{background:#00b4c8;transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,180,200,.28)}
        .footer{border-top:1px solid rgba(255,255,255,.06);padding:32px 44px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
        .footer-logo{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:14px;color:#e8f0fa}
        .footer-links{display:flex;gap:20px;flex-wrap:wrap}
        .footer-links button{font-size:13px;color:#3d4e62;background:none;border:none;cursor:pointer;font-family:'Instrument Sans',sans-serif;transition:color .15s}
        .footer-links button:hover{color:#8899b0}
        .footer-links a{font-size:13px;color:#3d4e62;text-decoration:none;transition:color .15s}
        .footer-links a:hover{color:#8899b0}
        .footer-copy{font-size:12px;color:#2a3545}
        @media(max-width:768px){
          .nav{padding:0 18px}
          .nav-links{display:none}
          .hero{padding:72px 18px 48px;min-height:auto}
          .sec{padding:64px 18px}
          .band{margin:0 18px 60px;padding:36px 22px}
          .footer{padding:24px 18px}
          .how-grid::before{display:none}
          .stats{gap:28px}
          .browser{margin-left:0;margin-right:0;border-radius:0;border-left:none;border-right:none}
        }
      `}</style>

      <div className="fp" dir={c.dir}>

        {/* NAV */}
        <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
          <a href="/" className="nav-logo">
            <div className="nav-mark">F</div>
            <span className="nav-name">FeedbackPro</span>
          </a>
          <div className="nav-links">
            <button className="nav-link" onClick={() => smoothScrollTo('features')}>{c.nav.features}</button>
            <button className="nav-link" onClick={() => smoothScrollTo('how')}>{c.nav.how}</button>
            <button className="nav-link" onClick={() => smoothScrollTo('pricing')}>{c.nav.pricing}</button>
          </div>
          <div className="nav-right">
            <div className="lang-sw">
              {(['fr','ar','en','es'] as Lang[]).map(l => (
                <button key={l} className={`lang-b${lang===l?' on':''}`} onClick={() => setLang(l)}>
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
            <a href="/login" className="btn-ghost">{c.nav.login}</a>
            <a href="/register" className="btn-teal">{c.nav.cta}</a>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="badge fu"><div className="badge-dot"></div>{c.badge}</div>
          <h1 className="fu2">
            {c.h1a} <span className="accent">{c.h1b}</span>
            <span className="dim-line">{c.h1c}</span>
          </h1>
          <p className="hero-sub fu3">{c.sub}</p>
          <div className="hero-cta fu4">
            <a href="/register" className="cta-main">
              {c.cta1}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
            <a href="/r/al-badr-casablanca" className="cta-sec">{c.cta2} →</a>
          </div>
          <div className="stats fu4">
            {[{n:'60s',l:c.s1},{n:'0 MAD',l:c.s2},{n:'4',l:c.s3},{n:'100%',l:c.s4}].map((s,i) => (
              <div key={i}>
                <div className="stat-n">{s.n}</div>
                <div className="stat-l">{s.l}</div>
              </div>
            ))}
          </div>

          {/* BROWSER */}
          <div className="browser">
            <div className="browser-bar">
              <div className="b-dot" style={{background:'#EF4444'}}></div>
              <div className="b-dot" style={{background:'#F59E0B'}}></div>
              <div className="b-dot" style={{background:'#10B981'}}></div>
              <div className="b-url">app.feedbackpro.ma/dashboard</div>
            </div>
            <div className="browser-sc">
              <div className="bs-card" style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                  <div className="bs-av">AB</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:'#0A1628'}}>Restaurant Al Badr</div>
                    <div style={{fontSize:10,color:'#6B7C93'}}>Casablanca · Pro</div>
                  </div>
                  <div style={{marginLeft:'auto',fontSize:11,background:'#D1FAE5',color:'#065F46',padding:'2px 8px',borderRadius:6,fontWeight:600}}>✓ Actif</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
                  {[{n:'3.8',l:'Score',c:'#028090'},{n:'47',l:'Avis',c:'#0A1628'},{n:'+6',l:'Google',c:'#10B981'}].map((m,i) => (
                    <div key={i} style={{background:'#F5F8FB',borderRadius:8,padding:'10px 6px',textAlign:'center'}}>
                      <div style={{fontSize:18,fontWeight:800,color:m.c}}>{m.n}</div>
                      <div style={{fontSize:9,color:'#6B7C93'}}>{m.l}</div>
                    </div>
                  ))}
                </div>
                {[{l:'Nourriture',w:'88%',c:'#028090'},{l:'Service',w:'42%',c:'#EF4444'},{l:'Propreté',w:'80%',c:'#028090'},{l:'Ambiance',w:'76%',c:'#028090'}].map((b,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                    <span style={{fontSize:10,color:'#6B7C93',width:66,flexShrink:0}}>{b.l}</span>
                    <div className="bs-bar-bg" style={{flex:1}}><div className="bs-bar-fill" style={{width:b.w,background:b.c}}></div></div>
                    <span style={{fontSize:10,fontWeight:700,color:b.c,width:22,textAlign:'right'}}>{(parseFloat(b.w)/20).toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <div className="bs-card" style={{width:152,flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}>
                  <div className="bs-av" style={{width:26,height:26,borderRadius:7,fontSize:9}}>AB</div>
                  <span style={{fontSize:10,fontWeight:700,color:'#0A1628'}}>Al Badr</span>
                </div>
                {[{l:'Nourriture',s:5},{l:'Service',s:2},{l:'Propreté',s:4}].map((r,i) => (
                  <div key={i} style={{marginBottom:9}}>
                    <div style={{fontSize:9,color:'#6B7C93',marginBottom:4}}>{r.l}</div>
                    <div style={{display:'flex',gap:2}}>
                      {[1,2,3,4,5].map(star => (
                        <div key={star} style={{width:18,height:18,borderRadius:4,background:star<=r.s?'#FEF3C7':'#F5F8FB',border:`1px solid ${star<=r.s?'#FCD34D':'#E8EEF4'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <span style={{fontSize:9,color:star<=r.s?'#F59E0B':'#C8D4E0'}}>★</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{width:'100%',padding:'7px',background:'#028090',borderRadius:7,textAlign:'center',fontSize:9,fontWeight:700,color:'#fff',marginTop:6}}>Envoyer →</div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="sec">
          <div className="sec-lbl">{c.feat_label}</div>
          <div className="sec-title">{c.feat_title}</div>
          <div className="sec-sub">{c.feat_sub}</div>
          <div className="feat-grid">
            {c.cards.map((f,i) => (
              <div key={i} className="feat-card">
                <div className="feat-ico">{f.icon}</div>
                <div className="feat-t">{f.title}</div>
                <div className="feat-d">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="sec" style={{paddingTop:0}}>
          <div style={{textAlign:'center',marginBottom:52}}>
            <div className="sec-lbl" style={{textAlign:'center'}}>{c.how_label}</div>
            <div className="sec-title" style={{textAlign:'center',marginBottom:0}}>{c.how_title}</div>
          </div>
          <div className="how-grid">
            {c.steps.map((s,i) => (
              <div key={i} className="step">
                <div className="step-n">{i+1}</div>
                <div className="step-t">{s.title}</div>
                <div className="step-d">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="sec" style={{paddingTop:0}}>
          <div className="sec-lbl">{c.price_label}</div>
          <div className="sec-title">{c.price_title}</div>
          <div className="sec-sub">{c.price_sub}</div>
          <div className="plan-grid">
            {c.plans.map((p,i) => (
              <div key={i} className={`plan${p.featured?' feat':''}`}>
                {p.featured && <div className="plan-badge">{p.cta}</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price">{p.price}</div>
                <div className="plan-period">{p.period}</div>
                <ul className="plan-feats">{p.features.map((f,j) => <li key={j}>{f}</li>)}</ul>
                <a href="/register" className="plan-btn">{p.featured ? '→ ' : ''}{p.cta}</a>
              </div>
            ))}
          </div>
        </section>

        {/* BAND */}
        <div className="band">
          <div className="band-t">{c.band_title}</div>
          <div className="band-s">{c.band_sub}</div>
          <a href="/register" className="band-btn">{c.band_cta}</a>
        </div>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-logo">FeedbackPro.ma</div>
          <div className="footer-links">
            <button onClick={() => smoothScrollTo('features')}>{c.nav.features}</button>
            <button onClick={() => smoothScrollTo('how')}>{c.nav.how}</button>
            <button onClick={() => smoothScrollTo('pricing')}>{c.nav.pricing}</button>
            <a href="/login">{c.nav.login}</a>
            <a href="/register">{c.nav.cta}</a>
          </div>
          <div className="footer-copy">© 2025 FeedbackPro Morocco</div>
        </footer>

      </div>
    </>
  )
}