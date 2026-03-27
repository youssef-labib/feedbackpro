'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AppNavbar from '../../components/AppNavbar'

type Business = {
  id: string
  name: string
  slug: string
  sector: string
  city: string
  google_review_url: string | null
  plan: string
  plan_status: string
  created_at: string
  owner_id: string
}

const PLAN_STYLES: Record<string, { text: string; bg: string }> = {
  trial: { text: '#d9f99d', bg: 'rgba(163, 230, 53, 0.14)' },
  starter: { text: '#bbf7d0', bg: 'rgba(34, 197, 94, 0.14)' },
  pro: { text: '#86efac', bg: 'rgba(34, 197, 94, 0.2)' },
  business: { text: '#f8fafc', bg: 'rgba(255, 255, 255, 0.08)' },
}

const STATUS_STYLES: Record<string, { text: string; bg: string }> = {
  active: { text: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)' },
  trial: { text: '#84cc16', bg: 'rgba(132, 204, 22, 0.14)' },
  past_due: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
  suspended: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)' },
}

export default function AdminClient({
  businesses,
  submissionCounts,
  avgScores,
}: {
  businesses: Business[]
  submissionCounts: Record<string, number>
  avgScores: Record<string, number>
}) {
  const router = useRouter()
  const [items, setItems] = useState(businesses)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')

  const selected = useMemo(
    () => items.find((business) => business.id === selectedId) || null,
    [items, selectedId]
  )

  const activeCount = items.filter((item) => item.plan_status === 'active' || item.plan_status === 'trial').length
  const suspendedCount = items.filter((item) => item.plan_status === 'suspended').length
  const totalReviews = Object.values(submissionCounts).reduce((sum, count) => sum + count, 0)
  const monthlyRevenue = items.reduce((sum, item) => {
    if (item.plan_status !== 'active') return sum
    if (item.plan === 'starter') return sum + 149
    if (item.plan === 'pro') return sum + 299
    if (item.plan === 'business') return sum + 699
    return sum
  }, 0)

  const filtered = items.filter((item) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.slug.toLowerCase().includes(query) ||
      item.city.toLowerCase().includes(query)
    const matchesPlan = filterPlan === 'all' || item.plan === filterPlan
    const matchesStatus = filterStatus === 'all' || item.plan_status === filterStatus
    return matchesSearch && matchesPlan && matchesStatus
  })

  async function updateBusiness(id: string, updates: Record<string, string>) {
    setUpdating(true)
    setUpdateMessage('')

    const response = await fetch('/api/admin/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })

    if (!response.ok) {
      setUpdateMessage('Update failed')
      setUpdating(false)
      return
    }

    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)))
    setUpdateMessage('Updated')
    router.refresh()
    setUpdating(false)
  }

  return (
    <div className="page-shell">
      <AppNavbar
        lang="en"
        setLang={() => {}}
        brandHref="/admin"
        brandCaption="Internal workspace"
        actions={[{ href: '/', label: 'Go home', variant: 'secondary' }]}
        mobileEyebrow="Admin console"
        showLanguage={false}
      />
      <main className="admin-shell">
        <div className="container">
          <header className="admin-header">
            <div>
              <div className="pill accent-pill" style={{ marginBottom: 14 }}>Admin console</div>
              <h1 className="page-title">Manage FeedbackPro clients</h1>
              <p className="page-subtitle">
                Review plans, account status, review volume, and client activity from one clean control panel.
              </p>
            </div>
          </header>

          <section className="stats-grid" style={{ marginBottom: 22 }}>
            {[
              { label: 'Total clients', value: items.length, note: `${activeCount} active or trial` },
              { label: 'Estimated MRR', value: `${monthlyRevenue} MAD`, note: 'active subscriptions only' },
              { label: 'Suspended', value: suspendedCount, note: 'accounts needing attention' },
              { label: 'Total reviews', value: totalReviews, note: 'all public submissions' },
            ].map((card) => (
              <article key={card.label} className="metric-card">
                <div className="metric-label">{card.label}</div>
                <div className="metric-value">{card.value}</div>
                <div className="metric-note">{card.note}</div>
              </article>
            ))}
          </section>

          <section className="table-card">
            <div className="field-row" style={{ marginBottom: 18 }}>
              <h2 className="card-title" style={{ margin: 0 }}>Clients</h2>
              <div className="pill">{filtered.length} result(s)</div>
            </div>

            <div className="topbar-actions" style={{ marginBottom: 18 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                <Search size={16} style={{ position: 'absolute', left: 16, top: 16, color: 'var(--muted)' }} />
                <input
                  className="input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by client, slug, or city"
                  style={{ paddingLeft: 44 }}
                />
              </div>

              <select className="select" value={filterPlan} onChange={(event) => setFilterPlan(event.target.value)} style={{ maxWidth: 180 }}>
                <option value="all">All plans</option>
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>

              <select className="select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} style={{ maxWidth: 180 }}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="past_due">Past due</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state" style={{ boxShadow: 'none', background: 'transparent' }}>
                <h3 className="empty-title">No clients found</h3>
                <p className="empty-copy">Try another search term or clear the current filters.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>City</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Reviews</th>
                      <th>Score</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((business) => {
                      const planStyle = PLAN_STYLES[business.plan] || PLAN_STYLES.trial
                      const statusStyle = STATUS_STYLES[business.plan_status] || STATUS_STYLES.active

                      return (
                        <tr key={business.id}>
                          <td>
                            <button type="button" className="table-row-button" onClick={() => setSelectedId(business.id)}>
                              <div style={{ fontWeight: 800 }}>{business.name}</div>
                              <div className="help-text" style={{ marginTop: 4 }}>{business.slug}</div>
                            </button>
                          </td>
                          <td>{business.city || '-'}</td>
                          <td>
                            <span className="score-pill" style={{ background: planStyle.bg, color: planStyle.text }}>
                              {business.plan}
                            </span>
                          </td>
                          <td>
                            <span className="score-pill" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                              {business.plan_status}
                            </span>
                          </td>
                          <td>{submissionCounts[business.id] || 0}</td>
                          <td>{avgScores[business.id] ? `${avgScores[business.id].toFixed(1)}/5` : '-'}</td>
                          <td>{new Date(business.created_at).toLocaleDateString('en-US')}</td>
                          <td>
                            <button type="button" className="button button-secondary" onClick={() => setSelectedId(business.id)}>
                              Manage
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {selected ? (
        <div className="modal-backdrop" onClick={() => setSelectedId(null)}>
          <div className="surface-card modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="field-row" style={{ marginBottom: 20 }}>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>{selected.name}</h2>
                <p className="card-copy" style={{ marginTop: 6 }}>
                  {selected.city} · {selected.sector} · {selected.slug}
                </p>
              </div>
              <a href={`/r/${selected.slug}`} target="_blank" rel="noopener noreferrer" className="button button-secondary">
                Open form
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="stack">
              <div className="field">
                <label className="label">Plan</label>
                <select
                  className="select"
                  value={selected.plan}
                  onChange={(event) => updateBusiness(selected.id, { plan: event.target.value })}
                >
                  <option value="trial">Trial</option>
                  <option value="starter">Starter - 149 MAD</option>
                  <option value="pro">Pro - 299 MAD</option>
                  <option value="business">Business - 699 MAD</option>
                </select>
              </div>

              <div className="field">
                <label className="label">Account status</label>
                <div className="inline-actions">
                  <button type="button" className="button button-primary" disabled={updating} onClick={() => updateBusiness(selected.id, { plan_status: 'active' })}>
                    Set active
                  </button>
                  <button type="button" className="button button-secondary" disabled={updating} onClick={() => updateBusiness(selected.id, { plan_status: 'past_due' })}>
                    Mark past due
                  </button>
                  <button type="button" className="button button-danger" disabled={updating} onClick={() => updateBusiness(selected.id, { plan_status: 'suspended' })}>
                    Suspend
                  </button>
                </div>
              </div>

              <section className="summary-card">
                {[
                  ['Owner id', selected.owner_id],
                  ['Reviews received', String(submissionCounts[selected.id] || 0)],
                  ['Average score', avgScores[selected.id] ? `${avgScores[selected.id].toFixed(1)}/5` : '-'],
                  ['Created', new Date(selected.created_at).toLocaleDateString('en-US')],
                ].map(([label, value]) => (
                  <div key={label} className="info-row">
                    <div className="metric-label" style={{ color: 'var(--muted)' }}>{label}</div>
                    <div>{value}</div>
                  </div>
                ))}
              </section>

              {updateMessage ? <div className="message message-success">{updateMessage}</div> : null}

              <div className="inline-actions">
                <button type="button" className="button button-secondary" onClick={() => setSelectedId(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
