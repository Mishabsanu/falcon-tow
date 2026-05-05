export function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

export function toCsv(records) {
  const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  const rows = records.map((record) => headers.map((header) => escapeCsv(record[header] ?? '')).join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function toPdf(title, records) {
  const lines = [
    title,
    `Generated: ${new Date().toISOString()}`,
    '',
    ...records.slice(0, 40).map((record) => Object.entries(record).map(([key, value]) => `${key}: ${value}`).join(' | ')),
  ];
  const text = lines.map((line, index) => `BT /F1 10 Tf 40 ${780 - index * 16} Td (${escapePdf(line)}) Tj ET`).join('\n');
  const body = `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${text.length} >> stream
${text}
endstream endobj
xref
0 6
0000000000 65535 f 
trailer << /Root 1 0 R /Size 6 >>
startxref
0
%%EOF`;

  return body;
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function escapeCsv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function escapePdf(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}
