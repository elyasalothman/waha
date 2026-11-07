import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PasskeyCard } from "@/components/passkey-card";
import { signOut } from "@/lib/auth/client";
import { signInSocial, type SocialProvider } from "@/lib/auth/social";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

type Caps = { email: boolean; google: boolean; apple: boolean };

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "أنا · واحة" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "حسابك في واحة. القراءة والتفضيلات تبقى على هذا الجهاز." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const [caps, setCaps] = useState<Caps | null>(null);
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [notice, setNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const signedIn = Boolean(user && !user.isDevFallback);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth-status", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!body) return;
        setCaps({
          email: Boolean(body.email),
          google: Boolean(body.google),
          apple: Boolean(body.apple),
        });
      })
      .catch(() => setCaps(null));
    return () => controller.abort();
  }, []);
  async function social(provider: SocialProvider) {
    setNotice("");
    setBusy(provider);
    try {
      await signInSocial(provider, {
        callbackURL: "/me",
        newUserCallbackURL: "/onboarding",
        errorCallbackURL: "/register?mode=signin&error=oauth",
      });
    } catch {
      setNotice(
        provider === "apple"
          ? "أُلغي دخول Apple أو تعذّر. لم يُنشأ حساب محلي بدلًا منه."
          : "أُلغي دخول Google أو تعذّر. لم يُنشأ حساب محلي بدلًا منه.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="mx-auto max-w-3xl" dir="rtl">
      <h1 className="font-display text-4xl">أنا</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
        القراءة والودجات تبقى على هذا الجهاز. الحساب، إن وُجد، هو جلسة على الخادم فقط، بلا مزامنة
        للكتب بين الأجهزة.
      </p>
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5" aria-label="حالة الحساب">
        {isPending ? (
          <p role="status">جارٍ التحقق من الجلسة…</p>
        ) : signedIn ? (
          <>
            <p className="text-lg">أهلًا، {user?.displayName || "بك"}</p>
            <button
              type="button"
              className="mt-3 min-h-11 text-primary underline"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                setNotice("");
                try {
                  await signOut("/me");
                } catch {
                  setNotice("تعذّر تسجيل الخروج. أعد المحاولة.");
                  setSigningOut(false);
                }
              }}
            >
              {signingOut ? "جارٍ الخروج…" : "تسجيل الخروج"}
            </button>
          </>
        ) : (
          <>
            <p>أنت ضيف. لم تُفتح جلسة.</p>
            {caps?.google || caps?.apple ? (
              <div className="mt-4 flex flex-col gap-2">
                {caps.apple ? (
                  <button
                    type="button"
                    className="min-h-12 rounded-full bg-black px-4 text-white disabled:opacity-60"
                    disabled={busy !== null}
                    onClick={() => void social("apple")}
                  >
                    {busy === "apple" ? "جارٍ فتح Apple…" : "المتابعة باستخدام Apple"}
                  </button>
                ) : null}
                {caps.google ? (
                  <button
                    type="button"
                    className="min-h-12 rounded-full border border-border bg-white px-4 text-neutral-900 disabled:opacity-60"
                    disabled={busy !== null}
                    onClick={() => void social("google")}
                  >
                    {busy === "google" ? "جارٍ فتح Google…" : "المتابعة باستخدام Google"}
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-muted" role="status">
                تسجيل Google وApple غير مهيأ على هذا الخادم. لا يظهر زر يتصل بمزوّد غير جاهز.
                {caps?.email ? " الدخول بالبريد يبقى من صفحة الحساب." : ""}
              </p>
            )}
            <Link to="/register" search={{ mode: "signin" }} className="mt-3 inline-flex min-h-11 items-center text-primary">
              صفحة الدخول والتسجيل
            </Link>
          </>
        )}
        {notice ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {notice}
          </p>
        ) : null}
      </section>
      <PasskeyCard />
      <Link
        to="/settings"
        className="mt-4 inline-flex min-h-11 items-center text-primary"
      >
        الإعدادات، الخصوصية، وحذف الحساب
      </Link>
    </div>
  );
}
