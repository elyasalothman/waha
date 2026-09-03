import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { PROVERBS, proverbOfDay } from "@/lib/proverbs";
import { useAppStore } from "@/store/app-store";

export function ProverbsApp() {
  const lang = useAppStore((s) => s.lang);
  const [q, setQ] = useState("");
  const today = proverbOfDay();
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return PROVERBS;
    return PROVERBS.filter((p) => p.ar.includes(q.trim()) || p.en.toLowerCase().includes(n));
  }, [q]);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-xs text-muted">{L("مثل اليوم", "Today’s saying")}</p>
        <p className="mt-3 font-display text-3xl leading-snug">{today.ar}</p>
        <p className="mt-3 text-sm text-muted">{today.en}</p>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("ابحث في الأمثال…", "Search proverbs…")} />
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.ar} className="rounded-xl border border-border bg-surface px-4 py-3">
            <p className="font-medium">{p.ar}</p>
            <p className="mt-1 text-sm text-muted">{p.en}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
