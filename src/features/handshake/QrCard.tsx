import { useMemo } from 'react';
import { Helix } from './Helix';
import { QUIET, moduleSize, qrMatrix, qrPath } from './qr';

interface Props {
  /** The full QR text, `https://<app>/s#hs1.<22>`. */
  text: string;
  /** Room for the card, px (page width minus its margins). */
  available: number;
  helix: boolean;
  /** The code has lapsed: the card keeps its size and says so instead of showing a code that no longer works. */
  expired: boolean;
  secondsLeft: number;
}

const HELIX_PAD = 84; // Pix: the card sits 84 px below the helix's top (card y 180, helix y 96)

/**
 * Pix's QR card (MIN-4473 section 5): opaque white, radius 8, a standard code with error correction Q, integer module
 * size 6 to 8, a 4-module white quiet zone inside the card, ink (brand --ink on white, 16:1), nothing over it. The helix is drawn
 * behind it and can be switched off (the scan test needs that).
 */
export function QrCard({ text, available, helix, expired, secondsLeft }: Props) {
  const matrix = useMemo(() => qrMatrix(text), [text]);
  const n = matrix.length;
  const m = moduleSize(n, available);
  const side = (n + 2 * QUIET) * m;
  const path = useMemo(() => qrPath(matrix), [matrix]);
  const stageH = side + 2 * HELIX_PAD;
  return (
    <div className="hs-stage" style={{ height: helix ? stageH : side }}>
      {helix && <Helix height={stageH} />}
      <div className="hs-card" style={{ width: side, height: side, top: helix ? HELIX_PAD : 0 }} data-testid="share-qr" data-module-px={m} data-modules={n}>
        {expired ? (
          <p className="hs-card-expired" role="status">
            This code has expired.
            <br />
            Make a new one.
          </p>
        ) : (
          <svg
            width={side}
            height={side}
            viewBox={`0 0 ${n + 2 * QUIET} ${n + 2 * QUIET}`}
            shapeRendering="crispEdges"
            role="img"
            aria-label={`Code to share your record, valid for ${secondsLeft} seconds`}
          >
            <rect width={n + 2 * QUIET} height={n + 2 * QUIET} fill="var(--white)" />
            <path d={path} fill="var(--ink)" />
          </svg>
        )}
      </div>
    </div>
  );
}
