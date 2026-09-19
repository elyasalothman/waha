import type { I18nKey } from "@/lib/i18n";

/** First-row chrome item. Games never belong here. */
export type ChromeNavItem = { to: string; key: I18nKey };

export const PERSONAL_NAV: readonly ChromeNavItem[] = [
  { to: "/", key: "home" },
  { to: "/life", key: "life" },
  { to: "/money", key: "money" },
  { to: "/tools", key: "tools" },
  { to: "/studio", key: "studio" },
];

export const WORK_NAV: readonly ChromeNavItem[] = [
  { to: "/", key: "home" },
  { to: "/workspace", key: "workspace" },
  { to: "/money", key: "finance" },
  { to: "/tools", key: "tools" },
  { to: "/studio", key: "studio" },
];

/** Play lives under Tools — not a first-row tab. */
export const TOOLS_OVERFLOW_NAV: readonly ChromeNavItem[] = [{ to: "/games", key: "games" }];

const MOBILE_HIDDEN = new Set(["/studio"]);

export function chromeNav(audience: "personal" | "work"): readonly ChromeNavItem[] {
  return audience === "personal" ? PERSONAL_NAV : WORK_NAV;
}

export function mobileChromeNav(audience: "personal" | "work"): readonly ChromeNavItem[] {
  return chromeNav(audience).filter((item) => !MOBILE_HIDDEN.has(item.to));
}

export function isFirstRowPlayPath(path: string): boolean {
  return chromeNav("personal").some((item) => item.to === path) && path === "/games";
}
