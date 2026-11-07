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

/** Request host decides the OAuth redirect, so each public domain can finish sign-in. */
export function productionAuthBase(explicitBaseURL: string) {
  const fallback = explicitBaseURL.replace(/\/$/, "");
  const host = new URL(fallback).host;
  return {
    allowedHosts: [...new Set([host, "waha.hajdah.com", "waha.alhajda.com"])],
    protocol: fallback.startsWith("https://") ? ("https" as const) : ("auto" as const),
    fallback,
  };
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
