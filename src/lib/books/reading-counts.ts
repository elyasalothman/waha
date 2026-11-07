import { BOOK_CARDS } from "./seed.ts";
import { STORIES } from "./stories.ts";
import midad from "./platform/midad.json" with { type: "json" };

/** Distinct reading surfaces on `/books`. The stamped shelf is not the whole page. */
export const READING_COUNTS = {
  stampedShelf: BOOK_CARDS.length,
  midadOriginals: midad.length,
  mysteryEntries: STORIES.length,
  alhajda: 1,
  tradingGuide: 1,
} as const;

export function booksBlurb(lang: "ar" | "en"): string {
  const c = READING_COUNTS;
  if (lang === "en") {
    return `The source-stamped shelf is ${c.stampedShelf} books. Also in Waha: the Alhajda book, ${c.midadOriginals} original Midad texts, ${c.mysteryEntries} mystery entries, and the trading guide. No paper shop and no piracy.`;
  }
  return `الرف المعلَّم المصدر: ${c.stampedShelf} كتابًا. داخل واحة أيضًا: كتاب الهجدة، و${c.midadOriginals} نصًا من مداد، و${c.mysteryEntries} من قصص الغموض، ودليل التداول. بلا شراء ورقي ولا قرصنة.`;
}
