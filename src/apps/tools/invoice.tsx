import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { zatcaTlvBase64 } from "@/lib/zatca";
import { tafqeetMoney } from "@/lib/tafqeet";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Item = { desc: string; qty: number; price: number };
type Inv = { seller: string; vatNo: string; client: string; date: string; vat: number; items: Item[] };

const empty: Inv = {
  seller: "",
  vatNo: "",
  client: "",
  date: new Date().toISOString().slice(0, 10),
  vat: 15,
  items: [{ desc: "", qty: 1, price: 0 }],
};

export function InvoiceApp() {
  const lang = useAppStore((s) => s.lang);
  const [inv, setInv] = usePersistent<Inv>("waha:invoice", empty);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sub = inv.items.reduce((s, i) => s + i.qty * i.price, 0);
  const vat = sub * (inv.vat / 100);
  const total = sub + vat;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const payload =
    inv.seller.trim() && inv.vatNo.trim() && total > 0
      ? zatcaTlvBase64({
          seller: inv.seller,
          vatNo: inv.vatNo,
          timestamp: `${inv.date}T12:00:00`,
          total: total.toFixed(2),
          vat: vat.toFixed(2),
        })
      : "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    const fg = getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim() || "#eceee9";
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim() || "#0c0d0c";
    void QRCode.toCanvas(canvas, payload, { width: 180, margin: 1, color: { dark: fg, light: bg } });
  }, [payload]);

  function set<K extends keyof Inv>(key: K, value: Inv[K]) {
    setInv({ ...inv, [key]: value });
  }

  return (
    <div className="space-y-4 print:text-fg">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder={L("البائع", "Seller")} value={inv.seller} onChange={(e) => set("seller", e.target.value)} />
        <Input placeholder={L("الرقم الضريبي", "VAT number")} value={inv.vatNo} onChange={(e) => set("vatNo", e.target.value)} />
        <Input placeholder={L("العميل", "Client")} value={inv.client} onChange={(e) => set("client", e.target.value)} />
        <Input type="date" value={inv.date} onChange={(e) => set("date", e.target.value)} />
      </div>
      <div className="space-y-2">
        {inv.items.map((item, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Input
              className="col-span-3 sm:col-span-4"
              placeholder={L("البند", "Item")}
              value={item.desc}
              onChange={(e) => {
                const items = inv.items.map((x, idx) => (idx === i ? { ...x, desc: e.target.value } : x));
                set("items", items);
              }}
            />
            <Input
              type="number"
              value={item.qty}
              onChange={(e) => {
                const items = inv.items.map((x, idx) => (idx === i ? { ...x, qty: Number(e.target.value) } : x));
                set("items", items);
              }}
            />
            <Input
              type="number"
              value={item.price}
              onChange={(e) => {
                const items = inv.items.map((x, idx) => (idx === i ? { ...x, price: Number(e.target.value) } : x));
                set("items", items);
              }}
            />
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => set("items", [...inv.items, { desc: "", qty: 1, price: 0 }])}>
          {t(lang, "add")}
        </Button>
      </div>
      <label className="block max-w-40 text-sm">
        <span className="mb-1 block text-muted">{L("ضريبة %", "VAT %")}</span>
        <Input type="number" value={inv.vat} onChange={(e) => set("vat", Number(e.target.value))} />
      </label>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-1 font-mono tabular-nums">
          <div>{L("المجموع", "Subtotal")} {sub.toFixed(2)}</div>
          <div>{L("الضريبة", "VAT")} {vat.toFixed(2)}</div>
          <div className="text-lg">{L("الإجمالي", "Total")} {total.toFixed(2)} SAR</div>
          <p className="max-w-sm font-sans text-sm text-muted">فقط {tafqeetMoney(total)} لا غير</p>
        </div>
        {payload ? <canvas ref={canvasRef} className="rounded-lg border border-border" /> : null}
      </div>
      <Button onClick={() => window.print()}>{t(lang, "print")}</Button>
    </div>
  );
}
