import { useRef, useState } from "react";
import { FilePlus2, RotateCw, Trash2, ArrowUp, ArrowDown, Download, Share2 } from "lucide-react";
import { ProShell, Panel, Slider, proButton, proPrimary, proField } from "./shell";
import { SignaturePad, textToPng } from "./signature-pad";
import { canShareFiles, saveBlob, shareBlob, stamp, loadImage } from "@/lib/pro/files";
import { moveItem, formatBytes } from "@/lib/pro/pixels";
import {
  ANCHORS,
  anchorPoint,
  visualSize,
  visualToUser,
  normRotation,
  type Anchor,
} from "@/lib/pro/pdf-geometry";

type Source = { id: string; name: string; kind: "pdf" | "image"; bytes: Uint8Array; mime: string };
type Overlay = {
  png: string;
  w: number;
  h: number;
  anchor: Anchor;
  widthPct: number;
  label: string;
};
type PageItem = {
  key: string;
  source: string;
  index: number;
  rotation: number;
  thumb: string;
  aspect: number;
  overlays: Overlay[];
  selected: boolean;
};

let seq = 0;
const uid = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;

async function renderThumbs(bytes: Uint8Array) {
  const { pdfEngine } = await import("@/lib/books/private/pdf-client");
  const pdfjs = await pdfEngine();
  const doc = await pdfjs.getDocument({
    data: bytes.slice(),
    verbosity: 0,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  }).promise;
  const out: { thumb: string; aspect: number }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 220 / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
    out.push({
      thumb: canvas.toDataURL("image/jpeg", 0.7),
      aspect: viewport.height / viewport.width,
    });
  }
  await doc.cleanup();
  return out;
}

export function PdfStudioApp() {
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [pages, setPages] = useState<PageItem[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [stampText, setStampText] = useState("");
  const [anchor, setAnchor] = useState<Anchor>("br");
  const [widthPct, setWidthPct] = useState(28);
  const [numbers, setNumbers] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const selectedCount = pages.filter((p) => p.selected).length;
  const target = pages.find((p) => p.selected) ?? pages[0];

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setResult(null);
    const nextSources: Record<string, Source> = {};
    const nextPages: PageItem[] = [];
    for (const file of Array.from(files)) {
      setBusy(`جارٍ قراءة ${file.name}…`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const id = uid();
      try {
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const thumbs = await renderThumbs(bytes);
          nextSources[id] = { id, name: file.name, kind: "pdf", bytes, mime: "application/pdf" };
          thumbs.forEach((t, index) =>
            nextPages.push({
              key: uid(),
              source: id,
              index,
              rotation: 0,
              ...t,
              overlays: [],
              selected: false,
            }),
          );
        } else if (/^image\/(png|jpe?g)$/.test(file.type)) {
          const url = URL.createObjectURL(file);
          const img = await loadImage(url);
          nextSources[id] = { id, name: file.name, kind: "image", bytes, mime: file.type };
          nextPages.push({
            key: uid(),
            source: id,
            index: 0,
            rotation: 0,
            thumb: url,
            aspect: img.naturalHeight / img.naturalWidth,
            overlays: [],
            selected: false,
          });
        } else {
          setError(`الملف ${file.name} ليس PDF ولا صورة JPG/PNG.`);
        }
      } catch {
        setError(`تعذّرت قراءة ${file.name}. قد يكون محميًا بكلمة مرور أو تالفًا.`);
      }
    }
    setSources((s) => ({ ...s, ...nextSources }));
    setPages((p) => [...p, ...nextPages]);
    setBusy("");
    if (input.current) input.current.value = "";
  }

  const update = (key: string, fn: (p: PageItem) => PageItem) => {
    setResult(null);
    setPages((list) => list.map((p) => (p.key === key ? fn(p) : p)));
  };

  async function addOverlay(kind: "signature" | "text") {
    if (!target) return;
    let ov: Overlay | null = null;
    if (kind === "signature" && signature) {
      const img = await loadImage(signature);
      ov = {
        png: signature,
        w: img.naturalWidth,
        h: img.naturalHeight,
        anchor,
        widthPct,
        label: "توقيع",
      };
    }
    if (kind === "text" && stampText.trim()) {
      const t = textToPng(stampText.trim());
      ov = { png: t.png, w: t.w, h: t.h, anchor, widthPct, label: stampText.trim() };
    }
    if (!ov) return;
    const o = ov;
    update(target.key, (p) => ({ ...p, overlays: [...p.overlays, o] }));
  }

  async function build(onlySelected: boolean) {
    setError("");
    setBusy("جارٍ تجهيز الملف…");
    try {
      const { PDFDocument, degrees, StandardFonts, rgb } = await import("pdf-lib");
      const out = await PDFDocument.create();
      const font = await out.embedFont(StandardFonts.Helvetica);
      const loaded = new Map<string, Awaited<ReturnType<typeof PDFDocument.load>>>();
      const list = onlySelected ? pages.filter((p) => p.selected) : pages;
      let n = 0;
      for (const item of list) {
        n++;
        const src = sources[item.source];
        let page;
        if (src.kind === "pdf") {
          let doc = loaded.get(src.id);
          if (!doc) {
            doc = await PDFDocument.load(src.bytes, { ignoreEncryption: true });
            loaded.set(src.id, doc);
          }
          [page] = await out.copyPages(doc, [item.index]);
          out.addPage(page);
        } else {
          const img =
            src.mime === "image/png"
              ? await out.embedPng(src.bytes)
              : await out.embedJpg(src.bytes);
          const A4 = { w: 595.28, h: 841.89 };
          const landscape = img.width > img.height;
          const pw = landscape ? A4.h : A4.w;
          const ph = landscape ? A4.w : A4.h;
          page = out.addPage([pw, ph]);
          const k = Math.min((pw - 40) / img.width, (ph - 40) / img.height, 1.5);
          page.drawImage(img, {
            x: (pw - img.width * k) / 2,
            y: (ph - img.height * k) / 2,
            width: img.width * k,
            height: img.height * k,
          });
        }
        const rotation = normRotation(page.getRotation().angle + item.rotation);
        page.setRotation(degrees(rotation));
        const box = page.getMediaBox();
        const v = visualSize(box, rotation);
        for (const ov of item.overlays) {
          const png = await out.embedPng(ov.png);
          const iw = (v.w * ov.widthPct) / 100;
          const ih = iw * (ov.h / ov.w);
          const at = anchorPoint(v.w, v.h, iw, ih, ov.anchor);
          const u = visualToUser(box, rotation, at.x, at.y);
          page.drawImage(png, { x: u.x, y: u.y, width: iw, height: ih, rotate: degrees(rotation) });
        }
        if (numbers) {
          const label = `${n} / ${list.length}`;
          const size = 10;
          const tw = font.widthOfTextAtSize(label, size);
          const u = visualToUser(box, rotation, (v.w - tw) / 2, 16);
          page.drawText(label, {
            x: u.x,
            y: u.y,
            size,
            font,
            color: rgb(0.35, 0.35, 0.35),
            rotate: degrees(rotation),
          });
        }
      }
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const name = `waha-${onlySelected ? "pages" : "document"}-${stamp()}.pdf`;
      setResult({ blob, name });
      saveBlob(blob, name);
    } catch (e) {
      console.warn(e);
      setError(
        "تعذّر إنشاء الملف. إن كان أحد الملفات محميًا بكلمة مرور فافتح حمايته أولًا ثم أعد المحاولة.",
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <ProShell
      title="استوديو PDF"
      subtitle="ادمج ملفات PDF والصور في ملف واحد، رتّب الصفحات واحذفها ودوّرها، استخرج صفحات محددة، وأضف توقيعك وختمًا نصيًا وأرقام الصفحات."
    >
      <Panel>
        <input
          ref={input}
          type="file"
          multiple
          accept="application/pdf,.pdf,image/png,image/jpeg"
          className="sr-only"
          id="pdf-input"
          aria-label="اختر ملفات PDF أو صور"
          onChange={(e) => addFiles(e.target.files)}
        />
        <label htmlFor="pdf-input" className={`${proPrimary} w-full cursor-pointer`}>
          <FilePlus2 className="size-5" aria-hidden="true" />
          {pages.length ? "أضف ملفات أخرى" : "اختر ملفات PDF أو صور"}
        </label>
        {busy && (
          <p role="status" className="text-sm text-primary">
            {busy}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-red-400 p-3 text-sm">
            {error}
          </p>
        )}
        {!!pages.length && (
          <p className="text-sm text-muted">
            {pages.length} صفحة من {Object.keys(sources).length} ملف ·{" "}
            {selectedCount ? `${selectedCount} محددة` : "اضغط على صفحة لتحديدها"}
          </p>
        )}
      </Panel>

      {!!pages.length && (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="صفحات المستند">
          {pages.map((p, i) => (
            <li
              key={p.key}
              className={`overflow-hidden rounded-2xl border bg-surface ${p.selected ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
            >
              <button
                type="button"
                aria-pressed={p.selected}
                aria-label={`صفحة ${i + 1}`}
                className="grid h-40 w-full place-items-center bg-surface-2 p-2"
                onClick={() => update(p.key, (x) => ({ ...x, selected: !x.selected }))}
              >
                <img
                  src={p.thumb}
                  alt=""
                  className="max-h-36 max-w-full bg-white shadow transition-transform"
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                />
              </button>
              <div className="flex items-center justify-between px-2 py-1 text-xs">
                <span>
                  {i + 1}
                  {p.overlays.length ? ` · ${p.overlays.length} إضافة` : ""}
                </span>
                <span className="flex">
                  <IconBtn
                    label="تحريك للأمام"
                    onClick={() => setPages((l) => moveItem(l, i, -1))}
                    disabled={i === 0}
                  >
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="تحريك للخلف"
                    onClick={() => setPages((l) => moveItem(l, i, 1))}
                    disabled={i === pages.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="تدوير"
                    onClick={() =>
                      update(p.key, (x) => ({ ...x, rotation: (x.rotation + 90) % 360 }))
                    }
                  >
                    <RotateCw className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="حذف الصفحة"
                    onClick={() => {
                      setResult(null);
                      setPages((l) => l.filter((x) => x.key !== p.key));
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconBtn>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {!!pages.length && (
        <Panel title="التوقيع والختم">
          <p className="text-xs text-muted">
            تُضاف إلى {target ? `الصفحة ${pages.indexOf(target) + 1}` : "الصفحة الأولى"} (أول صفحة
            محددة، أو الأولى إن لم تحدد).
          </p>
          <SignaturePad onChange={setSignature} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={proButton}
              disabled={!signature}
              onClick={() => addOverlay("signature")}
            >
              ضع التوقيع
            </button>
          </div>
          <label className="block space-y-1 text-sm">
            <span>ختم نصي (مثل: «مُعتمد» أو اسمك وتاريخ اليوم)</span>
            <input
              className={proField}
              value={stampText}
              onChange={(e) => setStampText(e.target.value)}
              placeholder="مُعتمد"
            />
          </label>
          <button
            type="button"
            className={proButton}
            disabled={!stampText.trim()}
            onClick={() => addOverlay("text")}
          >
            ضع الختم
          </button>
          <div className="flex flex-wrap gap-2" role="group" aria-label="مكان الإضافة">
            {ANCHORS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={anchor === a.id}
                className={`${proButton} ${anchor === a.id ? "!bg-primary !text-primary-fg" : ""}`}
                onClick={() => setAnchor(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <Slider
            label="العرض من الصفحة"
            value={widthPct}
            min={8}
            max={70}
            onChange={setWidthPct}
            suffix="%"
          />
          {target && target.overlays.length > 0 && (
            <button
              type="button"
              className={proButton}
              onClick={() => update(target.key, (p) => ({ ...p, overlays: [] }))}
            >
              إزالة إضافات هذه الصفحة
            </button>
          )}
        </Panel>
      )}

      {!!pages.length && (
        <Panel title="التصدير">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              className="size-5"
            />
            أضف أرقام الصفحات أسفل كل صفحة
          </label>
          <button
            type="button"
            className={`${proPrimary} w-full`}
            disabled={!!busy}
            onClick={() => build(false)}
          >
            <Download className="size-5" aria-hidden="true" />
            نزّل الملف المدموج ({pages.length} صفحة)
          </button>
          <button
            type="button"
            className={`${proButton} w-full`}
            disabled={!selectedCount || !!busy}
            onClick={() => build(true)}
          >
            استخرج الصفحات المحددة فقط ({selectedCount})
          </button>
          {result && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/10 p-3 text-sm"
            >
              <span>
                جاهز: {result.name} · {formatBytes(result.blob.size)}
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  className={proButton}
                  onClick={() => saveBlob(result.blob, result.name)}
                >
                  تنزيل مجددًا
                </button>
                {canShareFiles() && (
                  <button
                    type="button"
                    className={proButton}
                    onClick={() => shareBlob(result.blob, result.name)}
                  >
                    <Share2 className="size-4" aria-hidden="true" /> مشاركة
                  </button>
                )}
              </span>
            </div>
          )}
          <button
            type="button"
            className="text-sm text-muted underline"
            onClick={() => {
              setPages([]);
              setSources({});
              setResult(null);
            }}
          >
            ابدأ من جديد
          </button>
        </Panel>
      )}
    </ProShell>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg hover:bg-surface-2 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
