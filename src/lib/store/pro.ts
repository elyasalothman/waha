// «بدائل مجانية لبرامج مدفوعة»: original Waha tools that replace paid software categories.
// Market references are generic ranges verified on 2026-10-18; sources in docs/PRO-TOOLS-PRICING.md.
export type ProTool = {
  slug: "cv" | "pdf" | "scan" | "image";
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Honest, generic reference to what comparable paid products charge. */
  marketRef: string;
  /** Higher = pricier paid category; used to pick the featured product. */
  marketRank: number;
  features: string[];
};
export const PRO_TOOLS: readonly ProTool[] = [
  {
    slug: "cv",
    id: "pro-cv",
    name: "منشئ السيرة الذاتية",
    description:
      "سيرة ذاتية احترافية بالعربية أو الإنجليزية بثلاثة قوالب، تُحفظ على جهازك، وتصدّر PDF بلا علامة مائية.",
    icon: "IdCard",
    marketRef: "مثيلاتها المدفوعة بحدود 95–115 ر.س كل 4 أسابيع",
    marketRank: 4,
    features: ["قوالب عربية وإنجليزية", "حفظ تلقائي ونسخة احتياطية", "PDF بجودة الطباعة"],
  },
  {
    slug: "pdf",
    id: "pro-pdf",
    name: "استوديو PDF",
    description:
      "ادمج ملفات PDF والصور، رتّب الصفحات ودوّرها واحذفها، استخرج صفحات، وأضف توقيعك وختمًا وأرقام صفحات.",
    icon: "FileStack",
    marketRef: "مثيلاتها المدفوعة بحدود 35–75 ر.س/شهر",
    marketRank: 3,
    features: ["دمج وترتيب واستخراج", "توقيع بخط اليد وختم نصي", "بلا رفع للملفات"],
  },
  {
    slug: "image",
    id: "pro-image",
    name: "استوديو الصور",
    description:
      "قص وتدوير وفلاتر وضبط ألوان، تغيير المقاس وضغط الحجم وتحويل الصيغة، وعلامة مائية بالعربي.",
    icon: "ImagePlus",
    marketRef: "تطبيقات التحرير والتصميم المدفوعة تبدأ بحدود 50 ر.س/شهر",
    marketRank: 2,
    features: ["فلاتر جاهزة", "ضغط وتحويل JPG/PNG/WebP", "علامة مائية عربية"],
  },
  {
    slug: "scan",
    id: "pro-scan",
    name: "الماسح الضوئي",
    description:
      "صوّر المستندات بالجوال، قصّها وحسّن وضوحها أو اجعلها أبيض وأسود، واحفظها PDF متعدد الصفحات.",
    icon: "ScanLine",
    marketRef: "مثيلاتها المدفوعة بحدود 20–40 ر.س/شهر",
    marketRank: 1,
    features: ["تحسين تلقائي وأبيض وأسود", "PDF متعدد الصفحات", "بلا علامة مائية"],
  },
];
export const featuredProTool = () => [...PRO_TOOLS].sort((a, b) => b.marketRank - a.marketRank)[0];
