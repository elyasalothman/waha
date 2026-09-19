import { CLIP_CARDS, CLIP_IDS } from "./seed.ts";
import { EMPTY_CLIPS, type ClipCard, type ClipsLocalState } from "./types.ts";

export { CLIP_CARDS, CLIP_IDS };

/** Seed order only — no ranking, no shuffle, no recommendations. */
export function listClips(cards: readonly ClipCard[] = CLIP_CARDS): ClipCard[] {
  return [...cards];
}

export function emptyClips(): ClipsLocalState {
  return { version: 1, seededIds: [], seen: [] };
}

export function hydrateClipsState(
  prev: ClipsLocalState | null | undefined,
  seedIds: readonly string[] = CLIP_IDS,
): ClipsLocalState {
  const ids = [...seedIds];
  const allowed = new Set(ids);
  if (!prev || prev.version !== 1) {
    return { version: 1, seededIds: ids, seen: [] };
  }
  return {
    version: 1,
    seededIds: ids,
    seen: prev.seen.filter((id) => allowed.has(id)),
  };
}

export function markSeen(state: ClipsLocalState, id: string): ClipsLocalState {
  if (!state.seededIds.includes(id) || state.seen.includes(id)) return state;
  return { ...state, seen: [...state.seen, id] };
}

export function isSeen(state: ClipsLocalState, id: string): boolean {
  return state.seen.includes(id);
}

export { EMPTY_CLIPS };
