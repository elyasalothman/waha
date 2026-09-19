import { useSyncExternalStore } from "react";

/** False on the server and during hydration — first paint can show a skeleton. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
