import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { passkeySupported } from "@/lib/auth/social";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

/** Offers a passkey (Face ID / fingerprint) once the visitor is signed in. */
export function PasskeyCard() {
  const { user, isPending } = useCurrentUserState();
  const [count, setCount] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const signedIn = !isPending && user && !user.isDevFallback;
  useEffect(() => {
    if (!signedIn || !passkeySupported()) return;
    authClient.passkey
      .listUserPasskeys()
      .then((r) => setCount(Array.isArray(r.data) ? r.data.length : 0))
      .catch(() => setCount(null));
  }, [signedIn]);
  if (!signedIn || count === null || (count > 0 && state !== "done")) return null;
  return (
    <section className="mx-auto mb-5 max-w-3xl rounded-xl border border-border p-4" aria-live="polite">
      <div className="flex items-start gap-3">
        <Fingerprint className="mt-1 shrink-0 text-primary" size={22} aria-hidden="true" />
        <div className="flex-1">
          <h2 className="!m-0 text-base font-semibold">
            {state === "done" ? "تمت إضافة مفتاح المرور ✓" : "ادخل في المرة القادمة ببصمتك"}
          </h2>
          <p className="!mt-1 text-sm leading-7 text-muted">
            {state === "done"
              ? "صار بإمكانك الدخول إلى واحة بـFace ID أو البصمة دون بريد أو كلمة مرور."
              : "أضف مفتاح مرور (Passkey) لهذا الجهاز: أسرع وأأمن من كلمة المرور."}
          </p>
          {state !== "done" && (
            <button
              type="button"
              disabled={state === "busy"}
              className="landing-button small mt-2 disabled:opacity-60"
              onClick={async () => {
                setState("busy");
                const r = await authClient.passkey.addPasskey({ name: "واحة" }).catch(() => null);
                setState(r && !r.error ? "done" : "error");
              }}
            >
              {state === "busy" ? "جارٍ…" : "أضف مفتاح مرور"}
            </button>
          )}
          {state === "error" && (
            <p role="alert" className="!mt-2 text-sm text-danger">
              لم تكتمل الإضافة. أعد المحاولة.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
