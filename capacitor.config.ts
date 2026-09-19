import type { CapacitorConfig } from "@capacitor/cli";

/**
 * واحة iOS — R&D lock (store product).
 *
 * 1. Capacitor WKWebView is the App Store app. A2HS / PWA is not the product.
 * 2. viewport-fit=cover + env(safe-area-inset-*) top/bottom on chrome.
 * 3. StatusBar overlays the WebView; Keyboard.resize is `native`.
 * 4. Arabic RTL keyboard must be verified on device before any ASC Submit.
 * 5. Not a thin website wrap — native salah LocalNotifications (UNUserNotificationCenter).
 *
 * Load order:
 *   1. CAPACITOR_SERVER_URL or WAHA_IOS_SERVER_URL → live production/preview
 *   2. otherwise bundled `www/`
 */
const REMOTE_URL = (
  process.env.CAPACITOR_SERVER_URL ||
  process.env.WAHA_IOS_SERVER_URL ||
  ""
).trim();

const PRODUCTION_HOST = "waha.alhajda.com";

const config: CapacitorConfig = {
  appId: "com.alhajda.waha",
  appName: "واحة",
  webDir: "www",
  backgroundColor: "#0c0d0c",
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    scheme: "Waha",
    zoomEnabled: false,
    backgroundColor: "#0c0d0c",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c0d0c",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      iconColor: "#c5d0c4",
    },
  },
  server: {
    androidScheme: "https",
    cleartext: false,
    allowNavigation: [
      PRODUCTION_HOST,
      "alhajda.com",
      "*.alhajda.com",
      "hajdah.com",
      "*.hajdah.com",
      "*.vercel.app",
    ],
    ...(REMOTE_URL ? { url: REMOTE_URL } : {}),
  },
};

export default config;
