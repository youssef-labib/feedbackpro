import type { ReactNode } from 'react'
import Link from 'next/link'
import AppLogo from './AppLogo'
import FlagLangSelector from './FlagLangSelector'
import type { Lang } from './useStoredLanguage'

export default function AuthShell({
  lang,
  setLang,
  title,
  subtitle,
  badge,
  topLink,
  sideTitle,
  sideText,
  sideItems,
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
      <header className="topbar">
        <div className="container topbar-inner">
          <AppLogo />
          <div className="topbar-actions">
            <FlagLangSelector lang={lang} setLang={setLang} options={['fr', 'ar', 'en', 'es']} />
            {topLink ? (
              <Link href={topLink.href} className="nav-link">
                {topLink.label}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="split-shell">
        <div className="container auth-layout">
          <section className="surface-card auth-card">
            {badge ? <div className="pill accent-pill" style={{ marginBottom: 18 }}>{badge}</div> : null}
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            {children}
          </section>

          <aside className="surface-card auth-side">
            <div className="section-eyebrow">FeedbackPro</div>
            <h2 className="card-title" style={{ marginTop: 0 }}>{sideTitle}</h2>
            <p className="card-copy">{sideText}</p>
            <div className="list" style={{ marginTop: 22 }}>
              {sideItems.map((item) => (
                <div key={item} className="list-row">
                  <span className="list-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
