// CV data model for the Waha CV builder. Stored only in this browser.
export type CvEntry = { title: string; org: string; period: string; details: string };
export type CvTemplate = "classic" | "modern" | "compact";
export type Cv = {
  lang: "ar" | "en";
  template: CvTemplate;
  accent: string;
  name: string;
  headline: string;
  phone: string;
  email: string;
  city: string;
  link: string;
  summary: string;
  experience: CvEntry[];
  education: CvEntry[];
  skills: string;
  languages: string;
  certificates: string;
};
export const CV_KEY = "waha:pro:cv:v1";
export const CV_ACCENTS = ["#146455", "#1d4ed8", "#7c2d12", "#334155", "#9d174d"];
export const CV_TEMPLATES: { id: CvTemplate; label: string }[] = [
  { id: "classic", label: "كلاسيكي" },
  { id: "modern", label: "حديث بعمود جانبي" },
  { id: "compact", label: "مختصر بصفحة واحدة" },
];
export const emptyEntry = (): CvEntry => ({ title: "", org: "", period: "", details: "" });
export const emptyCv = (): Cv => ({
  lang: "ar",
  template: "modern",
  accent: CV_ACCENTS[0],
  name: "",
  headline: "",
  phone: "",
  email: "",
  city: "",
  link: "",
  summary: "",
  experience: [emptyEntry()],
  education: [emptyEntry()],
  skills: "",
  languages: "",
  certificates: "",
});
/** Illustrative sample so the user sees a finished layout; clearly fictional. */
export const sampleCv = (): Cv => ({
  ...emptyCv(),
  name: "سارة عبدالله",
  headline: "محللة بيانات",
  phone: "05xxxxxxxx",
  email: "sara@example.com",
  city: "الرياض",
  link: "linkedin.com/in/example",
  summary:
    "محللة بيانات بخبرة ثلاث سنوات في تحويل البيانات إلى قرارات واضحة، أجيد بناء لوحات المتابعة وتنظيف البيانات وعرض النتائج لغير المتخصصين.",
  experience: [
    {
      title: "محللة بيانات",
      org: "شركة مثال للتقنية",
      period: "2023 — الآن",
      details:
        "بناء لوحات متابعة أسبوعية للإدارة\nأتمتة تقارير المبيعات وتقليل وقت إعدادها\nالعمل مع فرق التسويق على قياس الحملات",
    },
    {
      title: "متدربة تحليل بيانات",
      org: "جهة مثال",
      period: "2022",
      details: "تنظيف بيانات العملاء وتوحيدها\nإعداد عروض مختصرة للنتائج",
    },
  ],
  education: [
    { title: "بكالوريوس نظم المعلومات", org: "جامعة مثال", period: "2018 — 2022", details: "" },
  ],
  skills: "SQL، Excel المتقدم، Power BI، Python، عرض النتائج",
  languages: "العربية (اللغة الأم)، الإنجليزية (متقدم)",
  certificates: "شهادة تحليل بيانات (مثال)",
});

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
function entries(v: unknown): CvEntry[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 12).map((e) => ({
    title: str(e?.title, 200),
    org: str(e?.org, 200),
    period: str(e?.period, 80),
    details: str(e?.details, 2000),
  }));
}
/** Accept anything (saved data, imported JSON) and return a valid Cv. */
export function normalizeCv(raw: unknown): Cv {
  const base = emptyCv();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  return {
    lang: r.lang === "en" ? "en" : "ar",
    template: CV_TEMPLATES.some((t) => t.id === r.template)
      ? (r.template as CvTemplate)
      : base.template,
    accent:
      typeof r.accent === "string" && /^#[0-9a-f]{6}$/i.test(r.accent) ? r.accent : base.accent,
    name: str(r.name, 120),
    headline: str(r.headline, 160),
    phone: str(r.phone, 40),
    email: str(r.email, 120),
    city: str(r.city, 80),
    link: str(r.link, 200),
    summary: str(r.summary, 1500),
    experience: entries(r.experience),
    education: entries(r.education),
    skills: str(r.skills, 800),
    languages: str(r.languages, 400),
    certificates: str(r.certificates, 800),
  };
}
/** Split comma / Arabic comma / newline lists into trimmed items. */
export function splitList(s: string) {
  return s
    .split(/[,،\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
export const filledEntries = (list: CvEntry[]) =>
  list.filter((e) => e.title.trim() || e.org.trim() || e.details.trim());
export const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.replace(/^[-•·\s]+/, "").trim())
    .filter(Boolean);

export const CV_LABELS = {
  ar: {
    summary: "نبذة",
    experience: "الخبرات",
    education: "التعليم",
    skills: "المهارات",
    languages: "اللغات",
    certificates: "الشهادات",
    contact: "التواصل",
  },
  en: {
    summary: "Profile",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    certificates: "Certificates",
    contact: "Contact",
  },
};
