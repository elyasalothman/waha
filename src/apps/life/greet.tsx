import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Seg } from "@/components/seg";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const OCCASIONS = [
  { id: "friday", ar: "جمعة مباركة", en: "Blessed Friday", lineAr: "جمعة مباركة عليكم، يتقبّل الله منكم صالح الأعمال.", lineEn: "A blessed Friday to you — may God accept the good you do." },
  { id: "national", ar: "اليوم الوطني", en: "National Day", lineAr: "دام عزّك يا وطن. كل عام وأنت بخير يا السعودية.", lineEn: "Glory to the homeland. Happy National Day, Saudi Arabia." },
  { id: "founding", ar: "يوم التأسيس", en: "Founding Day", lineAr: "يوم تأسيس مجيد… أصلٌ واحد وراية خفاقة.", lineEn: "A glorious Founding Day — one root, one banner." },
  { id: "ramadan", ar: "رمضان", en: "Ramadan", lineAr: "رمضان كريم، كل عام وأنتم بخير.", lineEn: "Ramadan kareem — a blessed month to you." },
  { id: "fitr", ar: "عيد الفطر", en: "Eid al-Fitr", lineAr: "عيدكم مبارك، تقبّل الله طاعتكم وأعاده عليكم باليمن.", lineEn: "Blessed Eid — may God accept your worship." },
  { id: "adha", ar: "عيد الأضحى", en: "Eid al-Adha", lineAr: "عيد أضحى مبارك، حج مبرور وذنب مغفور.", lineEn: "Blessed Eid al-Adha — an accepted pilgrimage and forgiven sins." },
  { id: "birthday", ar: "عيد ميلاد", en: "Birthday", lineAr: "كل عام وأنت بخير، عمر مديد وعمل سديد.", lineEn: "Happy birthday — a long life and sound work." },
  { id: "baby", ar: "مواليد", en: "New baby", lineAr: "بارك الله لكم في المولود، وجعله من الصالحين.", lineEn: "May God bless the newborn and make them among the righteous." },
  { id: "grad", ar: "تخرج", en: "Graduation", lineAr: "ألف مبارك التخرج، وخطوات موفقة فيما بعد.", lineEn: "Congratulations on graduating — may the next steps be guided." },
  { id: "thanks", ar: "شكر", en: "Thanks", lineAr: "شكراً من القلب، جزاك الله خيراً.", lineEn: "Thank you from the heart — may God reward you." },
] as const;

type OccId = (typeof OCCASIONS)[number]["id"];

export function GreetApp() {
  const lang = useAppStore((s) => s.lang);
  const [occ, setOcc] = useState<OccId>("national");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const item = OCCASIONS.find((o) => o.id === occ) ?? OCCASIONS[0];
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const body = lang === "ar" ? item.lineAr : item.lineEn;
  const title = lang === "ar" ? item.ar : item.en;
  const text = useMemo(() => {
    const who = to.trim() ? (lang === "ar" ? `يا ${to.trim()}، ` : `${to.trim()}, `) : "";
    const sign = from.trim() ? (lang === "ar" ? `\n\n— ${from.trim()}` : `\n\n— ${from.trim()}`) : "";
    return `${who}${body}${sign}`;
  }, [to, from, body, lang]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t(lang, "copied"));
    } catch {
      toast.error(t(lang, "error"));
    }
  }

  return (
    <div className="space-y-4">
      <Seg
        lang={lang}
        value={occ}
        onChange={setOcc}
        options={OCCASIONS.map((o) => ({ id: o.id, ar: o.ar, en: o.en }))}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("إلى", "To")}</span>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder={L("الاسم (اختياري)", "Name (optional)")} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{L("من", "From")}</span>
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder={L("توقيعك", "Your name")} />
        </label>
      </div>
      <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
        <p className="text-xs tracking-wide text-muted">{title}</p>
        <p className="mt-6 font-display text-3xl leading-snug md:text-4xl">{text}</p>
      </div>
      <Button onClick={copy} className="w-full sm:w-auto">
        {t(lang, "copy")}
      </Button>
    </div>
  );
}
