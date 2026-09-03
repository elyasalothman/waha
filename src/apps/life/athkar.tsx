import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

type Store = { date: string; morning: string[]; evening: string[] };

const MORNING = [
  { id: "kursi", ar: "آية الكرسي", en: "Ayat al-Kursi" },
  { id: "asbahna", ar: "اللهم بك أصبحنا وبك أمسينا", en: "Allahumma bika asbahna" },
  { id: "sayyid", ar: "سيد الاستغفار", en: "Sayyid al-istighfar" },
  { id: "subhan100", ar: "سبحان الله وبحمده (١٠٠)", en: "Subhan Allah wa bihamdih (100)" },
  { id: "tahlil", ar: "لا إله إلا الله وحده لا شريك له (١٠)", en: "La ilaha illa Allah, ten times" },
  { id: "afiya", ar: "اللهم إني أسألك العافية في الدنيا والآخرة", en: "Allahumma inni as’aluka al-afiyah" },
  { id: "kalimat", ar: "أعوذ بكلمات الله التامات من شر ما خلق", en: "A’udhu bi kalimat Allah" },
  { id: "hasbi", ar: "حسبي الله لا إله إلا هو عليه توكلت", en: "Hasbiya Allah, la ilaha illa huwa" },
];

const EVENING = [
  { id: "kursi", ar: "آية الكرسي", en: "Ayat al-Kursi" },
  { id: "amsayna", ar: "اللهم بك أمسينا وبك أصبحنا", en: "Allahumma bika amsayna" },
  { id: "sayyid", ar: "سيد الاستغفار", en: "Sayyid al-istighfar" },
  { id: "subhan100", ar: "سبحان الله وبحمده (١٠٠)", en: "Subhan Allah wa bihamdih (100)" },
  { id: "tahlil", ar: "لا إله إلا الله وحده لا شريك له (١٠)", en: "La ilaha illa Allah, ten times" },
  { id: "afiya", ar: "اللهم إني أسألك العافية في الدنيا والآخرة", en: "Allahumma inni as’aluka al-afiyah" },
  { id: "kalimat", ar: "أعوذ بكلمات الله التامات من شر ما خلق", en: "A’udhu bi kalimat Allah" },
  { id: "hasbi", ar: "حسبي الله لا إله إلا هو عليه توكلت", en: "Hasbiya Allah, la ilaha illa huwa" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AthkarApp() {
  const lang = useAppStore((s) => s.lang);
  const [store, setStore] = usePersistent<Store>("waha:athkar", { date: today(), morning: [], evening: [] });
  const date = today();
  const morning = store.date === date ? store.morning : [];
  const evening = store.date === date ? store.evening : [];
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function toggle(which: "morning" | "evening", id: string) {
    const list = which === "morning" ? morning : evening;
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    setStore({
      date,
      morning: which === "morning" ? next : morning,
      evening: which === "evening" ? next : evening,
    });
  }

  return (
    <div className="space-y-8">
      <Section
        title={L("أذكار الصباح", "Morning")}
        done={morning.length}
        total={MORNING.length}
        items={MORNING}
        checked={morning}
        lang={lang}
        onToggle={(id) => toggle("morning", id)}
      />
      <Section
        title={L("أذكار المساء", "Evening")}
        done={evening.length}
        total={EVENING.length}
        items={EVENING}
        checked={evening}
        lang={lang}
        onToggle={(id) => toggle("evening", id)}
      />
    </div>
  );
}

function Section({
  title,
  done,
  total,
  items,
  checked,
  lang,
  onToggle,
}: {
  title: string;
  done: number;
  total: number;
  items: { id: string; ar: string; en: string }[];
  checked: string[];
  lang: "ar" | "en";
  onToggle: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm tabular-nums text-muted">
          {done}/{total}
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const on = checked.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={cn(
                "flex min-h-14 w-full items-center justify-between rounded-xl border px-4 py-3 text-start",
                on ? "border-primary bg-surface-2" : "border-border bg-surface",
              )}
            >
              <span className="text-sm leading-relaxed">{lang === "ar" ? item.ar : item.en}</span>
              <span className={cn("ms-3 shrink-0 text-xs", on ? "text-primary" : "text-muted")}>
                {on ? (lang === "ar" ? "تمّ" : "Done") : lang === "ar" ? "افتح" : "Open"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
