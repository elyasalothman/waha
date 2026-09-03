import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Meeting = { id: string; title: string; at: string; attendees: string; notes: string; done: boolean };

export function MeetingsApp() {
  const lang = useAppStore((s) => s.lang);
  const [rows, setRows] = usePersistent<Meeting[]>("waha:meetings", []);
  const [title, setTitle] = useState("");
  const [at, setAt] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const sorted = [...rows].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setRows([{ id: crypto.randomUUID(), title: title.trim(), at, attendees: "", notes: "", done: false }, ...rows]);
          setTitle("");
          setAt("");
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L("عنوان الاجتماع", "Meeting title")} />
        <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted">{L("أضف اجتماعك القادم ونقاطه هنا.", "Add the next meeting and its notes here.")}</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((m) => (
            <li key={m.id} className={cn("rounded-xl border border-border bg-surface p-4", m.done && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="mt-1 font-mono text-xs tabular-nums text-muted">{m.at.replace("T", " ")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setRows(rows.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)))}>
                    {m.done ? L("مفتوح", "Open") : L("تمّ", "Done")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((x) => x.id !== m.id))}>
                    {t(lang, "delete")}
                  </Button>
                </div>
              </div>
              <Input
                className="mt-3"
                value={m.attendees}
                onChange={(e) => setRows(rows.map((x) => (x.id === m.id ? { ...x, attendees: e.target.value } : x)))}
                placeholder={L("الحضور", "Attendees")}
              />
              <Textarea
                className="mt-2"
                value={m.notes}
                onChange={(e) => setRows(rows.map((x) => (x.id === m.id ? { ...x, notes: e.target.value } : x)))}
                placeholder={L("نقاط ومتابعات", "Notes and follow-ups")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
