import styles from './dashboard.module.css'

export default function Loading() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.workspaceCard} style={{ minHeight: 160 }} />
        <div className={styles.nav}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={styles.workspaceCard} style={{ minHeight: 76 }} />
          ))}
        </div>
      </aside>

      <div className={styles.canvas}>
        <div className={styles.mobileBar} style={{ display: 'flex' }}>
          <div className={styles.iconButton} />
          <div className={styles.workspaceCard} style={{ minHeight: 42, flex: 1 }} />
          <div className={styles.iconButton} />
        </div>

        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.workspaceCard} style={{ minHeight: 84, flex: 1 }} />
            <div className={styles.workspaceCard} style={{ minHeight: 84, width: 360 }} />
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.mainInner}>
            <div className={styles.kpiGrid}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={styles.metricCard} style={{ minHeight: 180 }} />
              ))}
            </div>

            <div className={styles.twoColumnGrid} style={{ marginTop: 20 }}>
              <div className={styles.panel} style={{ minHeight: 360 }} />
              <div className={styles.panel} style={{ minHeight: 360 }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
