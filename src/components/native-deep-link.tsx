import { useEffect } from "react";
import { deepLinkPath } from "@/lib/deep-link";

function isNative() {
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } }).Capacitor;
  return !!(cap && (cap.isNativePlatform?.() || cap.isNative === true));
}

/** Opens waha:// links (iOS Shortcuts, Android automations) on the matching in-app page. */
export function NativeDeepLink() {
  useEffect(() => {
    if (!isNative()) return;
    let remove: (() => void) | null = null;
    let cancelled = false;
    void import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("appUrlOpen", ({ url }) => {
          const path = deepLinkPath(url);
          // A full load so the page reads the fragment on mount.
          if (path) window.location.assign(`${window.location.origin}${path}`);
        }),
      )
      .then((handle) => {
        if (cancelled) void handle.remove();
        else remove = () => void handle.remove();
      })
      .catch(() => {
        /* plugin missing on this build */
      });
    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
  return null;
}
