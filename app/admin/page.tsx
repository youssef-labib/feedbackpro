import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import { createSupabaseAdminClient, createSupabaseServerClient } from '../../lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = createSupabaseAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/admin/denied')
  }

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
