import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { form_id, business_id, ratings, average_score, comment } = body

    if (!form_id || !business_id || !ratings || typeof ratings !== 'object') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()

    // Verify the form exists and belongs to the business
    const { data: form, error: formError } = await admin
      .from('feedback_forms')
      .select('id, business_id, categories')
      .eq('id', form_id)
      .single()

    if (formError || !form || form.business_id !== business_id) {
      return NextResponse.json({ error: 'Invalid form' }, { status: 400 })
    }

    // Validate ratings: keys must be valid category IDs, values must be 1-5
    const categoryIds = new Set(
      Array.isArray(form.categories)
        ? form.categories.map((c: { id: string }) => c.id)
        : []
    )

    const submittedEntries = Object.entries(ratings as Record<string, unknown>)

    if (submittedEntries.length === 0) {
      return NextResponse.json({ error: 'No ratings provided' }, { status: 400 })
    }

    const hasInvalidValue = submittedEntries.some(([, value]) => {
      const n = Number(value)
      return !Number.isInteger(n) || n < 1 || n > 5
    })

    if (hasInvalidValue) {
      return NextResponse.json({ error: 'Invalid rating value (must be 1-5)' }, { status: 400 })
    }

    // Compute average from submitted ratings only (lenient - don't require all categories)
    const computedAverage =
      Math.round(
        (submittedEntries.reduce((sum, [, v]) => sum + Number(v), 0) / submittedEntries.length) * 10
      ) / 10

    const { error } = await admin
      .from('submissions')
      .insert({
        form_id,
        business_id,
        ratings,
        average_score: computedAverage || Number(average_score) || 0,
        comment: comment?.trim() || null,
      })

    if (error) {
      console.error('Submit insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, average_score: computedAverage })
  } catch (err) {
    console.error('Submit API crash:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
