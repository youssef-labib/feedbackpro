'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import AuthShell from '../../components/AuthShell'
import { useStoredLanguage } from '../../components/useStoredLanguage'

const CITIES = [
  'Casablanca',
  'Rabat',
  'Sale',
  'Temara',
  'Mohammedia',
  'Tanger',
  'Tetouan',
  'Oujda',
  'Nador',
  'Chefchaouen',
  'Fes',
  'Meknes',
  'Marrakech',
  'Agadir',
  'Essaouira',
  'Ouarzazate',
  'Laayoune',
  'Beni Mellal',
  'Khouribga',
  'Khenifra',
  'Settat',
  'Berrechid',
  'Larache',
  'Al Hoceima',
  'Midelt',
  'Errachidia',
  'Tiznit',
  'Taroudant',
  'Ifrane',
  'Dakhla',
]

const SECTORS = {
  fr: [
    { value: 'restaurant', label: 'Restaurant / Cafe' },
    { value: 'gym', label: 'Salle de sport' },
    { value: 'hotel', label: 'Hotel / Riad' },
    { value: 'car_rental', label: 'Location de voitures' },
    { value: 'other', label: 'Autre' },
  ],
  ar: [
    { value: 'restaurant', label: 'مطعم / مقهى' },
    { value: 'gym', label: 'قاعة رياضية' },
    { value: 'hotel', label: 'فندق / رياض' },
    { value: 'car_rental', label: 'كراء السيارات' },
    { value: 'other', label: 'اخرى' },
  ],
  en: [
    { value: 'restaurant', label: 'Restaurant / Cafe' },
    { value: 'gym', label: 'Gym' },
    { value: 'hotel', label: 'Hotel / Riad' },
    { value: 'car_rental', label: 'Car rental' },
    { value: 'other', label: 'Other' },
  ],
} as const

const COPY = {
  fr: {
    topLink: 'Connexion',
    title1: 'Creez votre compte.',
    subtitle1: 'Commencez par votre email puis ajoutez les details du business.',
    title2: 'Parlez-nous de votre business.',
    subtitle2: 'Ces informations servent a preparer le dashboard et le formulaire public.',
    badge: '14 jours gratuits',
    email: 'Adresse email',
    password: 'Mot de passe',
    business: 'Nom du business',
    city: 'Ville',
    sector: 'Type de business',
    continue: 'Continuer',
    back: 'Retour',
    create: 'Creer mon compte',
    creating: 'Creation...',
    haveAccount: 'Vous avez deja un compte ?',
    signIn: 'Se connecter',
    accountError: 'Impossible de creer le compte.',
    businessError: 'Impossible de creer le business.',
    networkError: 'Erreur reseau. Reessayez.',
    sideTitle: 'Un onboarding court, sans bruit.',
    sideText: 'Le but est d arriver vite au dashboard sans vous perdre dans un long setup.',
    sideItems: [
      'Inscription en deux etapes simples.',
      'Questions et QR configures juste apres.',
      'La structure reste propre pour evoluer vite.',
    ],
  },
  ar: {
    topLink: 'تسجيل الدخول',
    title1: 'انشئ حسابك.',
    subtitle1: 'ابدأ بالبريد ثم اضف معلومات النشاط.',
    title2: 'اخبرنا عن نشاطك.',
    subtitle2: 'هذه المعلومات ستجهز لوحة التحكم والنموذج العام.',
    badge: '14 يوما مجانا',
    email: 'البريد الالكتروني',
    password: 'كلمة المرور',
    business: 'اسم النشاط',
    city: 'المدينة',
    sector: 'نوع النشاط',
    continue: 'متابعة',
    back: 'رجوع',
    create: 'انشاء الحساب',
    creating: 'جاري الانشاء...',
    haveAccount: 'لديك حساب بالفعل؟',
    signIn: 'تسجيل الدخول',
    accountError: 'تعذر انشاء الحساب.',
    businessError: 'تعذر انشاء النشاط.',
    networkError: 'خطأ في الشبكة. حاول مرة اخرى.',
    sideTitle: 'تهيئة قصيرة وواضحة.',
    sideText: 'نوصلك بسرعة الى لوحة التحكم بدون خطوات مزعجة.',
    sideItems: [
      'تسجيل على خطوتين فقط.',
      'الاسئلة و QR مباشرة بعد ذلك.',
      'هيكلة واضحة تساعدك على تطوير المنتج لاحقا.',
    ],
  },
  en: {
    topLink: 'Login',
    title1: 'Create your account.',
    subtitle1: 'Start with your email, then add the business details.',
    title2: 'Tell us about your business.',
    subtitle2: 'This prepares the dashboard and the public feedback form.',
    badge: '14-day free trial',
    email: 'Email address',
    password: 'Password',
    business: 'Business name',
    city: 'City',
    sector: 'Business type',
    continue: 'Continue',
    back: 'Back',
    create: 'Create account',
    creating: 'Creating...',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    accountError: 'Could not create account.',
    businessError: 'Could not create business.',
    networkError: 'Network error. Please try again.',
    sideTitle: 'Short onboarding, clear next step.',
    sideText: 'The product gets you to the dashboard quickly without a noisy setup.',
    sideItems: [
      'Two simple registration steps.',
      'Questions and QR setup come right after.',
      'A clean structure that stays easy to improve later.',
    ],
  },
} as const

export default function RegisterPage() {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [city, setCity] = useState('')
  const [sector, setSector] = useState('restaurant')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (step === 1) {
      setStep(2)
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError(copy.accountError)
        setLoading(false)
        return
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          city,
          sector,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || copy.businessError)
        setLoading(false)
        return
      }

      window.location.href = '/setup'
    } catch {
      setError(copy.networkError)
      setLoading(false)
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <AuthShell
        lang={lang}
        setLang={setLang}
        title={step === 1 ? copy.title1 : copy.title2}
        subtitle={step === 1 ? copy.subtitle1 : copy.subtitle2}
        badge={copy.badge}
        topLink={{ href: '/login', label: copy.topLink }}
        sideTitle={copy.sideTitle}
        sideText={copy.sideText}
        sideItems={copy.sideItems}
      >
        <div className="auth-stepbar">
          <div className={`auth-step${step >= 1 ? ' active' : ''}`} />
          <div className={`auth-step${step >= 2 ? ' active' : ''}`} />
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="field">
                <label className="label">{copy.email}</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field">
                <label className="label">{copy.password}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    autoComplete="new-password"
                    required
                    style={{ paddingInlineEnd: 52 }}
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((value) => !value)}
                    style={{
                      position: 'absolute',
                      insetInlineEnd: 14,
                      top: 14,
                      color: 'var(--muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label className="label">{copy.business}</label>
                <input
                  type="text"
                  className="input"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="FeedbackPro Cafe"
                  required
                />
              </div>

              <div className="field">
                <label className="label">{copy.city}</label>
                <select
                  className="select"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                >
                  <option value="">Select city</option>
                  {CITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">{copy.sector}</label>
                <select
                  className="select"
                  value={sector}
                  onChange={(event) => setSector(event.target.value)}
                >
                  {SECTORS[copyLang].map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error ? <div className="message message-error">{error}</div> : null}

          <div className="inline-actions" style={{ marginTop: 8 }}>
            {step === 2 ? (
              <button type="button" className="button button-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} />
                {copy.back}
              </button>
            ) : null}

            <button type="submit" className="button button-primary" disabled={loading} style={{ flex: 1 }}>
              {step === 1 ? copy.continue : loading ? copy.creating : copy.create}
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="muted-line" style={{ marginTop: 18, textAlign: 'center' }}>
            {copy.haveAccount}{' '}
            <Link href="/login" className="inline-link">
              {copy.signIn}
            </Link>
          </p>
        </form>
      </AuthShell>
    </div>
  )
}
