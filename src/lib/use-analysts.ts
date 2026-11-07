import { useEffect, useRef, useState } from "react";
import { nextAnalystList, readAnalystPayload, type AnalystCard, type AnalystOpinion } from "./analysts-feed.ts";
import { newsIsStale, newsPollDelay } from "./news-poll.ts";

export type AnalystPayload = {
  items: AnalystOpinion[];
  roster: AnalystCard[];
  fetchedAt: string | null;
};

function rosterOf(value: unknown): AnalystCard[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { roster?: unknown }).roster)) return [];
  return (value as { roster: unknown[] }).roster.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const handle = typeof item.handle === "string" ? item.handle.trim() : "";
    if (!name || !handle) return [];
    return [
      {
        name: name.slice(0, 80),
        handle: handle.slice(0, 40),
        ini: typeof item.ini === "string" ? item.ini.slice(0, 4) : name.slice(0, 2),
        color: typeof item.color === "string" && /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : "#0f766e",
        role: typeof item.role === "string" ? item.role.slice(0, 120) : undefined,
        url: typeof item.url === "string" && item.url.startsWith("https://") ? item.url : undefined,
      },
    ];
  });
}

/** Poll Hudoo while the page is visible and online. No fetch while the app is closed. */
export function useAnalysts() {
  const [data, setData] = useState<AnalystPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const dataRef = useRef<AnalystPayload | null>(null);
  const failures = useRef(0);
  const lastOk = useRef<number | null>(null);

  useEffect(() => {
    let timer = 0;
    let current: AbortController | null = null;
    let stopped = false;
    const schedule = () => {
      window.clearTimeout(timer);
      const delay = newsPollDelay(failures.current, document.hidden, navigator.onLine);
      if (delay == null) return;
      timer = window.setTimeout(() => void run(), delay);
    };
    const run = async () => {
      if (stopped) return;
      if (document.hidden || !navigator.onLine) {
        schedule();
        return;
      }
      current?.abort();
      const ac = new AbortController();
      current = ac;
      try {
        const response = await fetch("/api/analysts", { signal: ac.signal, cache: "no-store" });
        if (!response.ok) throw new Error("status");
        const body = (await response.json()) as { items?: unknown; fetchedAt?: unknown };
        if (!body || !Array.isArray(body.items)) throw new Error("shape");
        if (stopped || ac.signal.aborted) return;
        const items = nextAnalystList(dataRef.current?.items ?? [], readAnalystPayload(body));
        const next = {
          items,
          roster: rosterOf(body),
          fetchedAt: typeof body.fetchedAt === "string" ? body.fetchedAt : null,
        };
        dataRef.current = next;
        setData(next);
        setFailed(false);
        failures.current = 0;
        lastOk.current = Date.now();
      } catch {
        if (stopped || ac.signal.aborted) return;
        failures.current += 1;
        setFailed(true);
      }
      schedule();
    };
    const onResume = () => {
      if (document.hidden || !navigator.onLine) return;
      if (newsIsStale(lastOk.current, Date.now())) void run();
      else schedule();
    };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("online", onResume);
    window.addEventListener("offline", schedule);
    void run();
    return () => {
      stopped = true;
      current?.abort();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("online", onResume);
      window.removeEventListener("offline", schedule);
    };
  }, [attempt]);

  return {
    data,
    failed,
    retry() {
      failures.current = 0;
      setFailed(false);
      setAttempt((value) => value + 1);
    },
  };
}
