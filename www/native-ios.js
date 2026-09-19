/**
 * Capacitor iOS chrome: status bar + safe-area class.
 * Safe to load on the web — no-ops when Capacitor is absent.
 */
(function bootNativeIos() {
  const root = document.documentElement;
  const isNative =
    typeof window !== "undefined" &&
    !!(window.Capacitor && (window.Capacitor.isNativePlatform?.() || window.Capacitor.isNative === true));

  if (isNative) {
    root.classList.add("native-ios");
    root.setAttribute("data-native", "ios");
  }

  function applyStatusBar() {
    const Cap = window.Capacitor;
    const StatusBar = Cap?.Plugins?.StatusBar;
    if (!StatusBar) return;
    Promise.resolve(StatusBar.setStyle?.({ style: "DARK" })).catch(() => {});
    Promise.resolve(StatusBar.setBackgroundColor?.({ color: "#0c0d0c" })).catch(() => {});
    Promise.resolve(StatusBar.setOverlaysWebView?.({ overlay: true })).catch(() => {});
    const Keyboard = Cap?.Plugins?.Keyboard;
    if (Keyboard) {
      Promise.resolve(Keyboard.setStyle?.({ style: "DARK" })).catch(() => {});
      Promise.resolve(Keyboard.setResizeMode?.({ mode: "native" })).catch(() => {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyStatusBar, { once: true });
  } else {
    applyStatusBar();
  }
})();
