import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { NativeIosChrome } from "@/components/native-ios-chrome";
import { Shell } from "@/components/layout/shell";
import { useAppStore } from "@/store/app-store";
import { PwaRegistration } from "@/components/pwa-registration";
import appCss from "../styles.css?url";

const APP_NAME = "واحة · Waha";
const PWA_NAME = "واحة";

// Cloudflare Web Analytics (free, cookie-less). Loads only on the production host.
const cfWebAnalytics =
  '(function(){if(location.hostname!=="waha.hajdah.com")return;var s=document.createElement("script");s.defer=true;s.src="https://static.cloudflareinsights.com/beacon.min.js";s.setAttribute("data-cf-beacon",\'{"token":"225785b6d91548eba8ce3b39fd3d14af","spa":true}\');document.head.appendChild(s);})();';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: APP_NAME },
      { name: "description", content: "واحتك الرقمية — صلاة، أسماء، ضريبة، بلوت، وأدوات يومك" },
      { name: "application-name", content: PWA_NAME },
      { name: "apple-mobile-web-app-title", content: PWA_NAME },
      { name: "theme-color", content: "#f6f5f0" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-180.png" },
      {
        rel: "preload",
        href: "/fonts/ibm-plex-sans-arabic-400.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/amiri-400.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const lang = useAppStore((s) => s.lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <html
      lang={lang}
      dir={dir}
      className="antialiased"
      data-palette="waha-daylight"
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: cfWebAnalytics }} />
      </head>
      <body className="bg-bg text-fg">
        <PwaRegistration />
        <NativeIosChrome />
        <PreviewHostBridge />
        <AuthProvider>
          <Shell />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
