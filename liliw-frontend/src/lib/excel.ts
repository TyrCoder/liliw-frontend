import * as XLSX from 'xlsx-js-style';

/**
 * Branded Excel exports.
 *
 * The reports tab already produced styled workbooks, but the styling lived
 * inline in admin/page.tsx, so every new export either started from a plain
 * CSV — which opens in Excel as an unformatted grid with the columns collapsed
 * — or copied a hundred lines of border definitions. This is that styling,
 * once, in the same navy and gold as everything else.
 */

const NAVY = '0B3D91';
const GOLD = 'F5C518';
const ZEBRA = 'F0F5FF';

const BORDER = {
  top:    { style: 'thin', color: { rgb: 'E5E7EB' } },
  bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
  left:   { style: 'thin', color: { rgb: 'E5E7EB' } },
  right:  { style: 'thin', color: { rgb: 'E5E7EB' } },
};

export interface SheetColumn<T> {
  header: string;
  /** Cell value. Return a Date for real date cells rather than text. */
  value: (row: T) => string | number | Date | null;
  /** Character width. Left out, it is measured from the content. */
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface SheetSpec<T> {
  /** Workbook file name, without the .xlsx. */
  filename: string;
  /** Tab name. Excel forbids : \ / ? * [ ] and caps it at 31 characters. */
  sheetName: string;
  title: string;
  subtitle?: string;
  columns: SheetColumn<T>[];
  rows: T[];
}

/** Excel rejects the whole file if a sheet name breaks its rules. */
function safeSheetName(name: string) {
  return (name.replace(/[:\\/?*[\]]/g, '-').trim() || 'Sheet1').slice(0, 31);
}

function fmtValue(v: string | number | Date | null) {
  if (v === null || v === undefined) return '';
  return v;
}

export function exportSheet<T>({
  filename, sheetName, title, subtitle, columns, rows,
}: SheetSpec<T>) {
  const nCols = columns.length;
  const blank = Array(Math.max(nCols - 1, 0)).fill('');

  const body = rows.map(r => columns.map(c => fmtValue(c.value(r))));

  const aoa: (string | number | Date)[][] = [
    [title, ...blank],
    [subtitle ?? '', ...blank],
    ['', ...blank],
    columns.map(c => c.header),
    ...body,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Title and subtitle span the table so they read as headings rather than as
  // a value that happens to sit in column A.
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(nCols - 1, 0) } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(nCols - 1, 0) } },
  ];

  // Measured from the content, because the default width truncates almost
  // every real value — an email column shows "tbalbie…" and someone has to
  // drag every column before the sheet is usable.
  ws['!cols'] = columns.map((c, i) => {
    if (c.width) return { wch: c.width };
    const longest = body.reduce(
      (max, row) => Math.max(max, String(row[i] ?? '').length),
      c.header.length,
    );
    return { wch: Math.min(Math.max(longest + 2, 10), 46) };
  });

  ws['!rows'] = [{ hpt: 26 }, { hpt: 18 }, { hpt: 6 }, { hpt: 22 }];

  const put = (r: number, c: number, style: Record<string, unknown>, numFmt?: string) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = style;
    // The number format has to go on the cell's own `z`, not into the style
    // object. `s.numFmt` is accepted without complaint and then dropped —
    // checked by writing a workbook both ways and reading numFmts out of
    // styles.xml, where only the `z` version registered a format.
    if (numFmt) ws[addr].z = numFmt;
  };

  for (let c = 0; c < nCols; c++) {
    put(0, c, {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: NAVY } },
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    put(1, c, {
      font: { italic: true, sz: 10, color: { rgb: '4B5563' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'EFF6FF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    });
    put(3, c, {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: NAVY } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: { ...BORDER, bottom: { style: 'medium', color: { rgb: GOLD } } },
    });
  }

  for (let i = 0; i < body.length; i++) {
    const r = i + 4;
    for (let c = 0; c < nCols; c++) {
      const isDate = body[i][c] instanceof Date;
      put(r, c, {
        fill: { patternType: 'solid', fgColor: { rgb: i % 2 ? ZEBRA : 'FFFFFF' } },
        border: BORDER,
        alignment: {
          horizontal: columns[c].align ?? (isDate ? 'center' : 'left'),
          vertical: 'top',
          wrapText: true,
        },
      },
      // A Date is written as a real date cell — so it sorts as a date rather
      // than as text — but the default m/d/yy format drops the time, which is
      // the part that matters for "when did they sign up".
      isDate ? 'yyyy-mm-dd hh:mm' : undefined);
    }
  }

  // Filter dropdowns on the header row, so whoever opens it can sort and
  // filter without setting anything up.
  //
  // No frozen header row: xlsx-js-style writes neither `!freeze` nor `!views`
  // into the file — checked by generating a workbook and reading the XML, and
  // both were silently dropped. Leaving the line in would have looked like the
  // feature was there.
  if (body.length) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range(
        { r: 3, c: 0 },
        { r: 3 + body.length, c: Math.max(nCols - 1, 0) },
      ),
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName(sheetName));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
