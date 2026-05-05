import { NextResponse } from 'next/server';
import { createRecord, listRecords } from '@/lib/store';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function GET(request, context) {
  const { module: moduleKey } = await context.params;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = searchParams.get('page') || 1;
  const limit = searchParams.get('limit') || 10;

  // Convert all other search params into filters
  const filters = {};
  searchParams.forEach((value, key) => {
    if (!['q', 'page', 'limit'].includes(key)) {
      filters[key] = value;
    }
  });

  const options = { q, page, limit, ...filters };

  const result = await listRecords(moduleKey, options);

  if (!result) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, ...result });
}

export async function POST(request, context) {
  const { module: moduleKey } = await context.params;
  const payload = await request.json();

  // Hash password if creating a user
  if (moduleKey === 'users' && payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  const record = await createRecord(moduleKey, payload);

  if (!record) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  }

  return NextResponse.json({ data: record }, { status: 201 });
}
