import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import DashboardClient from './DashboardClient'
import type {
  DashboardBusiness,
  DashboardCategory,
  DashboardForm,
  DashboardSubmission,
} from './dashboard-data'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug, sector, city, google_review_url, plan, plan_status, qr_generated, logo_url')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    redirect('/setup')
  }

  const [formResponse, submissionsResponse] = await Promise.all([
    supabase
      .from('feedback_forms')
      .select('id, business_id, categories')
      .eq('business_id', business.id)
      .single(),
    supabase
      .from('submissions')
      .select('id, ratings, average_score, comment, created_at')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false }),
  ])

  const formData = formResponse.data
  const submissionsData = submissionsResponse.data || []

  const form: DashboardForm | null = formData
    ? {
        id: formData.id,
        business_id: formData.business_id,
        categories: Array.isArray(formData.categories)
          ? (formData.categories as DashboardCategory[])
          : [],
      }
    : null

  return (
    <DashboardClient
      business={business as DashboardBusiness}
      form={form}
      submissions={submissionsData as DashboardSubmission[]}
      userEmail={user.email || ''}
    />
  )
}
