import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/admin/denied']

function isPublic(path: string) {
  return PUBLIC_PATHS.includes(path) || path.startsWith('/r/')
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Always allow static-like paths immediately
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user - if this fails, treat as logged out (don't crash)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  // ── NOT LOGGED IN ──────────────────────────────────────
  if (!user) {
    // Public paths always allowed
    if (isPublic(path)) return supabaseResponse
    // Everything else → login
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // ── LOGGED IN ─────────────────────────────────────────
  // Setup allowed for everyone
  if (path === '/setup') return supabaseResponse

  // Get role - if fails, treat as normal user
  let isAdmin = false
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin === true
  } catch {
    isAdmin = false
  }

  const AUTH_PATHS = ['/', '/login', '/register']

  if (isAdmin) {
    if (AUTH_PATHS.includes(path)) return NextResponse.redirect(new URL('/admin', request.url))
    if (path.startsWith('/dashboard')) return NextResponse.redirect(new URL('/admin', request.url))
    if (path.startsWith('/admin')) return supabaseResponse
    if (isPublic(path)) return supabaseResponse
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Normal user
  if (AUTH_PATHS.includes(path)) return NextResponse.redirect(new URL('/dashboard', request.url))
  if (path.startsWith('/admin') && path !== '/admin/denied') {
    return NextResponse.redirect(new URL('/admin/denied', request.url))
  }
  if (path.startsWith('/dashboard')) return supabaseResponse
  if (isPublic(path)) return supabaseResponse
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
