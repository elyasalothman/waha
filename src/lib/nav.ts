import type { I18nKey } from "@/lib/i18n";

/** First-row chrome item. Games never belong here. */
export type ChromeNavItem = { to: string; key: I18nKey };

/** Filled Square — first visible section tab after the quiet home. */
export const MAYDAN_PATH = "/maydan";

export const PERSONAL_NAV: readonly ChromeNavItem[] = [
  { to: "/", key: "home" },
  { to: MAYDAN_PATH, key: "square" },
  { to: "/madar", key: "madar" },
  { to: "/life", key: "life" },
  { to: "/money", key: "money" },
  { to: "/tools", key: "tools" },
  { to: "/studio", key: "studio" },
];

export const WORK_NAV: readonly ChromeNavItem[] = [
  { to: "/", key: "home" },
  { to: MAYDAN_PATH, key: "square" },
  { to: "/madar", key: "madar" },
  { to: "/workspace", key: "workspace" },
  { to: "/money", key: "finance" },
  { to: "/tools", key: "tools" },
  { to: "/studio", key: "studio" },
];

/** Play lives under Tools — not a first-row tab. */
export const TOOLS_OVERFLOW_NAV: readonly ChromeNavItem[] = [{ to: "/games", key: "games" }];

const MOBILE_HIDDEN = new Set(["/studio", "/madar"]);

export function chromeNav(audience: "personal" | "work"): readonly ChromeNavItem[] {
  return audience === "personal" ? PERSONAL_NAV : WORK_NAV;
}

export function mobileChromeNav(audience: "personal" | "work"): readonly ChromeNavItem[] {
  return chromeNav(audience).filter((item) => !MOBILE_HIDDEN.has(item.to));
}

/** First filled chrome tab — Maydan, never the quiet home and never games. */
export function firstFilledTab(audience: "personal" | "work"): ChromeNavItem {
  const item = chromeNav(audience).find((entry) => entry.to === MAYDAN_PATH);
  if (!item) throw new Error("Maydan must stay a first-row chrome tab");
  return item;
}
