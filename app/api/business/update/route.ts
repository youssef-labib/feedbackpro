import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient, createSupabaseServerClient } from '../../../../lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { businessId, name, google_review_url, plan, logo_url } = body as {
      businessId?: string
      name?: string
      google_review_url?: string
      plan?: string
      logo_url?: string | null
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Missing business id' }, { status: 400 })
    }

    const allowedPlans = ['trial', 'starter', 'pro', 'business']
    if (plan && !allowedPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const updates: Record<string, string | null> = {}
    if (typeof name === 'string' && name.trim()) updates.name = name.trim()
    if (typeof google_review_url === 'string') updates.google_review_url = google_review_url.trim()
    if (typeof plan === 'string') updates.plan = plan
    if (Object.prototype.hasOwnProperty.call(body, 'logo_url')) {
      updates.logo_url = typeof logo_url === 'string' ? logo_url.trim() : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('id, owner_id, slug')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: updateError } = await admin
      .from('businesses')
      .update(updates)
      .eq('id', businessId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    revalidatePath('/dashboard')
    revalidatePath('/setup')
    revalidatePath(`/r/${business.slug}`)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
