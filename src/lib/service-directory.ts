/**
 * The public services list. Routes that are not listed stay reachable by their
 * old addresses; they are not advertised here.
 */
export type DirectoryItem = {
  id: string;
  href: string;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
  external?: boolean;
};

export type DirectorySection = {
  id: string;
  title: { ar: string; en: string };
  items: readonly DirectoryItem[];
};

export const SERVICE_DIRECTORY: readonly DirectorySection[] = [
  {
    id: "reading",
    title: { ar: "القراءة والبحث", en: "Reading and research" },
    items: [
      {
        id: "books",
        href: "/books",
        title: { ar: "المكتبة", en: "Library" },
        blurb: { ar: "الكتب والقصص وموضع القراءة على هذا الجهاز.", en: "Books, stories, and your place on this device." },
      },
      {
        id: "research",
        href: "/research",
        title: { ar: "مركز الأبحاث", en: "Research" },
        blurb: { ar: "فهرس أوراق الهجدة كما نُشر، بلا ملخص مخترع.", en: "The published paper index, without an invented summary." },
      },
      {
        id: "alhajda-book",
        href: "/books/alhajda",
        title: { ar: "كتاب الهجدة", en: "Alhajda" },
        blurb: { ar: "الكتاب نفسه داخل واحة، لا بطاقة تعريف بدل النص.", en: "The book itself inside Waha." },
      },
    ],
  },
  {
    id: "news",
    title: { ar: "الأخبار", en: "News" },
    items: [
      {
        id: "headlines",
        href: "/news",
        title: { ar: "العناوين", en: "Headlines" },
        blurb: { ar: "عناوين من مصادرها مع وقت الجلب.", en: "Headlines from their sources, with the fetch time." },
      },
      {
        id: "analysts",
        href: "/analysts",
        title: { ar: "آراء المحللين", en: "Analyst notes" },
        blurb: { ar: "ما نشره هدوء السوق بتاريخه. ليس توصية.", en: "What Hudoo published, with its date. Not advice." },
      },
      {
        id: "live",
        href: "/live",
        title: { ar: "البث المباشر", en: "Live broadcast" },
        blurb: {
          ar: "تلفزيون هدوء السوق داخل واحة. النجاح صورة مستمرة، لا مجرد فتح الصفحة.",
          en: "Hudoo TV inside Waha. Success is a picture that keeps moving.",
        },
      },
    ],
  },
  {
    id: "play",
    title: { ar: "اللعب", en: "Play" },
    items: [
      {
        id: "games",
        href: "/games",
        title: { ar: "الألعاب", en: "Games" },
        blurb: {
          ar: "جيش الواحة يحتاج رسوماً ثلاثية الأبعاد، وإن تعذّرت تظهر رسالة. تحته ألعاب جُرّبت.",
          en: "Oasis Army needs 3D and says so if it cannot start. The games under it were tried.",
        },
      },
    ],
  },
  {
    id: "tools",
    title: { ar: "أدوات تعمل هنا", en: "Tools that run here" },
    items: [
      {
        id: "mohsen",
        href: "/mohsen",
        title: { ar: "محسن", en: "Muhsin" },
        blurb: { ar: "محادثة. وجهات واحة من التطبيق، والسؤال العام من خدمته كما هي.", en: "Chat. Waha places come from the app; general questions use the service as it is." },
      },
      {
        id: "quran",
        href: "/quran",
        title: { ar: "القرآن", en: "Quran" },
        blurb: { ar: "المصحف وموضع القراءة على هذا الجهاز.", en: "The mushaf and your place on this device." },
      },
      {
        id: "salah",
        href: "/app/salah",
        title: { ar: "مواقيت الصلاة", en: "Prayer times" },
        blurb: { ar: "المواقيت من المدينة المحفوظة، بلا طلب موقع جديد.", en: "Times for the saved city, without a new location prompt." },
      },
      {
        id: "weather",
        href: "/app/weather",
        title: { ar: "الطقس", en: "Weather" },
        blurb: { ar: "حرارة المدينة المحفوظة من Open-Meteo.", en: "The saved city’s temperature from Open-Meteo." },
      },
    ],
  },
  {
    id: "outside",
    title: { ar: "مواقع الهجدة", en: "Alhajda sites" },
    items: [
      {
        id: "market",
        href: "https://market.alhajda.com",
        external: true,
        title: { ar: "منضدة السوق", en: "Market desk" },
        blurb: { ar: "خارج واحة. تعليمي وليس توصية بيع أو شراء.", en: "Outside Waha. Educational, not a trade." },
      },
      {
        id: "hissati",
        href: "https://hissati.alhajda.com/explore",
        external: true,
        title: { ar: "حصتي", en: "Hissati" },
        blurb: { ar: "دروس حصتي على موقعها، خارج واحة.", en: "Hissati lessons on their site, outside Waha." },
      },
    ],
  },
];

export function directoryItems(): DirectoryItem[] {
  return SERVICE_DIRECTORY.flatMap((section) => [...section.items]);
}

export function filterDirectory(query: string): DirectorySection[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...SERVICE_DIRECTORY];
  return SERVICE_DIRECTORY.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      `${item.title.ar} ${item.title.en} ${item.blurb.ar} ${item.blurb.en}`.toLowerCase().includes(needle),
    ),
  })).filter((section) => section.items.length > 0);
}
