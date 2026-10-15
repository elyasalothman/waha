import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { INTERESTS, interestKey, normalizeInterests } from "@/lib/interests";
import { AudienceSwitch } from "@/components/audience-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n";
import { useSquare } from "@/lib/square/store";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "مرحبًا في واحة · واحة" },
      { name: "description", content: "خصص واحتك واختر الأدوات المناسبة ليومك." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const lang = useAppStore((s) => s.lang);
  const navigate = useNavigate();
  const { local, saveProfile } = useSquare();
  const { user, isPending } = useCurrentUserState();
  const [interests, setInterests] = useState<string[]>([]);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      setInterests(
        normalizeInterests(JSON.parse(localStorage.getItem(interestKey(user?.id)) || "[]")),
      );
    } catch {
      /* Optional device preferences. */
    }
  }, [user?.id]);
  const [name, setName] = useState(local.profile.name);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const showSignIn = authEnabled && !isPending && !user;

  return (
    <div className="mx-auto max-w-xl" data-onboarding="waha-for-you" data-identity="onboarding">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight">{t(lang, "createAccount")}</h1>
        <p className="mt-2 max-w-xl text-muted">{t(lang, "wahaForYouBlurb")}</p>
        <p className="mt-2 text-sm text-subtle">{t(lang, "guestReadsFree")}</p>
      </header>
      <section aria-labelledby="waha-for-you-heading">
        <h2 id="waha-for-you-heading" className="mb-3 text-sm font-medium text-muted">
          {t(lang, "wahaForYou")}
        </h2>
        <AudienceSwitch />
      </section>
      <fieldset className="mt-8">
        <legend className="text-lg font-medium">ما الذي يهمك؟</legend>
        <p className="mt-2 text-sm text-muted">
          اختر اهتماماتك لتظهر اختصاراتها في «يومي». تُحفظ على هذا المتصفح، ويمكنك تغييرها هنا.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {INTERESTS.map((item) => (
            <label
              key={item.id}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 text-sm"
            >
              <input
                type="checkbox"
                checked={interests.includes(item.id)}
                onChange={(e) =>
                  setInterests((old) =>
                    e.target.checked ? [...old, item.id] : old.filter((id) => id !== item.id),
                  )
                }
                className="size-5 accent-primary"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor="onboarding-name" className="mt-8 block text-xs text-muted">
        {L("اسم العرض", "Display name")}
      </label>
      <Input
        id="onboarding-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder={L("ضيف الواحة", "Oasis guest")}
        className="mt-1"
      />
      {showSignIn ? (
        <div className="mt-6" data-identity="sign-in">
          <p className="mb-2 text-xs text-muted">
            {L("تسجيل اختياري إن أحببت", "Optional sign-in")}
          </p>
          <Link
            to="/register"
            search={{ mode: "signup" }}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm"
          >
            تسجيل حساب في واحة
          </Link>
        </div>
      ) : null}
      {storageError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          تعذّر حفظ التفضيلات. تحقق من إتاحة التخزين في المتصفح.
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={() => {
            saveProfile({ name, bio: local.profile.bio });
            try {
              localStorage.setItem(
                interestKey(user?.id),
                JSON.stringify(normalizeInterests(interests)),
              );
            } catch {
              setStorageError(true);
              return;
            }
            void navigate({ to: "/today" });
          }}
        >
          {L("إلى يومي", "Go to my day")}
        </Button>
      </div>
    </div>
  );
}
