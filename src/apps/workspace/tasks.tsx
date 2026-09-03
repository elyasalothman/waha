import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Task = { id: string; title: string; done: boolean; priority: 1 | 2 | 3 };
type Filter = "all" | "open" | "done";

export function TasksApp() {
  const lang = useAppStore((s) => s.lang);
  const [tasks, setTasks] = usePersistent<Task[]>("waha:tasks", []);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const shown = tasks.filter((t0) => (filter === "all" ? true : filter === "done" ? t0.done : !t0.done));

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setTasks([{ id: crypto.randomUUID(), title: title.trim(), done: false, priority: 2 }, ...tasks]);
          setTitle("");
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang === "ar" ? "مهمة جديدة" : "New task"} />
        <Button type="submit">{t(lang, "add")}</Button>
      </form>
      <div className="flex gap-2">
        {(["all", "open", "done"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "secondary"} onClick={() => setFilter(f)}>
            {f === "all" ? (lang === "ar" ? "الكل" : "All") : f === "open" ? (lang === "ar" ? "مفتوحة" : "Open") : lang === "ar" ? "منجزة" : "Done"}
          </Button>
        ))}
      </div>
      <ul className="space-y-2">
        {shown.map((task) => (
          <li key={task.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <input
              type="checkbox"
              className="size-5"
              checked={task.done}
              onChange={() => setTasks(tasks.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)))}
            />
            <span className={cn("flex-1 text-sm", task.done && "text-muted line-through")}>{task.title}</span>
            <select
              className="h-9 rounded-md border border-border bg-bg px-2 text-xs"
              value={task.priority}
              onChange={(e) =>
                setTasks(tasks.map((x) => (x.id === task.id ? { ...x, priority: Number(e.target.value) as 1 | 2 | 3 } : x)))
              }
            >
              <option value={1}>{lang === "ar" ? "عالية" : "High"}</option>
              <option value={2}>{lang === "ar" ? "وسط" : "Mid"}</option>
              <option value={3}>{lang === "ar" ? "منخفضة" : "Low"}</option>
            </select>
            <Button size="sm" variant="ghost" onClick={() => setTasks(tasks.filter((x) => x.id !== task.id))}>
              {t(lang, "delete")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
