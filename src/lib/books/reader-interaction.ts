/** A central tap toggles chrome, while selection, links and scrolling keep their normal behavior. */
export function isReaderToggleTap({
  x,
  y,
  width,
  height,
  start,
  interactive,
  selection,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  start?: { x: number; y: number };
  interactive: boolean;
  selection: string;
}): boolean {
  if (interactive || selection || width <= 0 || height <= 0) return false;
  if (start && Math.hypot(x - start.x, y - start.y) > 12) return false;
  return x >= width * 0.2 && x <= width * 0.8 && y >= height * 0.2 && y <= height * 0.8;
}
