import { useEffect, useRef, useState } from "react";
import { proButton } from "./shell";

/** Draw a signature with finger or mouse; returns a transparent PNG data URL via onChange. */
export function SignaturePad({ onChange }: { onChange: (png: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    c.width = c.clientWidth * ratio;
    c.height = c.clientHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#0b1b3a";
  }, []);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        aria-label="لوحة التوقيع"
        className="h-40 w-full touch-none rounded-xl border border-dashed border-border bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = e.currentTarget.getContext("2d")!;
          const p = point(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 0.1, p.y + 0.1);
          ctx.stroke();
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext("2d")!;
          const p = point(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={(e) => {
          drawing.current = false;
          setEmpty(false);
          onChange(trimmed(e.currentTarget));
        }}
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {empty ? "وقّع بإصبعك أو بالفأرة داخل المربع" : "تم حفظ التوقيع مؤقتًا في هذه الصفحة"}
        </span>
        <button
          type="button"
          className={proButton}
          onClick={() => {
            const c = ref.current;
            if (!c) return;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            setEmpty(true);
            onChange(null);
          }}
        >
          مسح
        </button>
      </div>
    </div>
  );
}

/** Crop the drawing to its ink bounding box (plus padding) so placement sizes are accurate. */
function trimmed(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!;
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width,
    y0 = height,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return c.toDataURL("image/png");
  const pad = 8;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(width - 1, x1 + pad);
  y1 = Math.min(height - 1, y1 + pad);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

/** Render text (Arabic shaping handled by the browser) into a tight transparent PNG. */
export function textToPng(text: string, color = "#0b1b3a", px = 64) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  const font = `600 ${px}px "IBM Plex Sans Arabic", "Noto Naskh Arabic", system-ui, sans-serif`;
  ctx.font = font;
  const m = ctx.measureText(text);
  c.width = Math.ceil(m.width + px * 0.5);
  c.height = Math.ceil(px * 1.6);
  const ctx2 = c.getContext("2d")!;
  ctx2.font = font;
  ctx2.fillStyle = color;
  ctx2.textBaseline = "middle";
  ctx2.direction = /[\u0600-\u06FF]/.test(text) ? "rtl" : "ltr";
  ctx2.textAlign = "center";
  ctx2.fillText(text, c.width / 2, c.height / 2);
  return { png: c.toDataURL("image/png"), w: c.width, h: c.height };
}
