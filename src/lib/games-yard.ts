import { getDoor } from "./doors.ts";
import { isPlayItem } from "./home-lock.ts";

export const WORKSHOP_GAME_IDS = ["kalima", "abaar", "majra", "kutal", "memory"] as const;
export type WorkshopGameId = (typeof WORKSHOP_GAME_IDS)[number];

export const LUMA_HREF = "https://games.alhajda.com";

export function lumaDoor() {
  const door = getDoor("luma");
  return {
    id: "luma" as const,
    href: door?.href ?? LUMA_HREF,
    title: door?.title ?? { ar: "لُمعة", en: "Luma" },
    blurb: door?.blurb ?? { ar: "ألعاب عربية من باحة الهجدة", en: "Arabic games from the Alhajda yard" },
    icon: door?.icon ?? "Gamepad2",
  };
}

export function workshopGames<T extends { id: string }>(items: T[]): T[] {
  const map = new Map(items.map((item) => [item.id, item]));
  return WORKSHOP_GAME_IDS.map((id) => map.get(id)).filter((item): item is T => item != null);
}

export function otherYardGames<T extends { id: string }>(items: T[]): T[] {
  const workshop = new Set<string>(WORKSHOP_GAME_IDS);
  return items.filter((item) => !workshop.has(item.id));
}

export function yardHasPlayOnHome(homeItems: Array<{ id: string; category: string; lane: string }>): boolean {
  return homeItems.some(isPlayItem);
}
