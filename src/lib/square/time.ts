type Lang = "ar" | "en";

/** Format a stored age (seed) without depending on the clock — SSR-safe. */
export function formatAgeMinutes(ageMinutes: number, lang: Lang): string {
  const m = Math.max(0, Math.round(ageMinutes));
  if (m < 1) return lang === "ar" ? "الآن" : "now";
  if (m < 8) return lang === "ar" ? "منذ دقائق" : "minutes ago";
  if (m < 60) {
    return lang === "ar" ? `منذ ${m} دقيقة` : `${m}m`;
  }
  const hours = Math.floor(m / 60);
  if (hours === 1) return lang === "ar" ? "منذ ساعة" : "1h";
  if (hours < 24) {
    return lang === "ar" ? `منذ ${hours} ساعات` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return lang === "ar" ? "منذ يوم" : "1d";
  return lang === "ar" ? `منذ ${days} أيام` : `${days}d`;
}

export function formatElapsed(createdAt: number, now: number, lang: Lang): string {
  const minutes = Math.max(0, Math.floor((now - createdAt) / 60_000));
  return formatAgeMinutes(minutes, lang);
}

export function seedCreatedAt(ageMinutes: number, now = Date.now()): number {
  return now - ageMinutes * 60_000;
}

export function compactRemain(ms: number, lang: Lang): string {
  const m = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (lang === "ar") return h > 0 ? `${h} س ${mm} د` : `${mm} د`;
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
}
