import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function AdminDeniedPage() {
  return (
    <div className="page-shell">
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
                Back to dashboard
              </Link>
              <Link href="/" className="button button-primary">
                Go home
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
