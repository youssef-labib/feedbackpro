'use client'

import { useEffect, useState } from 'react'

type Lang = 'fr' | 'ar' | 'en' | 'es'

const FLAGS: Record<Lang, { flag: string; label: string; native: string }> = {
  fr: { flag: '🇫🇷', label: 'FR', native: 'Francais' },
  ar: { flag: '🇲🇦', label: 'AR', native: 'Arabic' },
  en: { flag: '🇬🇧', label: 'EN', native: 'English' },
  es: { flag: '🇪🇸', label: 'ES', native: 'Espanol' },
}

export default function FlagLangSelector({
  lang,
  setLang,
  dark = false,
  options,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  dark?: boolean
  options?: Lang[]
}) {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const syncCompact = () => setCompact(window.innerWidth <= 640)
    syncCompact()
    window.addEventListener('resize', syncCompact)
    return () => window.removeEventListener('resize', syncCompact)
  }, [])

  const activeOptions = (options && options.length > 0 ? options : (Object.keys(FLAGS) as Lang[])).map(
    (code) => [code, FLAGS[code]] as const
  )
  const current = FLAGS[lang]

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}>
      <span style={{ position: 'absolute', left: 10, fontSize: 15, lineHeight: 1, pointerEvents: 'none', zIndex: 1 }}>
        {current.flag}
      </span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        style={{
          paddingLeft: 34,
          paddingRight: 32,
          paddingTop: 8,
          paddingBottom: 8,
          minWidth: compact ? 78 : 98,
          background: dark ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.05)',
          border: `1px solid ${dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.09)'}`,
          borderRadius: 10,
          color: '#e8f0fa',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Instrument Sans, sans-serif',
          cursor: 'pointer',
          outline: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235a6a82' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          whiteSpace: 'nowrap',
        }}
      >
        {activeOptions.map(([code, info]) => (
          <option key={code} value={code} style={{ background: '#0d1927', color: '#e8f0fa' }}>
            {compact ? info.label : info.native}
          </option>
        ))}
      </select>
    </div>
  )
}

export type { Lang }
export { FLAGS }
