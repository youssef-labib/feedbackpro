'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import AuthShell from '../../components/AuthShell'
import { useStoredLanguage } from '../../components/useStoredLanguage'

const COPY = {
  fr: {
    topLink: 'Retour a la connexion',
    title: 'Recuperez votre mot de passe.',
    subtitle: 'Entrez votre email et nous vous envoyons un lien de reinitialisation.',
    email: 'Adresse email',
    submit: 'Envoyer le lien',
    loading: 'Envoi...',
    sentTitle: 'Email envoye.',
    sentText: 'Verifiez votre boite mail puis ouvrez le lien pour choisir un nouveau mot de passe.',
    tryAgain: 'Reessayer',
    genericError: 'Une erreur est survenue.',
    sideTitle: 'Le flow reste simple.',
    sideText: 'Mot de passe oublie, lien recu, nouveau mot de passe, retour a la connexion.',
    sideItems: [
      'Aucun ecran inutile.',
      'Le lien revient vers votre app.',
      'Le meme style reste coherent partout.',
    ],
  },
  ar: {
    topLink: 'العودة الى الدخول',
    title: 'استرجع كلمة المرور.',
    subtitle: 'ادخل بريدك وسنرسل لك رابطا لاعادة التعيين.',
    email: 'البريد الالكتروني',
    submit: 'ارسال الرابط',
    loading: 'جاري الارسال...',
    sentTitle: 'تم ارسال البريد.',
    sentText: 'تحقق من بريدك وافتح الرابط لاختيار كلمة مرور جديدة.',
    tryAgain: 'حاول من جديد',
    genericError: 'حدث خطأ.',
    sideTitle: 'المسار واضح وبسيط.',
    sideText: 'نسيت كلمة المرور، استقبلت الرابط، غيرتها، ثم عدت للدخول.',
    sideItems: [
      'بدون شاشات مزعجة.',
      'الرابط يعود الى التطبيق.',
      'نفس الشكل متناسق في كل الصفحات.',
    ],
  },
  en: {
    topLink: 'Back to login',
    title: 'Recover your password.',
    subtitle: 'Enter your email and we will send you a password reset link.',
    email: 'Email address',
    submit: 'Send link',
    loading: 'Sending...',
    sentTitle: 'Email sent.',
    sentText: 'Check your inbox and open the link to choose a new password.',
    tryAgain: 'Try again',
    genericError: 'Something went wrong.',
    sideTitle: 'The flow stays clean.',
    sideText: 'Forgot password, receive link, update password, back to login.',
    sideItems: [
      'No unnecessary screens.',
      'The link returns to your app.',
      'The same visual language stays consistent everywhere.',
    ],
  },
} as const

export default function ForgotPasswordPage() {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')
  const copy = COPY[copyLang]
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError(copy.genericError)
    }

    setLoading(false)
  }

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
        {sent ? (
          <div className="stack">
            <div className="message message-success">
              <strong>{copy.sentTitle}</strong>
              <div style={{ marginTop: 6 }}>{copy.sentText}</div>
            </div>
            <button type="button" className="button button-secondary" onClick={() => setSent(false)}>
              {copy.tryAgain}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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

            {error ? <div className="message message-error">{error}</div> : null}

            <button type="submit" className="button button-primary" disabled={loading} style={{ width: '100%' }}>
              <Mail size={16} />
              {loading ? copy.loading : copy.submit}
            </button>

            <p className="muted-line" style={{ marginTop: 18, textAlign: 'center' }}>
              <Link href="/login" className="inline-link">
                {copy.topLink}
              </Link>
            </p>
          </form>
        )}
      </AuthShell>
    </div>
  )
}
