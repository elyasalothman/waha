export const WATCHLIST_KEY = "waha:company-watchlist:v1";
export function parseWatchlist(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0 && item.length <= 80),
      ),
    ].slice(0, 20);
  } catch {
    return [];
  }
}
