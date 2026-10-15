import { useState } from "react";
import { authClient, signOut } from "@/lib/auth/client";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="my-4 rounded-xl border border-border p-3">
      <button
        type="button"
        className="min-h-11 px-3 text-danger underline"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        حذف حسابي
      </button>
      {open ? (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              const result = await authClient.deleteUser(password ? { password } : {});
              if (result.error) throw new Error("delete-failed");
              await signOut("/welcome");
            } catch {
              setError("تعذّر الحذف. تحقق من كلمة المرور، أو سجّل الدخول مجددًا ثم أعد المحاولة.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            يُحذف حساب واحة وجلساته والكتب التي نشرتها فيه نهائيًا. الملفات والملاحظات المحفوظة على
            جهازك مستقلة وتُحذف من أدواتها؛ حسابات حصتي ومواقع البيت مستقلة.
          </p>
          <label className="block py-2">
            كلمة المرور (لحساب البريد)
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="block min-h-11 w-full rounded border border-border bg-bg p-2"
            />
          </label>
          <label className="block min-h-11 py-2">
            <input type="checkbox" required /> أفهم أن حذف حساب واحة نهائي
          </label>
          <button
            disabled={busy}
            className="min-h-11 rounded border border-danger px-4 text-danger"
          >
            {busy ? "جارٍ الحذف…" : "تأكيد حذف حساب واحة"}
          </button>
          <p role="alert">{error}</p>
        </form>
      ) : null}
    </section>
  );
}
