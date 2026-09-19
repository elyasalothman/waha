import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CloudSun, GalleryVertical, House, Mail, Sparkles, Sunrise, Wallet, Wrench, PanelsTopLeft, Settings } from "lucide-react";
import { WahaWordmark } from "@/components/brand";
import { CommandPalette } from "@/components/command-palette";
import { AudienceSwitch } from "@/components/audience-switch";
import { LangToggle } from "@/components/city-select";
import { OfflineBanner } from "@/components/offline-banner";
import { DoorsStrip } from "@/components/doors-strip";
import { t, type I18nKey } from "@/lib/i18n";
import { isFeatureOn, type FeatureId } from "@/lib/features";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { seedProfileFromAccount, signedDisplayName } from "@/lib/identity";
import { Toaster } from "sonner";

type NavItem = { to: string; key: I18nKey; icon: typeof House; feature?: FeatureId };

const PERSONAL_NAV: NavItem[] = [
  { to: "/", key: "home", icon: House },
  { to: "/faith", key: "faith", icon: Sunrise, feature: "faith" },
  { to: "/messages", key: "messages", icon: Mail, feature: "messages" },
  { to: "/ask", key: "ask", icon: Sparkles, feature: "ask" },
  { to: "/settings", key: "settings", icon: Settings, feature: "settings" },
];

const WORK_NAV: NavItem[] = [
  { to: "/", key: "home", icon: House },
  { to: "/workspace", key: "workspace", icon: PanelsTopLeft, feature: "work" },
  { to: "/money", key: "finance", icon: Wallet, feature: "money" },
  { to: "/tools", key: "tools", icon: Wrench, feature: "tools" },
  { to: "/settings", key: "settings", icon: Settings, feature: "settings" },
];

const DESKTOP_EXTRA: NavItem[] = [
  { to: "/midan", key: "midan", icon: GalleryVertical, feature: "midan" },
  { to: "/weather", key: "weather", icon: CloudSun, feature: "weather" },
  { to: "/money", key: "money", icon: Wallet, feature: "money" },
];

function SeedThinWriter() {
  const profileName = useAppStore((s) => s.profileName);
  const setProfileName = useAppStore((s) => s.setProfileName);
  const signedName = signedDisplayName(useCurrentUser());

  useEffect(() => {
    const seed = seedProfileFromAccount(profileName, signedName);
    if (seed) setProfileName(seed);
  }, [profileName, signedName, setProfileName]);

  return null;
}

export function Shell() {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const features = useAppStore((s) => s.features);
  const name = useAppStore((s) => s.profileName);
  const hydrate = useAppStore((s) => s.hydrate);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [cmd, setCmd] = useState(false);
  const base = audience === "personal" ? PERSONAL_NAV : WORK_NAV;
  const nav = [...base, ...(audience === "personal" ? DESKTOP_EXTRA : [])].filter(
    (item, i, all) => all.findIndex((x) => x.to === item.to) === i && (!item.feature || isFeatureOn(features, item.feature)),
  );
  const mobileNav = (audience === "personal" ? PERSONAL_NAV : WORK_NAV).filter(
    (item) => !item.feature || isFeatureOn(features, item.feature),
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <SeedThinWriter />
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 border-e border-border bg-bg lg:flex lg:flex-col">
        <div className="px-5 py-6">
          <Link to="/" className="inline-flex">
            <WahaWordmark lang={lang} />
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t(lang, audience === "personal" ? "osTagline" : "workTagline")}
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
            const Icon = item.icon;
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
                <Icon className="size-4" strokeWidth={1.75} />
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
          <button
            type="button"
            onClick={() => setCmd(true)}
            className="ms-auto flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-start text-sm text-muted lg:max-w-md"
          >
            <span className="truncate">{t(lang, "search")}</span>
          </button>
          <Link to="/settings" className="hidden max-w-28 truncate text-sm text-muted sm:inline hover:text-fg">
            {name || t(lang, "account")}
          </Link>
          <div className="hidden sm:block lg:hidden">
            <AudienceSwitch compact />
          </div>
          <div className="lg:hidden">
            <LangToggle lang={lang} />
          </div>
        </header>

        <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-10">
          <OfflineBanner lang={lang} />
          <Outlet />
        </main>
      </div>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] lg:hidden",
          mobileNav.length >= 5 ? "grid-cols-5" : "grid-cols-4",
        )}
      >
        {mobileNav.map((item) => {
          const Icon = item.icon;
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
