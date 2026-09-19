function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function waterWell() {
  const water = readJson<{ date: string; n: number; goal: number }>("waha:water");
  const today = todayIso();
  return {
    value: water?.date === today ? water.n : 0,
    max: water?.goal || 8,
  };
}

export function expenseWell() {
  const store = readJson<{ month: string; limit: number; items: { amount: number }[] }>("waha:budget");
  const month = monthKey();
  const items = store?.month === month ? store.items : [];
  const spent = items.reduce((s, i) => s + i.amount, 0);
  return { spent, limit: store?.limit || 4000 };
}

export function salahWell() {
  const salah = readJson<Record<string, Partial<Record<string, boolean>>>>("waha:salahlog");
  const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const done = prayers.filter((p) => salah?.[todayIso()]?.[p]).length;
  return { value: done, max: 5 };
}
