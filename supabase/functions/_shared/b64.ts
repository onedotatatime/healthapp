// Chunked base64 for photos (MIN-4542). Spreading a whole image into String.fromCharCode overflows
// the call stack on normal-size photos, so encode in 0x8000-byte slices, then btoa once.
export function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
