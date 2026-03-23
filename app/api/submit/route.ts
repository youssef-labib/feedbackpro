import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { form_id, business_id, ratings, average_score, comment } = body

    if (!form_id || !business_id || !ratings) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('submissions')
      .insert({
        form_id,
        business_id,
        ratings,
        average_score: Number(average_score) || 0,
        comment: comment || null,
      })

    if (error) {
      console.error('Submit error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Submit API crash:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
