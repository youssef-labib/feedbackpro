import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FeedbackFormClient from './FeedbackFormClient'

export default async function FeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: business } = await admin
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('plan_status', 'active')
    .single()

  if (!business) notFound()

  const { data: form } = await admin
    .from('feedback_forms')
    .select('*')
    .eq('business_id', business.id)
    .single()

  if (!form) notFound()

  return <FeedbackFormClient business={business} form={form} />
}
