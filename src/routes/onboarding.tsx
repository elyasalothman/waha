import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { INTERESTS, interestKey, normalizeInterests } from "@/lib/interests";
import { AudienceSwitch } from "@/components/audience-switch";
import { t } from "@/lib/i18n";
import { CITIES } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useSquare } from "@/lib/square/store";
import { useSettings } from "@/store/settings-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "مرحبًا في واحة · واحة" },
      { name: "description", content: "ثلاث خطوات لتخصيص واحتك، ويمكنك التخطي." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OnboardingPage,
});
function OnboardingPage() {
  const navigate = useNavigate();
  const { local, saveProfile } = useSquare();
  const { user } = useCurrentUserState();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const [step, setStep] = useState(0);
  const [city, setCity] = useState(settings.city);
  const [name, setName] = useState(local.profile.name);
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setCity(settings.city);
  }, [settings.city]);
  useEffect(() => {
    try {
      setInterests(
        normalizeInterests(JSON.parse(localStorage.getItem(interestKey(user?.id)) || "[]")),
      );
    } catch {
      /* Optional device preferences. */
    }
  }, [user?.id]);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const finish = (skip = false) => {
    try {
      if (!skip) {
        update({ city, location: "manual" });
        localStorage.setItem(interestKey(user?.id), JSON.stringify(normalizeInterests(interests)));
        saveProfile({ name, bio: local.profile.bio });
      }
      localStorage.setItem("waha:onboarding:v1", "done");
    } catch {
      setError("تعذّر حفظ التفضيلات. يمكنك المتابعة للرئيسية دون حفظ.");
      return;
    }
    void navigate({ to: "/" });
  };
  return (
    <div
      className="mx-auto max-w-xl space-y-6"
      data-onboarding="waha-for-you"
      data-identity="onboarding"
    >
      <div className="flex items-center justify-between gap-3">
        <p role="status" className="text-sm text-muted">
          {new Intl.NumberFormat("ar", { numberingSystem: settings.digits }).format(step + 1)} من ٣
          · بداية هادئة
        </p>
        <Button variant="ghost" onClick={() => finish(true)}>
          تخطي
        </Button>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
      <h1 ref={heading} tabIndex={-1} className="font-display text-3xl">
        {["يومك له واحة", "واحة على ذوقك", "تعرّف على محسن"][step]}
      </h1>
      {step === 0 && (
        <section className="space-y-5 rounded-2xl border border-border bg-surface p-6">
          <p className="text-lg leading-8">
            اقرأ، تعلّم، العب، وأنجز أدوات يومك في مساحة عربية واحدة.
          </p>
          <p className="leading-8 text-muted">
            ابدأ كضيف. كتبك الخاصة وتفضيلاتك على هذا الجهاز، والحساب اختياري. يمكنك تغيير اختياراتك
            من الإعدادات في أي وقت.
          </p>
          <label htmlFor="onboarding-name" className="block text-sm">
            اسم العرض (اختياري)
          </label>
          <Input
            id="onboarding-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="ضيف الواحة"
          />
          <p className="text-sm text-muted">{t(settings.language, "guestReadsFree")}</p>
          {!user && (
            <Link
              to="/register"
              search={{ mode: "signup" }}
              className="inline-flex min-h-11 items-center text-primary"
            >
              {t(settings.language, "createAccount")} (اختياري)
            </Link>
          )}
        </section>
      )}
      {step === 1 && (
        <section className="space-y-5">
          <h2 className="text-lg">{t(settings.language, "wahaForYou")}</h2>
          <AudienceSwitch />
          <label htmlFor="onboarding-city" className="block">
            مدينتك للطقس والصلاة
          </label>
          <select
            id="onboarding-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-3"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ar}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted">
            اختيار يدوي بلا إذن موقع. يمكنك تفعيل موقع الجهاز من الإعدادات.
          </p>
          <fieldset>
            <legend className="mb-3 text-lg">ما الذي يهمك؟</legend>
            <div className="grid grid-cols-2 gap-3">
              {INTERESTS.map((item) => (
                <label
                  key={item.id}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 text-sm"
                >
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={interests.includes(item.id)}
                    onChange={(e) =>
                      setInterests((old) =>
                        e.target.checked ? [...old, item.id] : old.filter((id) => id !== item.id),
                      )
                    }
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      )}
      {step === 2 && (
        <section className="space-y-5 rounded-2xl border border-border bg-surface p-6">
          <p className="text-lg leading-8">
            قل لمحسن: «احسب ١٥٪ من ٢٠٠» أو «كمل الكتاب» أو «افتح القرآن».
          </p>
          <p className="leading-8 text-muted">
            الحساب والأوامر المحلية تعمل على جهازك. الأسئلة المعرفية تحتاج اتصالًا؛ يُرسل السؤال
            وحده. يطلب محسن تأكيدك قبل حفظ البيانات أو تغيير الإعدادات.
          </p>
          <p className="text-sm text-muted">
            افتحه بزر ✦ أو Ctrl / ⌘ + K. راجع المصادر فيما يحتاج تدقيقًا.
          </p>
        </section>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}{" "}
          <Link to="/" className="inline-flex min-h-11 items-center underline">
            إلى الرئيسية
          </Link>
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          السابق
        </Button>
        <Button onClick={() => (step < 2 ? setStep((s) => s + 1) : finish())}>
          {step === 2 ? "ابدأ يومك" : "التالي"}
        </Button>
      </div>
    </div>
  );
}
