import { X_CARDS, X_IDS } from "./seed.ts";
import { EMPTY_X, type XCard, type XLocalState } from "./types.ts";

export { X_CARDS, X_IDS };

/** Seed order only — no ranking, no shuffle, no recommendations. */
export function listXCards(cards: readonly XCard[] = X_CARDS): XCard[] {
  return [...cards];
}

export function emptyX(): XLocalState {
  return { version: 1, seededIds: [] };
}

export function hydrateXState(
  prev: XLocalState | null | undefined,
  seedIds: readonly string[] = X_IDS,
): XLocalState {
  const ids = [...seedIds];
  if (!prev || prev.version !== 1) {
    return { version: 1, seededIds: ids };
  }
  return { version: 1, seededIds: ids };
}

export { EMPTY_X };
