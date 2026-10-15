/** Never confuse collection time with a publisher's publication date. */
export function collectedAtLabel(value: string, lang: "ar" | "en"): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    return lang === "ar" ? "تاريخ الحفظ غير معروف" : "Collection date unknown";
  return `${lang === "ar" ? "حُفظ" : "Saved"} ${new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", { dateStyle: "medium", timeZone: "Asia/Riyadh", calendar: "gregory" }).format(date)}`;
}
