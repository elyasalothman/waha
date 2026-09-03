import { Button } from "@/components/ui/button";
import { speak } from "@/lib/speak";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";
import { useState } from "react";

const LETTERS = [
  { ch: "ا", name: "ألف", en: "Alif", word: "أسد" },
  { ch: "ب", name: "باء", en: "Ba", word: "بيت" },
  { ch: "ت", name: "تاء", en: "Ta", word: "تمر" },
  { ch: "ث", name: "ثاء", en: "Tha", word: "ثلج" },
  { ch: "ج", name: "جيم", en: "Jeem", word: "جمل" },
  { ch: "ح", name: "حاء", en: "Ha", word: "حوت" },
  { ch: "خ", name: "خاء", en: "Kha", word: "خروف" },
  { ch: "د", name: "دال", en: "Dal", word: "دب" },
  { ch: "ذ", name: "ذال", en: "Dhal", word: "ذئب" },
  { ch: "ر", name: "راء", en: "Ra", word: "رمان" },
  { ch: "ز", name: "زاي", en: "Zay", word: "زرافة" },
  { ch: "س", name: "سين", en: "Seen", word: "سمك" },
  { ch: "ش", name: "شين", en: "Sheen", word: "شمس" },
  { ch: "ص", name: "صاد", en: "Sad", word: "صقر" },
  { ch: "ض", name: "ضاد", en: "Dad", word: "ضفدع" },
  { ch: "ط", name: "طاء", en: "Ta", word: "طائر" },
  { ch: "ظ", name: "ظاء", en: "Zha", word: "ظبي" },
  { ch: "ع", name: "عين", en: "Ayn", word: "عنب" },
  { ch: "غ", name: "غين", en: "Ghayn", word: "غزال" },
  { ch: "ف", name: "فاء", en: "Fa", word: "فيل" },
  { ch: "ق", name: "قاف", en: "Qaf", word: "قمر" },
  { ch: "ك", name: "كاف", en: "Kaf", word: "كتاب" },
  { ch: "ل", name: "لام", en: "Lam", word: "لبن" },
  { ch: "م", name: "ميم", en: "Meem", word: "ماء" },
  { ch: "ن", name: "نون", en: "Noon", word: "نخل" },
  { ch: "ه", name: "هاء", en: "Ha", word: "هلال" },
  { ch: "و", name: "واو", en: "Waw", word: "ورد" },
  { ch: "ي", name: "ياء", en: "Ya", word: "يد" },
];

export function LettersApp() {
  const lang = useAppStore((s) => s.lang);
  const [i, setI] = useState(0);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const cur = LETTERS[i]!;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => speak(`${cur.name}. ${cur.word}`, "ar")}
        className="flex w-full flex-col items-center rounded-xl border border-border bg-surface py-10 hover:bg-surface-2"
      >
        <span className="font-display text-8xl leading-none">{cur.ch}</span>
        <span className="mt-4 text-xl">{cur.name}</span>
        <span className="mt-1 text-sm text-muted">{cur.en}</span>
        <span className="mt-4 text-2xl text-primary">{cur.word}</span>
      </button>
      <div className="flex justify-center gap-2">
        <Button variant="secondary" onClick={() => setI((v) => (v + LETTERS.length - 1) % LETTERS.length)}>
          {L("السابق", "Prev")}
        </Button>
        <Button onClick={() => speak(`${cur.name}. ${cur.word}`, "ar")}>{L("استمع", "Listen")}</Button>
        <Button variant="secondary" onClick={() => setI((v) => (v + 1) % LETTERS.length)}>
          {L("التالي", "Next")}
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {LETTERS.map((l, idx) => (
          <button
            key={l.ch}
            type="button"
            onClick={() => setI(idx)}
            className={cn(
              "flex size-10 items-center justify-center rounded-md text-lg",
              idx === i ? "bg-primary text-primary-fg" : "bg-surface text-fg hover:bg-surface-2",
            )}
          >
            {l.ch}
          </button>
        ))}
      </div>
    </div>
  );
}
