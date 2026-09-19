import lockCards from "./maydan-min-alalam-cards-v1.json" with { type: "json" };
import full from "./maydan-min-alalam-seed-v1.json" with { type: "json" };

/** Separate from `waha:square:v1` and the house seed of 48. Static only — no live fetch. */
export const WORLD_STORAGE_KEY = "waha:square:world:v1";
export const WORLD_STAMP = "من العالم · مصدر معلَّم";
export const WORLD_LANE = "من العالم";
export const MIN_WORLD_CARDS = 15;

export type WorldSourceKind = "rss" | "news" | "x";

export type WorldCard = {
  id: string;
  lane: typeof WORLD_LANE;
  sourceKind: WorldSourceKind;
  sourceId: string;
  sourceLabel: string;
  sourceUrl: string;
  titleOrHook: string;
  summary: string;
  visual: string;
  stamp: typeof WORLD_STAMP;
  trusted: boolean;
  topic: string;
  fetchedAt: string;
  relativeTime: string;
  likes: number;
  note?: string;
};

export type WorldSeedFile = {
  version: number;
  title: string;
  lane: string;
  status: string;
  rules: {
    separateFromHouseSeed48: boolean;
    noMixIntoSeedCount: boolean;
    display: string;
    noXScrapingWave1: boolean;
    rssOnlyWave1: boolean;
  };
  sourcesProposed: Array<{
    id: string;
    kind: WorldSourceKind;
    label: string;
    url: string;
    kingApproved: boolean;
  }>;
  cards: WorldCard[];
  meta: { cardCount: number; sourceCount: number };
  implementationLock: {
    prScope: string[];
    noLiveFetch: boolean;
    noX: boolean;
    cardCount: number;
  };
};

export const WORLD_SEED = full as WorldSeedFile;
export const WORLD_LOCK_CARDS = lockCards as WorldCard[];

function isMarkedWorldCard(card: WorldCard): boolean {
  return (
    card.trusted === true &&
    card.lane === WORLD_LANE &&
    card.stamp === WORLD_STAMP &&
    Boolean(card.sourceLabel?.trim()) &&
    /^https:\/\//.test(card.sourceUrl ?? "") &&
    Boolean(card.titleOrHook?.trim()) &&
    Boolean(card.summary?.trim()) &&
    Boolean(card.sourceKind) &&
    Boolean(card.sourceId)
  );
}

/** Approved static cards only. Never hydrated from the network. */
export const WORLD_CARDS: WorldCard[] = (WORLD_SEED.cards.length ? WORLD_SEED.cards : WORLD_LOCK_CARDS).filter(
  isMarkedWorldCard,
);

export function worldCards(): WorldCard[] {
  return WORLD_CARDS;
}

export function worldStripCards(limit = 6): WorldCard[] {
  return WORLD_CARDS.slice(0, limit);
}

const SOURCE_TONE: Record<string, string> = {
  "bbc-ar": "#6aa8a4",
  aitnews: "#8a9298",
  techwd: "#7a8f7a",
  sciencedaily: "#6a7a9a",
  "aj-ar": "#8a8680",
};

export function worldSourceTone(sourceId: string): string {
  return SOURCE_TONE[sourceId] ?? "#7a847c";
}

export function sourceKindLabel(kind: WorldSourceKind, lang: "ar" | "en"): string {
  if (kind === "x") return lang === "ar" ? "إكس" : "X";
  return lang === "ar" ? "خبر" : "News";
}
