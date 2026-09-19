import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayIso, tomorrowAppointments, tomorrowIso, todaysTasks } from "@/lib/family-today";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { useFamilyTodayStore } from "@/store/family-today-store";
import { cn } from "@/lib/cn";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}

export function FamilyTodayPreview() {
  const lang = useAppStore((s) => s.lang);
  const hydrate = useFamilyTodayStore((s) => s.hydrate);
  const ready = useFamilyTodayStore((s) => s.ready);
  const roles = useFamilyTodayStore((s) => s.roles);
  const tasks = useFamilyTodayStore((s) => s.tasks);
  const appointments = useFamilyTodayStore((s) => s.appointments);
  const day = todayIso();
  const next = tomorrowIso();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const openTasks = todaysTasks({ roles, tasks, appointments }, day).filter((x) => !x.done).length;
  const soon = tomorrowAppointments({ roles, tasks, appointments }, next).length;
  const named = roles.filter((r) => r.name.trim()).length;

  return (
    <Link to="/today" className="mt-4 block rounded-2xl border border-border bg-surface px-5 py-4 hover:bg-surface-2">
      <p className="text-xs text-muted">{t(lang, "familyToday")}</p>
      {ready ? (
        <p className="mt-2 text-sm text-fg">
          {named}/3 · {openTasks} {t(lang, "familyTasks")} · {soon} {t(lang, "familyTomorrow")}
        </p>
      ) : (
        <Skeleton className="mt-3 h-5 w-48" />
      )}
    </Link>
  );
}

export function FamilyTodayBoard() {
  const lang = useAppStore((s) => s.lang);
  const hydrate = useFamilyTodayStore((s) => s.hydrate);
  const ready = useFamilyTodayStore((s) => s.ready);
  const roles = useFamilyTodayStore((s) => s.roles);
  const setRole = useFamilyTodayStore((s) => s.setRole);
  const addTask = useFamilyTodayStore((s) => s.addTask);
  const toggleTask = useFamilyTodayStore((s) => s.toggleTask);
  const addAppointment = useFamilyTodayStore((s) => s.addAppointment);
  const removeAppointment = useFamilyTodayStore((s) => s.removeAppointment);
  const tasks = useFamilyTodayStore((s) => s.tasks);
  const appointments = useFamilyTodayStore((s) => s.appointments);
  const [taskTitle, setTaskTitle] = useState("");
  const [apptTitle, setApptTitle] = useState("");
  const [apptAt, setApptAt] = useState(`${tomorrowIso()}T10:00`);
  const day = todayIso();
  const next = tomorrowIso();
  const todayTasks = todaysTasks({ roles, tasks, appointments }, day);
  const soon = tomorrowAppointments({ roles, tasks, appointments }, next);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header>
        <p className="text-xs tracking-wide text-muted">{t(lang, "familyToday")}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "familyToday")}</h1>
      </header>

      <section>
        <h2 className="text-sm text-muted">{t(lang, "familyRoles")}</h2>
        <div className="mt-3 space-y-2">
          {roles.map((role) => (
            <label key={role.id} className="block text-sm">
              <span className="mb-1 block text-muted">{role.title}</span>
              {ready ? (
                <Input value={role.name} onChange={(e) => setRole(role.id, e.target.value)} />
              ) : (
                <Skeleton className="h-11 w-full" />
              )}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm text-muted">{t(lang, "familyTasks")}</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTask(taskTitle, day);
            setTaskTitle("");
          }}
        >
          <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
          <Button type="submit">{t(lang, "add")}</Button>
        </form>
        <ul className="mt-3 space-y-2">
          {ready ? (
            todayTasks.length ? (
              todayTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-start text-sm",
                      task.done && "text-muted line-through",
                    )}
                  >
                    {task.title}
                  </button>
                </li>
              ))
            ) : (
              <li className="font-mono text-sm tabular-nums text-muted">0 {t(lang, "familyTasks")}</li>
            )
          ) : (
            <Skeleton className="h-12 w-full" />
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-sm text-muted">{t(lang, "familyTomorrow")}</h2>
        <form
          className="mt-3 grid gap-2 sm:grid-cols-[1fr_9rem_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            addAppointment(apptTitle, apptAt);
            setApptTitle("");
          }}
        >
          <Input value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} />
          <Input type="datetime-local" value={apptAt} onChange={(e) => setApptAt(e.target.value)} />
          <Button type="submit">{t(lang, "add")}</Button>
        </form>
        <ul className="mt-3 space-y-2">
          {ready ? (
            soon.length ? (
              soon.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
                  <span>
                    {item.title}
                    <span className="ms-2 text-xs text-muted">{item.at.slice(11, 16)}</span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => removeAppointment(item.id)}>
                    {t(lang, "delete")}
                  </Button>
                </li>
              ))
            ) : (
              <li className="font-mono text-sm tabular-nums text-muted">0 {t(lang, "familyTomorrow")}</li>
            )
          ) : (
            <Skeleton className="h-12 w-full" />
          )}
        </ul>
      </section>
    </div>
  );
}
