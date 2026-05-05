import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'falcon_secret_key_luxury'
);

// Define which roles can access which paths
const ROLE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/users': ['Administrator'],
  '/dashboard/customers': ['Administrator'],
  '/dashboard/vehicles': ['Administrator'],
  '/dashboard/quotations': ['Administrator'],
  '/dashboard/invoices': ['Administrator'],
  '/dashboard/reports': ['Administrator'],
  '/dashboard/notifications': ['Administrator'],
  // Workers and Admins can access:
  '/dashboard/tows': ['Administrator', 'Worker'],
  '/dashboard/expenses': ['Administrator', 'Worker'],
  '/dashboard/salaries': ['Administrator', 'Worker'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip non-dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  // 2. If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 3. Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const normalizedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

    // 4. Check permissions
    // Sort paths by length (descending) to match the most specific route first
    const restrictedPaths = Object.keys(ROLE_PERMISSIONS).sort((a, b) => b.length - a.length);
    const matchedPath = restrictedPaths.find(p => pathname.startsWith(p));

    if (matchedPath) {
      const allowedRoles = ROLE_PERMISSIONS[matchedPath];
      if (!allowedRoles.includes(normalizedRole) && normalizedRole !== 'Administrator') {
        // If role not allowed and not Administrator, redirect to dashboard home
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // 5. If token invalid, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('token', '', { expires: new Date(0) });
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
