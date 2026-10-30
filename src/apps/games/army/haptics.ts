/** Haptics: Capacitor Haptics inside the iOS/Android app, navigator.vibrate on the web. */
import { Capacitor } from "@capacitor/core";

type Style = "light" | "medium" | "heavy";
let last = 0;
let plugin: null | { impact: (o: { style: string }) => Promise<void> } = null;
let tried = false;

async function load() {
  if (tried) return plugin;
  tried = true;
  try {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Haptics")) {
      const m = await import("@capacitor/haptics");
      plugin = {
        impact: (o) => m.Haptics.impact({ style: o.style.toUpperCase() as never }),
      };
    }
  } catch {
    plugin = null;
  }
  return plugin;
}

export function buzz(style: Style = "light", gapMs = 60) {
  const now = performance.now();
  if (now - last < gapMs) return;
  last = now;
  void load().then((p) => {
    if (p) {
      void p.impact({ style }).catch(() => {});
    } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(style === "heavy" ? 40 : style === "medium" ? 22 : 10);
      } catch {
        /* ignore */
      }
    }
  });
}
