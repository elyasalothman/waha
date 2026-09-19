/** Child-mode money lock — hide spend on home and close `/money`. PIN is out of scope. */

export type ChildSegment = "all" | "child";

export type HomeMoneyWidget = {
  id: string;
  kind: "spend";
  href: "/app/budget";
  title: { ar: string; en: string };
};

/** Home spend chips the child slice must never show. */
export const HOME_MONEY_WIDGETS: readonly HomeMoneyWidget[] = [
  { id: "today-spend", kind: "spend", href: "/app/budget", title: { ar: "مصروف اليوم", en: "Today’s spend" } },
];

export function parseChildSegment(value: unknown): ChildSegment {
  return value === "child" ? "child" : "all";
}

export function isChildMode(segment: unknown): boolean {
  return parseChildSegment(segment) === "child";
}

export function hideMoney(segment: unknown): boolean {
  return isChildMode(segment);
}

export function homeMoneyWidgets(segment: unknown): HomeMoneyWidget[] {
  return hideMoney(segment) ? [] : [...HOME_MONEY_WIDGETS];
}

export function moneyPathBlocked(pathname: string, segment: unknown): boolean {
  if (!hideMoney(segment)) return false;
  return pathname === "/money" || pathname.startsWith("/money/");
}

export function withoutMoneyNav<T extends { to: string }>(items: readonly T[], segment: unknown): T[] {
  if (!hideMoney(segment)) return [...items];
  return items.filter((item) => item.to !== "/money");
}

export function isMoneySurface(item: { category?: string; lane?: string; id?: string }): boolean {
  return item.category === "money" || item.lane === "money";
}
