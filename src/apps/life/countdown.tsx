import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useNow } from "@/hooks/use-now";
import { useAppStore } from "@/store/app-store";

type Event = { id: string; title: string; date: string };

export function CountdownApp() {
  const lang = useAppStore((s) => s.lang);
  const now = useNow(60_000);
  const [events, setEvents] = usePersistent<Event[]>("waha:countdown", []);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !date) return;
          setEvents([{ id: crypto.randomUUID(), title: title.trim(), date }, ...events]);
          setTitle("");
        }}
      >
        <Input className="flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang === "ar" ? "المناسبة" : "Occasion"} />
        <Input type="date" className="sm:w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <ul className="space-y-2">
        {events
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((ev) => {
            const days = Math.round((new Date(ev.date + "T12:00:00").getTime() - start) / 86400000);
            const label =
              days === 0 ? t(lang, "today") : days > 0 ? `${days} ${t(lang, "days")}` : lang === "ar" ? `مضى ${-days}` : `${-days} ago`;
            return (
              <li key={ev.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div>
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-xs text-muted">{ev.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tabular-nums text-primary">{label}</span>
                  <Button size="sm" variant="ghost" onClick={() => setEvents(events.filter((x) => x.id !== ev.id))}>
                    {t(lang, "delete")}
                  </Button>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
