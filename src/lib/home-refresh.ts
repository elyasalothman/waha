/** How often a visible home re-reads its sources. Nothing runs while the page is hidden. */
export const HOME_REFRESH_MS = 120_000;

export function shouldRefreshHome(hidden: boolean, online: boolean, needsNetwork: boolean): boolean {
  if (hidden) return false;
  if (needsNetwork && !online) return false;
  return true;
}

/** Re-read on show, on reconnect, and on a timer while the document stays visible. */
export function subscribeHomeRefresh(run: () => void, needsNetwork = false): () => void {
  const tick = () => {
    if (!shouldRefreshHome(document.visibilityState === "hidden", navigator.onLine, needsNetwork)) return;
    run();
  };
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("online", tick);
  const timer = window.setInterval(tick, HOME_REFRESH_MS);
  return () => {
    document.removeEventListener("visibilitychange", tick);
    window.removeEventListener("online", tick);
    window.clearInterval(timer);
  };
}
