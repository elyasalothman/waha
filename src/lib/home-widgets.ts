/** Display widgets for `/`. Choice and size live in settings; home has one تخصيص entry. */
export const HOME_WIDGET_IDS = [
  "reading",
  "continue",
  "saved",
  "picks",
  "research",
  "headlines",
  "broadcast",
  "weather",
  "analysts",
  "prayer",
  "hijri",
] as const;

export const HOME_WIDGET_CATALOG = [
  { id: "reading", ar: "قراءة اليوم", en: "Today’s reading" },
  { id: "continue", ar: "أكمل القراءة", en: "Continue reading" },
  { id: "saved", ar: "محفوظاتك", en: "Saved reading" },
  { id: "picks", ar: "كتب من مداد", en: "Medad books" },
  { id: "research", ar: "مركز الأبحاث", en: "Research" },
  { id: "headlines", ar: "أهم الأخبار", en: "Top news" },
  { id: "broadcast", ar: "البث المباشر", en: "Live broadcast" },
  { id: "weather", ar: "الطقس", en: "Weather" },
  { id: "analysts", ar: "آراء المحللين", en: "Analyst opinions" },
  { id: "prayer", ar: "الصلاة القادمة", en: "Next prayer" },
  { id: "hijri", ar: "تاريخ اليوم", en: "Today’s date" },
] as const satisfies readonly { id: (typeof HOME_WIDGET_IDS)[number]; ar: string; en: string }[];

export type HomeWidgetId = (typeof HOME_WIDGET_IDS)[number];

/**
 * First visit only. A saved list, including a saved empty list, is not rewritten
 * and does not gain these ids by itself.
 */
export const DEFAULT_HOME_WIDGETS = [
  "reading",
  "continue",
  "saved",
  "picks",
  "research",
  "headlines",
  "weather",
  "analysts",
] as const satisfies readonly HomeWidgetId[];

export type HomeSize = "comfortable" | "compact";

const IDS = new Set<string>(HOME_WIDGET_IDS);

export function isHomeWidgetId(value: string): value is HomeWidgetId {
  return IDS.has(value);
}

export function addHomeWidget(current: readonly HomeWidgetId[], id: HomeWidgetId): HomeWidgetId[] {
  if (current.includes(id) || current.length >= HOME_WIDGET_CATALOG.length) return [...current];
  return [...current, id];
}

export function removeHomeWidget(current: readonly HomeWidgetId[], id: HomeWidgetId): HomeWidgetId[] {
  return current.filter((item) => item !== id);
}

export function moveHomeWidget(
  current: readonly HomeWidgetId[],
  index: number,
  delta: -1 | 1,
): HomeWidgetId[] {
  const next = index + delta;
  if (index < 0 || index >= current.length || next < 0 || next >= current.length) return [...current];
  const copy = [...current];
  const swap = copy[index];
  copy[index] = copy[next]!;
  copy[next] = swap!;
  return copy;
}
