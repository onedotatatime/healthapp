/**
 * Before upload (PRD 12.2): decode with the right rotation, scale the long edge to 2000 px, re-encode as JPEG 0.85.
 * The re-encode drops EXIF (GPS included) and turns an iPhone HEIC into JPEG. Throws when the file is not an image
 * the browser can decode: the screen says so instead of sending something unreadable.
 */
export const LONG_EDGE = 2000;

export async function preparePhoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, LONG_EDGE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
  if (!blob) throw new Error('no blob');
  return blob;
}
