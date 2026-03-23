import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '../../../lib/supabase-server'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 40) + '-' + Math.random().toString(36).substring(2, 6)
}

const DEFAULT_CATEGORIES: Record<string, { label_fr: string; label_ar: string; label_en: string }[]> = {
  restaurant: [
    { label_fr: 'Qualité de la nourriture', label_ar: 'جودة الطعام', label_en: 'Food quality' },
    { label_fr: 'Service & attente', label_ar: 'الخدمة', label_en: 'Service' },
    { label_fr: 'Propreté', label_ar: 'النظافة', label_en: 'Cleanliness' },
    { label_fr: 'Ambiance', label_ar: 'الأجواء', label_en: 'Ambiance' },
    { label_fr: 'Rapport qualité-prix', label_ar: 'القيمة مقابل السعر', label_en: 'Value for money' },
  ],
  gym: [
    { label_fr: 'Équipements', label_ar: 'المعدات', label_en: 'Equipment' },
    { label_fr: 'Propreté', label_ar: 'النظافة', label_en: 'Cleanliness' },
    { label_fr: 'Coaches', label_ar: 'المدربون', label_en: 'Coaches' },
    { label_fr: 'Ambiance', label_ar: 'الأجواء', label_en: 'Ambiance' },
  ],
  hotel: [
    { label_fr: 'Chambre', label_ar: 'الغرفة', label_en: 'Room' },
    { label_fr: 'Accueil', label_ar: 'الاستقبال', label_en: 'Reception' },
    { label_fr: 'Propreté', label_ar: 'النظافة', label_en: 'Cleanliness' },
    { label_fr: 'Petit-déjeuner', label_ar: 'الإفطار', label_en: 'Breakfast' },
  ],
  car_rental: [
    { label_fr: 'État du véhicule', label_ar: 'حالة السيارة', label_en: 'Vehicle condition' },
    { label_fr: 'Service', label_ar: 'الخدمة', label_en: 'Service' },
    { label_fr: 'Prix', label_ar: 'السعر', label_en: 'Price' },
    { label_fr: 'Processus', label_ar: 'الإجراءات', label_en: 'Process' },
  ],
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { businessName, city, sector } = body

    if (!businessName || !city || !sector) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createSupabaseAdminClient()

    const slug = generateSlug(businessName)

    const { data: existingBusiness } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (existingBusiness) {
      return NextResponse.json({ error: 'Business already exists for this user' }, { status: 409 })
    }

    // 1. Create profile if it doesn't exist
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: user.id, is_admin: false }, { onConflict: 'id', ignoreDuplicates: true })

    if (profileErr) {
      console.error('Profile error:', profileErr)
      // Don't fail on profile error - it might already exist
    }

    // 2. Create business
    const { data: biz, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: businessName,
        slug,
        city,
        sector,
        plan: 'trial',
        plan_status: 'active',
      })
      .select()
      .single()

    if (bizErr) {
      console.error('Business error:', bizErr)
      return NextResponse.json({ error: 'Failed to create business: ' + bizErr.message }, { status: 500 })
    }

    // 3. Create feedback form with default categories
    const rawCats = DEFAULT_CATEGORIES[sector] || DEFAULT_CATEGORIES.restaurant
    const categories = rawCats.map((c, i) => ({ id: String(i + 1), ...c }))

    const { error: formErr } = await supabaseAdmin
      .from('feedback_forms')
      .insert({
        business_id: biz.id,
        categories,
      })

    if (formErr) {
      console.error('Form error:', formErr)
      return NextResponse.json({ error: 'Failed to create form: ' + formErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, slug, businessId: biz.id })
  } catch (err) {
    console.error('Register API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
