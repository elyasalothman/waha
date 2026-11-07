/** Display widgets for `/`. Choice and size live in settings; home has one تخصيص entry. */
export const HOME_WIDGET_CATALOG = [
  { id: "weather", ar: "الطقس", en: "Weather" },
  { id: "headlines", ar: "أهم الأخبار", en: "Top news" },
  { id: "reading", ar: "قراءة اليوم", en: "Today’s reading" },
  { id: "research", ar: "مركز الأبحاث", en: "Research" },
  { id: "prayer", ar: "الصلاة القادمة", en: "Next prayer" },
  { id: "hijri", ar: "تاريخ اليوم", en: "Today’s date" },
] as const;

export type HomeWidgetId = (typeof HOME_WIDGET_CATALOG)[number]["id"];

/** First visit only. A saved empty list, or any saved order, stays as saved. */
export const DEFAULT_HOME_WIDGETS = ["reading", "research", "headlines", "weather"] as const satisfies readonly HomeWidgetId[];

export type HomeSize = "comfortable" | "compact";

const IDS = new Set<string>(HOME_WIDGET_CATALOG.map((item) => item.id));

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
