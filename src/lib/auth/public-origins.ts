/** Public Waha origins. Sessions are per host; cookies are not shared between them. */
export const WAHA_PUBLIC_ORIGINS = ["https://waha.hajdah.com", "https://waha.alhajda.com"] as const;

export const GOOGLE_CALLBACK_PATH = "/api/auth/callback/google";
export const APPLE_CALLBACK_PATH = "/api/auth/callback/apple";

/** iOS bundle id from capacitor.config.ts. This is not the Apple Services ID. */
export const IOS_BUNDLE_ID = "com.alhajda.waha";

/** HTTPS handoff used by the system browser. No custom URL scheme is required. */
export const NATIVE_AUTH_PATHS = [
  "/api/native-auth/start",
  "/api/native-auth/done",
  "/api/native-auth/claim",
] as const;

export function oauthCallbackUrls(origins: readonly string[] = WAHA_PUBLIC_ORIGINS): string[] {
  return origins.flatMap((origin) => [
    `${origin}${GOOGLE_CALLBACK_PATH}`,
    `${origin}${APPLE_CALLBACK_PATH}`,
  ]);
}

/** The provider apps already accept this origin. The other public host must not mint its own redirect_uri. */
export const CANONICAL_OAUTH_ORIGIN = "https://waha.hajdah.com";

/**
 * OAuth redirect_uri follows the configured base URL, not the browser host.
 * A dynamic host list made waha.alhajda.com send a callback the providers reject.
 */
export function productionAuthBase(explicitBaseURL: string) {
  return explicitBaseURL.replace(/\/$/, "");
}

/** Leave the other public host before OAuth so state, PKCE, and the callback share one origin. */
export function oauthHandoffUrl(currentOrigin: string, provider: "google" | "apple"): string | null {
  if (currentOrigin !== "https://waha.alhajda.com") return null;
  return `${CANONICAL_OAUTH_ORIGIN}/me?start=${provider}`;
}

/** Continue a handoff only when this page is the canonical origin and the previous page was the other Waha host. */
export function oauthHandoffProvider(origin: string, search: string, referrer: string): "google" | "apple" | null {
  if (origin !== CANONICAL_OAUTH_ORIGIN) return null;
  if (!referrer.startsWith("https://waha.alhajda.com/")) return null;
  const start = new URLSearchParams(search).get("start");
  if (start === "google" || start === "apple") return start;
  return null;
}

export function productionTrustedOrigins(explicitBaseURL: string, localOrigins: readonly string[]): string[] {
  return [
    ...new Set([
      explicitBaseURL.replace(/\/$/, ""),
      ...WAHA_PUBLIC_ORIGINS,
      "https://appleid.apple.com",
      ...localOrigins,
    ]),
  ];
}
