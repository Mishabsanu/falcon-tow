import { NextResponse } from 'next/server';
import { listRecords } from '@/lib/store';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'falcon_secret_key_luxury'
);

export async function POST(request) {
  try {
    const { username: identifier, password } = await request.json();

    // Fetch users from the 'users' collection
    const result = await listRecords('users', { limit: 1000 });

    if (!result || !result.data || result.data.length === 0) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Match strictly by email or name
    const user = result.data.find(u => 
      u.email?.toLowerCase() === identifier.toLowerCase() || 
      u.name?.toLowerCase() === identifier.toLowerCase()
    );

    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...safeUser } = user;
      
      // 1. Create JWT Token
      const token = await new SignJWT({ 
        id: user.id, 
        role: user.role,
        name: user.name 
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      // 2. Prepare Response
      const response = NextResponse.json({
        success: true,
        user: safeUser
      });

      // 3. Set Secure Cookies
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400, // 24 hours
        path: '/',
      });

      // Also set a non-httpOnly role cookie for frontend UI logic
      response.cookies.set('role', user.role.toUpperCase(), {
        maxAge: 86400,
        path: '/',
      });

      response.cookies.set('name', user.name, {
        maxAge: 86400,
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
