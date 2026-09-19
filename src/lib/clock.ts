/** ASCII HH:MM — never empty, never Eastern-Arabic digits (those vanish in IBM Plex Mono). */
export const HM_RE = /^\d{2}:\d{2}$/;
/** Live countdown: always `HH:MM:SS`. */
export const HMS_RE = /^\d{2}:\d{2}:\d{2}$/;
/** Short fold timer: `M:SS` or `H:MM:SS`. */
export const SHORT_REMAIN_RE = /^(?:\d{1,2}:)?\d{1,2}:\d{2}$/;

export function pad2(n: number): string {
  const v = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  return String(v % 100).padStart(2, "0");
}

function remainParts(ms: number): { h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000));
  const h = Math.min(99, Math.floor(total / 3600));
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h, m, s };
}

/** Always `HH:MM:SS` — never empty, never a dash. */
export function formatLiveHms(ms: number): string {
  const { h, m, s } = remainParts(ms);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/** Short live timer for the fold: `3:14:22` or `12:34` or `0:26`. Never empty. */
export function formatShortRemain(ms: number): string {
  const { h, m, s } = remainParts(ms);
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

export function isVisibleHms(value: string): boolean {
  return HMS_RE.test(value);
}

export function isVisibleShortRemain(value: string): boolean {
  return SHORT_REMAIN_RE.test(value) && value.trim().length > 0;
}

/** Local wall clock of `date` (browser/OS timezone). Always `HH:MM`. */
export function formatLocalHm(date: Date = new Date()): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return formatLocalHm(new Date());
  }
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Format an instant as `HH:MM` in `timeZone`.
 * Falls back to local hours if ICU/timezone data is missing.
 */
export function formatHmInZone(date: Date, timeZone: string): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return formatLocalHm(new Date());
  }
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    if (hour != null && minute != null) {
      const h = pad2(Number.parseInt(hour, 10));
      const m = pad2(Number.parseInt(minute, 10));
      const out = `${h}:${m}`;
      if (HM_RE.test(out)) return out;
    }
  } catch {
    /* ICU / timezone missing */
  }
  return formatLocalHm(date);
}

export function isVisibleHm(value: string): boolean {
  return HM_RE.test(value);
}

/** Civil Y-M-D in a zone, at local noon, so adhan's day is the city's day. */
export function civilDateInZone(now: Date, timeZone: string): Date {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(now);
    const num = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const y = num("year");
    const m = num("month");
    const d = num("day");
    if (y > 0 && m > 0 && d > 0) return new Date(y, m - 1, d, 12, 0, 0);
  } catch {
    /* fall through */
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}
