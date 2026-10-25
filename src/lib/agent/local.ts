import { normalizeDigits } from "./math.ts";
export { normalizeDigits } from "./math.ts";
export interface LocalStorageHost {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export type LocalItem = {
  id: string;
  text: string;
  createdAt: string;
  dueAt?: string;
  notified?: boolean;
};
export type Feedback = {
  text: string;
  positive: boolean;
  misunderstood: boolean;
  createdAt: string;
};
export const LOCAL_KEYS = {
  notes: "waha-agent-notes",
  reminders: "waha-agent-reminders",
  memories: "waha-agent-memories",
  feedback: "waha-agent-feedback",
  improve: "waha-agent-improve",
} as const;
export function sanitizeFeedback(text: string): string {
  return normalizeDigits(text)
    .toLowerCase()
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[بريد]")
    .replace(/(?:\+?\d[\s()-]*){7,}/g, "[رقم]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}
export function parseArabicTime(
  text: string,
  now = new Date(),
): { dueAt: string; label: string } | null {
  const s = normalizeDigits(text).replace(/أ|إ|آ/g, "ا");
  const date = new Date(now);
  const relative = s.match(
    /بعد\s*(?:(\d+(?:\.\d+)?)\s*)?(دقيق(?:ة|ه|تين)|دقائق|ساع(?:ة|ه|تين)|ساعات|يومين|يوم|ايام)/,
  );
  if (relative) {
    const unit = relative[2];
    const count = relative[1] ? Number(relative[1]) : /تين|يومين/.test(unit) ? 2 : 1;
    const factor = /دقيق/.test(unit) ? 60000 : /ساع/.test(unit) ? 3600000 : 86400000;
    date.setTime(date.getTime() + count * factor);
    return { dueAt: date.toISOString(), label: relative[0] };
  }
  const days = ["الاحد", "الاثنين", "الثلاثاء", "الاربعاء", "الخميس", "الجمعة", "السبت"];
  const day = days.findIndex((d) => s.includes(d));
  const tomorrow = /بكر[ةه]|غدا/.test(s);
  const time = s.match(
    /(?:الساع[ةه]\s*|(?:بكر[ةه]|غدا)\s*|(?:الاحد|الاثنين|الثلاثاء|الاربعاء|الخميس|الجمعة|السبت)\s*)(\d{1,2})(?::(\d{2}))?/,
  );
  if (!time && day < 0 && !tomorrow) return null;
  if (tomorrow) date.setDate(date.getDate() + 1);
  if (day >= 0) {
    let diff = (day - date.getDay() + 7) % 7;
    if (!diff) diff = 7;
    date.setDate(date.getDate() + diff);
  }
  let hours = time ? Number(time[1]) : 9;
  const minutes = time ? Number(time[2] || 0) : 0;
  if (hours > 23 || minutes > 59) return null;
  if (/العصر|المساء|مساء|الليل|المغرب|الظهر/.test(s) && hours < 12) hours += 12;
  if (/صباح|الفجر/.test(s) && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
  if (date <= now && !tomorrow && day < 0) date.setDate(date.getDate() + 1);
  return { dueAt: date.toISOString(), label: time?.[0] || s };
}
export function createLocalStore(storage: LocalStorageHost) {
  const read = <T>(key: string): T[] => {
    try {
      const value: unknown = JSON.parse(storage.getItem(key) || "[]");
      return Array.isArray(value) ? (value.slice(-200) as T[]) : [];
    } catch {
      return [];
    }
  };
  const write = <T>(key: string, value: T[]) =>
    storage.setItem(key, JSON.stringify(value.slice(-200)));
  const list = (kind: "notes" | "reminders" | "memories") => read<LocalItem>(LOCAL_KEYS[kind]);
  const add = (kind: "notes" | "reminders" | "memories", text: string, dueAt?: string) => {
    const item: LocalItem = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      text: text.trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
      ...(dueAt ? { dueAt } : {}),
    };
    if (!item.text) throw new Error("النص مطلوب");
    write(LOCAL_KEYS[kind], [...list(kind), item]);
    return item;
  };
  const remove = (kind: "notes" | "reminders" | "memories", id: string) => {
    const old = list(kind);
    write(
      LOCAL_KEYS[kind],
      old.filter((item) => item.id !== id),
    );
    return old.find((item) => item.id === id);
  };
  return {
    list,
    add,
    remove,
    clear: (kind: "notes" | "reminders" | "memories") => write(LOCAL_KEYS[kind], []),
    feedback: () => read<Feedback>(LOCAL_KEYS.feedback),
    addFeedback: (text: string, positive: boolean, misunderstood = false) => {
      const entry: Feedback = {
        text: sanitizeFeedback(text),
        positive,
        misunderstood,
        createdAt: new Date().toISOString(),
      };
      write(LOCAL_KEYS.feedback, [...read<Feedback>(LOCAL_KEYS.feedback), entry]);
      return entry;
    },
    city: () =>
      list("memories")
        .map((m) => m.text.match(/(?:مدينتي|اسكن في|أسكن في)\s+(.+)/)?.[1])
        .filter(Boolean)
        .at(-1),
    improveEnabled: () => storage.getItem(LOCAL_KEYS.improve) === "true",
    setImproveEnabled: (enabled: boolean) => storage.setItem(LOCAL_KEYS.improve, String(enabled)),
    report: () =>
      JSON.stringify(
        read<Feedback>(LOCAL_KEYS.feedback).map(({ text, positive, misunderstood }) => ({
          text,
          positive,
          misunderstood,
        })),
        null,
        2,
      ),
    issueUrl: () =>
      `https://github.com/elyasalothman/waha/issues/new?labels=agent-feedback&title=agent-feedback&body=${encodeURIComponent(
        JSON.stringify(
          read<Feedback>(LOCAL_KEYS.feedback).map(({ text, positive, misunderstood }) => ({
            text,
            positive,
            misunderstood,
          })),
          null,
          2,
        ),
      )}`,
  };
}
