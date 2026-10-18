import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, RotateCw, FlipHorizontal2, Download, Undo2, Share2 } from "lucide-react";
import { ProShell, Panel, Slider, proButton, proPrimary, proField } from "./shell";
import { adjust, cropRect, formatBytes } from "@/lib/pro/pixels";
import { canShareFiles, canvasBlob, loadImage, saveBlob, shareBlob, stamp } from "@/lib/pro/files";

type Format = "image/jpeg" | "image/png" | "image/webp";
const FORMATS: { id: Format; label: string; ext: string }[] = [
  { id: "image/jpeg", label: "JPG", ext: "jpg" },
  { id: "image/png", label: "PNG", ext: "png" },
  { id: "image/webp", label: "WebP", ext: "webp" },
];
type Settings = {
  rotation: number;
  flip: boolean;
  crop: { top: number; right: number; bottom: number; left: number };
  width: number;
  brightness: number;
  contrast: number;
  saturation: number;
  watermark: string;
  wmOpacity: number;
};
const fresh = (w: number): Settings => ({
  rotation: 0,
  flip: false,
  crop: { top: 0, right: 0, bottom: 0, left: 0 },
  width: w,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  watermark: "",
  wmOpacity: 45,
});
const PRESETS: { label: string; s: Partial<Settings> }[] = [
  { label: "طبيعي", s: { brightness: 0, contrast: 0, saturation: 0 } },
  { label: "حيوي", s: { brightness: 4, contrast: 14, saturation: 30 } },
  { label: "دافئ هادئ", s: { brightness: 6, contrast: -6, saturation: 12 } },
  { label: "أبيض وأسود", s: { brightness: 0, contrast: 18, saturation: -100 } },
  { label: "باهت", s: { brightness: 10, contrast: -18, saturation: -25 } },
];

function render(img: HTMLImageElement, s: Settings, maxWidth?: number) {
  const r = cropRect(img.naturalWidth, img.naturalHeight, s.crop);
  const turned = s.rotation % 180 !== 0;
  const targetW = Math.min(maxWidth ?? s.width, s.width);
  const k = Math.min(1, targetW / (turned ? r.h : r.w));
  const w = Math.max(1, Math.round(r.w * k));
  const h = Math.max(1, Math.round(r.h * k));
  const c = document.createElement("canvas");
  c.width = turned ? h : w;
  c.height = turned ? w : h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((s.rotation * Math.PI) / 180);
  if (s.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, r.x, r.y, r.w, r.h, -w / 2, -h / 2, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (s.brightness || s.contrast || s.saturation) {
    const data = ctx.getImageData(0, 0, c.width, c.height);
    adjust(data.data, s);
    ctx.putImageData(data, 0, 0);
  }
  if (s.watermark.trim()) {
    const size = Math.max(14, Math.round(c.width / 22));
    ctx.font = `600 ${size}px "IBM Plex Sans Arabic", system-ui, sans-serif`;
    ctx.globalAlpha = s.wmOpacity / 100;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.lineWidth = Math.max(1, size / 12);
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.direction = /[\u0600-\u06FF]/.test(s.watermark) ? "rtl" : "ltr";
    ctx.strokeText(s.watermark, c.width / 2, c.height - size * 0.6);
    ctx.fillText(s.watermark, c.width / 2, c.height - size * 0.6);
    ctx.globalAlpha = 1;
  }
  return c;
}

export function ImageStudioApp() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState("image");
  const [origSize, setOrigSize] = useState(0);
  const [s, setS] = useState<Settings>(fresh(1600));
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [quality, setQuality] = useState(82);
  const [preview, setPreview] = useState("");
  const [out, setOut] = useState<{ blob: Blob; name: string; w: number; h: number } | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const webpOk = useMemo(() => {
    if (typeof document === "undefined") return false;
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  }, []);

  useEffect(() => {
    if (!img) return;
    setOut(null);
    const id = setTimeout(() => setPreview(render(img, s, 900).toDataURL("image/jpeg", 0.85)), 80);
    return () => clearTimeout(id);
  }, [img, s]);

  async function open(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setError("");
    try {
      const im = await loadImage(URL.createObjectURL(f));
      setImg(im);
      setName(f.name.replace(/\.[^.]+$/, "") || "image");
      setOrigSize(f.size);
      setS(fresh(im.naturalWidth));
    } catch {
      setError("تعذّر فتح هذه الصورة. جرّب JPG أو PNG.");
    }
    if (input.current) input.current.value = "";
  }

  async function exportImage() {
    if (!img) return;
    const c = render(img, s);
    const type = format === "image/webp" && !webpOk ? "image/png" : format;
    const blob = await canvasBlob(c, type, type === "image/png" ? undefined : quality / 100);
    const ext = FORMATS.find((f) => f.id === type)!.ext;
    const file = `${name}-waha-${stamp()}.${ext}`;
    setOut({ blob, name: file, w: c.width, h: c.height });
    saveBlob(blob, file);
  }

  const set = (p: Partial<Settings>) => setS((x) => ({ ...x, ...p }));
  const maxW = img?.naturalWidth ?? 4000;

  return (
    <ProShell
      title="استوديو الصور"
      subtitle="قص ودوّر واقلب، اضبط الإضاءة والتباين والتشبّع بفلاتر جاهزة، غيّر المقاس واضغط الحجم وصيغة الملف، وأضف علامة مائية بالعربي."
    >
      <Panel>
        <input
          ref={input}
          id="img-input"
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="اختر صورة"
          onChange={(e) => open(e.target.files)}
        />
        <label htmlFor="img-input" className={`${proPrimary} w-full cursor-pointer`}>
          <ImagePlus className="size-5" aria-hidden="true" /> {img ? "افتح صورة أخرى" : "اختر صورة"}
        </label>
        {error && (
          <p role="alert" className="rounded-xl border border-red-400 p-3 text-sm">
            {error}
          </p>
        )}
      </Panel>
      {img && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-2">
            <div className="grid min-h-64 place-items-center rounded-2xl border border-border bg-surface-2 p-3">
              {preview && (
                <img
                  src={preview}
                  alt="معاينة الصورة بعد التعديل"
                  className="max-h-[60vh] max-w-full shadow"
                />
              )}
            </div>
            <p className="text-xs text-muted">
              الأصل: {img.naturalWidth}×{img.naturalHeight} · {formatBytes(origSize)}
            </p>
          </div>
          <div className="space-y-4">
            <Panel title="الشكل">
              <div className="flex flex-wrap gap-2">
                <button
                  className={proButton}
                  onClick={() => set({ rotation: (s.rotation + 90) % 360 })}
                >
                  <RotateCw className="size-4" /> تدوير
                </button>
                <button
                  className={proButton}
                  aria-pressed={s.flip}
                  onClick={() => set({ flip: !s.flip })}
                >
                  <FlipHorizontal2 className="size-4" /> قلب
                </button>
                <button className={proButton} onClick={() => setS(fresh(img.naturalWidth))}>
                  <Undo2 className="size-4" /> إعادة
                </button>
              </div>
              <Slider
                label="قص من الأعلى"
                value={s.crop.top}
                min={0}
                max={45}
                onChange={(v) => set({ crop: { ...s.crop, top: v } })}
                suffix="%"
              />
              <Slider
                label="قص من الأسفل"
                value={s.crop.bottom}
                min={0}
                max={45}
                onChange={(v) => set({ crop: { ...s.crop, bottom: v } })}
                suffix="%"
              />
              <Slider
                label="قص من اليمين"
                value={s.crop.right}
                min={0}
                max={45}
                onChange={(v) => set({ crop: { ...s.crop, right: v } })}
                suffix="%"
              />
              <Slider
                label="قص من اليسار"
                value={s.crop.left}
                min={0}
                max={45}
                onChange={(v) => set({ crop: { ...s.crop, left: v } })}
                suffix="%"
              />
              <Slider
                label="العرض بالبكسل"
                value={Math.min(s.width, maxW)}
                min={Math.min(200, maxW)}
                max={maxW}
                step={10}
                onChange={(v) => set({ width: v })}
              />
            </Panel>
            <Panel title="الألوان">
              <div className="flex flex-wrap gap-2" role="group" aria-label="فلاتر جاهزة">
                {PRESETS.map((p) => (
                  <button key={p.label} className={proButton} onClick={() => set(p.s)}>
                    {p.label}
                  </button>
                ))}
              </div>
              <Slider
                label="الإضاءة"
                value={s.brightness}
                min={-60}
                max={60}
                onChange={(v) => set({ brightness: v })}
              />
              <Slider
                label="التباين"
                value={s.contrast}
                min={-60}
                max={60}
                onChange={(v) => set({ contrast: v })}
              />
              <Slider
                label="التشبّع"
                value={s.saturation}
                min={-100}
                max={80}
                onChange={(v) => set({ saturation: v })}
              />
            </Panel>
            <Panel title="علامة مائية">
              <input
                className={proField}
                value={s.watermark}
                onChange={(e) => set({ watermark: e.target.value })}
                placeholder="مثال: © متجري"
                aria-label="نص العلامة المائية"
              />
              <Slider
                label="الشفافية"
                value={s.wmOpacity}
                min={10}
                max={100}
                onChange={(v) => set({ wmOpacity: v })}
                suffix="%"
              />
            </Panel>
            <Panel title="الحفظ">
              <div className="flex gap-2" role="group" aria-label="صيغة الملف">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    aria-pressed={format === f.id}
                    disabled={f.id === "image/webp" && !webpOk}
                    className={`${proButton} flex-1 ${format === f.id ? "!bg-primary !text-primary-fg" : ""}`}
                    onClick={() => setFormat(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {!webpOk && (
                <p className="text-xs text-muted">متصفحك لا يدعم حفظ WebP؛ استخدم JPG أو PNG.</p>
              )}
              {format !== "image/png" && (
                <Slider
                  label="الجودة (أقل = حجم أصغر)"
                  value={quality}
                  min={30}
                  max={100}
                  step={2}
                  onChange={setQuality}
                  suffix="%"
                />
              )}
              <button className={`${proPrimary} w-full`} onClick={exportImage}>
                <Download className="size-5" aria-hidden="true" /> احفظ الصورة
              </button>
              {out && (
                <div role="status" className="space-y-2 rounded-xl bg-primary/10 p-3 text-sm">
                  <p>
                    جاهز: {out.w}×{out.h} · {formatBytes(out.blob.size)}
                    {origSize ? ` (${Math.round((out.blob.size / origSize) * 100)}% من الأصل)` : ""}
                  </p>
                  <span className="flex gap-2">
                    <button className={proButton} onClick={() => saveBlob(out.blob, out.name)}>
                      تنزيل مجددًا
                    </button>
                    {canShareFiles() && (
                      <button className={proButton} onClick={() => shareBlob(out.blob, out.name)}>
                        <Share2 className="size-4" aria-hidden="true" /> مشاركة
                      </button>
                    )}
                  </span>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </ProShell>
  );
}
