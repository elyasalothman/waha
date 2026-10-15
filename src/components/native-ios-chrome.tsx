import { useEffect } from "react";
import { openExternalUrl, shouldOpenExternally } from "@/lib/native-browser";

function isNativeIos() {
  const cap = (
    window as Window & { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } }
  ).Capacitor;
  return !!(cap && (cap.isNativePlatform?.() || cap.isNative === true));
}

function closestAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("a");
}

/** Marks html.native-ios, paints the status bar, and routes https exits (house → in-app WKWebView). */
export function NativeIosChrome() {
  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      document.documentElement.classList.add("standalone");
      document.documentElement.setAttribute("data-display", "standalone");
    }

    if (!isNativeIos()) return;
    document.documentElement.classList.add("native-ios");
    document.documentElement.setAttribute("data-native", "ios");

    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncAppearance = () => {
      document.documentElement.classList.toggle("native-dark", scheme.matches);
      void Promise.all([import("@capacitor/status-bar"), import("@capacitor/keyboard")])
        .then(([{ StatusBar, Style }, { Keyboard, KeyboardStyle, KeyboardResize }]) =>
          Promise.allSettled([
            StatusBar.setStyle({ style: scheme.matches ? Style.Dark : Style.Light }),
            StatusBar.setOverlaysWebView({ overlay: true }),
            Keyboard.setStyle({ style: scheme.matches ? KeyboardStyle.Dark : KeyboardStyle.Light }),
            Keyboard.setResizeMode({ mode: KeyboardResize.Native }),
          ]),
        )
        .catch(() => {});
    };
    syncAppearance();
    scheme.addEventListener("change", syncAppearance);

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const anchor = closestAnchor(event.target);
      if (!anchor) return;
      if (anchor.closest(".native-safe-bottom")) {
        void import("@/lib/house-door-browser")
          .then(({ HouseDoorBrowser }) => HouseDoorBrowser.selection())
          .catch(() => {});
      }
      const href = anchor.getAttribute("href");
      if (!href || !shouldOpenExternally(href)) return;
      event.preventDefault();
      event.stopPropagation();
      void openExternalUrl(anchor.href || href);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      scheme.removeEventListener("change", syncAppearance);
    };
  }, []);

  return null;
}
