/**
 * Native exits from واحة.
 *
 * House / sister https doors (مداد، تهجد، مواقعنا، محسن، ألعاب/لُمعة، حياة)
 * open in a first-party in-app WKWebView with Arabic chrome
 * (title + زر «رجوع لواحة») — never Safari / SFSafariViewController /
 * `@capacitor/browser`.
 *
 * مداد library URLs from the Square door equivalent and from `/books`
 * stay on this in-app path. True external (gov) portals still use
 * `@capacitor/browser` on iOS.
 */

import type { HouseDoorOpenOptions } from "./house-door-browser.ts";
import { HOUSE_SITES } from "./house-sites.ts";
import { t } from "./i18n.ts";

export type HouseDestinationId = "midad" | "tahajjud" | "mohsen" | "games" | "hayat";

export type HouseDestination = {
  id: HouseDestinationId;
  ar: string;
  en: string;
  blurbAr: string;
  blurbEn: string;
  href: string;
};

export type NativeOpenPath = "inapp-webview" | "system-browser" | "web-tab";

export type NativeOpenResult = { ok: boolean; reason?: string; path?: NativeOpenPath };

export type NativeOpenDeps = {
  isNativeIos?: () => boolean;
  openInAppWebView?: (options: HouseDoorOpenOptions) => Promise<void>;
  openSystemBrowser?: (url: string) => Promise<void>;
  openWebTab?: (url: string) => boolean;
};

/** بيت الهجدة — تُفتح داخل قشرة واحة عبر WKWebView، لا سفاري. */
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
    id: "midad",
    ar: "مداد",
    en: "Midad",
    blurbAr: "قراءة",
    blurbEn: "Reading",
    href: "https://midad.alhajda.com/library",
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

/** Apex + every *.alhajda.com house / sister product, including مداد and لُمعة. */
export function isHouseDoorHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return host === "alhajda.com" || host.endsWith(".alhajda.com");
}

export function isHouseDoorUrl(href: string, origin = typeof window !== "undefined" ? window.location.origin : ""): boolean {
  try {
    const url = new URL(href, origin || "https://waha.hajdah.com");
    if (url.protocol !== "https:") return false;
    return isHouseDoorHost(url.hostname);
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

export function resolveNativeOpenPath(href: string, origin = typeof window !== "undefined" ? window.location.origin : ""): NativeOpenPath {
  return isHouseDoorUrl(href, origin) ? "inapp-webview" : "system-browser";
}

export function houseChromeLang(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  if (document.documentElement.lang === "en") return "en";
  if (document.documentElement.dir === "ltr") return "en";
  return "ar";
}

export function houseDoorChrome(href: string, lang: "ar" | "en" = "ar"): HouseDoorOpenOptions {
  const closeLabel = t(lang, "backToWaha");
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { url: href, title: lang === "ar" ? "باب البيت" : "House door", closeLabel };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const site = HOUSE_SITES.find((row) => row.host === host);
  if (site) {
    return { url: url.toString(), title: site.title[lang], closeLabel };
  }
  const dest = HOUSE_DESTINATIONS.find((row) => {
    try {
      return new URL(row.href).hostname.replace(/^www\./, "").toLowerCase() === host;
    } catch {
      return false;
    }
  });
  if (dest) {
    return { url: url.toString(), title: lang === "ar" ? dest.ar : dest.en, closeLabel };
  }
  if (host === "midad.alhajda.com") {
    return { url: url.toString(), title: lang === "ar" ? "مداد" : "Midad", closeLabel };
  }
  if (host === "luma.alhajda.com") {
    return { url: url.toString(), title: lang === "ar" ? "لُمعة" : "Luma", closeLabel };
  }
  return { url: url.toString(), title: host || (lang === "ar" ? "باب البيت" : "House door"), closeLabel };
}

async function defaultOpenInAppWebView(options: HouseDoorOpenOptions): Promise<void> {
  const { HouseDoorBrowser } = await import("./house-door-browser.ts");
  await HouseDoorBrowser.open(options);
}

async function defaultOpenSystemBrowser(url: string): Promise<void> {
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url, presentationStyle: "popover" });
}

function defaultOpenWebTab(url: string): boolean {
  if (typeof window === "undefined") return false;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) opened.opener = null;
  return true;
}

/** Always the in-app WKWebView path — house doors must not call Browser.open. */
export async function openHouseDoor(href: string, deps: NativeOpenDeps = {}): Promise<NativeOpenResult> {
  let safe: string;
  try {
    safe = assertHttpsUrl(href);
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "invalid-url" };
  }

  const native = deps.isNativeIos ?? isNativeIos;
  const chrome = houseDoorChrome(safe, houseChromeLang());
  chrome.url = safe;

  if (native()) {
    const openInApp = deps.openInAppWebView ?? defaultOpenInAppWebView;
    await openInApp(chrome);
    return { ok: true, path: "inapp-webview" };
  }

  const opened = (deps.openWebTab ?? defaultOpenWebTab)(safe);
  return opened ? { ok: true, path: "web-tab" } : { ok: false, reason: "no-window" };
}

export async function openExternalUrl(href: string, deps: NativeOpenDeps = {}): Promise<NativeOpenResult> {
  let safe: string;
  try {
    safe = assertHttpsUrl(href);
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "invalid-url" };
  }

  const native = deps.isNativeIos ?? isNativeIos;
  if (native()) {
    if (resolveNativeOpenPath(safe) === "inapp-webview") {
      return openHouseDoor(safe, deps);
    }
    const openSafari = deps.openSystemBrowser ?? defaultOpenSystemBrowser;
    await openSafari(safe);
    return { ok: true, path: "system-browser" };
  }

  const opened = (deps.openWebTab ?? defaultOpenWebTab)(safe);
  return opened ? { ok: true, path: "web-tab" } : { ok: false, reason: "no-window" };
}

export function houseDestination(id: HouseDestinationId): HouseDestination {
  const found = HOUSE_DESTINATIONS.find((row) => row.id === id);
  if (!found) throw new Error(`unknown-house:${id}`);
  return found;
}
