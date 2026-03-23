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
      label_fr: category.label_fr?.trim(),
      label_ar: category.label_ar?.trim() || category.label_fr?.trim(),
      label_en: category.label_en?.trim() || category.label_fr?.trim(),
      label_es: category.label_es?.trim() || category.label_en?.trim() || category.label_fr?.trim(),
    }))

    const hasInvalidCategory = normalized.some((category) => !category.label_fr)
    if (hasInvalidCategory) {
      return NextResponse.json({ error: 'French label is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const { data: form, error: formError } = await admin
      .from('feedback_forms')
      .select('id, business_id, businesses!inner(owner_id, slug)')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const businessRow = Array.isArray(form.businesses) ? form.businesses[0] : form.businesses
    const ownerId = businessRow?.owner_id
    const slug = businessRow?.slug

    if (!ownerId || !slug) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: updateError } = await admin
      .from('feedback_forms')
      .update({ categories: normalized })
      .eq('id', formId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    revalidatePath('/dashboard')
    revalidatePath('/setup')
    revalidatePath(`/r/${slug}`)

    return NextResponse.json({ success: true, categories: normalized })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
