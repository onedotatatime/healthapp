import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { extractToken, formatShortCode, parseShortCode, typedCode } from './codes';
import { qrText } from './contract';
import { MAX_MODULE_PX, MIN_MODULE_PX, QUIET, moduleSize, qrMatrix } from './qr';

const TOKEN = 'hs1.AbCdEfGhIjKlMnOpQrStUv';
const ORIGIN = 'https://healthapp-staging.pages.dev';

/** Rasterise the matrix the way the screen does (integer module size, 4-module white quiet zone, dark on light). */
function raster(matrix: boolean[][], m: number) {
  const side = (matrix.length + 2 * QUIET) * m;
  const px = new Uint8ClampedArray(side * side * 4).fill(255);
  matrix.forEach((row, r) =>
    row.forEach((on, c) => {
      if (!on) return;
      for (let y = 0; y < m; y++)
        for (let x = 0; x < m; x++) {
          const i = (((r + QUIET) * m + y) * side + (c + QUIET) * m + x) * 4;
          px[i] = 0x0b; px[i + 1] = 0x1f; px[i + 2] = 0x27; px[i + 3] = 255;
        }
    }),
  );
  return { px, side };
}

describe('the QR really decodes', () => {
  it('a fragment payload at 6 px and 8 px modules decodes back to the exact text', () => {
    const text = qrText(ORIGIN, TOKEN);
    const matrix = qrMatrix(text);
    for (const m of [MIN_MODULE_PX, MAX_MODULE_PX]) {
      const { px, side } = raster(matrix, m);
      expect(jsQR(px, side, side)?.data).toBe(text);
    }
  });
  it('the payload is a fragment: the token is not in the path or the query', () => {
    const u = new URL(qrText(ORIGIN, TOKEN));
    expect(u.pathname).toBe('/s');
    expect(u.search).toBe('');
    expect(u.hash).toBe(`#${TOKEN}`);
  });
  it('module size is an integer from 6 to 8 and shrinks with the screen', () => {
    const n = qrMatrix(qrText(ORIGIN, TOKEN)).length;
    expect(moduleSize(33, 390 - 32)).toBe(8);
    expect(moduleSize(n, 390 - 32)).toBeGreaterThanOrEqual(6);
    expect(moduleSize(n, 200)).toBe(6);
    expect(moduleSize(21, 4000)).toBe(8);
    expect(Number.isInteger(moduleSize(n, 377))).toBe(true);
  });
});

describe('codes', () => {
  it('finds the token in a scanned URL, a bare token, and rejects other text', () => {
    expect(extractToken(qrText(ORIGIN, TOKEN))).toBe(TOKEN);
    expect(extractToken(TOKEN)).toBe(TOKEN);
    expect(extractToken('https://example.com/s#hs2.AbCdEfGhIjKlMnOpQrStUv')).toBeNull();
    expect(extractToken('hello')).toBeNull();
  });
  it('typed codes: case and spaces forgiven, ambiguous characters refused', () => {
    expect(parseShortCode('k7mq 4rxd')).toBe('K7MQ4RXD');
    expect(parseShortCode('K7MQ-4RXD')).toBe('K7MQ4RXD');
    expect(parseShortCode('K7MQ4RX0')).toBeNull(); // 0 is not in the alphabet
    expect(parseShortCode('K7MQ4RX')).toBeNull();
    expect(typedCode('k7mq4rxd9')).toBe('K7MQ 4RXD');
    expect(typedCode('k7m')).toBe('K7M');
    expect(formatShortCode('K7MQ4RXD')).toBe('K7MQ 4RXD');
  });
});
