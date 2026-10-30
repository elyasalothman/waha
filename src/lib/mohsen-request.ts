export const MOHSEN_MESSAGE_LIMIT = 8000;
export const MOHSEN_BODY_LIMIT = 128000;
/** Bound conversation context separately from the current question. */
export function mohsenHistory(value: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(value)) return [];
  let remaining = 12000;
  const result: { role: "user" | "assistant"; content: string }[] = [];
  for (const entry of value.slice(-8).reverse()) {
    if (!entry || !["user", "assistant"].includes(entry.role) || typeof entry.content !== "string")
      continue;
    const content = entry.content.slice(0, Math.min(4000, remaining));
    if (content) result.unshift({ role: entry.role, content });
    remaining -= content.length;
    if (!remaining) break;
  }
  return result;
}

/** Device-local memories (وكيل محسن «تذكّر») sent with the question; never stored server-side. */
export function mohsenMemory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  let total = 0;
  for (const v of value.slice(-20)) {
    // eslint-disable-next-line no-control-regex
    const t = String(typeof v === "string" ? v : "").replace(/[\u0000-\u001f<>`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
    if (!t || total + t.length > 1200) continue;
    total += t.length;
    out.push(t);
  }
  return out;
}

/** Starter prompts that showcase Mohsen's sourced specialist modes. */
export const MOHSEN_STARTERS = [
  { label: "🛒 أفضل شاحن جداري", q: "وش أفضل شاحن جداري سريع للآيفون والسامسونج؟ أبي رابط شراء" },
  { label: "📱 أفضل جوال بحدود 2000", q: "أفضل جوال بحدود 2000 ريال" },
  { label: "🚗 سيارة عائلية بحدود 150 ألف", q: "أفضل سيارة عائلية SUV في السعودية بحدود 150 ألف ريال" },
  { label: "📖 تفسير آية الكرسي", q: "ما تفسير آية الكرسي؟" },
  { label: "🏛️ تجديد رخصة القيادة", q: "كيف أجدد رخصة القيادة وكم الرسوم؟" },
] as const;
