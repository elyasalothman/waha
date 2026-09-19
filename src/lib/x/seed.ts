import lockCards from "./maydan-x-cards-v1.json" with { type: "json" };
import full from "./maydan-x-seed-v1.json" with { type: "json" };
import { X_LANE, X_SEED_COUNT, X_STAMP, type XCard } from "./types.ts";

export type XSeedFile = {
  version: number;
  title: string;
  status: string;
  createdAt: string;
  displayLock: {
    place: string;
    separateTabWave1: boolean;
    stamp: string;
    show: string[];
    forbid: string[];
  };
  cadence: {
    pollMinutes: number[];
    cardsPerCycle: number[];
    stripCap: number;
  };
  method: string;
  whitelistRef: string;
  cardCount: number;
  cards: XCard[];
  updatedAt: string;
  kingLock: {
    approvedAt: string;
    note: string;
    replaced: {
      id: string;
      old: string;
      new: string;
      sourceUrl: string;
    };
  };
};

export const X_SEED = full as XSeedFile;
export const X_LOCK_CARDS = lockCards as XCard[];

function isMarkedXCard(card: XCard): boolean {
  return (
    card.trusted === true &&
    card.notHouseSeed === true &&
    card.lane === X_LANE &&
    card.stamp === X_STAMP &&
    card.counters === null &&
    card.sourceKind === "x-public-oembed" &&
    Boolean(card.text?.trim()) &&
    Boolean(card.authorName?.trim()) &&
    Boolean(card.authorHandle?.trim()) &&
    /^https:\/\/x\.com\//.test(card.sourceUrl ?? "")
  );
}

/** Approved static cards only. Never hydrated from the network. */
export const X_CARDS: XCard[] = (X_SEED.cards.length ? X_SEED.cards : X_LOCK_CARDS).filter(isMarkedXCard);

export const X_IDS = X_CARDS.map((card) => card.id);

export function xCards(): XCard[] {
  return X_CARDS;
}

export function xStripCards(limit = X_SEED.cadence.stripCap): XCard[] {
  return X_CARDS.slice(0, Math.min(limit, X_CARDS.length));
}

export { X_SEED_COUNT };
