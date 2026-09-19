import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { locPair } from "@/lib/locale";
import { useAppStore } from "@/store/app-store";

type Cat = "length" | "mass" | "temp" | "area" | "volume" | "speed";

const CATS: Record<Cat, { ar: string; en: string; units: { id: string; ar: string; en: string; toBase: (n: number) => number; fromBase: (n: number) => number }[] }> = {
  length: {
    ar: "طول",
    en: "Length",
    units: [
      { id: "m", ar: "متر", en: "m", toBase: (n) => n, fromBase: (n) => n },
      { id: "km", ar: "كم", en: "km", toBase: (n) => n * 1000, fromBase: (n) => n / 1000 },
      { id: "mi", ar: "ميل", en: "mi", toBase: (n) => n * 1609.344, fromBase: (n) => n / 1609.344 },
      { id: "ft", ar: "قدم", en: "ft", toBase: (n) => n * 0.3048, fromBase: (n) => n / 0.3048 },
    ],
  },
  mass: {
    ar: "كتلة",
    en: "Mass",
    units: [
      { id: "kg", ar: "كغ", en: "kg", toBase: (n) => n, fromBase: (n) => n },
      { id: "g", ar: "غ", en: "g", toBase: (n) => n / 1000, fromBase: (n) => n * 1000 },
      { id: "lb", ar: "رطل", en: "lb", toBase: (n) => n * 0.453592, fromBase: (n) => n / 0.453592 },
    ],
  },
  temp: {
    ar: "حرارة",
    en: "Temp",
    units: [
      { id: "c", ar: "مئوية", en: "°C", toBase: (n) => n, fromBase: (n) => n },
      { id: "f", ar: "فهرنهايت", en: "°F", toBase: (n) => ((n - 32) * 5) / 9, fromBase: (n) => (n * 9) / 5 + 32 },
      { id: "k", ar: "كلفن", en: "K", toBase: (n) => n - 273.15, fromBase: (n) => n + 273.15 },
    ],
  },
  area: {
    ar: "مساحة",
    en: "Area",
    units: [
      { id: "m2", ar: "م²", en: "m²", toBase: (n) => n, fromBase: (n) => n },
      { id: "ft2", ar: "قدم²", en: "ft²", toBase: (n) => n * 0.092903, fromBase: (n) => n / 0.092903 },
    ],
  },
  volume: {
    ar: "حجم",
    en: "Volume",
    units: [
      { id: "l", ar: "لتر", en: "L", toBase: (n) => n, fromBase: (n) => n },
      { id: "gal", ar: "غالون", en: "gal", toBase: (n) => n * 3.78541, fromBase: (n) => n / 3.78541 },
    ],
  },
  speed: {
    ar: "سرعة",
    en: "Speed",
    units: [
      { id: "kmh", ar: "كم/س", en: "km/h", toBase: (n) => n, fromBase: (n) => n },
      { id: "mph", ar: "ميل/س", en: "mph", toBase: (n) => n * 1.60934, fromBase: (n) => n / 1.60934 },
    ],
  },
};

export function UnitsApp() {
  const lang = useAppStore((s) => s.lang);
  const [cat, setCat] = useState<Cat>("length");
  const pack = CATS[cat];
  const [from, setFrom] = useState(pack.units[0]!.id);
  const [to, setTo] = useState(pack.units[1]!.id);
  const [val, setVal] = useState(1);

  const out = useMemo(() => {
    const a = pack.units.find((u) => u.id === from);
    const b = pack.units.find((u) => u.id === to);
    if (!a || !b) return 0;
    return b.fromBase(a.toBase(val));
  }, [pack, from, to, val]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATS) as Cat[]).map((c) => (
          <button
            key={c}
            type="button"
            className={`h-11 rounded-md border px-3 text-sm ${c === cat ? "border-primary bg-surface-2" : "border-border bg-surface"}`}
            onClick={() => {
              setCat(c);
              setFrom(CATS[c].units[0]!.id);
              setTo(CATS[c].units[1]!.id);
            }}
          >
            {locPair(lang, CATS[c])}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">{lang === "ar" ? "من" : "From"}</span>
          <select className="mb-2 h-11 w-full rounded-md border border-border bg-surface px-2" value={from} onChange={(e) => setFrom(e.target.value)}>
            {pack.units.map((u) => (
              <option key={u.id} value={u.id}>
                {locPair(lang, u)}
              </option>
            ))}
          </select>
          <Input type="number" value={val} onChange={(e) => setVal(Number(e.target.value))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">{lang === "ar" ? "إلى" : "To"}</span>
          <select className="mb-2 h-11 w-full rounded-md border border-border bg-surface px-2" value={to} onChange={(e) => setTo(e.target.value)}>
            {pack.units.map((u) => (
              <option key={u.id} value={u.id}>
                {locPair(lang, u)}
              </option>
            ))}
          </select>
          <div className="flex h-11 items-center rounded-md border border-border bg-surface px-3 font-mono tabular-nums">{out.toPrecision(6)}</div>
        </label>
      </div>
    </div>
  );
}
