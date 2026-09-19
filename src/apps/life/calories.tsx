import { Input } from "@/components/ui/input";
import { Seg } from "@/components/seg";
import { usePersistent } from "@/lib/storage";
import { pairLang } from "@/lib/locale";
import { useAppStore } from "@/store/app-store";

type Sex = "m" | "f";
type Act = "sed" | "light" | "mid" | "high";

const ACT: Record<Act, number> = { sed: 1.2, light: 1.375, mid: 1.55, high: 1.725 };

export function CaloriesApp() {
  const lang = pairLang(useAppStore((s) => s.lang));
  const [sex, setSex] = usePersistent<Sex>("waha:cal-sex", "m");
  const [age, setAge] = usePersistent("waha:cal-age", 30);
  const [cm, setCm] = usePersistent("waha:cal-cm", 170);
  const [kg, setKg] = usePersistent("waha:cal-kg", 75);
  const [act, setAct] = usePersistent<Act>("waha:cal-act", "light");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const bmr = sex === "m" ? 10 * kg + 6.25 * cm - 5 * age + 5 : 10 * kg + 6.25 * cm - 5 * age - 161;
  const tdee = Math.round(bmr * ACT[act]);
  const lose = tdee - 500;
  const gain = tdee + 300;

  return (
    <div className="space-y-4">
      <Seg
        lang={lang}
        value={sex}
        onChange={setSex}
        options={[
          { id: "m", ar: "رجل", en: "Male" },
          { id: "f", ar: "امرأة", en: "Female" },
        ]}
      />
      <div className="grid grid-cols-3 gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">{L("العمر", "Age")}</span>
          <Input type="number" min={12} max={90} value={age} onChange={(e) => setAge(Number(e.target.value) || 0)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">{L("الطول سم", "Height cm")}</span>
          <Input type="number" min={120} max={220} value={cm} onChange={(e) => setCm(Number(e.target.value) || 0)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">{L("الوزن كجم", "Weight kg")}</span>
          <Input type="number" min={35} max={250} value={kg} onChange={(e) => setKg(Number(e.target.value) || 0)} />
        </label>
      </div>
      <Seg
        lang={lang}
        value={act}
        onChange={setAct}
        options={[
          { id: "sed", ar: "جلوس", en: "Desk" },
          { id: "light", ar: "خفيف", en: "Light" },
          { id: "mid", ar: "متوسط", en: "Moderate" },
          { id: "high", ar: "مرتفع", en: "High" },
        ]}
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label={L("للثبات", "Maintain")} value={tdee} lang={lang} />
        <Stat label={L("لنقص هادئ", "Gentle loss")} value={Math.max(1200, lose)} lang={lang} />
        <Stat label={L("لزيادة", "Gain")} value={gain} lang={lang} />
      </div>
      <p className="text-xs text-subtle">{L("معادلة ميفلين — تقدير لا يغني عن أخصائي.", "Mifflin–St Jeor — an estimate, not clinical advice.")}</p>
    </div>
  );
}

function Stat({ label, value, lang }: { label: string; value: number; lang: "ar" | "en" }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl tabular-nums">{Math.round(value)}</p>
      <p className="text-xs text-subtle">{lang === "ar" ? "سعرة / يوم" : "kcal / day"}</p>
    </div>
  );
}
