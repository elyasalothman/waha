/** Open house/sister apps and official portals in SFSafariViewController — not inside WKWebView. */

export type HouseDestinationId = "tahajjud" | "mohsen" | "games" | "hayat";

export type HouseDestination = {
  id: HouseDestinationId;
  ar: string;
  en: string;
  blurbAr: string;
  blurbEn: string;
  href: string;
};

/** بيت الهجدة — روابط خارجية تُفتح عبر Browser، لا داخل قشرة واحة. */
export const HOUSE_DESTINATIONS: readonly HouseDestination[] = [
  {
    id: "tahajjud",
    ar: "تهجد",
    en: "Tahajjud",
    blurbAr: "عبادة",
    blurbEn: "Worship",
    href: "https://tahajjud.alhajda.com/",
  },
  {
    id: "mohsen",
    ar: "محسن",
    en: "Mohsen",
    blurbAr: "محادثة",
    blurbEn: "Chat",
    href: "https://ai.alhajda.com/",
  },
  {
    id: "games",
    ar: "ألعاب",
    en: "Games",
    blurbAr: "لُمعة",
    blurbEn: "Luma",
    href: "https://games.alhajda.com/",
  },
  {
    id: "hayat",
    ar: "حياة",
    en: "Hayat",
    blurbAr: "يومك",
    blurbEn: "Daily",
    href: "https://hayat.alhajda.com/",
  },
];

export function isNativeIos(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } })
    .Capacitor;
  return !!(cap && (cap.isNativePlatform?.() || cap.isNative === true));
}

export function assertHttpsUrl(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    throw new Error("invalid-url");
  }
  if (url.protocol !== "https:") throw new Error("https-only");
  return url.toString();
}

export function isSameOriginHref(href: string, origin = typeof window !== "undefined" ? window.location.origin : ""): boolean {
  if (!origin) return false;
  try {
    return new URL(href, origin).origin === origin;
  } catch {
    return false;
  }
}

export function shouldOpenExternally(href: string, origin = typeof window !== "undefined" ? window.location.origin : ""): boolean {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return false;
  try {
    const url = new URL(href, origin || "https://waha.hajdah.com");
    if (url.protocol !== "https:") return false;
    if (origin && url.origin === origin) return false;
    return true;
  } catch {
    return false;
  }
}

export async function openExternalUrl(href: string): Promise<{ ok: boolean; reason?: string }> {
  let safe: string;
  try {
    safe = assertHttpsUrl(href);
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "invalid-url" };
  }

  if (isNativeIos()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: safe, presentationStyle: "popover" });
    return { ok: true };
  }

  if (typeof window !== "undefined") {
    const opened = window.open(safe, "_blank", "noopener,noreferrer");
    if (opened) opened.opener = null;
    return { ok: true };
  }

  return { ok: false, reason: "no-window" };
}

export function houseDestination(id: HouseDestinationId): HouseDestination {
  const found = HOUSE_DESTINATIONS.find((row) => row.id === id);
  if (!found) throw new Error(`unknown-house:${id}`);
  return found;
}
