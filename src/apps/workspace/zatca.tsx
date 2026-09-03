import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zatcaTlvBase64 } from "@/lib/zatca";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Form = { seller: string; vatNo: string; total: string; vat: string; time: string };

export function ZatcaApp() {
  const lang = useAppStore((s) => s.lang);
  const [v, setV] = usePersistent<Form>("waha:zatca", {
    seller: "",
    vatNo: "",
    total: "",
    vat: "",
    time: new Date().toISOString().slice(0, 19),
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const ready = v.seller.trim() && v.vatNo.trim() && v.total.trim() && v.vat.trim();
  const payload = ready
    ? zatcaTlvBase64({
        seller: v.seller,
        vatNo: v.vatNo,
        timestamp: v.time.length >= 19 ? v.time : `${v.time}:00`,
        total: v.total,
        vat: v.vat,
      })
    : "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    const fg = getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim() || "#eceee9";
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim() || "#0c0d0c";
    void QRCode.toCanvas(canvas, payload, { width: 240, margin: 1, color: { dark: fg, light: bg } });
  }, [payload]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {L("رمز المرحلة الأولى للفاتورة المبسّطة. ليس بديلاً عن منصة هيئة الزكاة.", "Phase-1 QR for a simplified e-invoice. Not a substitute for the ZATCA portal.")}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={v.seller} onChange={(e) => setV({ ...v, seller: e.target.value })} placeholder={L("اسم البائع", "Seller name")} />
        <Input value={v.vatNo} onChange={(e) => setV({ ...v, vatNo: e.target.value })} placeholder={L("الرقم الضريبي", "VAT number")} dir="ltr" />
        <Input value={v.total} onChange={(e) => setV({ ...v, total: e.target.value })} placeholder={L("الإجمالي مع الضريبة", "Total incl. VAT")} />
        <Input value={v.vat} onChange={(e) => setV({ ...v, vat: e.target.value })} placeholder={L("مبلغ الضريبة", "VAT amount")} />
        <Input value={v.time} onChange={(e) => setV({ ...v, time: e.target.value })} placeholder="2026-09-03T12:00" dir="ltr" />
      </div>
      {payload ? (
        <div className="space-y-3">
          <canvas ref={canvasRef} className="mx-auto rounded-lg border border-border" />
          <p className="break-all font-mono text-xs text-subtle" dir="ltr">
            {payload}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const a = document.createElement("a");
              a.href = canvas.toDataURL("image/png");
              a.download = "zatca-qr.png";
              a.click();
            }}
          >
            {L("تنزيل الرمز", "Download QR")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">{L("أكمل الحقول ليظهر الرمز.", "Fill the fields to generate the code.")}</p>
      )}
    </div>
  );
}
