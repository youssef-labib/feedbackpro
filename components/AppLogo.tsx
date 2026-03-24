import Link from 'next/link'

export default function AppLogo({
  href = '/',
  title = 'FeedbackPro',
  caption = 'Customer feedback platform',
}: {
  href?: string
  title?: string
  caption?: string
}) {
  return (
    <Link href={href} className="brand">
      <span className="brand-mark">FP</span>
      <span className="brand-copy">
        <span className="brand-title">{title}</span>
        <span className="brand-caption">{caption}</span>
      </span>
    </Link>
  )
}
