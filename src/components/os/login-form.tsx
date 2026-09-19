import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CitySelect } from "@/components/city-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export function LoginForm() {
  const lang = useAppStore((s) => s.lang);
  const name = useAppStore((s) => s.profileName);
  const setProfileName = useAppStore((s) => s.setProfileName);
  const setGuest = useAppStore((s) => s.setGuest);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function goHome() {
    void navigate({ to: "/" });
  }

  async function withEmail(mode: "in" | "up") {
    setBusy(true);
    setErr(null);
    try {
      const display = name.trim() || email.split("@")[0] || "";
      const payload = { email: email.trim(), password, name: display };
      const result =
        mode === "up" ? await authClient.signUp.email(payload) : await authClient.signIn.email({ email: payload.email, password });
      if (result.error) throw new Error(result.error.message ?? "auth");
      if (display) setProfileName(display);
      setGuest(false);
      goHome();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t(lang, "error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <p className="text-xs tracking-wide text-muted">{t(lang, "account")}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "login")}</h1>
        <p className="mt-3 text-sm text-muted">{t(lang, "guestHint")}</p>
      </header>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">{t(lang, "profileName")}</span>
        <Input value={name} onChange={(e) => setProfileName(e.target.value)} placeholder={lang === "ar" ? "اسمك" : "Your name"} />
      </label>
      <CitySelect />

      {authEnabled ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void withEmail("in");
          }}
        >
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t(lang, "email")} />
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(lang, "password")}
          />
          {err ? <p className="text-sm text-danger">{err}</p> : null}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={busy || !email || !password}>
              {t(lang, "signInEmail")}
            </Button>
            <Button type="button" variant="secondary" disabled={busy || !email || !password} onClick={() => void withEmail("up")}>
              {t(lang, "createAccount")}
            </Button>
          </div>
        </form>
      ) : null}

      {authEnabled && GROK_PROVIDERS.length ? (
        <div className="space-y-2">
          {GROK_PROVIDERS.map((p) => (
            <Button key={p.providerId} type="button" variant="outline" className="w-full" onClick={() => void signIn(p.providerId)}>
              {p.label}
            </Button>
          ))}
        </div>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => {
          setGuest(true);
          goHome();
        }}
      >
        {t(lang, "guestContinue")}
      </Button>
    </div>
  );
}
