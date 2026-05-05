import { NextResponse } from 'next/server';
import { listRecords } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 20;

    const result = await listRecords('notifications', { page, limit });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Notifications module not configured' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Notifications API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
