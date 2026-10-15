import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { openPrivatePdf } from "@/lib/books/private/pdf-client";
import { errorMessage } from "@/lib/books/private/model";

export function OriginalPage({ file, page, ar }: { file: Blob; page: number; ar: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(160, Math.min(900, entries[0]?.contentRect.width ?? 320))),
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let close: (() => Promise<void>) | undefined;
    void file
      .arrayBuffer()
      .then(async (bytes) => {
        if (!active) return;
        const task = await openPrivatePdf(new Uint8Array(bytes));
        close = () => task.destroy();
        if (!active) {
          await task.destroy();
          return;
        }
        const document = await task.promise;
        if (active) setPdf(document);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e, ar));
      });
    return () => {
      active = false;
      void close?.();
    };
  }, [file, ar]);

  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let active = true;
    let cancel: (() => void) | undefined;
    setRendering(true);
    setError("");
    void pdf
      .getPage(page)
      .then(async (source) => {
        if (!active || !canvas.current) return;
        const base = source.getViewport({ scale: 1 });
        const scale = Math.min(
          (width / base.width) * Math.min(window.devicePixelRatio || 1, 1.5),
          Math.sqrt(2_000_000 / (base.width * base.height)),
        );
        const viewport = source.getViewport({ scale });
        canvas.current.width = Math.ceil(viewport.width);
        canvas.current.height = Math.ceil(viewport.height);
        // Paint visual annotations, but never mount actionable annotation/JS layers.
        const task = source.render({ canvas: canvas.current, viewport, annotationMode: 1 });
        cancel = () => task.cancel();
        await task.promise;
        if (active) setRendering(false);
        source.cleanup();
      })
      .catch((e) => {
        if (active && e?.name !== "RenderingCancelledException") {
          setError(errorMessage(e, ar));
          setRendering(false);
        }
      });
    return () => {
      active = false;
      cancel?.();
    };
  }, [pdf, page, width, ar]);

  return (
    <div ref={container} className="mx-auto w-full max-w-3xl" data-original-pdf="canvas-only">
      {rendering && !error && (
        <p role="status" className="py-4 text-sm">
          {ar ? "تجهيز الصفحة الأصلية…" : "Preparing original page…"}
        </p>
      )}
      {error && (
        <p role="alert" className="py-4 text-sm">
          {error}
        </p>
      )}
      <canvas
        ref={canvas}
        className="h-auto w-full rounded-md bg-white"
        aria-label={ar ? `الصفحة الأصلية ${page}` : `Original page ${page}`}
      />
    </div>
  );
}
