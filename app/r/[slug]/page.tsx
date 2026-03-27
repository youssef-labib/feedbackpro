export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FeedbackFormClient from './FeedbackFormClient'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function FeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: business, error: bizError } = await supabaseAdmin
    .from('businesses')
    .select('id, name, slug, city, google_review_url, logo_url')
    .eq('slug', slug)
    .single()

  if (bizError || !business) {
    console.error('Business fetch error for slug:', slug, bizError)
    notFound()
  }

  const { data: form, error: formError } = await supabaseAdmin
    .from('feedback_forms')
    .select('id, business_id, categories')
    .eq('business_id', business.id)
    .single()

  if (formError || !form) {
    console.error('Form fetch error for business:', business.id, formError)
    notFound()
  }

  const categories = Array.isArray(form.categories) && form.categories.length > 0
    ? form.categories
    : []

  return (
    <FeedbackFormClient
      business={business}
      form={{ ...form, categories }}
    />
  )
}
