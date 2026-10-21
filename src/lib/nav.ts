import { withoutMoneyNav } from "./child-mode.ts";
import type { I18nKey } from "@/lib/i18n";

/** Catalog wells — launcher / المزيد only, never the Square bar. */
export const CATALOG_TAB_PATHS = [
  "/life",
  "/money",
  "/tools",
  "/games",
  "/studio",
  "/workspace",
] as const;

export type ChromeNavItem = { to: string; key: I18nKey };

export const PERSONAL_NAV: readonly ChromeNavItem[] = [
  { to: "/", key: "home" },
  { to: "/books", key: "books" },
  { to: "/tools", key: "tools" },
  { to: "/games", key: "games" },
  { to: "/me", key: "me" },
];

export const WORK_NAV = PERSONAL_NAV;

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

/** Play lives under المزيد — not a first-row tab. */
export const TOOLS_OVERFLOW_NAV: readonly ChromeNavItem[] = [{ to: "/games", key: "games" }];

export function chromeNav(
  audience: "personal" | "work",
  segment?: unknown,
): readonly ChromeNavItem[] {
  return withoutMoneyNav(audience === "personal" ? PERSONAL_NAV : WORK_NAV, segment);
}

export function mobileChromeNav(
  _audience: "personal" | "work",
  _segment?: unknown,
): readonly ChromeNavItem[] {
  return chromeNav(_audience, _segment);
}

export function moreOverflowNav(
  audience: "personal" | "work",
  segment?: unknown,
): readonly ChromeNavItem[] {
  const base = audience === "work" ? WORK_MORE_OVERFLOW_NAV : MORE_OVERFLOW_NAV;
  return withoutMoneyNav(base, segment);
}

export function isCatalogTabPath(path: string): boolean {
  return (CATALOG_TAB_PATHS as readonly string[]).includes(path);
}
