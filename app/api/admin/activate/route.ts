import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient, createSupabaseServerClient } from '../../../../lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const allowedUpdates = ['plan', 'plan_status']
    const invalidKeys = Object.keys(updates).filter((key) => !allowedUpdates.includes(key))

    if (invalidKeys.length > 0) {
      return NextResponse.json({ error: 'Invalid update fields' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await admin
      .from('businesses')
      .update(updates)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
