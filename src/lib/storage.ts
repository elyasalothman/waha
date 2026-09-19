import { useCallback, useEffect, useState } from "react";

export function usePersistent<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota */
    }
  }, [key, value, ready]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [value, update, ready] as const;
}

export function readScore(id: string): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(JSON.parse(localStorage.getItem("waha:scores") ?? "{}")[id] ?? 0);
  } catch {
    return 0;
  }
}

export function writeScore(id: string, score: number) {
  try {
    const all = JSON.parse(localStorage.getItem("waha:scores") ?? "{}") as Record<string, number>;
    const next = Math.max(all[id] ?? 0, score);
    all[id] = next;
    localStorage.setItem("waha:scores", JSON.stringify(all));
    return next;
  } catch {
    return score;
  }
}

/** Lower is better — times, moves, rotations. Zero means no record yet. */
export function writeBestMin(id: string, value: number) {
  try {
    const all = JSON.parse(localStorage.getItem("waha:scores") ?? "{}") as Record<string, number>;
    const prev = all[id] ?? 0;
    const next = prev === 0 ? value : Math.min(prev, value);
    all[id] = next;
    localStorage.setItem("waha:scores", JSON.stringify(all));
    return next;
  } catch {
    return value;
  }
}
