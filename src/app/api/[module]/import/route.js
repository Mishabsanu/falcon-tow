import { NextResponse } from 'next/server';
import { parseCsv } from '@/lib/exporters';
import { importRecords } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(request, context) {
  const { module: moduleKey } = await context.params;
  const contentType = request.headers.get('content-type') ?? '';
  const rows = contentType.includes('application/json')
    ? await request.json()
    : parseCsv(await request.text());
  const imported = await importRecords(moduleKey, Array.isArray(rows) ? rows : rows.data ?? []);

  if (!imported) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  }

  return NextResponse.json({ data: imported, count: imported.length }, { status: 201 });
}
