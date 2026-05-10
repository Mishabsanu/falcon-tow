import { NextResponse } from 'next/server';
import { runFleetScout } from '@/utils/fleetScout';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await runFleetScout();
    return NextResponse.json({ success: true, message: 'Fleet scout mission completed.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
