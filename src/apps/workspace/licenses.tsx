import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { locPair } from "@/lib/locale";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Doc = { id: string; title: string; kind: string; expiry: string };

const KINDS = [
  { id: "cr", ar: "سجل تجاري", en: "Commercial registration" },
  { id: "vat", ar: "شهادة ضريبة", en: "VAT certificate" },
  { id: "balady", ar: "رخصة بلدي", en: "Municipal license" },
  { id: "chamber", ar: "غرفة تجارية", en: "Chamber" },
  { id: "saudization", ar: "نطاقات", en: "Nitaqat" },
  { id: "other", ar: "أخرى", en: "Other" },
];

function daysUntil(iso: string) {
  const t0 = new Date(`${iso}T00:00:00`).getTime();
  if (!Number.isFinite(t0)) return null;
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return Math.round((t0 - n.getTime()) / 86400000);
}

export function LicensesApp() {
  const lang = useAppStore((s) => s.lang);
  const [docs, setDocs] = usePersistent<Doc[]>("waha:licenses", []);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("cr");
  const [expiry, setExpiry] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const sorted = [...docs].sort((a, b) => a.expiry.localeCompare(b.expiry));

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !expiry) return;
          setDocs([{ id: crypto.randomUUID(), title: title.trim(), kind, expiry }, ...docs]);
          setTitle("");
          setExpiry("");
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L("اسم الرخصة", "License name")} />
        <select className="h-11 rounded-md border border-border bg-surface px-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {lang === "ar" ? k.ar : k.en}
            </option>
          ))}
        </select>
        <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted">{L("أضف السجل والرخص ليصلك تنبيه قبل انتهائها.", "Add the CR and licenses to get a reminder before they lapse.")}</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((doc) => {
            const d = daysUntil(doc.expiry);
            const tone = d == null ? "text-muted" : d < 0 ? "text-danger" : d <= 45 ? "text-warn" : "text-muted";
            const label =
              d == null ? "" : d < 0 ? L(`انتهت منذ ${Math.abs(d)} يوماً`, `Expired ${Math.abs(d)} days ago`) : d === 0 ? L("تنتهي اليوم", "Expires today") : L(`متبقي ${d} يوماً`, `${d} days left`);
            return (
              <li key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-xs text-muted">{(() => { const k = KINDS.find((x) => x.id === doc.kind); return k ? locPair(lang, k) : doc.kind; })()}</p>
                  <p className={cn("mt-1 text-sm tabular-nums", tone)}>{label}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setDocs(docs.filter((x) => x.id !== doc.id))}>
                  {t(lang, "delete")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
