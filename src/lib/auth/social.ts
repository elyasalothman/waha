import { Capacitor } from "@capacitor/core";
import { authClient } from "./client";

/**
 * "Continue with Google / Apple".
 *
 * - Web: a normal full-page redirect (Better Auth social sign-in).
 * - Native app (Capacitor WebView): Google blocks embedded-WebView OAuth, so
 *   the flow runs in the system browser (SFSafariViewController / Custom Tab)
 *   and the session is handed back through `/api/native-auth/*` (see that
 *   route for the protocol). Resolves once the WebView holds the session.
 */
export type SocialProvider = "google" | "apple";

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Passkeys only where WebAuthn is really usable (not inside the app WebView yet). */
export function passkeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !isNativeApp() &&
    typeof window.PublicKeyCredential === "function" &&
    window.isSecureContext
  );
}

function randomHex(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signInSocial(
  provider: SocialProvider,
  opts: { callbackURL: string; errorCallbackURL: string; newUserCallbackURL?: string },
): Promise<void> {
  if (!isNativeApp()) {
    const { data, error } = await authClient.signIn.social({
      provider,
      callbackURL: opts.callbackURL,
      errorCallbackURL: opts.errorCallbackURL,
      newUserCallbackURL: opts.newUserCallbackURL,
    });
    if (error) throw new Error(error.message ?? "Sign-in failed");
    if (data && "url" in data && data.url) window.location.href = data.url;
    return;
  }

  const nonce = randomHex();
  const h = await sha256Hex(nonce);
  const { Browser } = await import("@capacitor/browser");
  const startUrl = `${window.location.origin}/api/native-auth/start?provider=${provider}&h=${h}`;
  let browserClosed = false;
  const listener = await Browser.addListener("browserFinished", () => {
    browserClosed = true;
  });
  await Browser.open({ url: startUrl, presentationStyle: "popover" });

  const claim = async (): Promise<boolean> => {
    const res = await fetch("/api/native-auth/claim", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nonce }),
    });
    return res.status === 200;
  };

  const deadline = Date.now() + 5 * 60 * 1000;
  let closedAt: number | null = null;
  try {
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1200));
      if (await claim().catch(() => false)) {
        try {
          await Browser.close();
        } catch {
          /* already closed */
        }
        await authClient.getSession();
        window.location.href = opts.callbackURL;
        return;
      }
      // After the user closes the sheet, keep checking briefly (the done page
      // may have parked the token just before) and then give up.
      if (browserClosed) {
        closedAt ??= Date.now();
        if (Date.now() - closedAt > 6000) throw new Error("Sign-in was cancelled");
      }
    }
    throw new Error("Sign-in timed out");
  } finally {
    await listener.remove();
  }
}
