import { lazy, Suspense, useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  GalleryVertical,
  ShoppingBag,
  Search,
  LayoutGrid,
  MessageCircle,
  UserRound,
  Home,
  Moon,
  Sun,
} from "lucide-react";
import { ClipsMark, MadarMark, WahaWordmark } from "@/components/brand";
const CommandPalette = lazy(() =>
  import("@/components/command-palette").then((m) => ({ default: m.CommandPalette })),
);
import { LangToggle } from "@/components/city-select";
import { NativeReminders } from "@/components/native-reminders";
import { OfflineBanner } from "@/components/offline-banner";
import { DoorsStrip } from "@/components/doors-strip";
import { t } from "@/lib/i18n";
import { chromeNav, mobileChromeNav } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { Toaster } from "sonner";

const NAV_ICON = {
  "/": Home,
  "/store": ShoppingBag,
  "/ask": MessageCircle,
  "/me": UserRound,
  "/more": LayoutGrid,
} as const;

export function Shell() {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const segment = useAppStore((s) => s.segment);
  const hydrate = useAppStore((s) => s.hydrate);
  const pushRecent = useAppStore((s) => s.pushRecent);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    let active = true;
    void import("@/lib/superapp")
      .then(({ SERVICES }) => {
        if (!active) return;
        const service = SERVICES.find((item) => item.href === pathname);
        if (service) pushRecent(service.id);
      })
      .catch(() => {
        /* Recent history is optional when offline. */
      });
    return () => {
      active = false;
    };
  }, [pathname, pushRecent]);
  const [cmd, setCmd] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      let preference = null;
      try {
        preference = localStorage.getItem("waha:theme");
      } catch {
        /* system default */
      }
      const next = preference ? preference === "dark" : scheme.matches;
      setDark(next);
      document.documentElement.classList.toggle("waha-dark", next);
    };
    apply();
    scheme.addEventListener("change", apply);
    return () => scheme.removeEventListener("change", apply);
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("waha-dark", next);
    try {
      localStorage.setItem("waha:theme", next ? "dark" : "light");
    } catch {
      /* session only */
    }
  };
  useEffect(() => {
    if (cmd) return;
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCmd(true);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, [cmd]);
  const nav = chromeNav(audience, segment);
  const mobileNav = mobileChromeNav(audience, segment);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (["/welcome", "/register"].includes(pathname)) {
    return <Outlet />;
  }

  return (
    <div className="waha-shell min-h-dvh bg-bg text-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-fg focus:outline-2 focus:outline-offset-2"
      >
        {lang === "ar" ? "تجاوز إلى المحتوى" : "Skip to content"}
      </a>
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 border-e border-border bg-surface lg:flex lg:flex-col">
        <div className="px-5 py-6">
          <Link to="/" className="inline-flex">
            <WahaWordmark lang={lang} />
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t(lang, audience === "personal" ? "tagline" : "workTagline")}
          </p>
          {audience === "personal" ? (
            <div className="mt-4">
              <DoorsStrip lang={lang} compact />
            </div>
          ) : null}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((item) => {
            const Icon = NAV_ICON[item.to as keyof typeof NAV_ICON] ?? GalleryVertical;
            const active =
              item.to === "/"
                ? pathname === "/" || pathname === "/today"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                aria-current={active ? "page" : undefined}
                to={item.to === "/" ? "/today" : item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                  active
                    ? "bg-primary text-primary-fg shadow-sm"
                    : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                {item.to === "/madar" ? (
                  <MadarMark className="size-4" />
                ) : item.to === "/clips" ? (
                  <ClipsMark className="size-4" />
                ) : (
                  <Icon className="size-4" strokeWidth={1.75} />
                )}
                {t(lang, item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/me" className="inline-flex min-h-11 items-center gap-2 text-sm">
            <UserRound className="size-4" />
            {t(lang, "me")}
          </Link>
          <LangToggle lang={lang} />
        </div>
      </aside>

      <div className="lg:ps-60">
        <header className="native-safe-top sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/90 px-4 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm lg:pt-0">
          <Link to="/" className="inline-flex min-h-11 shrink-0 items-center lg:hidden">
            <WahaWordmark lang={lang} />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={lang === "ar" ? "تبديل الوضع الداكن" : "Toggle dark mode"}
            aria-pressed={dark}
            className="ms-auto grid size-11 shrink-0 place-items-center rounded-xl border border-border text-primary"
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <button
            type="button"
            onClick={() => setCmd(true)}
            aria-label={t(lang, "search")}
            className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-start text-sm text-muted lg:max-w-md"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate">{t(lang, "search")}</span>
            <kbd className="ms-auto hidden rounded border border-border px-1.5 font-mono text-[10px] text-subtle sm:inline">
              ⌘K
            </kbd>
          </button>
          <div className="lg:hidden">
            <LangToggle lang={lang} />
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="scroll-mt-16 px-4 py-6 pb-24 lg:px-8 lg:pb-10"
        >
          <OfflineBanner lang={lang} />
          {!["/", "/today"].includes(pathname) && (
            <nav
              aria-label="الأخبار والقرآن ومحسن"
              className="mx-auto mb-5 flex max-w-3xl flex-wrap gap-2"
            >
              <Link
                to="/madar"
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm"
              >
                {t(lang, "madar")}
              </Link>
              <Link
                to="/clips"
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm"
              >
                {t(lang, "clips")}
              </Link>
              <Link
                to="/news"
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm"
              >
                الأخبار والبث
              </Link>
              <Link
                to="/quran"
                search={{ surah: 1, ayah: 1 }}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm"
              >
                القرآن الكريم
              </Link>
              <Link
                to="/ask"
                search={{ q: "" }}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm"
              >
                محسن
              </Link>
            </nav>
          )}
          {pathname === "/today" ? <NativeReminders /> : null}
          <Outlet />
        </main>
      </div>

      <nav
        className={cn(
          "native-safe-bottom fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom,0px)] lg:hidden",
          mobileNav.length <= 2
            ? "grid-cols-2"
            : mobileNav.length === 3
              ? "grid-cols-3"
              : mobileNav.length === 5
                ? "grid-cols-5"
                : "grid-cols-4",
        )}
      >
        {mobileNav.map((item) => {
          const Icon = NAV_ICON[item.to as keyof typeof NAV_ICON] ?? GalleryVertical;
          const active =
            item.to === "/"
              ? pathname === "/" || pathname === "/today"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              aria-current={active ? "page" : undefined}
              to={item.to === "/" ? "/today" : item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                active ? "text-fg" : "text-muted",
              )}
            >
              {item.to === "/madar" ? (
                <MadarMark className="size-5" />
              ) : item.to === "/clips" ? (
                <ClipsMark className="size-5" />
              ) : (
                <Icon className="size-5" />
              )}
              {t(lang, item.key)}
            </Link>
          );
        })}
      </nav>

      <Suspense fallback={null}>
        {cmd ? <CommandPalette open={cmd} onOpenChange={setCmd} lang={lang} /> : null}
      </Suspense>
      <Toaster
        theme={dark ? "dark" : "light"}
        position={lang === "ar" ? "bottom-left" : "bottom-right"}
        toastOptions={{
          className: "!bg-surface !text-fg !border-border",
        }}
      />
    </div>
  );
}
