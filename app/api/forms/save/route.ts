import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient, createSupabaseServerClient } from '../../../../lib/supabase-server'

type Category = {
  id: string
  label_fr: string
  label_ar?: string
  label_en?: string
  label_es?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { formId, categories } = body as { formId?: string; categories?: Category[] }

    if (!formId || !Array.isArray(categories) || categories.length < 1 || categories.length > 10) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const normalized = categories.map((category, index) => ({
      id: String(index + 1),
      label_fr: (category.label_fr || '').trim(),
      label_ar: (category.label_ar || category.label_fr || '').trim(),
      label_en: (category.label_en || category.label_fr || '').trim(),
      label_es: (category.label_es || category.label_en || category.label_fr || '').trim(),
    }))

    const hasInvalidCategory = normalized.some((c) => !c.label_fr)
    if (hasInvalidCategory) {
      return NextResponse.json({ error: 'French label is required for every question' }, { status: 400 })
    }

    // Auth check
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()

    // Simplified ownership check - NO complex join that was failing silently
    const { data: form, error: formError } = await admin
      .from('feedback_forms')
      .select('id, business_id')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      console.error('Form fetch error:', formError)
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('owner_id, slug')
      .eq('id', form.business_id)
      .single()

    if (businessError || !business) {
      console.error('Business fetch error:', businessError)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: updateError } = await admin
      .from('feedback_forms')
      .update({ categories: normalized })
      .eq('id', formId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    revalidatePath('/dashboard')
    revalidatePath('/setup')
    revalidatePath(`/r/${business.slug}`)

    return NextResponse.json({ success: true, categories: normalized })
  } catch (err) {
    console.error('forms/save crash:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
