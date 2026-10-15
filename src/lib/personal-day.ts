export const PILLARS = [
  { id: "faith", ar: "ديني", en: "Faith", cards: ["prayer", "ayah", "athkar"] },
  { id: "news", ar: "أخبار", en: "News", cards: ["news"] },
  { id: "fun", ar: "ممتع", en: "Fun", cards: ["wamda", "baloot", "hayat", "luma"] },
  { id: "learn", ar: "تعلم", en: "Learn", cards: ["reading", "knowledge", "hissati"] },
] as const;
export type DayPrefs = {
  theme: "day" | "night" | "gold";
  font: number;
  order: string[];
  hidden: string[];
  pinned: string[];
};
const ids: string[] = PILLARS.flatMap((p) => [...p.cards]);
const clean = (v: unknown) =>
  Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === "string" && ids.includes(x)))]
    : [];
export function dayPrefs(raw: unknown): DayPrefs {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    theme: v.theme === "night" || v.theme === "gold" ? v.theme : "day",
    font: v.font === 18 || v.font === 20 ? v.font : 16,
    order: clean(v.order),
    hidden: clean(v.hidden).filter(
      (id) => !["prayer", "ayah", "news", "wamda", "reading", "hissati"].includes(id),
    ),
    pinned: clean(v.pinned),
  };
}
export function dayKey(userId?: string) {
  return `waha:day:v1:${userId || "guest"}`;
}
export function pillarCards(cards: readonly string[], prefs: DayPrefs) {
  return [...cards]
    .filter((id) => !prefs.hidden.includes(id))
    .sort((a, b) => {
      const pin = Number(prefs.pinned.includes(b)) - Number(prefs.pinned.includes(a));
      if (pin) return pin;
      const rank = (id: string) =>
        prefs.order.includes(id) ? prefs.order.indexOf(id) : 100 + cards.indexOf(id);
      // Interests expand the matching pillar; never change the four pillar positions.
      return rank(a) - rank(b);
    });
}
export function moveCard(
  prefs: DayPrefs,
  cards: readonly string[],
  id: string,
  delta: number,
): DayPrefs {
  const ordered = pillarCards(cards, prefs);
  const from = ordered.indexOf(id),
    to = from + delta;
  if (from < 0 || to < 0 || to >= ordered.length) return prefs;
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
  return { ...prefs, order: [...ordered, ...prefs.order.filter((x) => !cards.includes(x))] };
}
