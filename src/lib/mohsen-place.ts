import { continueReading } from "./books/continue-reading.ts";
import { monthSpent } from "./home-spend.ts";

type Store = { getItem(key: string): string | null };

/** Facts already stored on this device. Nothing here is estimated or advised. */
export function muhsinDeviceNotes(storage: Store, now = new Date()): string[] {
  const notes: string[] = [];
  try {
    const hit = continueReading(storage)[0];
    if (hit?.title) notes.push(`آخر قراءة محفوظة على الجهاز: ${hit.title}. ${hit.detail}`);
  } catch {
    /* a damaged reading record is omitted */
  }
  const spent = monthSpent(storage.getItem("waha:mizaniya:v1"), now);
  if (spent > 0) notes.push(`مصروف هذا الشهر في ميزانيتي على الجهاز: ${spent} ريال. هذا سجل، وليس نصيحة.`);
  return notes;
}

export const MUHSIN_PLACES = [
  { label: "المكتبة", href: "/books" },
  { label: "الأخبار", href: "/news" },
  { label: "ميزانيتي", href: "/app/budget" },
  { label: "الأبحاث", href: "https://alhajda.com/research/" },
  { label: "الألعاب", href: "/games" },
] as const;
