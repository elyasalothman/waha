import { useMemo } from "react";
import { usePersistent } from "@/lib/storage";
import { hydrateClipsState, listClips, markSeen } from "./logic.ts";
import { CLIP_CARDS, CLIP_IDS } from "./seed.ts";
import { CLIPS_STORAGE_KEY, type ClipsLocalState } from "./types.ts";

export { CLIPS_STORAGE_KEY };

const INITIAL: ClipsLocalState = {
  version: 1,
  seededIds: [...CLIP_IDS],
  seen: [],
};

export function useClips() {
  const [local, setLocal, ready] = usePersistent<ClipsLocalState>(CLIPS_STORAGE_KEY, INITIAL);

  const clips = useMemo(() => listClips(CLIP_CARDS), []);
  const state = useMemo(() => hydrateClipsState(local, CLIP_IDS), [local]);

  const actions = useMemo(
    () => ({
      markSeen: (id: string) => setLocal((prev) => markSeen(hydrateClipsState(prev, CLIP_IDS), id)),
    }),
    [setLocal],
  );

  return { clips, local: state, ready, ...actions };
}
