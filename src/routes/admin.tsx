import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { counts, exportBackup, hasPin, importBackup, isUnlocked, lockAdmin, resetWaha, setPin, unlock } from "@/lib/admin";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const lang = useAppStore((s) => s.lang);
  const [pin, setPinValue] = useState("");
  const [open, setOpen] = useState(() => (typeof window === "undefined" ? false : isUnlocked()));
  const [err, setErr] = useState<string | null>(null);
  const [backup, setBackup] = useState("");
  const stats = useMemo(() => (open && typeof window !== "undefined" ? counts() : { tasks: 0, spend: 0, keys: 0 }), [open]);

  async function submit() {
    setErr(null);
    try {
      if (!hasPin()) {
        if (pin.length < 4) return;
        await setPin(pin);
        setOpen(true);
        setPinValue("");
        return;
      }
      const ok = await unlock(pin);
      if (!ok) {
        setErr(t(lang, "pinWrong"));
        return;
      }
      setOpen(true);
      setPinValue("");
    } catch {
      setErr(t(lang, "error"));
    }
  }

  if (!open) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="font-display text-4xl tracking-tight">{t(lang, "admin")}</h1>
        <p className="mt-2 text-sm text-muted">{hasPin() ? t(lang, "pinEnter") : t(lang, "pinSet")}</p>
        <input
          type="password"
          inputMode="numeric"
          className="mt-6 h-11 w-full rounded-md border border-border bg-surface px-3 font-mono"
          value={pin}
          onChange={(e) => setPinValue(e.target.value)}
        />
        {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
        <Button className="mt-4 w-full" type="button" onClick={() => void submit()}>
          {t(lang, "unlock")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-tight">{t(lang, "admin")}</h1>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            lockAdmin();
            setOpen(false);
          }}
        >
          {t(lang, "lock")}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={lang === "ar" ? "مهام" : "Tasks"} value={stats.tasks} />
        <Stat label={lang === "ar" ? "مصروف" : "Spend"} value={stats.spend} />
        <Stat label={lang === "ar" ? "مفاتيح" : "Keys"} value={stats.keys} />
      </div>
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-medium">{t(lang, "backup")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setBackup(exportBackup())}>
            {t(lang, "backup")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              try {
                importBackup(backup);
              } catch {
                /* ignore */
              }
            }}
          >
            {t(lang, "restore")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => resetWaha()}>
            {t(lang, "reset")}
          </Button>
        </div>
        <textarea
          className="mt-3 min-h-40 w-full rounded-md border border-border bg-bg p-3 font-mono text-xs"
          value={backup}
          onChange={(e) => setBackup(e.target.value)}
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="num mt-1 font-mono text-xl tabular-nums">{value}</p>
    </div>
  );
}
