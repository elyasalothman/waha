import midad from "./books/platform/midad.json" with { type: "json" };
import { RESEARCH_LINKS } from "./research-catalog.ts";

export function dailyMidad(now = Date.now()) {
  return midad[Math.floor(now / 86400000) % midad.length]!;
}

/** Fixed catalog order. The daily passage book is left to that card. */
export function steadyBooks(now = Date.now()) {
  const today = dailyMidad(now).id;
  return midad.filter((book) => book.id !== today).slice(0, 3);
}

export function steadyResearch() {
  return RESEARCH_LINKS.filter((item) => item.id !== "research");
}
