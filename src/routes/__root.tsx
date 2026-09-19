import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { NativeIosChrome } from "@/components/native-ios-chrome";
import { Shell } from "@/components/layout/shell";
import { useAppStore } from "@/store/app-store";
import appCss from "../styles.css?url";

const APP_NAME = "واحة · Waha";
const PWA_NAME = "واحة";

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
      { name: "theme-color", content: "#141311" },
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
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const lang = useAppStore((s) => s.lang);
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <html lang={lang} dir={dir} className="antialiased" data-palette="waha-hearth-night" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
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
