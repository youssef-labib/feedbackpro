'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import AuthShell from '../../components/AuthShell'
import { useStoredLanguage } from '../../components/useStoredLanguage'

const COPY = {
  fr: {
    topLink: 'Creer un compte',
    title: 'Connectez-vous a votre espace.',
    subtitle: 'Accedez a votre dashboard, vos questions, vos QR codes et vos retours clients.',
    email: 'Adresse email',
    password: 'Mot de passe',
    forgot: 'Mot de passe oublie ?',
    submit: 'Se connecter',
    loading: 'Connexion...',
    noAccount: "Pas encore de compte ?",
    create: 'Creer un compte',
    invalid: 'Email ou mot de passe incorrect.',
    sideTitle: 'Un espace simple pour piloter vos feedbacks.',
    sideText: 'Le dashboard garde les informations utiles visibles sans surcharge.',
    sideItems: [
      'Consultez les avis recus en temps reel.',
      'Mettez a jour vos questions sans casser le formulaire public.',
      'Gerez votre QR code, votre plan et vos reglages depuis un seul espace.',
    ],
  },
  ar: {
    topLink: 'انشاء حساب',
    title: 'سجل الدخول الى مساحتك.',
    subtitle: 'ادخل الى لوحة التحكم والاسئلة و QR واراء العملاء.',
    email: 'البريد الالكتروني',
    password: 'كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    submit: 'تسجيل الدخول',
    loading: 'جاري تسجيل الدخول...',
    noAccount: 'ليس لديك حساب؟',
    create: 'انشاء حساب',
    invalid: 'البريد او كلمة المرور غير صحيحة.',
    sideTitle: 'مساحة بسيطة لمتابعة اراء العملاء.',
    sideText: 'كل ما تحتاجه موجود بشكل واضح ومرتب.',
    sideItems: [
      'اطلع على الاراء بشكل مباشر.',
      'حدث الاسئلة بدون تعقيد.',
      'تحكم في QR والخطة والاعدادات من مكان واحد.',
    ],
  },
  en: {
    topLink: 'Create account',
    title: 'Sign in to your workspace.',
    subtitle: 'Access your dashboard, questions, QR codes, and customer feedback.',
    email: 'Email address',
    password: 'Password',
    forgot: 'Forgot password?',
    submit: 'Sign in',
    loading: 'Signing in...',
    noAccount: 'No account yet?',
    create: 'Create account',
    invalid: 'Invalid email or password.',
    sideTitle: 'A simple workspace for feedback operations.',
    sideText: 'The dashboard keeps the important information visible without clutter.',
    sideItems: [
      'See incoming reviews in real time.',
      'Update questions without breaking the public form.',
      'Manage your QR, plan, and settings from one place.',
    ],
  },
} as const

export default function LoginPage() {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message === 'Invalid login credentials' ? copy.invalid : authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()

      window.location.href = profile?.is_admin ? '/admin' : '/dashboard'
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <AuthShell
        lang={lang}
        setLang={setLang}
        title={copy.title}
        subtitle={copy.subtitle}
        topLink={{ href: '/register', label: copy.topLink }}
        sideTitle={copy.sideTitle}
        sideText={copy.sideText}
        sideItems={copy.sideItems}
      >
        <form onSubmit={handleLogin}>
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
            <div className="field-row">
              <label className="label" style={{ marginBottom: 0 }}>{copy.password}</label>
              <Link href="/forgot-password" className="inline-link">
                {copy.forgot}
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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

          {error ? <div className="message message-error">{error}</div> : null}

          <button type="submit" className="button button-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? copy.loading : copy.submit}
            {!loading ? <ArrowRight size={16} /> : null}
          </button>

          <p className="muted-line" style={{ marginTop: 18, textAlign: 'center' }}>
            {copy.noAccount}{' '}
            <Link href="/register" className="inline-link">
              {copy.create}
            </Link>
          </p>
        </form>
      </AuthShell>
    </div>
  )
}
