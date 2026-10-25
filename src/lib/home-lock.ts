import { SHADE_FIELD_CROSSING } from "./shade-field-data.ts";

export { SHADE_FIELD_CROSSING, SHADE_FIELD_LANES } from "./shade-field-data.ts";

/** Reviewer lock: the first screen stays solemn. Games are never the hero. */
export type HomeItem = { id: string; category: string; lane: string };

/** Homepage stays limited to the three daily essentials. */
export const HOME_ABOVE_FOLD = ["news", "watchlist", "shortcuts"] as const;
export const HOME_SHADOW_KEYS = ["now", "prayer", "weather"] as const;
export const HOME_FORBIDDEN_COPY = ["ابدأ من هنا", "جديد في واحة"] as const;
/** واحة من أجلك lives on account creation — never `/`, chrome, or `/settings`. */
export const HOME_ONBOARDING_PATH = "/onboarding";
export const WAHA_FOR_YOU_SLICES = ["personal", "child", "family", "work"] as const;

export function homeChromeShowsAudienceSwitch(): boolean {
  return false;
}

export function slicesLiveOnSettings(): boolean {
  return false;
}

export function slicesLiveOnOnboarding(): boolean {
  return true;
}

/** روح الواحة: a guest reads the Square with no account. */
export function guestReadsWithoutAccount(): boolean {
  return true;
}

/** Slices and signed-in identity live only on account creation. */
export function identityOnlyAtOnboarding(): boolean {
  return true;
}

/** Guest Maydan is never emptied by a leftover child/work slice. */
export function guestMaydanKeepsSeed48(): boolean {
  return true;
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
  return [];
}

/** The Square and prayer/weather stay under Explore, off the homepage. */
export function homeKeepsShadeWithField(): boolean {
  return false;
}

export function homeShowsDailySlides(): boolean {
  return false;
}

export function homeShowsBooksShelf(): boolean {
  return false;
}

export function homeShadeFieldCrossing(): typeof SHADE_FIELD_CROSSING {
  return SHADE_FIELD_CROSSING;
}
