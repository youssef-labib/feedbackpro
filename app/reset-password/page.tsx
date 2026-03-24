'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import AuthShell from '../../components/AuthShell'
import { type Lang, useStoredLanguage } from '../../components/useStoredLanguage'

type Copy = {
  topLink: string
  title: string
  subtitle: string
  password: string
  confirm: string
  min: string
  mismatch: string
  match: string
  submit: string
  loading: string
  checking: string
  invalidTitle: string
  invalidText: string
  newRequest: string
  successTitle: string
  successText: string
  sideTitle: string
  sideText: string
  sideItems: ReadonlyArray<string>
}

const COPY: Record<'fr' | 'ar' | 'en', Copy> = {
  fr: {
    topLink: 'Retour a la connexion',
    title: 'Choisissez un nouveau mot de passe.',
    subtitle: 'Utilisez un mot de passe simple a retenir mais assez solide pour votre compte.',
    password: 'Nouveau mot de passe',
    confirm: 'Confirmation',
    min: 'Minimum 6 caracteres',
    mismatch: 'Les mots de passe ne correspondent pas.',
    match: 'Les mots de passe correspondent.',
    submit: 'Enregistrer le mot de passe',
    loading: 'Mise a jour...',
    checking: 'Verification du lien...',
    invalidTitle: 'Lien invalide',
    invalidText: 'Le lien est invalide ou expire. Refaites une demande de reinitialisation.',
    newRequest: 'Nouvelle demande',
    successTitle: 'Mot de passe mis a jour.',
    successText: 'Redirection vers la page de connexion...',
    sideTitle: 'Un flow de reset plus propre.',
    sideText: 'Le produit garde le meme style et le meme niveau de clarte, meme sur les pages secondaires.',
    sideItems: [
      'Verification du lien de recuperation.',
      'Mise a jour directe du mot de passe.',
      'Retour propre vers la connexion.',
    ],
  },
  ar: {
    topLink: 'العودة الى الدخول',
    title: 'اختر كلمة مرور جديدة.',
    subtitle: 'استخدم كلمة سهلة التذكر لكن مناسبة لحماية الحساب.',
    password: 'كلمة المرور الجديدة',
    confirm: 'تأكيد كلمة المرور',
    min: 'الحد الادنى 6 احرف',
    mismatch: 'كلمتا المرور غير متطابقتين.',
    match: 'كلمتا المرور متطابقتان.',
    submit: 'حفظ كلمة المرور',
    loading: 'جاري التحديث...',
    checking: 'جاري التحقق من الرابط...',
    invalidTitle: 'رابط غير صالح',
    invalidText: 'الرابط غير صالح او منتهي. اطلب رابطا جديدا.',
    newRequest: 'طلب جديد',
    successTitle: 'تم تحديث كلمة المرور.',
    successText: 'جاري التحويل الى صفحة الدخول...',
    sideTitle: 'مسار اعادة التعيين اوضح.',
    sideText: 'حتى الصفحات الثانوية تبقى بنفس الجودة والبساطة.',
    sideItems: [
      'التحقق من رابط الاسترجاع.',
      'تحديث مباشر لكلمة المرور.',
      'رجوع واضح الى صفحة الدخول.',
    ],
  },
  en: {
    topLink: 'Back to login',
    title: 'Choose a new password.',
    subtitle: 'Use a password that is easy to remember but strong enough for your account.',
    password: 'New password',
    confirm: 'Confirm password',
    min: 'Minimum 6 characters',
    mismatch: 'Passwords do not match.',
    match: 'Passwords match.',
    submit: 'Save password',
    loading: 'Updating...',
    checking: 'Checking link...',
    invalidTitle: 'Invalid link',
    invalidText: 'The link is invalid or expired. Request a new reset email.',
    newRequest: 'New request',
    successTitle: 'Password updated.',
    successText: 'Redirecting to login...',
    sideTitle: 'A cleaner reset flow.',
    sideText: 'Even the secondary pages keep the same level of clarity and polish.',
    sideItems: [
      'Recovery link validation.',
      'Direct password update.',
      'Clean return to login.',
    ],
  },
}

function ResetForm({ lang }: { lang: Lang }) {
  const searchParams = useSearchParams()
  const copy = COPY[lang === 'es' ? 'en' : lang]
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}

    async function init() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && active) {
          setReady(true)
        }
      })
      unsubscribe = () => subscription.unsubscribe()

      const code = searchParams.get('code')

      if (code) {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
        if (!active) return
        if (sessionError) {
          setError(copy.invalidText)
        } else {
          setReady(true)
        }
      } else if (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery')) {
        setReady(true)
      } else {
        setError(copy.invalidText)
      }
    }

    init()

    return () => {
      active = false
      unsubscribe()
    }
  }, [copy.invalidText, searchParams])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (password !== confirm) {
      setError(copy.mismatch)
      return
    }

    if (password.length < 6) {
      setError(copy.min)
      return
    }

    setLoading(true)
    setError('')

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => window.location.replace('/login'), 1800)
  }

  if (done) {
    return (
      <div className="message message-success" style={{ marginBottom: 0 }}>
        <strong>{copy.successTitle}</strong>
        <div style={{ marginTop: 6 }}>{copy.successText}</div>
      </div>
    )
  }

  if (error && !ready) {
    return (
      <div className="stack">
        <div className="message message-error" style={{ marginBottom: 0 }}>
          <strong>{copy.invalidTitle}</strong>
          <div style={{ marginTop: 6 }}>{copy.invalidText}</div>
        </div>
        <Link href="/forgot-password" className="button button-secondary">
          <TriangleAlert size={16} />
          {copy.newRequest}
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="message" style={{ border: '1px solid var(--border)', marginBottom: 0 }}>
        <LoaderCircle size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
        {copy.checking}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label className="label">{copy.password}</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={copy.min}
            minLength={6}
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

      <div className="field">
        <label className="label">{copy.confirm}</label>
        <input
          type={showPassword ? 'text' : 'password'}
          className="input"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder={copy.confirm}
          required
        />
        {confirm ? (
          <div className="help-text" style={{ color: confirm === password ? 'var(--success)' : 'var(--danger)' }}>
            {confirm === password ? copy.match : copy.mismatch}
          </div>
        ) : null}
      </div>

      {error ? <div className="message message-error">{error}</div> : null}

      <button
        type="submit"
        className="button button-primary"
        disabled={loading || password.length < 6 || password !== confirm}
        style={{ width: '100%' }}
      >
        {loading ? copy.loading : copy.submit}
        {!loading ? <ArrowRight size={16} /> : null}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <AuthShell
        lang={lang}
        setLang={setLang}
        title={copy.title}
        subtitle={copy.subtitle}
        topLink={{ href: '/login', label: copy.topLink }}
        sideTitle={copy.sideTitle}
        sideText={copy.sideText}
        sideItems={copy.sideItems}
      >
        <Suspense fallback={<div className="message">{copy.checking}</div>}>
          <ResetForm lang={lang} />
        </Suspense>
        <div style={{ marginTop: 18 }}>
          <Link href="/login" className="inline-link">
            {copy.topLink}
          </Link>
        </div>
      </AuthShell>
    </div>
  )
}
