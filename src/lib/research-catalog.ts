/**
 * Public pages read on 7 Nov 2026. Only fields printed on those pages.
 * No author and no DOI appeared, so none is stored here.
 */
export const RESEARCH_LINKS = [
  {
    id: "research",
    title: "مركز الأبحاث",
    href: "https://lab.alhajda.com/research/",
    note: "صفحة الفهرس على مركز أبحاث الهجدة.",
    status: "فهرس عام",
    updated: null,
    stated: null,
    aliases: ["مركز الابحاث", "الابحاث", "ابحاث", "فهرس الابحاث"],
  },
  {
    id: "research-bitcoin",
    title: "أسئلة كبرى · القضية ضد البيتكوين",
    href: "https://lab.alhajda.com/research/big-questions/bitcoin/",
    note: "افتح الورقة مباشرة؛ صفحة البحث تعرض المصادر والبيانات وتاريخ المراجعة.",
    status: "ورقة رأي تحليلية · مسودة للمراجعة",
    updated: "2026-11-01",
    stated: "41 مصدرًا مؤرخًا",
    aliases: ["اسئله كبرى", "القضيه ضد البيتكوين", "البيتكوين"],
  },
  {
    id: "research-humanoid",
    title: "روبوت الهجدة: بحث وتصميم أول روبوت بشري عربي",
    href: "https://lab.alhajda.com/research/humanoid/",
    note: "مسودة ظاهرة في الفهرس.",
    status: "مسودة",
    updated: "2026-10-29",
    stated: "55 مصدرًا مؤرخًا",
    aliases: ["روبوت الهجده", "روبوت بشري"],
  },
  {
    id: "research-marketing",
    title: "أفضل طرق تسويق المنتجات… دولة بدولة",
    href: "https://lab.alhajda.com/research/marketing/",
    note: "مسودة ظاهرة في الفهرس.",
    status: "مسودة",
    updated: "2026-10-25",
    stated: "18 دولة · 69 مصدرًا",
    aliases: ["تسويق المنتجات", "دوله بدوله"],
  },
] as const;
