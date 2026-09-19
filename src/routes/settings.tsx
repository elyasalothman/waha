import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { AudienceSwitch } from "@/components/audience-switch";
import { CitySelect, LangToggle } from "@/components/city-select";
import { FeatureStore } from "@/components/os/feature-store";
import { SisterApps } from "@/components/os/sister-apps";
import { Input } from "@/components/ui/input";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { isFeatureOn } from "@/lib/features";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const lang = useAppStore((s) => s.lang);
  const name = useAppStore((s) => s.profileName);
  const setProfileName = useAppStore((s) => s.setProfileName);
  const guest = useAppStore((s) => s.guest);
  const features = useAppStore((s) => s.features);

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <header>
        <p className="text-xs tracking-wide text-muted">{t(lang, "settings")}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "account")}</h1>
      </header>

      <section className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t(lang, "profileName")}</span>
          <Input value={name} onChange={(e) => setProfileName(e.target.value)} />
        </label>
        <CitySelect />
        <div className="flex items-center justify-between">
          <LangToggle lang={lang} />
        </div>
        <AudienceSwitch />
        {guest ? <p className="text-sm text-muted">{t(lang, "guestHint")}</p> : null}
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <Link
            to="/login"
            className="inline-flex h-11 items-center rounded-md border border-border bg-surface-2 px-4 text-sm"
          >
            {t(lang, "login")}
          </Link>
        </SignedOut>
      </section>

      <FeatureStore lang={lang} />

      {isFeatureOn(features, "sisters") ? <SisterApps lang={lang} /> : null}
    </div>
  );
}
