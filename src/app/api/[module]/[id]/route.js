import { NextResponse } from 'next/server';
import { deleteRecord, getRecord, updateRecord } from '@/lib/store';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function GET(_request, context) {
  const { module: moduleKey, id } = await context.params;
  const record = await getRecord(moduleKey, id);

  if (!record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}

export async function PUT(request, context) {
  const { module: moduleKey, id } = await context.params;
  const payload = await request.json();

  // Hash password if updating a user and password is provided
  if (moduleKey === 'users' && payload.password) {
    // Check if it's already a hash (starts with $2)
    if (!payload.password.startsWith('$2')) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
  }

  const record = await updateRecord(moduleKey, id, payload);

  if (!record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}

export async function DELETE(_request, context) {
  const { module: moduleKey, id } = await context.params;
  const deleted = await deleteRecord(moduleKey, id);

  if (!deleted) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  return NextResponse.json({ data: { id, deleted: true } });
}
