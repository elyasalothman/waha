import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { locPair } from "@/lib/locale";
import { useAppStore } from "@/store/app-store";

export function BmiApp() {
  const lang = useAppStore((s) => s.lang);
  const [cm, setCm] = useState(170);
  const [kg, setKg] = useState(70);
  const bmi = useMemo(() => (cm > 0 ? kg / (cm / 100) ** 2 : 0), [cm, kg]);
  const cat =
    bmi < 18.5
      ? { ar: "نقص وزن", en: "Underweight" }
      : bmi < 25
        ? { ar: "طبيعي", en: "Normal" }
        : bmi < 30
          ? { ar: "زيادة", en: "Overweight" }
          : { ar: "سمنة", en: "Obese" };

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{lang === "ar" ? "الطول (سم)" : "Height (cm)"}</span>
        <Input type="number" value={cm} onChange={(e) => setCm(Number(e.target.value))} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{lang === "ar" ? "الوزن (كغ)" : "Weight (kg)"}</span>
        <Input type="number" value={kg} onChange={(e) => setKg(Number(e.target.value))} />
      </label>
      <p className="font-display text-4xl tabular-nums">{bmi.toFixed(1)}</p>
      <p className="text-muted">{locPair(lang, cat)}</p>
    </div>
  );
}
