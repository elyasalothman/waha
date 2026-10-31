/** One registry shared by directory, home, command routing, and house sites. */
export const LEAP_SERVICES = [
  {
    id: "hissati-explore",
    title: "حصتي · المسارات والدروس",
    group: "تعلّم",
    icon: "GraduationCap",
    href: "https://hissati.alhajda.com/explore",
    words: "حصتي قدرات تعلم دروس مسارات",
  },
  {
    id: "wiki",
    title: "موسوعة الهجدة",
    group: "تعلّم",
    icon: "BookOpen",
    href: "https://wiki.alhajda.com",
    words: "موسوعة معرفة بحث",
  },
  {
    id: "research",
    title: "مركز الأبحاث",
    group: "تعلّم",
    icon: "BookOpen",
    href: "https://lab.alhajda.com/research/",
    words: "ابحاث أبحاث دراسات",
  },
  {
    id: "skills",
    title: "مهارة في أسبوع",
    group: "تعلّم",
    icon: "GraduationCap",
    href: "https://lab.alhajda.com/skills/",
    words: "مهارات تعلم",
  },
  {
    id: "news-latest",
    title: "هدوء السوق · آخر الأخبار",
    group: "أخبار ومال",
    icon: "Newspaper",
    href: "/news",
    words: "اخبار عاجل أخبار",
  },
  {
    id: "articles",
    title: "مقالات هدوء السوق",
    group: "أخبار ومال",
    icon: "Newspaper",
    href: "https://news.alhajda.com/articles",
    words: "مقالات تحليل",
  },
  {
    id: "analysts",
    title: "آراء المحللين",
    group: "أخبار ومال",
    icon: "TrendingUp",
    href: "/analysts",
    words: "محللين محللون رأي تحليل",
  },
  {
    id: "market-sa",
    title: "السوق السعودي",
    group: "أخبار ومال",
    icon: "TrendingUp",
    href: "https://market.alhajda.com",
    words: "سوق اسهم أسعار تداول",
  },
  {
    id: "market-us",
    title: "السوق الأمريكي",
    group: "أخبار ومال",
    icon: "TrendingUp",
    href: "https://market.alhajda.com/us",
    words: "امريكي أمريكي امريكا",
  },
  {
    id: "market-bot",
    title: "روبوت التداول · افتراضي — بلا أموال حقيقية",
    group: "أخبار ومال",
    icon: "Bot",
    href: "https://market.alhajda.com/bot",
    words: "بوت وهمي تداول تجريبي روبوت",
  },
  {
    id: "math-lab",
    title: "حلّال الرياضيات",
    group: "أدوات وذكاء",
    icon: "Calculator",
    href: "https://lab.alhajda.com/math/",
    words: "رياضيات معادلات حل",
  },
  {
    id: "wadhifati",
    title: "وظيفتي",
    group: "أدوات وذكاء",
    icon: "Briefcase",
    href: "https://lab.alhajda.com/wadhifati/",
    words: "وظيفة توظيف",
  },
  {
    id: "phones",
    title: "مقارنة الجوالات",
    group: "أدوات وذكاء",
    icon: "Smartphone",
    href: "https://phones.alhajda.com",
    words: "قارن جوالات هواتف",
  },
  {
    id: "bench",
    title: "مقياس الهجدة",
    group: "أدوات وذكاء",
    icon: "Gauge",
    href: "https://bench.alhajda.com",
    words: "مقياس قياس",
  },
  {
    id: "hayat-live",
    title: "حياة · العالم المفتوح",
    group: "ألعاب",
    icon: "Gamepad2",
    href: "https://hayat.alhajda.com",
    words: "حياة لعب",
  },
  {
    id: "mamalik",
    title: "ممالك",
    group: "ألعاب",
    icon: "Gamepad2",
    href: "https://games.alhajda.com/mamalik",
    words: "ممالك استراتيجية لعب",
  },
  {
    id: "store-collect",
    title: "مقتنيات الهجدة · حجز مسبق فقط",
    group: "تسوّق",
    icon: "ShoppingBag",
    href: "https://store.alhajda.com",
    words: "متجر مقتنيات تسوق حجز بلا دفع",
  },
] as const;
export type SectionId = (typeof LEAP_SERVICES)[number]["id"];
export const sectionIds = LEAP_SERVICES.map((s) => s.id) as [SectionId, ...SectionId[]];
export const DIRECTORY_KEY = "waha:directory:v2";
export function directoryState(raw: string | null): { recent: string[]; favorites: string[] } {
  try {
    const x = JSON.parse(raw || "{}");
    const valid = (v: unknown) =>
      Array.isArray(v)
        ? v
            .filter(
              (id): id is string =>
                typeof id === "string" && LEAP_SERVICES.some((s) => s.id === id),
            )
            .slice(0, 20)
        : [];
    return { recent: valid(x.recent), favorites: valid(x.favorites) };
  } catch {
    return { recent: [], favorites: [] };
  }
}

/** Match Arabic service names and keywords, ignoring typing marks and spacing. */
export function searchDirectoryServices(query: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .toLowerCase()
      .trim();
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return LEAP_SERVICES.filter((service) => {
    const text = normalize(`${service.title} ${service.words}`);
    return terms.every((term) => text.includes(term));
  });
}
