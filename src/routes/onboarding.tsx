import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AudienceSwitch } from "@/components/audience-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { useSquare } from "@/lib/square/store";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

function OnboardingPage() {
  const lang = useAppStore((s) => s.lang);
  const navigate = useNavigate();
  const { local, saveProfile } = useSquare();
  const [name, setName] = useState(local.profile.name);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="mx-auto max-w-xl" data-onboarding="waha-for-you">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight">{t(lang, "createAccount")}</h1>
        <p className="mt-2 max-w-xl text-muted">{t(lang, "wahaForYouBlurb")}</p>
      </header>
      <section aria-labelledby="waha-for-you-heading">
        <h2 id="waha-for-you-heading" className="mb-3 text-sm font-medium text-muted">
          {t(lang, "wahaForYou")}
        </h2>
        <AudienceSwitch />
      </section>
      <label className="mt-8 block text-xs text-muted">{L("اسم العرض", "Display name")}</label>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder={L("ضيف الواحة", "Oasis guest")}
        className="mt-1"
      />
      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={() => {
            saveProfile({ name, bio: local.profile.bio });
            void navigate({ to: "/" });
          }}
        >
          {t(lang, "enterSquare")}
        </Button>
      </div>
    </div>
  );
}
