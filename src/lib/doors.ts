import {
  ALHAJDA_SITES_INDEX,
  HOUSE_SITES,
  PRIMARY_LAUNCHER_IDS,
  directoryHouseSites,
  getHouseSite,
  isExternalHouseSite,
  launcherHouseSites,
  primaryLauncherHouseSites,
  type HouseSite,
  type HouseSiteId,
} from "./house-sites.ts";

export { ALHAJDA_SITES_INDEX, PRIMARY_LAUNCHER_IDS };

export type DoorId = HouseSiteId;
export type Door = HouseSite;

/** Same catalog as HOUSE_SITES — do not add a second house list here. */
export const DOORS: readonly Door[] = HOUSE_SITES;

export function getDoor(id: string): Door | undefined {
  return getHouseSite(id);
}

export function launcherDoors(): Door[] {
  return launcherHouseSites();
}

export function directoryDoors(): Door[] {
  return directoryHouseSites();
}

export function primaryLauncherDoors(): Door[] {
  return primaryLauncherHouseSites();
}

export function isExternalDoor(door: Pick<Door, "href">): boolean {
  return isExternalHouseSite(door);
}

/** Same-tab target for a house door. */
export function doorHref(door: Pick<Door, "href">): string {
  return door.href;
}

/** King lock: باب مداد in أبواب opens the `/books` shelf, not the Maydan line. */
export const MIDAD_SHELF_PATH = "/books";

export function doorOpensInternalShelf(door: Pick<Door, "id">): boolean {
  return door.id === "midad";
}

export function doorOpenHref(door: Pick<Door, "id" | "href">): string {
  return doorOpensInternalShelf(door) ? MIDAD_SHELF_PATH : door.href;
}

export function isPrimaryDoor(id: string): boolean {
  return (PRIMARY_LAUNCHER_IDS as readonly string[]).includes(id);
}

export function doorExternalHref(door: Pick<Door, "href">): string | undefined {
  return isExternalDoor(door) ? door.href : undefined;
}
