export type PulseAlert = { id: string; href: string; ar: string; en: string; tone: "warn" | "ok" };
export type PulseStat = { id: string; href: string; ar: string; en: string; value: string; max?: string };

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

function daysUntil(iso: string) {
  const t = new Date(`${iso}T00:00:00`).getTime();
  if (!Number.isFinite(t)) return null;
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return Math.round((t - n.getTime()) / 86400000);
}

export function personalPulse(): { stats: PulseStat[]; alerts: PulseAlert[] } {
  const stats: PulseStat[] = [];
  const alerts: PulseAlert[] = [];
  const today = todayIso();
  const month = monthKey();

  const salah = readJson<Record<string, Partial<Record<string, boolean>>>>("waha:salahlog");
  const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const done = prayers.filter((p) => salah?.[today]?.[p]).length;
  stats.push({
    id: "salah",
    href: "salahlog",
    ar: "صلوات اليوم",
    en: "Today’s prayers",
    value: String(done),
    max: "5",
  });

  const water = readJson<{ date: string; n: number; goal: number }>("waha:water");
  const glasses = water?.date === today ? water.n : 0;
  stats.push({
    id: "water",
    href: "water",
    ar: "أكواب الماء",
    en: "Water glasses",
    value: String(glasses),
    max: String(water?.goal || 8),
  });

  const athkar = readJson<{ date: string; morning: string[]; evening: string[] }>("waha:athkar");
  const m = athkar?.date === today ? athkar.morning.length : 0;
  const e = athkar?.date === today ? athkar.evening.length : 0;
  stats.push({
    id: "athkar",
    href: "athkar",
    ar: "أذكار",
    en: "Athkar",
    value: `${m + e}`,
    max: "16",
  });

  const papers = readJson<{ id: string; title: string; expiry: string }[]>("waha:papers") ?? [];
  for (const doc of papers) {
    const d = daysUntil(doc.expiry);
    if (d == null) continue;
    if (d < 0) {
      alerts.push({
        id: `paper-${doc.id}`,
        href: "papers",
        tone: "warn",
        ar: `انتهت ${doc.title}`,
        en: `${doc.title} expired`,
      });
    } else if (d <= 45) {
      alerts.push({
        id: `paper-${doc.id}`,
        href: "papers",
        tone: "warn",
        ar: `${doc.title} خلال ${d} يوماً`,
        en: `${doc.title} in ${d} days`,
      });
    }
  }

  const billsStore = readJson<{ bills: { id: string; title: string; dueDay: number; paidOn: string | null }[] }>("waha:bills");
  const day = new Date().getDate();
  for (const bill of billsStore?.bills ?? []) {
    if (bill.paidOn === month) continue;
    if (bill.dueDay <= day) {
      alerts.push({
        id: `bill-${bill.id}`,
        href: "bills",
        tone: "warn",
        ar: `${bill.title} مستحق`,
        en: `${bill.title} is due`,
      });
    } else if (bill.dueDay - day <= 3) {
      alerts.push({
        id: `bill-${bill.id}`,
        href: "bills",
        tone: "warn",
        ar: `${bill.title} بعد ${bill.dueDay - day} أيام`,
        en: `${bill.title} in ${bill.dueDay - day} days`,
      });
    }
  }

  const family = readJson<{ id: string; name: string; birthday: string }[]>("waha:family") ?? [];
  for (const p of family) {
    const next = nextBirthday(p.birthday);
    if (next == null) continue;
    if (next === 0) {
      alerts.push({ id: `bday-${p.id}`, href: "family", tone: "ok", ar: `اليوم عيد ${p.name}`, en: `${p.name}’s birthday is today` });
    } else if (next <= 14) {
      alerts.push({
        id: `bday-${p.id}`,
        href: "family",
        tone: "ok",
        ar: `عيد ${p.name} بعد ${next} أيام`,
        en: `${p.name}’s birthday in ${next} days`,
      });
    }
  }

  const car = readJson<{ inspection: string; insurance: string }>("waha:car");
  if (car?.inspection) {
    const d = daysUntil(car.inspection);
    if (d != null && d <= 30) {
      alerts.push({
        id: "car-insp",
        href: "car",
        tone: "warn",
        ar: d < 0 ? "انتهى فحص السيارة" : `فحص السيارة خلال ${d} يوماً`,
        en: d < 0 ? "Car inspection expired" : `Inspection in ${d} days`,
      });
    }
  }
  if (car?.insurance) {
    const d = daysUntil(car.insurance);
    if (d != null && d <= 30) {
      alerts.push({
        id: "car-ins",
        href: "car",
        tone: "warn",
        ar: d < 0 ? "انتهى تأمين السيارة" : `تأمين السيارة خلال ${d} يوماً`,
        en: d < 0 ? "Car insurance expired" : `Insurance in ${d} days`,
      });
    }
  }

  const lmp = readJson<string>("waha:pregnancy-lmp");
  if (typeof lmp === "string" && /^\d{4}-\d{2}-\d{2}$/.test(lmp)) {
    const start = new Date(`${lmp}T00:00:00`);
    const due = new Date(start);
    due.setDate(due.getDate() + 280);
    const dueIso = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
    const left = daysUntil(dueIso);
    if (left != null && left >= 0 && left <= 21) {
      alerts.push({
        id: "preg",
        href: "pregnancy",
        tone: "ok",
        ar: left === 0 ? "موعد الولادة المتوقع اليوم" : `موعد الولادة المتوقع بعد ${left} يوماً`,
        en: left === 0 ? "Due date is today" : `Due in ${left} days`,
      });
    }
  }

  return { stats, alerts: alerts.slice(0, 6) };
}

export function workPulse(): { stats: PulseStat[]; alerts: PulseAlert[] } {
  const stats: PulseStat[] = [];
  const alerts: PulseAlert[] = [];
  const today = todayIso();
  const month = monthKey();

  const tasks = readJson<{ id: string; done: boolean }[]>("waha:tasks") ?? [];
  const open = tasks.filter((t0) => !t0.done).length;
  stats.push({
    id: "tasks",
    href: "tasks",
    ar: "مهام مفتوحة",
    en: "Open tasks",
    value: String(open),
    max: tasks.length ? String(tasks.length) : undefined,
  });

  const sheet = readJson<{ project: string; start: number; end: number | null }[]>("waha:timesheet") ?? [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const ms = sheet.reduce((acc, r) => {
    const end = r.end ?? Date.now();
    if (end < start.getTime()) return acc;
    return acc + Math.max(0, end - Math.max(r.start, start.getTime()));
  }, 0);
  stats.push({
    id: "hours",
    href: "timesheet",
    ar: "ساعات اليوم",
    en: "Hours today",
    value: (ms / 3600000).toFixed(1),
  });

  const expenses = readJson<{ amount: number; date: string; paid: boolean }[]>("waha:expenses") ?? [];
  const due = expenses.filter((e) => e.date.startsWith(month) && !e.paid).reduce((s, e) => s + e.amount, 0);
  stats.push({
    id: "exp",
    href: "expenses",
    ar: "مصروف معلّق",
    en: "Open expenses",
    value: String(Math.round(due)),
  });

  const licenses = readJson<{ id: string; title: string; expiry: string }[]>("waha:licenses") ?? [];
  for (const doc of licenses) {
    const d = daysUntil(doc.expiry);
    if (d == null) continue;
    if (d < 0) {
      alerts.push({ id: `lic-${doc.id}`, href: "licenses", tone: "warn", ar: `انتهت ${doc.title}`, en: `${doc.title} expired` });
    } else if (d <= 45) {
      alerts.push({
        id: `lic-${doc.id}`,
        href: "licenses",
        tone: "warn",
        ar: `${doc.title} خلال ${d} يوماً`,
        en: `${doc.title} in ${d} days`,
      });
    }
  }

  const meetings = readJson<{ id: string; title: string; at: string; done: boolean }[]>("waha:meetings") ?? [];
  for (const meet of meetings) {
    if (meet.done || !meet.at) continue;
    if (meet.at.slice(0, 10) === today) {
      alerts.push({ id: `meet-${meet.id}`, href: "meetings", tone: "ok", ar: `اجتماع اليوم: ${meet.title}`, en: `Today: ${meet.title}` });
    }
  }

  const pipeline = readJson<{ id: string; title: string; stage: string }[]>("waha:pipeline") ?? [];
  const offers = pipeline.filter((d) => d.stage === "offer").length;
  if (offers > 0) {
    alerts.push({
      id: "offers",
      href: "pipeline",
      tone: "ok",
      ar: `${offers} عرض بانتظار الرد`,
      en: `${offers} offers waiting`,
    });
  }

  return { stats, alerts: alerts.slice(0, 6) };
}

function nextBirthday(mmdd: string) {
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd) ?? /^(\d{4})-(\d{2})-(\d{2})$/.exec(mmdd);
  if (!m) return null;
  const month = Number(m.length === 3 ? m[1] : m[2]);
  const day = Number(m.length === 3 ? m[2] : m[3]);
  if (!month || !day) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next < now) next = new Date(now.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - now.getTime()) / 86400000);
}
