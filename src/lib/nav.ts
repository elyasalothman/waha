import type { I18nKey } from "@/lib/i18n";

/** First-row chrome item. Catalog wells never belong here. */
export type ChromeNavItem = { to: string; key: I18nKey };

export const CATALOG_TAB_PATHS = ["/life", "/money", "/tools", "/games", "/studio", "/workspace"] as const;

export const PERSONAL_NAV: readonly ChromeNavItem[] = [
  { to: "/", key: "home" },
  { to: "/more", key: "more" },
];

export const WORK_NAV: readonly ChromeNavItem[] = [
  { to: "/", key: "home" },
  { to: "/more", key: "more" },
];

/** Catalog wells live under المزيد — not the Square bar. */
export const MORE_OVERFLOW_NAV: readonly ChromeNavItem[] = [
  { to: "/life", key: "life" },
  { to: "/money", key: "money" },
  { to: "/tools", key: "tools" },
  { to: "/games", key: "games" },
  { to: "/studio", key: "studio" },
];

export const WORK_MORE_OVERFLOW_NAV: readonly ChromeNavItem[] = [
  { to: "/workspace", key: "workspace" },
  { to: "/money", key: "finance" },
  { to: "/tools", key: "tools" },
  { to: "/studio", key: "studio" },
];

/** Play lives under المزيد (and Tools) — not a first-row tab. */
export const TOOLS_OVERFLOW_NAV: readonly ChromeNavItem[] = [{ to: "/games", key: "games" }];

export function chromeNav(audience: "personal" | "work"): readonly ChromeNavItem[] {
  return audience === "personal" ? PERSONAL_NAV : WORK_NAV;
}

export function mobileChromeNav(audience: "personal" | "work"): readonly ChromeNavItem[] {
  return chromeNav(audience);
}

export function moreOverflowNav(audience: "personal" | "work"): readonly ChromeNavItem[] {
  return audience === "work" ? WORK_MORE_OVERFLOW_NAV : MORE_OVERFLOW_NAV;
}
