import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { WahaWordmark } from "@/components/brand";
import { authClient, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

type Mode = "signup" | "signin" | "forgot" | "reset";
export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { mode: Mode; token?: string; error?: string } => ({
    mode: ["signin", "forgot", "reset"].includes(String(s.mode)) ? (s.mode as Mode) : "signup",
    token: typeof s.token === "string" ? s.token : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  head: () => ({
    meta: [
      { title: "حسابك في واحة" },
      { name: "description", content: "سجّل في واحة أو ادخل إلى حسابك، وخصص يومك." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Register,
});
function Register() {
  const { mode, token, error: callbackError } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [cap, setCap] = useState<{
    email: boolean;
    google: boolean;
    passwordReset: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth-status", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setCap)
      .catch(() => {
        if (!controller.signal.aborted)
          setMessage("تعذّر التحقق من خدمة الحساب. أعد تحميل الصفحة أو جرّب كضيف.");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    setMessage("");
    setSuccess(false);
  }, [mode]);
  useEffect(() => {
    if (!isPending && user && !user.isDevFallback && mode !== "reset")
      void navigate({ to: mode === "signup" ? "/onboarding" : "/today", replace: true });
  }, [user, isPending, mode, navigate]);
  const title = {
    signup: "ابدأ واحتك الخاصة",
    signin: "أهلًا بعودتك",
    forgot: "نسيت كلمة المرور؟",
    reset: "كلمة مرور جديدة",
  }[mode];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      const result =
        mode === "signup"
          ? await authClient.signUp.email({
              name: String(form.get("name")).trim(),
              email,
              password,
              callbackURL: "/onboarding",
            })
          : mode === "signin"
            ? await authClient.signIn.email({ email, password, callbackURL: "/today" })
            : mode === "forgot"
              ? await authClient.requestPasswordReset({ email, redirectTo: "/register?mode=reset" })
              : await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        const code = result.error.code as string;
        const errors: Record<string, string> = {
          AUTH_NOT_CONFIGURED:
            "التسجيل والدخول غير متاحين مؤقتًا لأن خدمة الحساب لم تُهيأ بعد. جرّب واحة بدون حساب.",
          RESET_NOT_CONFIGURED: "خدمة بريد الاستعادة لم تُهيأ بعد.",
          INVALID_EMAIL_OR_PASSWORD: "البريد أو كلمة المرور غير صحيحة.",
          USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
            "تعذّر إنشاء الحساب بهذا البريد. جرّب الدخول أو استعادة كلمة المرور.",
          PASSWORD_TOO_SHORT: "استخدم كلمة مرور من 10 أحرف على الأقل.",
          INVALID_TOKEN: "رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.",
        };
        setMessage(errors[code] ?? "تعذّر إتمام الطلب. تحقق من البيانات وأعد المحاولة.");
      } else if (mode === "forgot") {
        setSuccess(true);
        setMessage("إذا كان البريد مسجلًا، ستصلك رسالة تحتوي رابط استعادة كلمة المرور.");
      } else if (mode === "reset") {
        setSuccess(true);
        setMessage("تم تحديث كلمة المرور. يمكنك الآن تسجيل الدخول.");
      } else {
        await authClient.getSession();
        await navigate({ to: mode === "signup" ? "/onboarding" : "/today" });
      }
    } catch {
      setMessage("تعذّر الاتصال بخدمة الحساب. تحقق من اتصالك وأعد المحاولة.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="landing min-h-dvh" dir="rtl" lang="ar">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Link to="/welcome" className="inline-flex min-h-11 items-center">
          <WahaWordmark lang="ar" />
        </Link>
      </div>
      <main id="main-content" className="mx-auto max-w-md px-6 pb-16 pt-6 sm:pt-12">
        <Link
          to="/welcome"
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted"
        >
          <ArrowRight size={16} />
          عودة إلى واحة
        </Link>
        <p className="landing-eyebrow">مساحة ليومك، بطريقتك</p>
        <h1 className="!my-4 !font-display !text-4xl !tracking-normal">{title}</h1>
        <p className="mb-7 text-sm leading-7 text-muted">
          {mode === "signup"
            ? "سجّل مجانًا، ثم اختر ما يهمك. يمكنك دائمًا البدء كضيف."
            : "حسابك في واحة، قريب منك."}
        </p>
        {cap && !cap.email && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-border bg-surface p-4 text-sm leading-7"
          >
            خدمة الحساب لم تُهيأ بعد. التسجيل والدخول متوقفان مؤقتًا؛ جميع التجارب العامة متاحة{" "}
            <Link to="/today" className="underline">
              بدون حساب
            </Link>
            .
          </p>
        )}
        {mode === "forgot" && cap?.email && !cap.passwordReset && (
          <p role="status" className="mb-5 text-sm leading-7">
            استعادة كلمة المرور غير متاحة حاليًا؛ خدمة بريد الاستعادة لم تُهيأ بعد.
          </p>
        )}
        {callbackError && (
          <p role="alert" className="mb-4 text-sm text-danger">
            تعذّر إكمال الدخول أو انتهت صلاحية الرابط. أعد المحاولة.
          </p>
        )}
        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && (
            <label className="block text-sm">
              الاسم
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4"
              />
            </label>
          )}
          {mode !== "reset" && (
            <label className="block text-sm">
              البريد الإلكتروني
              <input
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                required
                maxLength={254}
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-start"
              />
            </label>
          )}
          {mode !== "forgot" && (
            <label className="block text-sm">
              كلمة المرور
              <input
                name="password"
                type="password"
                dir="ltr"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={mode === "signin" ? 1 : 10}
                maxLength={128}
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4"
              />
              {mode !== "signin" && (
                <span className="mt-2 block text-xs text-muted">
                  10 أحرف على الأقل، وحتى 128 حرفًا.
                </span>
              )}
            </label>
          )}
          {message && (
            <p
              role={success ? "status" : "alert"}
              className={`rounded-xl border border-border p-4 text-sm leading-7 ${success ? "text-success" : "text-danger"}`}
            >
              {message}
            </p>
          )}
          <button
            className="landing-button w-full disabled:opacity-60"
            disabled={
              busy ||
              !cap ||
              !cap.email ||
              (mode === "forgot" && !cap.passwordReset) ||
              (mode === "reset" && !token)
            }
          >
            {busy
              ? "جارٍ إتمام الطلب…"
              : {
                  signup: "إنشاء حساب مجاني",
                  signin: "دخول",
                  forgot: "أرسل رابط الاستعادة",
                  reset: "حفظ كلمة المرور",
                }[mode]}
          </button>
        </form>
        {cap?.google && (mode === "signup" || mode === "signin") && (
          <button
            disabled={busy}
            className="mt-4 min-h-12 w-full rounded-full border border-border bg-white px-4"
            onClick={async () => {
              setBusy(true);
              try {
                await signIn("grok-google", {
                  callbackURL: mode === "signup" ? "/onboarding" : "/today",
                  errorCallbackURL: "/register?mode=signin&error=oauth",
                });
              } catch {
                setMessage("تعذّر الدخول باستخدام Google. أعد المحاولة.");
              } finally {
                setBusy(false);
              }
            }}
          >
            المتابعة باستخدام Google
          </button>
        )}
        <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
          <Link
            className="inline-flex min-h-11 items-center underline"
            to="/register"
            search={{ mode: mode === "signup" ? "signin" : "signup" }}
          >
            {mode === "signup" ? "لديك حساب؟ ادخل" : "أنشئ حسابًا جديدًا"}
          </Link>
          <Link
            className="inline-flex min-h-11 items-center underline"
            to="/register"
            search={{ mode: "forgot" }}
          >
            نسيت كلمة المرور؟
          </Link>
        </div>
        <Link className="landing-secondary mt-4 w-full" to="/today">
          جرّب بدون حساب
        </Link>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <ShieldCheck size={16} />
          كتبك الخاصة وتفضيلاتك الحالية محفوظة على جهازك.
        </p>
      </main>
    </div>
  );
}
