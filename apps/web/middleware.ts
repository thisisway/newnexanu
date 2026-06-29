import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const ADMIN_ROUTES = ['/admin']
const PORTAL_ROUTES = ['/portal']
const CLIENT_ROLE_SLUGS = ['client', 'customer']

function isValidToken(value: string | undefined): boolean {
  if (!value) return false
  if (value === 'undefined' || value === 'null' || value === '') return false
  return value.split('.').length === 3
}

function getFirstOrgRoleFromToken(token: string): string | null {
  try {
    const payloadB64 = token.split('.')[1]
    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json)
    return payload?.organizations?.[0]?.roleSlug ?? null
  } catch {
    return null
  }
}

function getDefaultDestination(token: string): string {
  const role = getFirstOrgRoleFromToken(token)
  return CLIENT_ROLE_SLUGS.includes(role ?? '') ? '/portal' : '/admin/dashboard'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rawToken = request.cookies.get('nexano_token')?.value
  const token = isValidToken(rawToken) ? rawToken : null

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  const isPortal = PORTAL_ROUTES.some((route) => pathname.startsWith(route))

  // Token present but structurally invalid → clear it and continue
  if (rawToken && !token) {
    const response = NextResponse.next()
    response.cookies.delete('nexano_token')
    return response
  }

  // Root redirect
  if (pathname === '/') {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.redirect(new URL(getDefaultDestination(token), request.url))
  }

  // /admin with no sub-path → /admin/dashboard
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Authenticated users on public routes → send to their default home
  if (isPublic && token) {
    return NextResponse.redirect(new URL(getDefaultDestination(token), request.url))
  }

  // Protect admin and portal routes from unauthenticated access
  if ((isAdmin || isPortal) && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Prevent portal clients from accessing admin routes and vice-versa
  if (token && isAdmin) {
    const role = getFirstOrgRoleFromToken(token)
    if (CLIENT_ROLE_SLUGS.includes(role ?? '')) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
