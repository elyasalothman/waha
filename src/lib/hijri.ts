export const HIJRI_MONTHS = {
  ar: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
  en: ["Muharram", "Safar", "Rabiʿ I", "Rabiʿ II", "Jumada I", "Jumada II", "Rajab", "Shaʿban", "Ramadan", "Shawwal", "Dhu al-Qaʿdah", "Dhu al-Hijjah"],
} as const;

export type HijriDate = { hy: number; hm: number; hd: number };

export function toHijri(date: Date): HijriDate {
  const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const num = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { hy: num("year"), hm: num("month"), hd: num("day") };
}

export function formatHijri(date: Date, lang: "ar" | "en", withWeekday = false) {
  const { hy, hm, hd } = toHijri(date);
  const month = HIJRI_MONTHS[lang][hm - 1] ?? "";
  const weekday = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    weekday: "long",
    calendar: "islamic-umalqura",
  }).format(date);
  const core = lang === "ar" ? `${hd} ${month} ${hy}` : `${hd} ${month} ${hy}`;
  return withWeekday ? `${weekday} · ${core}` : core;
}

export function formatGregorian(date: Date, lang: "ar" | "en") {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function hijriToGregorian(hy: number, hm: number, hd: number): Date | null {
  const approx = new Date(Date.UTC(Math.round(hy * 0.970224 + 621.57), Math.max(0, hm - 1), hd));
  let lo = new Date(approx);
  lo.setUTCDate(lo.getUTCDate() - 40);
  let hi = new Date(approx);
  hi.setUTCDate(hi.getUTCDate() + 40);

  for (let i = 0; i < 48; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    const h = toHijri(mid);
    const cmp = h.hy !== hy ? h.hy - hy : h.hm !== hm ? h.hm - hm : h.hd - hd;
    if (cmp === 0) {
      return new Date(mid.getFullYear(), mid.getMonth(), mid.getDate());
    }
    if (cmp < 0) lo = new Date(mid.getTime() + 86400000);
    else hi = new Date(mid.getTime() - 86400000);
    if (hi < lo) break;
  }
  return null;
}

export type Occasion = { id: string; hy: number; hm: number; hd: number; ar: string; en: string };

export function upcomingOccasions(from: Date, lang: "ar" | "en"): { title: string; days: number; date: Date }[] {
  const { hy } = toHijri(from);
  const events: Occasion[] = [
    { id: "ramadan", hy, hm: 9, hd: 1, ar: "أول رمضان", en: "Ramadan begins" },
    { id: "eid-fitr", hy, hm: 10, hd: 1, ar: "عيد الفطر", en: "Eid al-Fitr" },
    { id: "arafah", hy, hm: 12, hd: 9, ar: "يوم عرفة", en: "Day of Arafah" },
    { id: "eid-adha", hy, hm: 12, hd: 10, ar: "عيد الأضحى", en: "Eid al-Adha" },
    { id: "hijri-new", hy: hy + 1, hm: 1, hd: 1, ar: "رأس السنة الهجرية", en: "Islamic New Year" },
    { id: "ashura", hy: hy + 1, hm: 1, hd: 10, ar: "عاشوراء", en: "Ashura" },
    { id: "mawlid", hy: hy + 1, hm: 3, hd: 12, ar: "المولد النبوي", en: "Mawlid" },
  ];
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return events
    .map((e) => {
      const date = hijriToGregorian(e.hy, e.hm, e.hd);
      if (!date) return null;
      const days = Math.round((date.getTime() - start) / 86400000);
      return { title: lang === "ar" ? e.ar : e.en, days, date };
    })
    .filter((x): x is { title: string; days: number; date: Date } => x != null && x.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);
}
