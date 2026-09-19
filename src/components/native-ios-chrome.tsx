import { useEffect } from "react";
import { openExternalUrl, shouldOpenExternally } from "@/lib/native-browser";
import { PALETTE } from "@/lib/palette";

function isNativeIos() {
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } })
    .Capacitor;
  return !!(cap && (cap.isNativePlatform?.() || cap.isNative === true));
}

function closestAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("a");
}

/** Marks html.native-ios, paints the status bar, and opens https exits via Browser. */
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

    const cap = (window as Window & { Capacitor?: { Plugins?: {
      StatusBar?: {
        setStyle?: (opts: { style: string }) => Promise<void>;
        setBackgroundColor?: (opts: { color: string }) => Promise<void>;
        setOverlaysWebView?: (opts: { overlay: boolean }) => Promise<void>;
      };
      Keyboard?: {
        setStyle?: (opts: { style: string }) => Promise<void>;
        setResizeMode?: (opts: { mode: string }) => Promise<void>;
      };
    } } }).Capacitor;
    const StatusBar = cap?.Plugins?.StatusBar;
    if (StatusBar) {
      void StatusBar.setStyle?.({ style: "DARK" });
      void StatusBar.setBackgroundColor?.({ color: PALETTE.bg });
      void StatusBar.setOverlaysWebView?.({ overlay: true });
    }
    const Keyboard = cap?.Plugins?.Keyboard;
    if (Keyboard) {
      void Keyboard.setStyle?.({ style: "DARK" });
      void Keyboard.setResizeMode?.({ mode: "native" });
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const anchor = closestAnchor(event.target);
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !shouldOpenExternally(href)) return;
      event.preventDefault();
      event.stopPropagation();
      void openExternalUrl(anchor.href || href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
