/** Visible, online headline refresh. Not a background fetch while the app is closed. */
export const NEWS_POLL_MS = 120_000;
export const NEWS_STALE_MS = 90_000;
export const NEWS_BACKOFF_CAP_MS = 600_000;

export function newsPollDelay(failures: number, hidden: boolean, online: boolean): number | null {
  if (hidden || !online) return null;
  const steps = Math.min(Math.max(0, failures), 4);
  return Math.min(NEWS_POLL_MS * 2 ** steps, NEWS_BACKOFF_CAP_MS);
}

export function newsIsStale(lastSuccessAt: number | null, now: number): boolean {
  if (lastSuccessAt == null) return true;
  return now - lastSuccessAt >= NEWS_STALE_MS;
}
