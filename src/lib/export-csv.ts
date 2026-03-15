/**
 * Generic CSV exporter
 * Takes an array of objects + column config and triggers a browser download.
 */

interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
  /** Optional formatter — defaults to String(value) */
  format?: (row: T) => string;
}

export function exportCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string = 'export.csv'
) {
  if (data.length === 0) return;

  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerRow = columns.map((c) => escape(c.header)).join(',');

  const rows = data.map((row) =>
    columns
      .map((col) => {
        if (col.format) return escape(col.format(row));
        const val = row[col.key as keyof T];
        return escape(val == null ? '' : String(val));
      })
      .join(',')
  );

  const csvContent = [headerRow, ...rows].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
