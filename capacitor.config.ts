import type { CapacitorConfig } from "@capacitor/cli";

/**
 * واحة iOS shell — house pattern matches تهجد / حصتي / محسن.
 *
 * Load order:
 *   1. CAPACITOR_SERVER_URL or WAHA_IOS_SERVER_URL → live production/preview
 *   2. otherwise bundled `www/` (synced from the Vite client / fallback splash)
 *
 * Elyas has no Mac. `npx cap sync ios` runs on Codemagic (mac_mini_m2).
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
