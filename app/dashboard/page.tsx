import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: business } = await admin.from('businesses').select('*').eq('owner_id', user.id).single()
  if (!business) redirect('/register')

  const { data: form } = await admin.from('feedback_forms').select('*').eq('business_id', business.id).single()
  const { data: submissions } = await admin.from('submissions').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(100)

  return <DashboardClient business={business} form={form} submissions={submissions||[]} userEmail={user.email||''} />
}
