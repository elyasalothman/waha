import { useEffect } from "react";

function isNativeIos() {
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } })
    .Capacitor;
  return !!(cap && (cap.isNativePlatform?.() || cap.isNative === true));
}

/** Marks html.native-ios and paints the status bar when running inside Capacitor. */
export function NativeIosChrome() {
  useEffect(() => {
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
      void StatusBar.setBackgroundColor?.({ color: "#0c0d0c" });
      void StatusBar.setOverlaysWebView?.({ overlay: true });
    }
    const Keyboard = cap?.Plugins?.Keyboard;
    if (Keyboard) {
      void Keyboard.setStyle?.({ style: "DARK" });
      void Keyboard.setResizeMode?.({ mode: "native" });
    }
  }, []);

  return null;
}
