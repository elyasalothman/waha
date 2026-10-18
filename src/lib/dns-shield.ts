/** درع الإعلانات — DNS الهجدة المشفّر (DoH) على dns.alhajda.com. */
export const SHIELD_HOST = "dns.alhajda.com";
export const SHIELD_DOH_URL = `https://${SHIELD_HOST}/dns-query`;
export const SHIELD_PAGE_URL = `https://${SHIELD_HOST}/`;
export const SHIELD_PROFILE_URL = `https://${SHIELD_HOST}/alhajda-dns.mobileconfig`;
export const SHIELD_FAMILY_PROFILE_URL = `https://${SHIELD_HOST}/alhajda-dns-family.mobileconfig`;
/** Public host that only the shield blocks: unreachable ⇒ the shield is active. */
export const SHIELD_CANARY_URL = "https://shield-test.alhajda.com/";

export type ShieldPlatform =
  | "ios-native" // Waha iOS app (Capacitor)
  | "ios-safari" // Safari tab: can install the profile directly
  | "ios-other" // home-screen PWA or another iOS browser/in-app view: must hand off to Safari
  | "mac-safari"
  | "desktop"
  | "android";

export function detectShieldPlatform(
  ua: string,
  opts: { maxTouchPoints?: number; standalone?: boolean; native?: boolean } = {},
): ShieldPlatform {
  const iPadOS = /Macintosh/.test(ua) && (opts.maxTouchPoints ?? 0) > 1;
  const ios = /iPhone|iPad|iPod/.test(ua) || iPadOS;
  if (ios) {
    if (opts.native) return "ios-native";
    const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Snapchat|Line\/|Twitter/.test(ua);
    if (opts.standalone || otherBrowser || !/Safari\//.test(ua)) return "ios-other";
    return "ios-safari";
  }
  if (/Android/.test(ua)) return "android";
  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\/|Firefox/.test(ua))
    return "mac-safari";
  return "desktop";
}

/** The link the big «فعّل الحماية» button opens. Profiles only install from Safari, so
 *  everywhere else on iOS we hand off with the x-safari-https scheme (iOS 17+). */
export function profileOpenHref(platform: ShieldPlatform, family = false): string {
  const url = family ? SHIELD_FAMILY_PROFILE_URL : SHIELD_PROFILE_URL;
  if (platform === "ios-native" || platform === "ios-other")
    return url.replace(/^https:\/\//, "x-safari-https://");
  return url;
}

export type ShieldStatus = "active" | "inactive" | "unknown";

/** Probe the canary. Network error (DNS answered 0.0.0.0) ⇒ active. Offline ⇒ unknown. */
export async function probeShield(
  fetchImpl: typeof fetch = fetch,
  online = typeof navigator === "undefined" ? true : navigator.onLine !== false,
  timeoutMs = 5000,
): Promise<ShieldStatus> {
  if (!online) return "unknown";
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${SHIELD_CANARY_URL}?t=${Date.now()}`, {
      cache: "no-store",
      signal: ctl.signal,
    });
    return res.ok ? "inactive" : "unknown";
  } catch {
    return "active";
  } finally {
    clearTimeout(timer);
  }
}

/** Ask the shield whether a domain is on its blocklist (verdict only, no DNS lookup). */
export async function checkDomain(
  name: string,
  fetchImpl: typeof fetch = fetch,
): Promise<"block" | "allow"> {
  const clean = name.trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0];
  if (!/^[a-z0-9.-]{1,253}$/.test(clean) || !clean.includes(".")) throw new Error("bad-domain");
  const res = await fetchImpl(`https://${SHIELD_HOST}/check?name=${encodeURIComponent(clean)}`);
  if (!res.ok) throw new Error("check-failed");
  const json = (await res.json()) as { verdict?: string };
  return json.verdict === "block" ? "block" : "allow";
}
