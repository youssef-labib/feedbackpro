import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '../../../lib/supabase-server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const businessId = formData.get('businessId') as string

    if (!file || !businessId) {
      return NextResponse.json({ error: 'Missing file or businessId' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const [{ data: profile }, { data: business }] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single(),
      supabaseAdmin
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single(),
    ])

    const canManageBusiness = profile?.is_admin || business?.owner_id === user.id

    if (!canManageBusiness) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `logos/${businessId}.${ext}`
    const buffer = await file.arrayBuffer()

    // Upload to Supabase storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('business-assets')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('business-assets')
      .getPublicUrl(filename)

    // Update business with logo URL
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({ logo_url: publicUrl })
      .eq('id', businessId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
