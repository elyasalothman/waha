import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export function QrApp() {
  const lang = useAppStore((s) => s.lang);
  const [text, setText] = useState("https://");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    const fg = getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim() || "#eceee9";
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim() || "#0c0d0c";
    void QRCode.toCanvas(canvas, text.trim(), { width: 280, margin: 1, color: { dark: fg, light: bg } });
  }, [text]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "waha-qr.png";
    a.click();
  }

  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={lang === "ar" ? "رابط أو نص" : "Link or text"} />
      <canvas ref={canvasRef} className="mx-auto rounded-lg border border-border" />
      <Button onClick={download}>{lang === "ar" ? "تنزيل PNG" : "Download PNG"}</Button>
      <p className="text-xs text-subtle">{t(lang, "copy")}</p>
    </div>
  );
}
