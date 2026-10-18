// Pure pixel operations on RGBA buffers (ImageData.data). No DOM, so they run in tests and workers.
export type Rgba = Uint8ClampedArray;

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const luma = (d: Rgba, i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

export function grayscale(d: Rgba) {
  for (let i = 0; i < d.length; i += 4) {
    const y = luma(d, i);
    d[i] = d[i + 1] = d[i + 2] = y;
  }
  return d;
}

/** Otsu's threshold over the luminance histogram. */
export function otsuThreshold(d: Rgba) {
  const hist = new Array<number>(256).fill(0);
  let n = 0;
  for (let i = 0; i < d.length; i += 4) {
    hist[Math.round(luma(d, i))]++;
    n++;
  }
  if (!n) return 128;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = n - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

/** Crisp black-and-white "document" look. A small bias keeps light ink readable. */
export function blackWhite(d: Rgba, bias = 10) {
  const t = otsuThreshold(d) + bias;
  for (let i = 0; i < d.length; i += 4) {
    const v = luma(d, i) > t ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  return d;
}

/** Stretch luminance between the 2nd and 98th percentile: lifts grey paper to white. */
export function autoEnhance(d: Rgba) {
  const hist = new Array<number>(256).fill(0);
  let n = 0;
  for (let i = 0; i < d.length; i += 4) {
    hist[Math.round(luma(d, i))]++;
    n++;
  }
  if (!n) return d;
  const pick = (p: number) => {
    let acc = 0;
    for (let t = 0; t < 256; t++) {
      acc += hist[t];
      if (acc >= n * p) return t;
    }
    return 255;
  };
  const lo = pick(0.02);
  const hi = pick(0.98);
  if (hi - lo < 10) return d;
  const k = 255 / (hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp((d[i] - lo) * k);
    d[i + 1] = clamp((d[i + 1] - lo) * k);
    d[i + 2] = clamp((d[i + 2] - lo) * k);
  }
  return d;
}

/** brightness/contrast/saturation in -100..100; 0 leaves pixels untouched. */
export function adjust(d: Rgba, { brightness = 0, contrast = 0, saturation = 0 }) {
  if (!brightness && !contrast && !saturation) return d;
  const b = brightness * 2.55;
  const c = (259 * (contrast * 2.55 + 255)) / (255 * (259 - contrast * 2.55));
  const s = 1 + saturation / 100;
  for (let i = 0; i < d.length; i += 4) {
    let r = c * (d[i] - 128) + 128 + b;
    let g = c * (d[i + 1] - 128) + 128 + b;
    let bl = c * (d[i + 2] - 128) + 128 + b;
    const y = 0.299 * r + 0.587 * g + 0.114 * bl;
    r = y + (r - y) * s;
    g = y + (g - y) * s;
    bl = y + (bl - y) * s;
    d[i] = clamp(r);
    d[i + 1] = clamp(g);
    d[i + 2] = clamp(bl);
  }
  return d;
}

/** Crop rectangle from percentage margins, always at least 1px. */
export function cropRect(
  w: number,
  h: number,
  m: { top: number; right: number; bottom: number; left: number },
) {
  const pct = (v: number) => Math.min(Math.max(v, 0), 45) / 100;
  const x = Math.round(w * pct(m.left));
  const y = Math.round(h * pct(m.top));
  const cw = Math.max(1, Math.round(w * (1 - pct(m.left) - pct(m.right))));
  const ch = Math.max(1, Math.round(h * (1 - pct(m.top) - pct(m.bottom))));
  return { x, y, w: cw, h: ch };
}

/** Fit (w,h) inside a box, never upscaling. */
export function fitWithin(w: number, h: number, maxW: number, maxH: number) {
  const k = Math.min(1, maxW / w, maxH / h);
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} بايت`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} ك.ب`;
  return `${(n / 1024 / 1024).toFixed(1)} م.ب`;
}

/** Move an item one step in a list (immutable). */
export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return [...list];
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
