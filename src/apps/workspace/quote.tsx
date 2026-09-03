import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { tafqeetMoney } from "@/lib/tafqeet";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Item = { desc: string; qty: number; price: number };
type Quote = { seller: string; client: string; date: string; valid: number; vat: number; items: Item[] };

const empty: Quote = {
  seller: "",
  client: "",
  date: new Date().toISOString().slice(0, 10),
  valid: 14,
  vat: 15,
  items: [{ desc: "", qty: 1, price: 0 }],
};

export function QuoteApp() {
  const lang = useAppStore((s) => s.lang);
  const [q, setQ] = usePersistent<Quote>("waha:quote", empty);
  const sub = q.items.reduce((s, i) => s + i.qty * i.price, 0);
  const vat = sub * (q.vat / 100);
  const total = sub + vat;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function set<K extends keyof Quote>(key: K, value: Quote[K]) {
    setQ({ ...q, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder={L("مقدّم العرض", "From")} value={q.seller} onChange={(e) => set("seller", e.target.value)} />
        <Input placeholder={L("إلى العميل", "To")} value={q.client} onChange={(e) => set("client", e.target.value)} />
        <Input type="date" value={q.date} onChange={(e) => set("date", e.target.value)} />
        <Input type="number" value={q.valid} onChange={(e) => set("valid", Number(e.target.value) || 0)} placeholder={L("صلاحية بالأيام", "Valid days")} />
      </div>
      <div className="space-y-2">
        {q.items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_4.5rem_6rem] gap-2">
            <Input
              placeholder={L("البند", "Item")}
              value={item.desc}
              onChange={(e) => set("items", q.items.map((x, idx) => (idx === i ? { ...x, desc: e.target.value } : x)))}
            />
            <Input
              type="number"
              value={item.qty}
              onChange={(e) => set("items", q.items.map((x, idx) => (idx === i ? { ...x, qty: Number(e.target.value) } : x)))}
            />
            <Input
              type="number"
              value={item.price}
              onChange={(e) => set("items", q.items.map((x, idx) => (idx === i ? { ...x, price: Number(e.target.value) } : x)))}
            />
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => set("items", [...q.items, { desc: "", qty: 1, price: 0 }])}>
          {t(lang, "add")}
        </Button>
      </div>
      <div className="space-y-1 font-mono tabular-nums">
        <div>{L("المجموع", "Subtotal")} {sub.toFixed(2)}</div>
        <div>{L("الضريبة ١٥٪", "VAT")} {vat.toFixed(2)}</div>
        <div className="text-lg">{L("الإجمالي", "Total")} {total.toFixed(2)} SAR</div>
      </div>
      <p className="text-sm text-muted">
        {L("فقط", "Only")} {tafqeetMoney(total)} {L("لا غير", "only")}
      </p>
      <p className="text-xs text-subtle">{L(`العرض صالح ${q.valid} يوماً.`, `Valid for ${q.valid} days.`)}</p>
      <Button onClick={() => window.print()}>{t(lang, "print")}</Button>
    </div>
  );
}
