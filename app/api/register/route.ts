import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, businessName, city, sector, categories } = await req.json()

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const slug =
      businessName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') +
      '-' + city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') +
      '-' + Math.random().toString(36).slice(2,6)

    const { data: biz, error: bizErr } = await admin
      .from('businesses')
      .insert({ owner_id: userId, name: businessName, slug, sector, city, plan: 'trial', plan_status: 'active' })
      .select().single()

    if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 })

    await admin.from('feedback_forms').insert({ business_id: biz.id, name: 'Formulaire principal', categories })

    return NextResponse.json({ success: true, slug })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
