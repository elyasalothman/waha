export const LANGS = ["ar", "en", "zh", "es", "fr", "hi"] as const;
export type Lang = (typeof LANGS)[number];

export type Copy = Record<Lang, string>;
export type Pair = { ar: string; en: string };

export const LANG_META: Record<
  Lang,
  { native: string; dir: "rtl" | "ltr"; tag: string; short: string }
> = {
  ar: { native: "العربية", dir: "rtl", tag: "ar-SA", short: "ع" },
  en: { native: "English", dir: "ltr", tag: "en-GB", short: "EN" },
  zh: { native: "中文", dir: "ltr", tag: "zh-CN", short: "中" },
  es: { native: "Español", dir: "ltr", tag: "es-ES", short: "ES" },
  fr: { native: "Français", dir: "ltr", tag: "fr-FR", short: "FR" },
  hi: { native: "हिन्दी", dir: "ltr", tag: "hi-IN", short: "हि" },
};

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

export function isRtl(lang: Lang) {
  return LANG_META[lang].dir === "rtl";
}

export function localeTag(lang: Lang) {
  return LANG_META[lang].tag;
}

/** UI copy: current language, then English, then Arabic. Never empty. */
export function loc(lang: Lang, rec: Partial<Copy> & { ar: string }): string {
  return rec[lang] || rec.en || rec.ar;
}

export function locPair(lang: Lang, rec: Pair): string {
  return lang === "ar" ? rec.ar : rec.en;
}

export function copy(ar: string, en: string, zh: string, es: string, fr: string, hi: string): Copy {
  return { ar, en, zh, es, fr, hi };
}

export function parseLang(v: unknown): Lang {
  return isLang(v) ? v : "ar";
}

/** Catalog and older copy still ship Arabic + English only. */
export function pairLang(lang: Lang): "ar" | "en" {
  return lang === "ar" ? "ar" : "en";
}
