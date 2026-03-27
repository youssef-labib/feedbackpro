'use client'

import type { Lang } from './useStoredLanguage'

const LANG_OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'ar', flag: '🇲🇦', label: 'العربية' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
]

export default function FlagLangSelector({
  lang,
  setLang,
  options,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  options?: Lang[]
}) {
  const available = options && options.length > 0
    ? LANG_OPTIONS.filter((o) => options.includes(o.code))
    : LANG_OPTIONS

  const current = available.find((o) => o.code === lang) || available[0]

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Flag shown to the left of the select */}
      <span
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 16,
          lineHeight: 1,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {current.flag}
      </span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        style={{
          paddingLeft: 34,
          paddingRight: 28,
          paddingTop: 7,
          paddingBottom: 7,
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          color: 'var(--text)',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.18s ease',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          minHeight: 38,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        {available.map((option) => (
          <option
            key={option.code}
            value={option.code}
            style={{ background: 'var(--panel)', color: 'var(--text)' }}
          >
            {option.flag} {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export type { Lang }
