import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../lib/supabase-server'

type FormCategory = { id: string }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { form_id, business_id, ratings, average_score, comment } = body

    if (!form_id || !business_id || !ratings || typeof ratings !== 'object') {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const { data: form, error: formError } = await supabaseAdmin
      .from('feedback_forms')
      .select('business_id, categories')
      .eq('id', form_id)
      .single()

    if (formError || !form || form.business_id !== business_id) {
      return NextResponse.json({ error: 'Invalid form submission' }, { status: 400 })
    }

    const categoryIds = new Set(
      Array.isArray(form.categories)
        ? (form.categories as FormCategory[]).map((category) => category.id)
        : []
    )

    const submittedRatings = Object.entries(ratings as Record<string, unknown>)
    const hasInvalidRating = submittedRatings.some(([categoryId, value]) => {
      const numericValue = Number(value)
      return !categoryIds.has(categoryId) || !Number.isInteger(numericValue) || numericValue < 1 || numericValue > 5
    })

    if (submittedRatings.length === 0 || hasInvalidRating || submittedRatings.length !== categoryIds.size) {
      return NextResponse.json({ error: 'Invalid ratings payload' }, { status: 400 })
    }

    const computedAverage =
      Math.round(
        (submittedRatings.reduce((total, [, value]) => total + Number(value), 0) / submittedRatings.length) * 10
      ) / 10

    const { error } = await supabaseAdmin
      .from('submissions')
      .insert({
        form_id,
        business_id,
        ratings,
        average_score: computedAverage || Number(average_score) || 0,
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
