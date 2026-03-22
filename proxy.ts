import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password']

function isPublic(path: string) {
  return (
    PUBLIC_PATHS.includes(path) ||
    path.startsWith('/r/')
  )
}

export async function proxy(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── NOT LOGGED IN ──────────────────────────────────────
  if (!user) {
    if (isPublic(path)) return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── LOGGED IN — get role ───────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin === true

  // Setup page allowed for all logged-in users
  if (path === '/setup') return supabaseResponse

  // Admin/denied allowed for everyone
  if (path === '/admin/denied') return supabaseResponse

  // ── ADMIN ──────────────────────────────────────────────
  if (isAdmin) {
    if (path === '/' || path === '/login' || path === '/register') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (path.startsWith('/dashboard') || path === '/setup') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (path.startsWith('/admin')) return supabaseResponse
    if (isPublic(path)) return supabaseResponse
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // ── NORMAL USER ────────────────────────────────────────
  if (path === '/' || path === '/login' || path === '/register') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (path.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/denied', request.url))
  }
  if (path.startsWith('/dashboard')) return supabaseResponse
  if (isPublic(path)) return supabaseResponse
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)'],
}
