import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'falcon_secret_key_luxury'
)

const ROLE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/users': ['ADMIN', 'ADMINISTRATOR'],
  '/dashboard/customers': ['ADMIN', 'ADMINISTRATOR', 'MANAGER'],
  '/dashboard/vehicles': ['ADMIN', 'ADMINISTRATOR', 'MANAGER'],
  '/dashboard/invoices': ['ADMIN', 'ADMINISTRATOR', 'MANAGER', 'ACCOUNTANT'],
  '/dashboard/reports': ['ADMIN', 'ADMINISTRATOR', 'MANAGER', 'ACCOUNTANT'],
  '/dashboard/quotations': ['ADMIN', 'ADMINISTRATOR', 'MANAGER', 'DISPATCHER'],
  '/dashboard/tows': ['ADMIN', 'ADMINISTRATOR', 'MANAGER', 'DISPATCHER', 'WORKER'],
  '/dashboard/expenses': ['ADMIN', 'ADMINISTRATOR', 'MANAGER', 'ACCOUNTANT', 'WORKER'],
  '/dashboard/salaries': ['ADMIN', 'ADMINISTRATOR', 'MANAGER', 'ACCOUNTANT', 'WORKER'],
  '/dashboard/notifications': ['ADMIN', 'ADMINISTRATOR', 'MANAGER', 'DISPATCHER', 'WORKER'],
};

export default async function middleware(request: NextRequest) {
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
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (e) {
      // Token invalid, allow access to auth pages
    }
  }

  // Redirect unauthenticated users away from dashboard
  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-Based Access Control
  if (token && isDashboardPage) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (!payload || !payload.role) {
         throw new Error('Invalid payload');
      }

      const userRole = (payload.role as string).toUpperCase();

      // Check specific route permissions
      for (const [route, allowedRoles] of Object.entries(ROLE_PERMISSIONS)) {
        if (pathname.startsWith(route)) {
          if (!allowedRoles.includes(userRole)) {
            return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
          }
        }
      }
    } catch (e) {
      // Token verification failed
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      response.cookies.delete('role');
      response.cookies.delete('name');
      return response;
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
