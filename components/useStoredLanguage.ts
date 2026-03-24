import { useEffect, useState } from 'react'

export type Lang = 'fr' | 'ar' | 'en' | 'es'
export type CopyLang = 'fr' | 'ar' | 'en'

const STORAGE_KEY = 'feedbackpro-language'
const LANGS: Lang[] = ['fr', 'ar', 'en', 'es']

function isLang(value: string | null): value is Lang {
  return !!value && LANGS.includes(value as Lang)
}

export function toCopyLang(lang: Lang): CopyLang {
  return lang === 'es' ? 'en' : lang
}

export function isRtlLang(lang: Lang) {
  return lang === 'ar'
}

export function useStoredLanguage(initial: Lang = 'fr') {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    return isLang(stored) ? stored : initial
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
    document.documentElement.dir = isRtlLang(lang) ? 'rtl' : 'ltr'
  }, [lang])

  return { lang, setLang, copyLang: toCopyLang(lang), isRTL: isRtlLang(lang) }
}
