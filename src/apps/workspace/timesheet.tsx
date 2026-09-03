import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { useNow } from "@/hooks/use-now";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Entry = { id: string; project: string; start: number; end: number | null };

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function TimesheetApp() {
  const lang = useAppStore((s) => s.lang);
  const now = useNow(1000);
  const [rows, setRows] = usePersistent<Entry[]>("waha:timesheet", []);
  const [project, setProject] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const running = rows.find((r) => r.end == null);
  const start = todayStart();
  const todayMs = useMemo(() => {
    return rows.reduce((acc, r) => {
      const end = r.end ?? now.getTime();
      if (end < start) return acc;
      const from = Math.max(r.start, start);
      return acc + Math.max(0, end - from);
    }, 0);
  }, [rows, now, start]);

  function toggle() {
    if (running) {
      setRows(rows.map((r) => (r.id === running.id ? { ...r, end: Date.now() } : r)));
      return;
    }
    const name = project.trim() || (lang === "ar" ? "عام" : "General");
    setRows([{ id: crypto.randomUUID(), project: name, start: Date.now(), end: null }, ...rows]);
    setProject("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs text-muted">{L("ساعات اليوم", "Hours today")}</p>
        <p className="mt-1 font-mono text-4xl tabular-nums">{fmt(todayMs)}</p>
        {running ? (
          <p className="mt-2 text-sm text-primary">
            {L("جارٍ", "Running")} · {running.project} · {fmt(now.getTime() - running.start)}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder={L("المشروع", "Project")} disabled={!!running} />
        <Button onClick={toggle}>{running ? L("إيقاف", "Stop") : L("بدء", "Start")}</Button>
      </div>
      <ul className="space-y-2">
        {rows.slice(0, 20).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <div>
              <p className="font-medium">{r.project}</p>
              <p className="font-mono text-xs tabular-nums text-muted">
                {new Date(r.start).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                {r.end
                  ? ` – ${new Date(r.end).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" })}`
                  : ` – ${L("الآن", "now")}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono tabular-nums">{fmt((r.end ?? now.getTime()) - r.start)}</span>
              <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>
                {t(lang, "delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
