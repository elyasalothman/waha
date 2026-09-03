import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIG = "23456789";
const SYM = "!@#$%^&*()-_=+[]{}";

function rand(set: string) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return set[buf[0]! % set.length]!;
}

export function PasswordApp() {
  const lang = useAppStore((s) => s.lang);
  const [len, setLen] = useState(16);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [sym, setSym] = useState(true);
  const [pwd, setPwd] = useState("");

  const pool = `${lower ? LOWER : ""}${upper ? UPPER : ""}${digits ? DIG : ""}${sym ? SYM : ""}`;

  function gen() {
    if (!pool) return;
    const chars: string[] = [];
    if (lower) chars.push(rand(LOWER));
    if (upper) chars.push(rand(UPPER));
    if (digits) chars.push(rand(DIG));
    if (sym) chars.push(rand(SYM));
    while (chars.length < len) chars.push(rand(pool));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.getRandomValues(new Uint32Array(1))[0]! % (i + 1);
      [chars[i], chars[j]] = [chars[j]!, chars[i]!];
    }
    setPwd(chars.join(""));
  }

  const strength = useMemo(() => {
    if (pwd.length >= 16 && lower && upper && digits && sym) return lang === "ar" ? "قوية" : "Strong";
    if (pwd.length >= 12) return lang === "ar" ? "جيدة" : "Good";
    return lang === "ar" ? "ضعيفة" : "Weak";
  }, [pwd, lower, upper, digits, sym, lang]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface px-3 py-4 font-mono text-lg break-all">{pwd || "••••"}</div>
      <label className="block text-sm text-muted">
        {lang === "ar" ? "الطول" : "Length"} {len}
        <input className="mt-2 w-full" type="range" min={8} max={64} value={len} onChange={(e) => setLen(+e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex h-11 items-center gap-2"><input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} /> a-z</label>
        <label className="flex h-11 items-center gap-2"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> A-Z</label>
        <label className="flex h-11 items-center gap-2"><input type="checkbox" checked={digits} onChange={(e) => setDigits(e.target.checked)} /> 2-9</label>
        <label className="flex h-11 items-center gap-2"><input type="checkbox" checked={sym} onChange={(e) => setSym(e.target.checked)} /> !@#</label>
      </div>
      <p className="text-sm text-muted">{strength}</p>
      <div className="flex gap-2">
        <Button onClick={gen}>{lang === "ar" ? "توليد" : "Generate"}</Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (!pwd) return;
            void navigator.clipboard.writeText(pwd);
            toast(t(lang, "copied"));
          }}
        >
          {t(lang, "copy")}
        </Button>
      </div>
    </div>
  );
}
