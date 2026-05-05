import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Robust JWT payload decoder for Edge Runtime
function getJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Modern Edge Runtime decoding
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const jsonPayload = new TextDecoder().decode(bytes);
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Middleware JWT Decode Error:', e);
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

export default function middleware(request: NextRequest) {
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

    // Check specific route permissions
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
