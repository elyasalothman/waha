import { primaryLauncherDoors, type Door } from "../doors.ts";
import type { FeedItem, SeedPost, SquareAccount } from "./types.ts";

/**
 * Soft money for the Square (قسم الإنسان).
 *
 * Probed 2026-09-19: Tahajjud has no /tip /donate /support page (404).
 * Hajdah/Alhajda has a contact page, not a tip checkout.
 * Until a live tip exists, the local path is an honest «قريباً».
 */
export const LIVE_TIP_HREF: string | null = null;

export const HOUSE_SUPPORT_CONTACT_HREF = "https://alhajda.com/support";
export const HOUSE_SUPPORT_EMAIL = "support@alhajda.com";

export const SUPPORT_CARD_STORAGE_KEY = "waha:square:support-card:v1";

export const HOUSE_VALUE_DOOR_IDS = ["tahajjud", "midad"] as const;

export type HouseValueDoorId = (typeof HOUSE_VALUE_DOOR_IDS)[number];

export type SupportPath =
  | { kind: "live"; href: string }
  | { kind: "coming-soon"; contactHref: string; email: string };

const SPAM_MARKERS = [
  "اشتر الآن",
  "عرض محدود",
  "خصم",
  "sponsored",
  "buy now",
  "advert",
  "adsense",
  "doubleclick",
] as const;

const VALUE_HREFS = [
  "https://tahajjud.alhajda.com",
  "https://midad.alhajda.com/library",
] as const;

export function resolveSupportPath(tipHref: string | null = LIVE_TIP_HREF): SupportPath {
  const href = tipHref?.trim() ?? "";
  if (/^https:\/\//i.test(href)) {
    return { kind: "live", href };
  }
  return {
    kind: "coming-soon",
    contactHref: HOUSE_SUPPORT_CONTACT_HREF,
    email: HOUSE_SUPPORT_EMAIL,
  };
}

export function claimsLivePayment(path: SupportPath = resolveSupportPath()): boolean {
  return path.kind === "live";
}

export function houseProductDoors(): Door[] {
  return primaryLauncherDoors();
}

export function isHouseValueDoorId(id: string | undefined): id is HouseValueDoorId {
  return id === "tahajjud" || id === "midad";
}

export function isHouseValueAccount(author: Pick<SquareAccount, "kind" | "href">): boolean {
  return author.kind === "house" && VALUE_HREFS.some((href) => href === author.href);
}

export function isHouseValueDoorItem(item: Pick<FeedItem, "author">): boolean {
  return isHouseValueAccount(item.author);
}

export function seedHouseValueDoorCount(posts: SeedPost[], accounts: Array<Pick<SquareAccount, "handle" | "kind" | "href">>): number {
  const valued = new Set(accounts.filter(isHouseValueAccount).map((a) => a.handle));
  return posts.filter((post) => valued.has(post.handle)).length;
}

export function copyLooksLikeSpam(text: string): boolean {
  const blob = text.toLowerCase();
  return SPAM_MARKERS.some((marker) => blob.includes(marker.toLowerCase()));
}

export function seedCopyIsCalm(posts: SeedPost[]): boolean {
  const blob = posts.map((p) => p.text).join("\n");
  return !copyLooksLikeSpam(blob);
}
