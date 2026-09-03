import { type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Form = {
  estate: number;
  deceased: "m" | "f";
  spouse: boolean;
  sons: number;
  daughters: number;
  father: boolean;
  mother: boolean;
};

const empty: Form = { estate: 100000, deceased: "m", spouse: true, sons: 1, daughters: 1, father: false, mother: false };

type Share = { ar: string; en: string; amount: number; note: string };

function compute(v: Form): Share[] {
  const far = v.sons + v.daughters > 0;
  let rest = 1;
  const out: Share[] = [];
  if (v.spouse) {
    if (v.deceased === "m") {
      const f = far ? 1 / 8 : 1 / 4;
      rest -= f;
      out.push({ ar: "الزوجة", en: "Wife", amount: v.estate * f, note: far ? "1/8" : "1/4" });
    } else {
      const f = far ? 1 / 4 : 1 / 2;
      rest -= f;
      out.push({ ar: "الزوج", en: "Husband", amount: v.estate * f, note: far ? "1/4" : "1/2" });
    }
  }
  if (v.mother) {
    const f = far ? 1 / 6 : 1 / 3;
    rest -= f;
    out.push({ ar: "الأم", en: "Mother", amount: v.estate * f, note: far ? "1/6" : "1/3" });
  }
  if (v.father && far) {
    rest -= 1 / 6;
    out.push({ ar: "الأب", en: "Father", amount: v.estate / 6, note: "1/6" });
  }
  rest = Math.max(0, rest);
  if (far) {
    const units = v.sons * 2 + v.daughters;
    if (units > 0 && rest > 0) {
      const unit = (v.estate * rest) / units;
      if (v.sons) out.push({ ar: `الأبناء (${v.sons})`, en: `Sons (${v.sons})`, amount: unit * 2 * v.sons, note: "2×" });
      if (v.daughters) out.push({ ar: `البنات (${v.daughters})`, en: `Daughters (${v.daughters})`, amount: unit * v.daughters, note: "1×" });
    }
  } else if (v.father) {
    out.push({ ar: "الأب (عصبة)", en: "Father (residue)", amount: v.estate * rest, note: "asaba" });
    rest = 0;
  } else if (rest > 0.0001) {
    out.push({ ar: "الباقي", en: "Remainder", amount: v.estate * rest, note: "—" });
  }
  return out.filter((s) => s.amount > 0.005);
}

export function FaraidApp() {
  const lang = useAppStore((s) => s.lang);
  const [v, setV] = usePersistent<Form>("waha:faraid", empty);
  const shares = compute(v);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const loc = lang === "ar" ? "ar-SA" : "en-SA";

  function num(key: "estate" | "sons" | "daughters") {
    return (
      <Input
        type="number"
        min={0}
        value={v[key]}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setV({ ...v, [key]: Number(e.target.value) || 0 })}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {L("توزيع مبسّط للحالات الشائعة: زوج/زوجة، أبوان، وأولاد. ليس فتوى.", "A simple split for common cases: spouse, parents, and children. Not a fatwa.")}
      </p>
      <label className="block max-w-xs text-sm">
        <span className="mb-1 block text-muted">{L("التركة (ريال)", "Estate (SAR)")}</span>
        {num("estate")}
      </label>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
        <button type="button" className={cn("h-11 rounded-md text-sm", v.deceased === "m" ? "bg-surface-2" : "text-muted")} onClick={() => setV({ ...v, deceased: "m" })}>
          {L("المتوفّى رجل", "Deceased is male")}
        </button>
        <button type="button" className={cn("h-11 rounded-md text-sm", v.deceased === "f" ? "bg-surface-2" : "text-muted")} onClick={() => setV({ ...v, deceased: "f" })}>
          {L("المتوفّاة امرأة", "Deceased is female")}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle on={v.spouse} label={L("زوج/زوجة على قيد الحياة", "Surviving spouse")} onClick={() => setV({ ...v, spouse: !v.spouse })} yes={L("نعم", "Yes")} no={L("لا", "No")} />
        <Toggle on={v.father} label={L("الأب حي", "Father living")} onClick={() => setV({ ...v, father: !v.father })} yes={L("نعم", "Yes")} no={L("لا", "No")} />
        <Toggle on={v.mother} label={L("الأم حيّة", "Mother living")} onClick={() => setV({ ...v, mother: !v.mother })} yes={L("نعم", "Yes")} no={L("لا", "No")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("عدد الأبناء", "Sons")}</span>
          {num("sons")}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("عدد البنات", "Daughters")}</span>
          {num("daughters")}
        </label>
      </div>
      <ul className="space-y-2">
        {shares.map((s) => (
          <li key={s.en} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <div>
              <p className="font-medium">{lang === "ar" ? s.ar : s.en}</p>
              <p className="text-xs text-muted">{s.note}</p>
            </div>
            <p className="font-mono tabular-nums">{s.amount.toLocaleString(loc, { maximumFractionDigits: 0 })} SAR</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({ on, label, onClick, yes, no }: { on: boolean; label: string; onClick: () => void; yes: string; no: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-12 items-center justify-between rounded-xl border px-4 text-start text-sm", on ? "border-primary bg-surface-2" : "border-border bg-surface")}
    >
      <span>{label}</span>
      <span className={cn("text-xs", on ? "text-primary" : "text-muted")}>{on ? yes : no}</span>
    </button>
  );
}
