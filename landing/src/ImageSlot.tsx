import { useState } from 'react';

/** Calm placeholder block with the right aspect ratio. Drop the file into public/img/ and it appears. */
export default function ImageSlot({
  src,
  alt,
  ratio,
  mobileRatio
}: {
  src: string;
  alt: string;
  ratio: string;
  mobileRatio?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="slot"
      style={{ ['--ratio' as string]: ratio, ['--ratio-m' as string]: mobileRatio ?? ratio }}
    >
      {!failed && <img src={src} alt={alt} onError={() => setFailed(true)} />}
    </div>
  );
}
