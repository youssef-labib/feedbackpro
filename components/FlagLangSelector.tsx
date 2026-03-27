'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { Lang } from './useStoredLanguage'

const FLAGS: Record<Lang, { flag: string; short: string; label: string; subtitle: string }> = {
  fr: { flag: '🇫🇷', short: 'FR', label: 'Francais', subtitle: 'French' },
  ar: { flag: '🇲🇦', short: 'AR', label: 'العربية', subtitle: 'Arabic' },
  en: { flag: '🇬🇧', short: 'EN', label: 'English', subtitle: 'English' },
  es: { flag: '🇪🇸', short: 'ES', label: 'Espanol', subtitle: 'Spanish' },
}

export default function FlagLangSelector({
  lang,
  setLang,
  options,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  options?: Lang[]
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const available = (options && options.length > 0 ? options : (Object.keys(FLAGS) as Lang[])).map((code) => ({
    code,
    ...FLAGS[code],
  }))
  const current = FLAGS[lang]

  return (
    <div className="lang-select" ref={rootRef}>
      <button
        type="button"
        className="lang-trigger"
        data-open={open}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="lang-trigger-current">
          <span>{current.flag}</span>
          <span className="lang-trigger-label">{current.short}</span>
        </span>
        <ChevronDown size={16} className="lang-trigger-chevron" />
      </button>

      {open ? (
        <div className="lang-menu" role="menu">
          {available.map((option) => (
            <button
              key={option.code}
              type="button"
              className={`lang-option${option.code === lang ? ' active' : ''}`}
              onClick={() => {
                setLang(option.code)
                setOpen(false)
              }}
              role="menuitemradio"
              aria-checked={option.code === lang}
            >
              <span>{option.flag}</span>
              <span className="lang-option-copy">
                <span className="lang-option-title">{option.short}</span>
                <span className="lang-option-subtitle">{option.label}</span>
              </span>
              {option.code === lang ? <Check size={15} style={{ marginLeft: 'auto' }} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export type { Lang }
export { FLAGS }
