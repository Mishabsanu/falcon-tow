import { toPdf } from '@/lib/exporters';
import { listRecords } from '@/lib/store';
import { moduleData } from '@/lib/moduleData';

export const runtime = 'nodejs';

export async function GET(_request, context) {
  const { module: moduleKey } = await context.params;
  const records = await listRecords(moduleKey);
  const config = moduleData[moduleKey];

  if (!records || !config) {
    return Response.json({ error: 'Module not found' }, { status: 404 });
  }

  return new Response(toPdf(`${config.title} Report`, records), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${moduleKey}.pdf"`,
    },
  });
}
