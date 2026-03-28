'use client'

import { CircleAlert, RefreshCw } from 'lucide-react'
import styles from './dashboard.module.css'

export default function Error({
  reset,
}: {
  reset: () => void
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.canvas} style={{ margin: 0 }}>
        <main className={styles.main}>
          <section className={styles.panel} style={{ maxWidth: 680, margin: '80px auto 0' }}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <CircleAlert size={18} />
              </div>
              <h1 className={styles.emptyTitle}>Dashboard could not load</h1>
              <p className={styles.emptyCopy}>
                Something went wrong while preparing the workspace. Try again to reload the latest data.
              </p>
              <button type="button" className={styles.primaryButton} onClick={reset}>
                Try again
                <RefreshCw size={16} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
