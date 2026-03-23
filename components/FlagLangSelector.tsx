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
  const activeOptions = (options && options.length > 0 ? options : (Object.keys(FLAGS) as Lang[])).map(
    (code) => [code, FLAGS[code]] as const
  )

  return (
    <div
      style={{
        display: 'flex',
        background: dark ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.05)',
        border: `1px solid ${dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.09)'}`,
        borderRadius: 10,
        padding: 3,
        gap: 2,
        maxWidth: '100%',
        overflowX: 'auto',
      }}
    >
      {activeOptions.map(([code, info]) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          title={info.native}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 9px',
            borderRadius: 7,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Instrument Sans, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            background: lang === code ? '#028090' : 'transparent',
            color: lang === code ? '#fff' : '#5a6a82',
            transition: 'all .15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{info.flag}</span>
          <span>{info.label}</span>
        </button>
      ))}
    </div>
  )
}

export type { Lang }
export { FLAGS }
