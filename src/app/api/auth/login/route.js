import { NextResponse } from 'next/server';
import { listRecords } from '@/lib/store';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username: identifier, password } = await request.json();

    // Fetch users from the 'users' collection
    const result = await listRecords('users', { limit: 1000 });

    if (!result || !result.data || result.data.length === 0) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Match strictly by email
    const user = result.data.find(u => 
      u.email?.toLowerCase() === identifier.toLowerCase()
    );

    if (user && await bcrypt.compare(password, user.password)) {
      // Don't send password back to client
      const { password: _, ...safeUser } = user;
      return NextResponse.json({
        success: true,
        user: safeUser
      });
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
