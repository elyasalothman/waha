import { primaryLauncherDoors } from "./doors.ts";

/** Reviewer lock: the first screen stays solemn. Games are never the hero. */
export type HomeItem = { id: string; category: string; lane: string };

/** King lock on `/`: filled square + thin shadow + house doors. */
export const HOME_ABOVE_FOLD = ["day-shadow", "house-doors", "square"] as const;
export const HOME_SHADOW_KEYS = ["now", "prayer", "weather"] as const;
export const HOME_FORBIDDEN_COPY = ["ابدأ من هنا", "جديد في واحة"] as const;
/** Audience slides live behind one settings icon — never above day-shadow on `/`. */
export const HOME_SETTINGS_PATH = "/settings";
export const WAHA_FOR_YOU_SLICES = ["personal", "child", "family", "work"] as const;

export function homeChromeShowsAudienceSwitch(): boolean {
  return false;
}

export function isPlayItem(item: HomeItem): boolean {
  return item.category === "games" || item.lane === "play" || item.id === "luma";
}

export function forSeriousHome<T extends HomeItem>(items: T[]): T[] {
  return items.filter((item) => !isPlayItem(item));
}

export function homeShowsCityPicker(): boolean {
  return false;
}

export function homeHouseDoorIds(): string[] {
  return primaryLauncherDoors().map((d) => d.id);
}
