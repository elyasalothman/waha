import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { GalleryVertical, PanelsTopLeft, Search, Sparkles, Sun, Wallet, Wrench } from "lucide-react";
import { MadarMark, WahaWordmark } from "@/components/brand";
import { CommandPalette } from "@/components/command-palette";
import { AudienceSwitch } from "@/components/audience-switch";
import { LangToggle } from "@/components/city-select";
import { OfflineBanner } from "@/components/offline-banner";
import { DoorsStrip } from "@/components/doors-strip";
import { t } from "@/lib/i18n";
import { chromeNav, mobileChromeNav } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { Toaster } from "sonner";

const NAV_ICON = {
  "/": GalleryVertical,
  "/life": Sun,
  "/money": Wallet,
  "/tools": Wrench,
  "/studio": Sparkles,
  "/workspace": PanelsTopLeft,
} as const;

export function Shell() {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const hydrate = useAppStore((s) => s.hydrate);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [cmd, setCmd] = useState(false);
  const nav = chromeNav(audience);
  const mobileNav = mobileChromeNav(audience);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 border-e border-border bg-bg lg:flex lg:flex-col">
        <div className="px-5 py-6">
          <Link to="/" className="inline-flex">
            <WahaWordmark lang={lang} />
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t(lang, audience === "personal" ? "tagline" : "workTagline")}
          </p>
          <div className="mt-4">
            <AudienceSwitch />
          </div>
          {audience === "personal" ? (
            <div className="mt-4">
              <DoorsStrip lang={lang} compact />
            </div>
          ) : null}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((item) => {
            const Icon = NAV_ICON[item.to as keyof typeof NAV_ICON] ?? GalleryVertical;
            const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                  active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                {item.to === "/madar" ? (
                  <MadarMark className="size-4" />
                ) : (
                  <Icon className="size-4" strokeWidth={1.75} />
                )}
                {t(lang, item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between px-4 py-4">
          <LangToggle lang={lang} />
        </div>
      </aside>

      <div className="lg:ps-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur-sm">
          <Link to="/" className="lg:hidden">
            <WahaWordmark lang={lang} />
          </Link>
          <Link
            to="/madar"
            className={cn(
              "ms-auto flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-primary hover:bg-surface-2",
              pathname === "/madar" && "bg-surface-2",
            )}
            aria-label={t(lang, "madar")}
            title={t(lang, "madar")}
          >
            <MadarMark className="size-5" />
          </Link>
          <button
            type="button"
            onClick={() => setCmd(true)}
            className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-start text-sm text-muted lg:max-w-md"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate">{t(lang, "search")}</span>
            <kbd className="ms-auto hidden rounded border border-border px-1.5 font-mono text-[10px] text-subtle sm:inline">
              ⌘K
            </kbd>
          </button>
          <div className="hidden sm:block lg:hidden">
            <AudienceSwitch compact />
          </div>
          <div className="lg:hidden">
            <LangToggle lang={lang} />
          </div>
        </header>

        <div className="border-b border-border px-4 py-2 sm:hidden">
          <AudienceSwitch />
        </div>

        <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-10">
          <OfflineBanner lang={lang} />
          <Outlet />
        </main>
      </div>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] lg:hidden",
          mobileNav.length === 5 ? "grid-cols-5" : "grid-cols-4",
        )}
      >
        {mobileNav.map((item) => {
          const Icon = NAV_ICON[item.to as keyof typeof NAV_ICON] ?? GalleryVertical;
          const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                active ? "text-fg" : "text-muted",
              )}
            >
              <Icon className="size-5" />
              {t(lang, item.key)}
            </Link>
          );
        })}
      </nav>

      <CommandPalette open={cmd} onOpenChange={setCmd} lang={lang} />
      <Toaster
        theme="dark"
        position={lang === "ar" ? "bottom-left" : "bottom-right"}
        toastOptions={{
          className: "!bg-surface !text-fg !border-border",
        }}
      />
    </div>
  );
}
