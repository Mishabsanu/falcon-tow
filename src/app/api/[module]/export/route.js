import { toCsv } from '@/lib/exporters';
import { listRecords } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(_request, context) {
  const { module: moduleKey } = await context.params;
  const records = await listRecords(moduleKey);

  if (!records) {
    return Response.json({ error: 'Module not found' }, { status: 404 });
  }

  return new Response(toCsv(records), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${moduleKey}.csv"`,
    },
  });
}
