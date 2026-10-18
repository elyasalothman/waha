// Map a point given on the page as the reader sees it (after /Rotate) back to PDF user space.
// PDF viewers rotate the page clockwise by `rotation`; pdf-lib rotates drawings counter-clockwise.
export type Box = { x: number; y: number; width: number; height: number };

export function normRotation(r: number) {
  return (((Math.round(r / 90) * 90) % 360) + 360) % 360;
}

/** Visual (as displayed) page size for a box and rotation. */
export function visualSize(box: Box, rotation: number) {
  const r = normRotation(rotation);
  return r % 180 ? { w: box.height, h: box.width } : { w: box.width, h: box.height };
}

/** Visual bottom-left based point → user space point; draw with rotate = rotation to look upright. */
export function visualToUser(box: Box, rotation: number, vx: number, vy: number) {
  const r = normRotation(rotation);
  const { x, y, width: w, height: h } = box;
  if (r === 90) return { x: x + w - vy, y: y + vx };
  if (r === 180) return { x: x + w - vx, y: y + h - vy };
  if (r === 270) return { x: x + vy, y: y + h - vx };
  return { x: x + vx, y: y + vy };
}

export type Anchor = "br" | "bc" | "bl" | "tr" | "tl" | "c";
export const ANCHORS: { id: Anchor; label: string }[] = [
  { id: "bl", label: "أسفل يسار" },
  { id: "bc", label: "أسفل الوسط" },
  { id: "br", label: "أسفل يمين" },
  { id: "tl", label: "أعلى يسار" },
  { id: "tr", label: "أعلى يمين" },
  { id: "c", label: "الوسط" },
];

/** Visual bottom-left corner for an item of size (iw, ih) placed at an anchor with a margin. */
export function anchorPoint(
  vw: number,
  vh: number,
  iw: number,
  ih: number,
  anchor: Anchor,
  margin = 28,
) {
  const left = margin;
  const right = vw - iw - margin;
  const cx = (vw - iw) / 2;
  const bottom = margin;
  const top = vh - ih - margin;
  switch (anchor) {
    case "bl":
      return { x: left, y: bottom };
    case "bc":
      return { x: cx, y: bottom };
    case "br":
      return { x: right, y: bottom };
    case "tl":
      return { x: left, y: top };
    case "tr":
      return { x: right, y: top };
    default:
      return { x: cx, y: (vh - ih) / 2 };
  }
}
