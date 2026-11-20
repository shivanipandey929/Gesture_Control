export interface ObjectFitMappingParams {
  boxWidth: number;
  boxHeight: number;
  videoWidth: number;
  videoHeight: number;
  objectFit?: 'cover' | 'contain';
  mirrored?: boolean;
}

export interface MappedPoint {
  x: number;
  y: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  percentX: number;
  percentY: number;
}

/**
 * Maps normalized camera landmark coordinates (0..1) to displayed box pixels
 * using CSS object-fit (cover or contain) geometry and mirroring.
 *
 * For object-fit: cover:
 *   s = max(W/vw, H/vh)
 *   ox = (W - vw * s) / 2
 *   oy = (H - vh * s) / 2
 *   x = ox + (mirrored ? (1 - lmX) : lmX) * vw * s
 *   y = oy + lmY * vh * s
 */
export function mapCameraPointToArena(
  lmX: number,
  lmY: number,
  params: ObjectFitMappingParams
): MappedPoint {
  const {
    boxWidth: W,
    boxHeight: H,
    videoWidth: vwRaw,
    videoHeight: vhRaw,
    objectFit = 'cover',
    mirrored = true,
  } = params;

  const vw = vwRaw > 0 ? vwRaw : 640;
  const vh = vhRaw > 0 ? vhRaw : 480;

  const scale =
    objectFit === 'contain'
      ? Math.min(W / vw, H / vh)
      : Math.max(W / vw, H / vh);

  const offsetX = (W - vw * scale) / 2;
  const offsetY = (H - vh * scale) / 2;

  const camX = mirrored ? 1 - lmX : lmX;
  const camY = lmY;

  const x = offsetX + camX * vw * scale;
  const y = offsetY + camY * vh * scale;

  const percentX = W > 0 ? (x / W) * 100 : 50;
  const percentY = H > 0 ? (y / H) * 100 : 50;

  return {
    x,
    y,
    scale,
    offsetX,
    offsetY,
    percentX,
    percentY,
  };
}
