import { useMemo } from "react";
import { usePersistent } from "@/lib/storage";
import { hydrateXState, listXCards } from "./logic.ts";
import { X_CARDS, X_IDS } from "./seed.ts";
import { X_STORAGE_KEY, type XLocalState } from "./types.ts";

export { X_STORAGE_KEY };

const INITIAL: XLocalState = {
  version: 1,
  seededIds: [...X_IDS],
};

export function useX() {
  const [local, , ready] = usePersistent<XLocalState>(X_STORAGE_KEY, INITIAL);

  const cards = useMemo(() => listXCards(X_CARDS), []);
  const state = useMemo(() => hydrateXState(local, X_IDS), [local]);

  return { cards, local: state, ready };
}
