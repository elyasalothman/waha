import { EmergencyStrip } from "@/components/emergency-strip";
import { useAppStore } from "@/store/app-store";

const NUMBERS = [
  { n: "911", ar: "الطوارئ الموحد", en: "Unified emergency" },
  { n: "997", ar: "الهلال الأحمر", en: "Saudi Red Crescent" },
  { n: "998", ar: "الدفاع المدني", en: "Civil Defense" },
  { n: "999", ar: "الشرطة", en: "Police" },
  { n: "993", ar: "المرور", en: "Traffic" },
  { n: "937", ar: "صحة ٩٣٧", en: "Seha 937" },
  { n: "933", ar: "الشركة السعودية للكهرباء", en: "Saudi Electricity" },
];

export function EmergencyApp() {
  const lang = useAppStore((s) => s.lang);
  return (
    <div className="space-y-2">
      <EmergencyStrip lang={lang} />
      <p className="mb-3 text-sm text-muted">
        {lang === "ar" ? "اضغط الرقم للاتصال من هاتفك." : "Tap a number to call from your phone."}
      </p>
      {NUMBERS.map((row) => (
        <a
          key={row.n}
          href={`tel:${row.n}`}
          className="flex h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 hover:bg-surface-2"
        >
          <span>{lang === "ar" ? row.ar : row.en}</span>
          <span className="font-mono text-lg tabular-nums text-primary">{row.n}</span>
        </a>
      ))}
    </div>
  );
}
