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

  const standalone =
    (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) ||
    (typeof navigator !== "undefined" && navigator.standalone === true);
  if (standalone) {
    root.classList.add("standalone");
    root.setAttribute("data-display", "standalone");
  }

  function applyStatusBar() {
    const Cap = window.Capacitor;
    const StatusBar = Cap?.Plugins?.StatusBar;
    if (!StatusBar) return;
    Promise.resolve(StatusBar.setStyle?.({ style: "DARK" })).catch(() => {});
    Promise.resolve(StatusBar.setBackgroundColor?.({ color: "#141311" })).catch(() => {});
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
