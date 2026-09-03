import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Leave = { id: string; name: string; kind: string; from: string; to: string };

const KINDS_AR = ["سنوية", "مرضية", "بدون راتب", "أخرى"];
const KINDS_EN = ["Annual", "Sick", "Unpaid", "Other"];

function daysBetween(a: string, b: string) {
  const x = new Date(`${a}T00:00:00`).getTime();
  const y = new Date(`${b}T00:00:00`).getTime();
  if (!Number.isFinite(x) || !Number.isFinite(y) || y < x) return 0;
  return Math.round((y - x) / 86400000) + 1;
}

export function LeaveApp() {
  const lang = useAppStore((s) => s.lang);
  const kinds = lang === "ar" ? KINDS_AR : KINDS_EN;
  const [rows, setRows] = usePersistent<Leave[]>("waha:leave", []);
  const [name, setName] = useState("");
  const [kind, setKind] = useState(kinds[0]!);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const year = String(new Date().getFullYear());
  const used = useMemo(
    () => rows.filter((r) => r.from.startsWith(year)).reduce((s, r) => s + daysBetween(r.from, r.to), 0),
    [rows, year],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">{L("أيام مسجّلة هذه السنة", "Days logged this year")}</p>
        <p className="mt-1 font-display text-4xl tabular-nums">{used}</p>
      </div>
      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !from || !to) return;
          setRows([{ id: crypto.randomUUID(), name: name.trim(), kind, from, to }, ...rows]);
          setName("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={L("الموظف", "Name")} />
        <select className="h-11 rounded-md border border-border bg-surface px-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
          {kinds.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted">
                {r.kind} · {r.from} → {r.to} · {daysBetween(r.from, r.to)} {t(lang, "days")}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>
              {t(lang, "delete")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
