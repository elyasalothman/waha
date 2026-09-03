import { Seg } from "@/components/seg";
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";
import { useState } from "react";

const MANASIK: { id: string; ar: string; en: string; noteAr?: string; noteEn?: string }[] = [
  { id: "ihram", ar: "الإحرام", en: "Ihram", noteAr: "النية والغسل والتلبية من الميقات.", noteEn: "Intention, ghusl, and talbiyah from the miqat." },
  { id: "tawaf", ar: "طواف العمرة", en: "Tawaf", noteAr: "سبعة أشواط تبدأ من الحجر الأسود، البيت عن يسارك.", noteEn: "Seven circuits from the Black Stone, Kaaba on your left." },
  { id: "pray", ar: "ركعتان خلف المقام", en: "Two rak‘ahs", noteAr: "خلف مقام إبراهيم إن تيسر، وإلا في أي موضع.", noteEn: "Behind Maqam Ibrahim if you can, otherwise anywhere in the mosque." },
  { id: "sai", ar: "السعي", en: "Sa‘i", noteAr: "سبعة أشواط بين الصفا والمروة، تبدأ من الصفا.", noteEn: "Seven legs between Safa and Marwah, starting at Safa." },
  { id: "halq", ar: "الحلق أو التقصير", en: "Shaving or shortening", noteAr: "الحلق أفضل للرجال، والتقصير للنساء أنملة.", noteEn: "Shaving is better for men; women shorten by a fingertip." },
];

const PACK: { id: string; ar: string; en: string; noteAr?: string; noteEn?: string }[] = [
  { id: "ihram-c", ar: "إحرام أبيض (للرجال)", en: "White ihram (men)" },
  { id: "slippers", ar: "نعال غير مخيط ظاهر القدم", en: "Open slippers" },
  { id: "soap", ar: "صابون ومسواك بلا طيب", en: "Unscented soap and a miswak" },
  { id: "bag", ar: "حقيبة صغيرة وماء", en: "Small bag and water" },
  { id: "docs", ar: "هوية / جواز وتصريح نسك", en: "ID / passport and Nusuk permit" },
  { id: "meds", ar: "أدوية مزمنة ومسكن خفيف", en: "Regular meds and a mild painkiller" },
  { id: "phone", ar: "شاحن وجوّال فيه نسك", en: "Charger and a phone with Nusuk" },
  { id: "women", ar: "لباس ساتر غير معطّر (للنساء)", en: "Modest unscented clothing (women)" },
];

export function UmrahApp() {
  const lang = useAppStore((s) => s.lang);
  const [tab, setTab] = useState<"manasik" | "pack">("manasik");
  const [done, setDone] = usePersistent<string[]>("waha:umrah", []);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function toggle(id: string) {
    setDone(done.includes(id) ? done.filter((x) => x !== id) : [...done, id]);
  }

  const items = tab === "manasik" ? MANASIK : PACK;

  return (
    <div className="space-y-4">
      <Seg
        lang={lang}
        value={tab}
        onChange={setTab}
        options={[
          { id: "manasik", ar: "المناسك", en: "Rites" },
          { id: "pack", ar: "العدة", en: "Packing" },
        ]}
      />
      <ul className="space-y-2">
        {items.map((item) => {
          const on = done.includes(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full min-h-14 items-start gap-3 rounded-xl border px-4 py-3 text-start",
                  on ? "border-primary bg-surface-2" : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                <span className={cn("mt-1 size-4 shrink-0 rounded-sm border", on ? "border-primary bg-primary" : "border-border")} />
                <span>
                  <span className="block font-medium">{lang === "ar" ? item.ar : item.en}</span>
                  {item.noteAr ? (
                    <span className="mt-1 block text-sm text-muted">{lang === "ar" ? item.noteAr : item.noteEn}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-subtle">
        {L("للتذكير فقط — راجع نسك والمسؤولين على الحرم للتفاصيل.", "A reminder only — check Nusuk and on-site guidance for details.")}
      </p>
    </div>
  );
}
