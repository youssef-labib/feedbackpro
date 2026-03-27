'use client'

import type { ReactNode } from 'react'
import AppNavbar, { getPublicNavItems } from './AppNavbar'
import type { Lang } from './useStoredLanguage'

export default function AuthShell({
  lang,
  setLang,
  title,
  subtitle,
  badge,
  topLink,
  children,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  title: string
  subtitle: string
  badge?: string
  topLink?: { href: string; label: string }
  sideTitle: string
  sideText: string
  sideItems: ReadonlyArray<string>
  children: ReactNode
}) {
  return (
    <div className="page-shell">
      <AppNavbar
        lang={lang}
        setLang={setLang}
        navItems={getPublicNavItems(lang)}
        actions={topLink ? [{ href: topLink.href, label: topLink.label, variant: 'secondary' }] : []}
        mobileEyebrow={badge || title}
      />

      <main className="split-shell auth-shell-center">
        <div className="container auth-layout">
          <section className="surface-card auth-card">
            {badge ? <div className="pill accent-pill" style={{ marginBottom: 18 }}>{badge}</div> : null}
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            {children}
          </section>
        </div>
      </main>
    </div>
  )
}
