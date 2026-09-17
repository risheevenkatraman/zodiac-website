/**
 * Samples a mark (PNG with alpha) into a point set. Runs in the browser: the
 * image is drawn to a small canvas and opaque pixels are picked with
 * probability proportional to their alpha, then jittered inside the pixel.
 * Coordinates come back normalized to [-1, 1] with y up, aspect preserved.
 */
export type SampledPoints = {
  /** xyz per point, z is depth jitter in [-1, 1] */
  positions: Float32Array;
  /** rgb per point in [0, 1], the source pixel colour */
  colors: Float32Array;
  /** where the whole source image sits in the same normalized space (x right, y up), so it can be drawn under the points */
  frame: { x: number; y: number; w: number; h: number };
};

export type SampleOptions = {
  /** number of points to return */
  count: number;
  /** raster size used for sampling */
  resolution?: number;
  /** skip pixels within this normalized radius of the centre (0 disables) */
  holeRadius?: number;
  /** fraction of the image the mark should occupy after normalization */
  fit?: number;
  /** deterministic seed */
  seed?: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

export async function samplePoints(src: string, opts: SampleOptions): Promise<SampledPoints> {
  const res = opts.resolution ?? 256;
  const rand = mulberry32(opts.seed ?? 7);
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  ctx.clearRect(0, 0, res, res);
  ctx.drawImage(img, 0, 0, res, res);
  const { data } = ctx.getImageData(0, 0, res, res);

  // Candidate pixels with cumulative weights, plus the mark's bounding box.
  const idx: number[] = [];
  const cum: number[] = [];
  let acc = 0;
  let minX = res, minY = res, maxX = 0, maxY = 0;
  const hole = opts.holeRadius ?? 0;
  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const i = (y * res + x) * 4;
      const a = data[i + 3];
      if (a < 24) continue;
      const nx = (x + 0.5) / res * 2 - 1;
      const ny = (y + 0.5) / res * 2 - 1;
      if (hole > 0 && nx * nx + ny * ny < hole * hole) continue;
      acc += a / 255;
      idx.push(i);
      cum.push(acc);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const positions = new Float32Array(opts.count * 3);
  const colors = new Float32Array(opts.count * 3);
  if (idx.length === 0) return { positions, colors, frame: { x: -1, y: 1, w: 2, h: 2 } };

  const fit = opts.fit ?? 0.9;
  const cx = (minX + maxX + 1) / 2;
  const cy = (minY + maxY + 1) / 2;
  const extent = Math.max(maxX - minX + 1, maxY - minY + 1);
  const scale = (2 * fit) / extent;
  const frame = { x: -cx * scale, y: cy * scale, w: res * scale, h: res * scale };

  for (let p = 0; p < opts.count; p++) {
    // binary search the cumulative weights
    const r = rand() * acc;
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const i = idx[lo];
    const pix = i / 4;
    const x = pix % res;
    const y = (pix - x) / res;
    const jx = x + rand();
    const jy = y + rand();
    positions[p * 3] = (jx - cx) * scale;
    positions[p * 3 + 1] = -(jy - cy) * scale;
    positions[p * 3 + 2] = rand() * 2 - 1;
    colors[p * 3] = data[i] / 255;
    colors[p * 3 + 1] = data[i + 1] / 255;
    colors[p * 3 + 2] = data[i + 2] / 255;
  }
  return { positions, colors, frame };
}
