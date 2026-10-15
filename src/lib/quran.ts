import verses from "./quran-daily.json" with { type: "json" };
export function riyadhDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function dailyAyah(day: string) {
  let n = 0;
  for (const c of day) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return verses[n % verses.length];
}
export function validPosition(value: unknown): { surah: number; ayah: number } | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  return Number.isInteger(p.surah) &&
    Number(p.surah) >= 1 &&
    Number(p.surah) <= 114 &&
    Number.isInteger(p.ayah) &&
    Number(p.ayah) >= 1 &&
    Number(p.ayah) <= 286
    ? { surah: Number(p.surah), ayah: Number(p.ayah) }
    : null;
}
