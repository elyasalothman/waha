import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { accountProviderView } from "@/lib/auth/account-provider";
import { signOut } from "@/lib/auth/client";
import { oauthHandoffProvider } from "@/lib/auth/public-origins";
import { signInSocial, type SocialProvider } from "@/lib/auth/social";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PasskeyCard } from "./passkey-card";

type Caps = { email: boolean; google: boolean; apple: boolean };
type CapsPhase = "checking" | "unknown" | "ready";

/** Sign-in for this device. The OAuth return stays /me so the provider callback does not change. */
export function AccountPanel() {
  const { user, isPending } = useCurrentUserState();
  const [caps, setCaps] = useState<Caps | null>(null);
  const [capsPhase, setCapsPhase] = useState<CapsPhase>("checking");
  const [capsTry, setCapsTry] = useState(0);
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [notice, setNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const signedIn = Boolean(user && !user.isDevFallback);
  useEffect(() => {
    const controller = new AbortController();
    setCapsPhase("checking");
    fetch("/api/auth-status", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!body || typeof body !== "object") {
          setCaps(null);
          setCapsPhase("unknown");
          return;
        }
        setCaps({
          email: Boolean(body.email),
          google: Boolean(body.google),
          apple: Boolean(body.apple),
        });
        setCapsPhase("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCaps(null);
        setCapsPhase("unknown");
      });
    return () => controller.abort();
  }, [capsTry]);
  useEffect(() => {
    const provider = oauthHandoffProvider(
      window.location.origin,
      window.location.search,
      document.referrer,
    );
    if (!provider) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("start");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    void social(provider);
    // The handoff runs once on arrival from the other public host.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const providers = accountProviderView({
    phase: capsPhase,
    google: caps?.google,
    apple: caps?.apple,
  });
  return (
    <section id="account" className="rounded-2xl border border-border bg-surface p-5" aria-label="حالة الحساب">
      <h2 className="text-xl">الحساب والدخول</h2>
      <p className="mt-2 text-sm leading-7 text-muted">
        القراءة والودجات تبقى على هذا الجهاز. الجلسة، إن وُجدت، تُحفظ على waha.hajdah.com لأن هذا
        عنوان العودة المسجّل لدى Google وApple.
      </p>
      {isPending ? (
        <p className="mt-3" role="status">
          جارٍ التحقق من الجلسة…
        </p>
      ) : signedIn ? (
        <>
          <p className="mt-3 text-lg">أهلًا، {user?.displayName || "بك"}</p>
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
          <p className="mt-3">أنت ضيف. لم تُفتح جلسة.</p>
          {providers === "on" ? (
            <div className="mt-4 flex flex-col gap-2">
              {caps?.apple ? (
                <button
                  type="button"
                  className="min-h-12 rounded-full bg-black px-4 text-white disabled:opacity-60"
                  disabled={busy !== null}
                  onClick={() => void social("apple")}
                >
                  {busy === "apple" ? "جارٍ فتح Apple…" : "المتابعة باستخدام Apple"}
                </button>
              ) : null}
              {caps?.google ? (
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
          ) : providers === "checking" ? (
            <p className="mt-3 text-sm leading-7 text-muted" role="status">
              جارٍ التحقق من تسجيل Google وApple…
            </p>
          ) : providers === "unknown" ? (
            <div className="mt-3" role="status">
              <p className="text-sm leading-7 text-muted">
                تعذّر التحقق من تهيئة الدخول. هذا ليس تأكيدًا أن الخادم غير مهيأ.
              </p>
              <button
                type="button"
                className="mt-2 min-h-11 text-primary underline"
                onClick={() => setCapsTry((value) => value + 1)}
              >
                إعادة التحقق
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-muted" role="status">
              تسجيل Google وApple غير مهيأ على هذا الخادم. لا يظهر زر يتصل بمزوّد غير جاهز.
              {caps?.email ? " الدخول بالبريد يبقى من صفحة الحساب." : ""}
            </p>
          )}
          <Link
            to="/register"
            search={{ mode: "signin" }}
            className="mt-3 inline-flex min-h-11 items-center text-primary"
          >
            صفحة الدخول والتسجيل
          </Link>
        </>
      )}
      {notice ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {notice}
        </p>
      ) : null}
      <PasskeyCard />
    </section>
  );
}
