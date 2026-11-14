import { HANDSHAKE_TOKEN_RE, SHORT_CODE_ALPHABET, ShortCode } from './contract';

const TOKEN_IN_TEXT = /hs1\.[A-Za-z0-9_-]{22}/;

/** A scanned QR text (`https://<app>/s#hs1.<22>`) or a bare token to the token, else null. */
export function extractToken(text: string): string | null {
  const m = TOKEN_IN_TEXT.exec(text);
  return m && HANDSHAKE_TOKEN_RE.test(m[0]) ? m[0] : null;
}

/** What the doctor typed to a valid short code, or null. Spaces and dashes are ignored, case too. */
export function parseShortCode(input: string): string | null {
  const s = input.replace(/[\s-]/g, '').toUpperCase();
  const r = ShortCode.safeParse(s);
  return r.success ? r.data : null;
}

/** `K7MQ4RXD` shown as `K7MQ 4RXD` (4 + 4). */
export function formatShortCode(code: string): string {
  return `${code.slice(0, 4)} ${code.slice(4)}`;
}

/** Keeps only characters the alphabet allows and groups 4 + 4 while typing. */
export function typedCode(raw: string): string {
  const up = raw.toUpperCase().split('').filter((c) => SHORT_CODE_ALPHABET.includes(c)).slice(0, 8).join('');
  return up.length > 4 ? `${up.slice(0, 4)} ${up.slice(4)}` : up;
}
