import qrcode from 'qrcode-generator';

/** Quiet zone, in modules, on every side (Pix, MIN-4473 section 5). */
export const QUIET = 4;
export const MIN_MODULE_PX = 6;
export const MAX_MODULE_PX = 8;

/** A standard QR code, error correction Q, modules untouched. */
export function qrMatrix(text: string): boolean[][] {
  const q = qrcode(0, 'Q');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => q.isDark(r, c)));
}

/** Integer pixels per module: as large as fits `availableWidth` with the quiet zone, 6 to 8 (Pix: never below 6). */
export function moduleSize(modules: number, availableWidth: number): number {
  return Math.min(MAX_MODULE_PX, Math.max(MIN_MODULE_PX, Math.floor(availableWidth / (modules + 2 * QUIET))));
}

/** One SVG path of unit squares; the SVG's viewBox is in modules, so scaling it by an integer keeps edges crisp. */
export function qrPath(matrix: boolean[][]): string {
  const parts: string[] = [];
  matrix.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      if (!row[c]) {
        c++;
        continue;
      }
      let run = 1;
      while (c + run < row.length && row[c + run]) run++;
      parts.push(`M${c + QUIET} ${r + QUIET}h${run}v1h-${run}z`);
      c += run;
    }
  });
  return parts.join('');
}
