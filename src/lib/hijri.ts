export const HIJRI_MONTHS = {
  ar: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
  en: ["Muharram", "Safar", "Rabiʿ I", "Rabiʿ II", "Jumada I", "Jumada II", "Rajab", "Shaʿban", "Ramadan", "Shawwal", "Dhu al-Qaʿdah", "Dhu al-Hijjah"],
} as const;

export type HijriDate = { hy: number; hm: number; hd: number };

/** Kuwaiti algorithmic Hijri — used when ICU `islamic-umalqura` is missing. */
function toHijriAlgo(date: Date): HijriDate {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let m = month;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hm = Math.max(1, Math.min(12, Math.floor((24 * l3) / 709)));
  const hd = Math.max(1, l3 - Math.floor((709 * hm) / 24));
  const hy = 30 * n + j - 30;
  return { hy, hm, hd };
}

export function toHijri(date: Date): HijriDate {
  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = fmt.formatToParts(date);
    const num = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const hy = num("year");
    const hm = num("month");
    const hd = num("day");
    if (hy > 0 && hm > 0 && hd > 0) return { hy, hm, hd };
  } catch {
    /* incomplete ICU */
  }
  return toHijriAlgo(date);
}

export function formatHijri(date: Date, lang: "ar" | "en", withWeekday = false) {
  const { hy, hm, hd } = toHijri(date);
  const month = HIJRI_MONTHS[lang][hm - 1] ?? HIJRI_MONTHS.en[0];
  let weekday = "";
  if (withWeekday) {
    try {
      weekday = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
        weekday: "long",
      }).format(date);
    } catch {
      weekday = "";
    }
  }
  const core = `${hd} ${month} ${hy}`;
  if (!core.trim()) return lang === "ar" ? "اليوم الهجري" : "Hijri today";
  return weekday ? `${weekday} · ${core}` : core;
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
