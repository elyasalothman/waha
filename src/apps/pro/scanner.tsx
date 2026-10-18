import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Share2,
} from "lucide-react";
import { ProShell, Panel, Slider, proButton, proPrimary } from "./shell";
import {
  autoEnhance,
  blackWhite,
  cropRect,
  fitWithin,
  formatBytes,
  grayscale,
  moveItem,
} from "@/lib/pro/pixels";
import { canShareFiles, canvasBlob, loadImage, saveBlob, shareBlob, stamp } from "@/lib/pro/files";

type Mode = "color" | "enhance" | "gray" | "bw";
const MODES: { id: Mode; label: string }[] = [
  { id: "enhance", label: "مُحسّن" },
  { id: "bw", label: "أبيض وأسود" },
  { id: "gray", label: "رمادي" },
  { id: "color", label: "الأصل" },
];
type Scan = {
  key: string;
  img: HTMLImageElement;
  rotation: number;
  mode: Mode;
  crop: { top: number; right: number; bottom: number; left: number };
};
const MAX_SIDE = 2000;

/** Render one scan to a canvas at working resolution with its filter applied. */
function renderScan(s: Scan, maxSide = MAX_SIDE) {
  const { naturalWidth: w0, naturalHeight: h0 } = s.img;
  const r = cropRect(w0, h0, s.crop);
  const fit = fitWithin(r.w, r.h, maxSide, maxSide);
  const turned = s.rotation % 180 !== 0;
  const c = document.createElement("canvas");
  c.width = turned ? fit.h : fit.w;
  c.height = turned ? fit.w : fit.h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((s.rotation * Math.PI) / 180);
  ctx.drawImage(s.img, r.x, r.y, r.w, r.h, -fit.w / 2, -fit.h / 2, fit.w, fit.h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (s.mode !== "color") {
    const data = ctx.getImageData(0, 0, c.width, c.height);
    if (s.mode === "gray") grayscale(data.data);
    if (s.mode === "enhance") autoEnhance(data.data);
    if (s.mode === "bw") blackWhite(data.data);
    ctx.putImageData(data, 0, 0);
  }
  return c;
}

export function ScannerApp() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const current = scans[active];

  useEffect(() => {
    if (!current) return setPreview("");
    const id = setTimeout(
      () => setPreview(renderScan(current, 900).toDataURL("image/jpeg", 0.85)),
      60,
    );
    return () => clearTimeout(id);
  }, [current]);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setResult(null);
    const next: Scan[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const img = await loadImage(URL.createObjectURL(f));
        next.push({
          key: `${Date.now()}-${next.length}-${f.name}`,
          img,
          rotation: 0,
          mode: "enhance",
          crop: { top: 0, right: 0, bottom: 0, left: 0 },
        });
      } catch {
        setError(`تعذّرت قراءة الصورة ${f.name}.`);
      }
    }
    setScans((s) => {
      setActive(s.length);
      return [...s, ...next];
    });
    if (camera.current) camera.current.value = "";
    if (gallery.current) gallery.current.value = "";
  }

  const patch = (p: Partial<Scan>) => {
    setResult(null);
    setScans((list) => list.map((s, i) => (i === active ? { ...s, ...p } : s)));
  };

  async function exportPdf() {
    setBusy("جارٍ إنشاء ملف PDF…");
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      for (const s of scans) {
        const c = renderScan(s);
        const jpg = await (await canvasBlob(c, "image/jpeg", quality / 100)).arrayBuffer();
        const img = await doc.embedJpg(jpg);
        const A4 = { w: 595.28, h: 841.89 };
        const landscape = img.width > img.height;
        const pw = landscape ? A4.h : A4.w;
        const ph = landscape ? A4.w : A4.h;
        const page = doc.addPage([pw, ph]);
        const k = Math.min((pw - 24) / img.width, (ph - 24) / img.height);
        page.drawImage(img, {
          x: (pw - img.width * k) / 2,
          y: (ph - img.height * k) / 2,
          width: img.width * k,
          height: img.height * k,
        });
      }
      const blob = new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" });
      const name = `waha-scan-${stamp()}.pdf`;
      setResult({ blob, name });
      saveBlob(blob, name);
    } catch {
      setError("تعذّر إنشاء الملف. جرّب تقليل الجودة أو عدد الصفحات.");
    } finally {
      setBusy("");
    }
  }

  async function exportJpg() {
    if (!current) return;
    const blob = await canvasBlob(renderScan(current), "image/jpeg", quality / 100);
    saveBlob(blob, `waha-scan-${stamp()}-${active + 1}.jpg`);
  }

  return (
    <ProShell
      title="الماسح الضوئي"
      subtitle="صوّر المستندات بكاميرا جوالك، قصّها ودوّرها، حسّن وضوحها أو اجعلها أبيض وأسود كالمسح الحقيقي، ثم احفظها ملف PDF متعدد الصفحات."
    >
      <Panel>
        <input
          ref={camera}
          id="scan-camera"
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          aria-label="التقاط بالكاميرا"
          onChange={(e) => add(e.target.files)}
        />
        <input
          ref={gallery}
          id="scan-gallery"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="اختيار صور"
          onChange={(e) => add(e.target.files)}
        />
        <div className="grid grid-cols-2 gap-2">
          <label htmlFor="scan-camera" className={`${proPrimary} cursor-pointer`}>
            <Camera className="size-5" aria-hidden="true" /> صوّر صفحة
          </label>
          <label htmlFor="scan-gallery" className={`${proButton} cursor-pointer`}>
            <ImagePlus className="size-5" aria-hidden="true" /> من الصور
          </label>
        </div>
        <p className="text-xs text-muted">
          نصيحة: ضع الورقة على سطح داكن، وصوّر من الأعلى في إضاءة جيدة.
        </p>
        {error && (
          <p role="alert" className="rounded-xl border border-red-400 p-3 text-sm">
            {error}
          </p>
        )}
      </Panel>

      {current && (
        <>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="الصفحات الممسوحة"
          >
            {scans.map((s, i) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={`${proButton} shrink-0 ${i === active ? "!border-primary !bg-primary/15" : ""}`}
              >
                صفحة {i + 1}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_280px]">
            <div className="grid min-h-64 place-items-center rounded-2xl border border-border bg-surface-2 p-3">
              {preview ? (
                <img
                  src={preview}
                  alt={`معاينة الصفحة ${active + 1}`}
                  className="max-h-[60vh] max-w-full bg-white shadow"
                />
              ) : (
                <span className="text-sm text-muted">جارٍ التجهيز…</span>
              )}
            </div>
            <Panel>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="نمط المسح">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    aria-pressed={current.mode === m.id}
                    className={`${proButton} ${current.mode === m.id ? "!bg-primary !text-primary-fg" : ""}`}
                    onClick={() => patch({ mode: m.id })}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <Slider
                label="قص من الأعلى"
                value={current.crop.top}
                min={0}
                max={45}
                onChange={(v) => patch({ crop: { ...current.crop, top: v } })}
                suffix="%"
              />
              <Slider
                label="قص من الأسفل"
                value={current.crop.bottom}
                min={0}
                max={45}
                onChange={(v) => patch({ crop: { ...current.crop, bottom: v } })}
                suffix="%"
              />
              <Slider
                label="قص من اليمين"
                value={current.crop.right}
                min={0}
                max={45}
                onChange={(v) => patch({ crop: { ...current.crop, right: v } })}
                suffix="%"
              />
              <Slider
                label="قص من اليسار"
                value={current.crop.left}
                min={0}
                max={45}
                onChange={(v) => patch({ crop: { ...current.crop, left: v } })}
                suffix="%"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className={proButton}
                  aria-label="تدوير"
                  onClick={() => patch({ rotation: (current.rotation + 90) % 360 })}
                >
                  <RotateCw className="size-4" /> تدوير
                </button>
                <button
                  className={proButton}
                  aria-label="تقديم الصفحة"
                  disabled={active === 0}
                  onClick={() => {
                    setScans((l) => moveItem(l, active, -1));
                    setActive(active - 1);
                  }}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  className={proButton}
                  aria-label="تأخير الصفحة"
                  disabled={active === scans.length - 1}
                  onClick={() => {
                    setScans((l) => moveItem(l, active, 1));
                    setActive(active + 1);
                  }}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  className={proButton}
                  aria-label="حذف الصفحة"
                  onClick={() => {
                    setResult(null);
                    setScans((l) => l.filter((_, i) => i !== active));
                    setActive(Math.max(0, active - 1));
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Panel>
          </div>
          <Panel title="الحفظ">
            <Slider
              label="جودة الصورة داخل الملف"
              value={quality}
              min={40}
              max={95}
              step={5}
              onChange={setQuality}
              suffix="%"
            />
            <button className={`${proPrimary} w-full`} disabled={!!busy} onClick={exportPdf}>
              <Download className="size-5" aria-hidden="true" /> احفظ PDF ({scans.length} صفحة)
            </button>
            <button className={`${proButton} w-full`} onClick={exportJpg}>
              احفظ هذه الصفحة صورة JPG
            </button>
            {busy && (
              <p role="status" className="text-sm text-primary">
                {busy}
              </p>
            )}
            {result && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/10 p-3 text-sm"
              >
                <span>
                  جاهز: {result.name} · {formatBytes(result.blob.size)}
                </span>
                <span className="flex gap-2">
                  <button className={proButton} onClick={() => saveBlob(result.blob, result.name)}>
                    تنزيل مجددًا
                  </button>
                  {canShareFiles() && (
                    <button
                      className={proButton}
                      onClick={() => shareBlob(result.blob, result.name)}
                    >
                      <Share2 className="size-4" aria-hidden="true" /> مشاركة
                    </button>
                  )}
                </span>
              </div>
            )}
          </Panel>
        </>
      )}
    </ProShell>
  );
}
