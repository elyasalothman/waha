import { isFeatureOn, type FeatureId, type FeatureMap } from "./features.ts";

/** Reviewer / King lock — first screen of واحة OS. */
export const KING_LOCK = {
  hero: "prayer" as const,
  maxPrimaryWells: 4,
  gamesOnFirstScreen: false,
};

export type OsAppId = "weather" | "faith" | "messages" | "settings" | "ask" | "money";

export type OsApp = {
  id: OsAppId;
  feature: FeatureId;
  /** First-screen well. Max four; games never qualify. */
  primary: boolean;
  title: { ar: string; en: string };
  to: string;
  icon: string;
};

export const OS_APPS: OsApp[] = [
  { id: "weather", feature: "weather", primary: true, title: { ar: "طقس", en: "Weather" }, to: "/weather", icon: "CloudSun" },
  { id: "faith", feature: "faith", primary: true, title: { ar: "إيمان", en: "Faith" }, to: "/faith", icon: "Sunrise" },
  { id: "messages", feature: "messages", primary: true, title: { ar: "رسائل", en: "Mail" }, to: "/messages", icon: "Mail" },
  { id: "money", feature: "money", primary: true, title: { ar: "مال", en: "Money" }, to: "/money", icon: "Wallet" },
  { id: "ask", feature: "ask", primary: false, title: { ar: "اسأل", en: "Ask" }, to: "/ask", icon: "Sparkles" },
  { id: "settings", feature: "settings", primary: false, title: { ar: "إعدادات", en: "Settings" }, to: "/settings", icon: "Settings" },
];

export type WellId = "water" | "expense" | "inbox";

export type Well = {
  id: WellId;
  href: string;
  title: { ar: string; en: string };
};

const WELLS: Well[] = [
  { id: "water", href: "/app/water", title: { ar: "الماء", en: "Water" } },
  { id: "expense", href: "/app/budget", title: { ar: "المصروف", en: "Spend" } },
  { id: "inbox", href: "/messages", title: { ar: "صندوق العائلة", en: "Family inbox" } },
];

export type HomeSurface = {
  hero: typeof KING_LOCK.hero;
  wells: Well[];
  primary: OsApp[];
  more: OsApp[];
};

export function composePersonalHome(flags: FeatureMap): HomeSurface {
  const dock = OS_APPS.filter((app) => isFeatureOn(flags, app.feature));
  const primary = dock.filter((app) => app.primary).slice(0, KING_LOCK.maxPrimaryWells);
  const more = dock.filter((app) => !app.primary);
  const wells = WELLS.filter((well) => {
    if (well.id === "inbox") return isFeatureOn(flags, "messages");
    if (well.id === "expense") return isFeatureOn(flags, "money");
    return true;
  }).slice(0, KING_LOCK.maxPrimaryWells);

  return {
    hero: KING_LOCK.hero,
    wells,
    primary,
    more,
  };
}

export function firstScreenIds(surface: HomeSurface): string[] {
  return ["hero:" + surface.hero, ...surface.wells.map((w) => "well:" + w.id), ...surface.primary.map((a) => "dock:" + a.id)];
}

export function assertKingLock(surface: HomeSurface) {
  const games = firstScreenIds(surface).filter((id) => id.includes("game") || id.includes("play"));
  return {
    oneHero: surface.hero === "prayer",
    wellsAtMostFour: surface.wells.length <= KING_LOCK.maxPrimaryWells,
    primaryAtMostFour: surface.primary.length <= KING_LOCK.maxPrimaryWells,
    gamesOffFirstScreen: games.length === 0 && KING_LOCK.gamesOnFirstScreen === false,
  };
}
