import { hijriToGregorian, toHijri } from "@/lib/hijri";

export type Holiday = {
  id: string;
  date: Date;
  ar: string;
  en: string;
  kind: "national" | "islamic";
};

function atMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(from: Date, to: Date) {
  return Math.round((atMidnight(to).getTime() - atMidnight(from).getTime()) / 86400000);
}

export function saudiHolidays(from = new Date()): (Holiday & { days: number })[] {
  const y = from.getFullYear();
  const { hy } = toHijri(from);
  const fixed: Holiday[] = [
    { id: "founding", date: new Date(y, 1, 22), ar: "يوم التأسيس", en: "Founding Day", kind: "national" },
    { id: "flag", date: new Date(y, 2, 11), ar: "يوم العلم", en: "Flag Day", kind: "national" },
    { id: "national", date: new Date(y, 8, 23), ar: "اليوم الوطني", en: "National Day", kind: "national" },
    { id: "founding-next", date: new Date(y + 1, 1, 22), ar: "يوم التأسيس", en: "Founding Day", kind: "national" },
    { id: "national-next", date: new Date(y + 1, 8, 23), ar: "اليوم الوطني", en: "National Day", kind: "national" },
  ];
  const islamicSpec = [
    { id: "ramadan", hy, hm: 9, hd: 1, ar: "أول رمضان", en: "Ramadan begins" },
    { id: "fitr", hy, hm: 10, hd: 1, ar: "عيد الفطر", en: "Eid al-Fitr" },
    { id: "arafah", hy, hm: 12, hd: 9, ar: "يوم عرفة", en: "Day of Arafah" },
    { id: "adha", hy, hm: 12, hd: 10, ar: "عيد الأضحى", en: "Eid al-Adha" },
    { id: "newhy", hy: hy + 1, hm: 1, hd: 1, ar: "رأس السنة الهجرية", en: "Islamic New Year" },
    { id: "ashura", hy: hy + 1, hm: 1, hd: 10, ar: "عاشوراء", en: "Ashura" },
    { id: "ramadan-next", hy: hy + 1, hm: 9, hd: 1, ar: "أول رمضان", en: "Ramadan begins" },
  ];
  const islamic: Holiday[] = [];
  for (const e of islamicSpec) {
    const date = hijriToGregorian(e.hy, e.hm, e.hd);
    if (!date) continue;
    islamic.push({ id: e.id, date, ar: e.ar, en: e.en, kind: "islamic" });
  }

  return [...fixed, ...islamic]
    .map((h) => ({ ...h, days: daysUntil(from, h.date) }))
    .filter((h) => h.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 10);
}
