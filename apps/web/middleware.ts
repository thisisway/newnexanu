import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const ADMIN_ROUTES = ['/admin']
const PORTAL_ROUTES = ['/portal']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('nexano_token')?.value

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  const isPortal = PORTAL_ROUTES.some((route) => pathname.startsWith(route))

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
