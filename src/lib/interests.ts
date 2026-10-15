export const INTERESTS = [
  { id: "faith", label: "ديني والقرآن", href: "/quran" },
  { id: "news", label: "الأخبار", href: "/news" },
  { id: "fun", label: "الألعاب والمتعة", href: "/games" },
  { id: "learn", label: "الكتب والتعلّم", href: "/books" },
] as const;
export function normalizeInterests(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return INTERESTS.filter((item) => value.includes(item.id)).map((item) => item.id);
}
export function interestKey(userId?: string) {
  return `waha:interests:${userId || "guest"}`;
}
