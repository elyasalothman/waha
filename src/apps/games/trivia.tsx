import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { t } from "@/lib/i18n";
import { locPair } from "@/lib/locale";
import { writeScore } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Q = { ar: string; en: string; choices: { ar: string; en: string }[]; answer: number };

const QS: Q[] = [
  { ar: "عاصمة المملكة العربية السعودية؟", en: "Capital of Saudi Arabia?", choices: [{ ar: "جدة", en: "Jeddah" }, { ar: "الرياض", en: "Riyadh" }, { ar: "الدمام", en: "Dammam" }, { ar: "أبها", en: "Abha" }], answer: 1 },
  { ar: "أين تقع الكعبة المشرفة؟", en: "Where is the Kaaba?", choices: [{ ar: "المدينة", en: "Madinah" }, { ar: "الطائف", en: "Taif" }, { ar: "مكة", en: "Makkah" }, { ar: "جدة", en: "Jeddah" }], answer: 2 },
  { ar: "عدد أركان الإسلام؟", en: "How many pillars of Islam?", choices: [{ ar: "ثلاثة", en: "Three" }, { ar: "أربعة", en: "Four" }, { ar: "خمسة", en: "Five" }, { ar: "ستة", en: "Six" }], answer: 2 },
  { ar: "أكبر محيط على الأرض؟", en: "Largest ocean?", choices: [{ ar: "الأطلسي", en: "Atlantic" }, { ar: "الهندي", en: "Indian" }, { ar: "الهادئ", en: "Pacific" }, { ar: "المتجمد", en: "Arctic" }], answer: 2 },
  { ar: "العنصر الكيميائي للماء؟", en: "Chemical formula of water?", choices: [{ ar: "CO2", en: "CO2" }, { ar: "H2O", en: "H2O" }, { ar: "O2", en: "O2" }, { ar: "NaCl", en: "NaCl" }], answer: 1 },
  { ar: "أسرع حيوان بري؟", en: "Fastest land animal?", choices: [{ ar: "الأسد", en: "Lion" }, { ar: "الفهد", en: "Cheetah" }, { ar: "الحصان", en: "Horse" }, { ar: "الظبي", en: "Gazelle" }], answer: 1 },
  { ar: "عملة السعودية؟", en: "Currency of Saudi Arabia?", choices: [{ ar: "الدرهم", en: "Dirham" }, { ar: "الريال", en: "Riyal" }, { ar: "الدينار", en: "Dinar" }, { ar: "الجنيه", en: "Pound" }], answer: 1 },
  { ar: "أعلى جبل في العالم؟", en: "Highest mountain?", choices: [{ ar: "كينيا", en: "Kenya" }, { ar: "إفرست", en: "Everest" }, { ar: "كليمنجارو", en: "Kilimanjaro" }, { ar: "الألب", en: "Alps" }], answer: 1 },
  { ar: "كم يوماً في السنة الميلادية غير الكبيسة؟", en: "Days in a common year?", choices: [{ ar: "364", en: "364" }, { ar: "365", en: "365" }, { ar: "366", en: "366" }, { ar: "360", en: "360" }], answer: 1 },
  { ar: "اللون الناتج عن مزج الأزرق والأصفر؟", en: "Blue mixed with yellow?", choices: [{ ar: "أحمر", en: "Red" }, { ar: "أخضر", en: "Green" }, { ar: "بنفسجي", en: "Purple" }, { ar: "برتقالي", en: "Orange" }], answer: 1 },
  { ar: "أول خليفة في الإسلام؟", en: "First caliph in Islam?", choices: [{ ar: "عمر", en: "Umar" }, { ar: "أبو بكر", en: "Abu Bakr" }, { ar: "عثمان", en: "Uthman" }, { ar: "علي", en: "Ali" }], answer: 1 },
  { ar: "قارة أستراليا أيضاً تُعد…", en: "Australia is also a…", choices: [{ ar: "دولة وجزيرة", en: "Country and island" }, { ar: "بحراً", en: "Sea" }, { ar: "نهراً", en: "River" }, { ar: "محيطاً", en: "Ocean" }], answer: 0 },
  { ar: "سرعة الضوء تقريباً؟", en: "Speed of light is about?", choices: [{ ar: "300 كم/ث", en: "300 km/s" }, { ar: "300 ألف كم/ث", en: "300,000 km/s" }, { ar: "3 كم/ث", en: "3 km/s" }, { ar: "30 كم/ث", en: "30 km/s" }], answer: 1 },
  { ar: "نهر النيل يصب في؟", en: "The Nile flows into the?", choices: [{ ar: "الأحمر", en: "Red Sea" }, { ar: "المتوسط", en: "Mediterranean" }, { ar: "الأطلسي", en: "Atlantic" }, { ar: "الخليج", en: "Gulf" }], answer: 1 },
  { ar: "جسم الإنسان فيه تقريباً كم عظمة للبالغ؟", en: "Adult human bones?", choices: [{ ar: "106", en: "106" }, { ar: "206", en: "206" }, { ar: "306", en: "306" }, { ar: "156", en: "156" }], answer: 1 },
  { ar: "أكبر صحراء حارة؟", en: "Largest hot desert?", choices: [{ ar: "الربع الخالي", en: "Empty Quarter" }, { ar: "الصحراء الكبرى", en: "Sahara" }, { ar: "جوبي", en: "Gobi" }, { ar: "نفود", en: "Nafud" }], answer: 1 },
  { ar: "وحدة قياس القوة؟", en: "SI unit of force?", choices: [{ ar: "واط", en: "Watt" }, { ar: "نيوتن", en: "Newton" }, { ar: "جول", en: "Joule" }, { ar: "باسكال", en: "Pascal" }], answer: 1 },
  { ar: "متى تُؤدى صلاة الفجر؟", en: "When is Fajr prayed?", choices: [{ ar: "بعد الشروق", en: "After sunrise" }, { ar: "قبل الشروق", en: "Before sunrise" }, { ar: "الظهر", en: "Noon" }, { ar: "الغروب", en: "Sunset" }], answer: 1 },
  { ar: "عاصمة فرنسا؟", en: "Capital of France?", choices: [{ ar: "ليون", en: "Lyon" }, { ar: "باريس", en: "Paris" }, { ar: "مارسيليا", en: "Marseille" }, { ar: "نيس", en: "Nice" }], answer: 1 },
  { ar: "كم كوكباً في المجموعة الشمسية؟", en: "Planets in the solar system?", choices: [{ ar: "سبعة", en: "Seven" }, { ar: "ثمانية", en: "Eight" }, { ar: "تسعة", en: "Nine" }, { ar: "عشرة", en: "Ten" }], answer: 1 },
  { ar: "الحج ركن من أركان الإسلام يجب على…", en: "Hajj is obligatory for those who are…", choices: [{ ar: "كل طفل", en: "Every child" }, { ar: "المستطيع", en: "Able to afford it" }, { ar: "المسافر فقط", en: "Travelers only" }, { ar: "الرجال دون النساء", en: "Men only" }], answer: 1 },
  { ar: "الغاز الأكثر في الهواء؟", en: "Most abundant gas in air?", choices: [{ ar: "أكسجين", en: "Oxygen" }, { ar: "نيتروجين", en: "Nitrogen" }, { ar: "كربون", en: "Carbon" }, { ar: "هيليوم", en: "Helium" }], answer: 1 },
  { ar: "مضيق يربط البحر الأحمر بخليج عدن؟", en: "Strait linking Red Sea to Gulf of Aden?", choices: [{ ar: "هرمز", en: "Hormuz" }, { ar: "باب المندب", en: "Bab al-Mandab" }, { ar: "جبل طارق", en: "Gibraltar" }, { ar: "البوسفور", en: "Bosphorus" }], answer: 1 },
  { ar: "اللغة الرسمية في البرازيل؟", en: "Official language of Brazil?", choices: [{ ar: "إسبانية", en: "Spanish" }, { ar: "برتغالية", en: "Portuguese" }, { ar: "فرنسية", en: "French" }, { ar: "إنجليزية", en: "English" }], answer: 1 },
];

export function TriviaApp() {
  const lang = useAppStore((s) => s.lang);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = QS[i];
  const finished = i >= QS.length;

  function pick(n: number) {
    if (picked != null || !q) return;
    setPicked(n);
    if (n === q.answer) setScore((s) => s + 1);
  }

  function next() {
    setI((x) => x + 1);
    setPicked(null);
  }

  useEffect(() => {
    if (i >= QS.length) writeScore("trivia", score);
  }, [i, score]);

  if (finished) {
    return (
      <div className="space-y-4">
        <Stat label={t(lang, "score")} value={`${score} / ${QS.length}`} />
        <Button
          onClick={() => {
            setI(0);
            setScore(0);
            setPicked(null);
          }}
        >
          {t(lang, "newGame")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Stat label={lang === "ar" ? "سؤال" : "Question"} value={`${i + 1} / ${QS.length}`} />
      <p className="text-lg font-medium">{locPair(lang, q!)}</p>
      <div className="grid gap-2">
        {q!.choices.map((c, n) => {
          const show = picked != null;
          const good = n === q!.answer;
          return (
            <button
              key={n}
              type="button"
              onClick={() => pick(n)}
              className={cn(
                "min-h-11 rounded-lg border px-3 py-2 text-start",
                show && good && "border-success bg-success/15",
                show && picked === n && !good && "border-danger bg-danger/15",
                !show && "border-border bg-surface hover:bg-surface-2",
              )}
            >
              {locPair(lang, c)}
            </button>
          );
        })}
      </div>
      {picked != null ? (
        <Button onClick={next}>{i + 1 === QS.length ? (lang === "ar" ? "النتيجة" : "Results") : lang === "ar" ? "التالي" : "Next"}</Button>
      ) : null}
    </div>
  );
}
