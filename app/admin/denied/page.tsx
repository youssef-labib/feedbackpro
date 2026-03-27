'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import AppNavbar, { getPublicNavItems } from '../../../components/AppNavbar'
import { useStoredLanguage } from '../../../components/useStoredLanguage'

export default function AdminDeniedPage() {
  const { lang, setLang, copyLang, isRTL } = useStoredLanguage('fr')

  const actionLabels = {
    fr: { dashboard: 'Retour au dashboard', home: 'Accueil' },
    ar: { dashboard: 'العودة إلى لوحة التحكم', home: 'الصفحة الرئيسية' },
    en: { dashboard: 'Back to dashboard', home: 'Home' },
    es: { dashboard: 'Volver al dashboard', home: 'Inicio' },
  }[copyLang]

  return (
    <div className="page-shell" dir={isRTL ? 'rtl' : 'ltr'}>
      <AppNavbar
        lang={lang}
        setLang={setLang}
        isRTL={isRTL}
        navItems={getPublicNavItems(lang)}
        actions={[{ href: '/', label: actionLabels.home, variant: 'secondary' }]}
        mobileEyebrow="Admin"
      />

      <main className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <section className="surface-card empty-state">
            <div className="feature-icon" style={{ margin: '0 auto' }}>
              <Lock size={20} />
            </div>
            <h1 className="empty-title">Access denied</h1>
            <p className="empty-copy">
              This area is reserved for admin accounts only. If you should have access, update the profile role first.
            </p>
            <div className="inline-actions" style={{ justifyContent: 'center', marginTop: 18 }}>
              <Link href="/dashboard" className="button button-secondary">
                {actionLabels.dashboard}
              </Link>
              <Link href="/" className="button button-primary">
                {actionLabels.home}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
