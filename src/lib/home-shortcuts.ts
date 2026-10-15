import type { CatalogItem } from "./catalog.ts";

export const HOME_SHORTCUTS_KEY = "waha:home-shortcuts:v1";
export const DEFAULT_HOME_SHORTCUTS = ["tasks", "notes", "focus"] as const;

/** Exactly three distinct, available catalogue entries; never rewrite saved choices on read. */
export function resolveHomeShortcuts(
  value: unknown,
  available: Pick<CatalogItem, "id">[],
): string[] {
  const allowed = new Set(available.map((item) => item.id));
  const candidates = [
    ...(Array.isArray(value) ? value : []),
    ...DEFAULT_HOME_SHORTCUTS,
    ...allowed,
  ];
  return [
    ...new Set(candidates.filter((id): id is string => typeof id === "string" && allowed.has(id))),
  ].slice(0, 3);
}

export function parseHomeShortcuts(raw: string | null): unknown {
  try {
    return JSON.parse(raw ?? "null") as unknown;
  } catch {
    return null;
  }
}
