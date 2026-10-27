import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Fingerprint, Mail, ShieldCheck } from "lucide-react";
import { WahaWordmark } from "@/components/brand";
import { authClient } from "@/lib/auth/client";
import { passkeySupported, signInSocial, type SocialProvider } from "@/lib/auth/social";
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
    apple?: boolean;
    passkey?: boolean;
    emailOtp?: boolean;
    passwordReset: boolean;
  } | null>(null);
  // Passwordless code is the default email path when a mailer exists; the
  // password form stays available for existing accounts.
  const [usePassword, setUsePassword] = useState(false);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [canPasskey, setCanPasskey] = useState(false);
  useEffect(() => setCanPasskey(passkeySupported()), []);
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
    signup: "ادخل إلى واحة",
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
              name: String(form.get("name") ?? "").trim() || email.split("@")[0] || "صديق واحة",
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
  const destination = mode === "signup" ? "/onboarding" : "/today";
  const otpMode = Boolean(cap?.emailOtp) && !usePassword && (mode === "signup" || mode === "signin");
  async function social(provider: SocialProvider) {
    setMessage("");
    setBusy(true);
    try {
      await signInSocial(provider, {
        callbackURL: "/today",
        newUserCallbackURL: "/onboarding",
        errorCallbackURL: `/register?mode=${mode === "signup" ? "signup" : "signin"}&error=oauth`,
      });
    } catch {
      setMessage(
        `لم يكتمل الدخول باستخدام ${provider === "apple" ? "Apple" : "Google"}. أعد المحاولة أو اختر طريقة أخرى.`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function passkeySignIn() {
    setMessage("");
    setBusy(true);
    try {
      const result = await authClient.signIn.passkey();
      if (result?.error) {
        setMessage("لم يكتمل الدخول بمفتاح المرور. إن لم تضف مفتاحًا لحسابك بعد، ادخل بطريقة أخرى ثم أضفه من «حسابي».");
      } else {
        await authClient.getSession();
        await navigate({ to: "/today" });
      }
    } catch {
      setMessage("لم يكتمل الدخول بمفتاح المرور. جرّب طريقة أخرى.");
    } finally {
      setBusy(false);
    }
  }
  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (!otpEmail) {
        const email = String(form.get("email") ?? "").trim();
        const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
        if (result.error) setMessage("تعذّر إرسال الرمز. تحقق من البريد وأعد المحاولة.");
        else {
          setOtpEmail(email);
          setSuccess(true);
          setMessage(`أرسلنا رمزًا من 6 أرقام إلى ${email}. صالح 10 دقائق.`);
        }
      } else {
        const otp = String(form.get("otp") ?? "").replace(/\D/g, "");
        const result = await authClient.signIn.emailOtp({ email: otpEmail, otp });
        if (result.error) setMessage("الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا.");
        else {
          await authClient.getSession();
          await navigate({ to: destination });
        }
      }
    } catch {
      setMessage("تعذّر الاتصال بخدمة الحساب. تحقق من اتصالك وأعد المحاولة.");
    } finally {
      setBusy(false);
    }
  }
  const showQuick = (mode === "signup" || mode === "signin") && cap?.email;
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
          {mode === "signup" || mode === "signin"
            ? "بنقرة واحدة عبر Apple أو Google، بلا بيانات إضافية. الحساب جديد أو موجود، نفس الخطوة."
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
        {showQuick && (
          <div className="mb-6 flex flex-col gap-3" aria-label="طرق الدخول السريع">
            {cap?.apple && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void social("apple")}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-black px-4 font-medium text-white disabled:opacity-60"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.41-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" />
                </svg>
                المتابعة باستخدام Apple
              </button>
            )}
            {cap?.google && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void social("google")}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-neutral-300 bg-white px-4 font-medium text-neutral-900 disabled:opacity-60"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                </svg>
                المتابعة باستخدام Google
              </button>
            )}
            {cap?.passkey && canPasskey && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void passkeySignIn()}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-surface px-4 font-medium disabled:opacity-60"
              >
                <Fingerprint size={18} aria-hidden="true" />
                الدخول بمفتاح المرور
              </button>
            )}
            {(cap?.apple || cap?.google) && (
              <div className="my-1 flex items-center gap-3 text-xs text-muted" role="separator">
                <span className="h-px flex-1 bg-border" />
                أو بالبريد الإلكتروني
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
          </div>
        )}
        {otpMode ? (
          <form onSubmit={submitOtp} className="space-y-5">
            {!otpEmail ? (
              <label className="block text-sm">
                البريد الإلكتروني
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email webauthn"
                  required
                  maxLength={254}
                  className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-start"
                />
              </label>
            ) : (
              <label className="block text-sm">
                رمز الدخول
                <input
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  required
                  maxLength={6}
                  dir="ltr"
                  className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-center text-xl tracking-[0.5em]"
                />
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
            <button className="landing-button w-full disabled:opacity-60" disabled={busy}>
              <Mail size={18} aria-hidden="true" />
              {busy ? "جارٍ…" : otpEmail ? "تأكيد الرمز" : "أرسل رمز الدخول"}
            </button>
            {otpEmail && (
              <button
                type="button"
                className="inline-flex min-h-11 items-center text-sm underline"
                onClick={() => {
                  setOtpEmail(null);
                  setMessage("");
                }}
              >
                تغيير البريد أو إعادة الإرسال
              </button>
            )}
          </form>
        ) : (
        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && (
            <label className="block text-sm">
              الاسم <span className="text-muted">(اختياري)</span>
              <input
                name="name"
                autoComplete="name"
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
        )}
        <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
          <Link
            className="inline-flex min-h-11 items-center underline"
            to="/register"
            search={{ mode: mode === "signup" ? "signin" : "signup" }}
          >
            {mode === "signup" ? "لديك حساب؟ ادخل" : "أنشئ حسابًا جديدًا"}
          </Link>
          {cap?.emailOtp && (mode === "signup" || mode === "signin") ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center underline"
              onClick={() => {
                setUsePassword((v) => !v);
                setMessage("");
              }}
            >
              {usePassword ? "الدخول برمز على البريد" : "الدخول بكلمة المرور"}
            </button>
          ) : (
            <Link
              className="inline-flex min-h-11 items-center underline"
              to="/register"
              search={{ mode: "forgot" }}
            >
              نسيت كلمة المرور؟
            </Link>
          )}
        </div>
        <Link className="landing-secondary mt-4 w-full" to="/today">
          تصفّح واحة بدون حساب
        </Link>
        <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-6 text-muted">
          <ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true" />
          <span>
            نطلب الاسم والبريد فقط، ولا ننشر شيئًا باسمك. بالمتابعة توافق على{" "}
            <Link to="/privacy" className="underline">
              سياسة الخصوصية
            </Link>
            ، ويمكنك{" "}
            <Link to="/delete-account" className="underline">
              حذف حسابك
            </Link>{" "}
            متى شئت.
          </span>
        </p>
      </main>
    </div>
  );
}
