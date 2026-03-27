'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import AppLogo from './AppLogo'
import FlagLangSelector from './FlagLangSelector'
import ThemeToggle from './ThemeToggle'
import type { Lang } from './useStoredLanguage'

type NavbarItem = {
  href: string
  label: string
}

type NavbarAction = {
  label: string
  href?: string
  onClick?: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger'
  arrow?: boolean
}

const PUBLIC_NAV_COPY: Record<Lang, { features: string; workflow: string; pricing: string }> = {
  fr: {
    features: 'Fonctions',
    workflow: 'Parcours',
    pricing: 'Tarifs',
  },
  ar: {
    features: 'الميزات',
    workflow: 'الخطوات',
    pricing: 'الأسعار',
  },
  en: {
    features: 'Features',
    workflow: 'Workflow',
    pricing: 'Pricing',
  },
  es: {
    features: 'Funciones',
    workflow: 'Flujo',
    pricing: 'Precios',
  },
}

export function getPublicNavItems(lang: Lang): NavbarItem[] {
  const copy = PUBLIC_NAV_COPY[lang]

  return [
    { href: '/#features', label: copy.features },
    { href: '/#workflow', label: copy.workflow },
    { href: '/#pricing', label: copy.pricing },
  ]
}

export default function AppNavbar({
  lang,
  setLang,
  isRTL,
  brandHref = '/',
  brandTitle = 'FeedbackPro',
  brandCaption = 'Customer feedback platform',
  navItems = [],
  actions = [],
  mobileEyebrow = 'Navigation',
  showLanguage = true,
  languageOptions = ['fr', 'ar', 'en', 'es'],
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  isRTL?: boolean
  brandHref?: string
  brandTitle?: string
  brandCaption?: string
  navItems?: NavbarItem[]
  actions?: NavbarAction[]
  mobileEyebrow?: string
  showLanguage?: boolean
  languageOptions?: Lang[]
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  function handleAction(action: NavbarAction) {
    closeMobileMenu()
    void action.onClick?.()
  }

  function renderAction(action: NavbarAction, mobile = false) {
    const variantClass =
      action.variant === 'danger'
        ? 'button-danger'
        : action.variant === 'primary'
          ? 'button-primary'
          : 'button-secondary'
    const classes = [
      'button',
      variantClass,
      mobile ? 'lp-mobile-drawer-button' : 'landing-topbar-button',
    ].join(' ')

    const content = (
      <>
        <span>{action.label}</span>
        {action.arrow ? <ArrowRight size={16} style={isRTL ? { transform: 'scaleX(-1)' } : undefined} /> : null}
      </>
    )

    if (action.href) {
      return (
        <Link key={`${action.label}-${mobile ? 'mobile' : 'desktop'}`} href={action.href} className={classes} onClick={closeMobileMenu}>
          {content}
        </Link>
      )
    }

    return (
      <button
        key={`${action.label}-${mobile ? 'mobile' : 'desktop'}`}
        type="button"
        className={classes}
        onClick={() => handleAction(action)}
      >
        {content}
      </button>
    )
  }

  return (
    <>
      <header className="topbar landing-topbar">
        <div className="container topbar-inner">
          <AppLogo href={brandHref} title={brandTitle} caption={brandCaption} />

          {navItems.length > 0 ? (
            <nav className="lp-nav">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="topbar-actions">
            <ThemeToggle />
            {showLanguage ? (
              <div className="lp-topbar-lang">
                <FlagLangSelector lang={lang} setLang={setLang} options={languageOptions} />
              </div>
            ) : null}
            {actions.map((action) => renderAction(action))}
            <button
              type="button"
              className="icon-button lp-mobile-menu-trigger"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`lp-mobile-drawer${mobileMenuOpen ? ' is-open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="lp-mobile-drawer-backdrop" />
        <aside className="lp-mobile-drawer-panel" onClick={(event) => event.stopPropagation()}>
          <div className="lp-mobile-drawer-head">
            <div>
              <div className="section-eyebrow">{mobileEyebrow}</div>
              <h2 className="landing-card-title">{brandTitle}</h2>
            </div>
            <button type="button" className="icon-button" aria-label="Close menu" onClick={closeMobileMenu}>
              <X size={18} />
            </button>
          </div>

          <nav className="lp-mobile-drawer-nav">
            {navItems.map((item) => (
              <Link key={`mobile-${item.href}`} href={item.href} className="nav-link" onClick={closeMobileMenu}>
                {item.label}
              </Link>
            ))}
            {showLanguage ? (
              <div className="lp-mobile-drawer-lang">
                <FlagLangSelector lang={lang} setLang={setLang} options={languageOptions} />
              </div>
            ) : null}
          </nav>

          {actions.length > 0 ? <div className="lp-mobile-drawer-actions">{actions.map((action) => renderAction(action, true))}</div> : null}
        </aside>
      </div>
    </>
  )
}

export type { NavbarAction, NavbarItem }
