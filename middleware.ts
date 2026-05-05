import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple JWT payload decoder for Edge Runtime
function getJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/users': ['ADMIN'],
  '/dashboard/customers': ['ADMIN', 'MANAGER'],
  '/dashboard/vehicles': ['ADMIN', 'MANAGER'],
  '/dashboard/invoices': ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
  '/dashboard/reports': ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
  '/dashboard/quotations': ['ADMIN', 'MANAGER', 'DISPATCHER'],
  '/dashboard/tows': ['ADMIN', 'MANAGER', 'DISPATCHER', 'WORKER'],
  '/dashboard/expenses': ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'WORKER'],
  '/dashboard/salaries': ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'WORKER'],
  '/dashboard/notifications': ['ADMIN', 'MANAGER', 'DISPATCHER', 'WORKER'],
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Handle root redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isDashboardPage = pathname.startsWith('/dashboard')

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users away from dashboard
  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-Based Access Control
  if (token && isDashboardPage) {
    const payload = getJwtPayload(token);
    if (!payload || !payload.role) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      response.cookies.delete('role');
      response.cookies.delete('name');
      return response;
    }

    const userRole = payload.role;

    for (const [route, allowedRoles] of Object.entries(ROLE_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
  ],
}
