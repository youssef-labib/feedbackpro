'use client'

import { CircleAlert, RefreshCw } from 'lucide-react'
import { useStoredLanguage } from '../../components/useStoredLanguage'
import { DASHBOARD_COPY } from './dashboard-copy'
import styles from './dashboard.module.css'

export default function Error({
  reset,
}: {
  reset: () => void
}) {
  const { lang } = useStoredLanguage('fr')
  const copy = DASHBOARD_COPY[(lang || 'en') as keyof typeof DASHBOARD_COPY] || DASHBOARD_COPY.en

  return (
    <div className={styles.shell}>
      <div className={styles.canvas} style={{ margin: 0 }}>
        <main className={styles.main}>
          <section className={styles.panel} style={{ maxWidth: 680, margin: '80px auto 0' }}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <CircleAlert size={18} />
              </div>
              <h1 className={styles.emptyTitle}>{copy.common.dashboardLoadError}</h1>
              <p className={styles.emptyCopy}>{copy.common.dashboardLoadErrorCopy}</p>
              <button type="button" className={styles.primaryButton} onClick={reset}>
                {copy.common.tryAgain}
                <RefreshCw size={16} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
