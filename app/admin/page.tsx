import { createClient } from '@supabase/supabase-js'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: businesses } = await admin
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: submissions } = await admin
    .from('submissions')
    .select('business_id, average_score, created_at')

  const countByBiz: Record<string, number> = {}
  const scoreByBiz: Record<string, number[]> = {}
  ;(submissions || []).forEach(s => {
    countByBiz[s.business_id] = (countByBiz[s.business_id] || 0) + 1
    if (!scoreByBiz[s.business_id]) scoreByBiz[s.business_id] = []
    scoreByBiz[s.business_id].push(s.average_score)
  })

  const avgByBiz: Record<string, number> = {}
  Object.entries(scoreByBiz).forEach(([id, scores]) => {
    avgByBiz[id] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  })

  return (
    <AdminClient
      businesses={businesses || []}
      submissionCounts={countByBiz}
      avgScores={avgByBiz}
    />
  )
}
