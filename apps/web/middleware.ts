import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const ADMIN_ROUTES = ['/admin']
const PORTAL_ROUTES = ['/portal']

function isValidToken(value: string | undefined): boolean {
  if (!value) return false
  if (value === 'undefined' || value === 'null' || value === '') return false
  // JWT has 3 dot-separated parts
  return value.split('.').length === 3
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rawToken = request.cookies.get('nexano_token')?.value
  const token = isValidToken(rawToken) ? rawToken : null

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  const isPortal = PORTAL_ROUTES.some((route) => pathname.startsWith(route))

  // If token is invalid/expired, clear the cookie and let the request through
  if (rawToken && !token) {
    const response = NextResponse.next()
    response.cookies.delete('nexano_token')
    return response
  }

  // Server-side redirect from root: no token → login, with token → dashboard
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Redirect /admin (no path) to /admin/dashboard
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Protect admin and portal routes
  if ((isAdmin || isPortal) && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
