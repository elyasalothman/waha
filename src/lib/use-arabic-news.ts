import { useEffect, useRef, useState } from "react";
import type { ArabicNews } from "./arabic-news.ts";
import { newsIsStale, newsPollDelay } from "./news-poll.ts";

export function useArabicNews() {
  const [data, setData] = useState<ArabicNews | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const dataRef = useRef<ArabicNews | null>(null);
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
        const response = await fetch("/api/news", { signal: ac.signal, cache: "no-store" });
        if (!response.ok) throw new Error("status");
        const next = (await response.json()) as ArabicNews;
        if (!next || !Array.isArray(next.items)) throw new Error("shape");
        if (stopped || ac.signal.aborted) return;
        const keep = next.status === "unavailable" && (dataRef.current?.items.length ?? 0) > 0;
        if (keep) {
          failures.current += 1;
          setFailed(true);
        } else {
          dataRef.current = next;
          setData(next);
          setFailed(next.status === "unavailable");
          if (next.status === "unavailable") failures.current += 1;
          else {
            failures.current = 0;
            lastOk.current = Date.now();
          }
        }
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
