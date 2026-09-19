import type { SquareAccount, SquareDoor, SquareDoorId } from "./types.ts";

export const DOORS: Record<SquareDoorId, SquareDoor> = {
  madar: {
    id: "madar",
    href: "/life",
    ar: "مدار",
    en: "Madar",
    hintAr: "باب يومك في الواحة",
    hintEn: "Your day’s door in Waha",
  },
  tahajjud: {
    id: "tahajjud",
    href: "/app/salah",
    appId: "salah",
    ar: "تهجد",
    en: "Tahajjud",
    hintAr: "مواقيت وذكر",
    hintEn: "Prayer times and remembrance",
  },
  midad: {
    id: "midad",
    href: "/app/khatma",
    appId: "khatma",
    ar: "مداد",
    en: "Midad",
    hintAr: "قراءة وختمة",
    hintEn: "Reading and a khatma",
  },
};

export const HOUSE_ACCOUNTS: SquareAccount[] = [
  {
    id: "house-waha",
    handle: "waha",
    nameAr: "واحة",
    nameEn: "Waha",
    bioAr: "صوت البيت — خدمات يومك في ساحة واحدة.",
    bioEn: "The house voice — your day’s services in one square.",
    kind: "house",
    tone: "#c5d0c4",
  },
  {
    id: "house-tahajjud",
    handle: "tahajjud",
    nameAr: "تهجد",
    nameEn: "Tahajjud",
    bioAr: "باب الصلاة والذكر — مواقيت وورد وقبلة.",
    bioEn: "The door of prayer and dhikr — times, wird, and qibla.",
    kind: "house",
    tone: "#b8c4c8",
  },
  {
    id: "house-midad",
    handle: "midad",
    nameAr: "مداد",
    nameEn: "Midad",
    bioAr: "باب القراءة — آية واسم وختمة.",
    bioEn: "The reading door — an ayah, a name, a khatma.",
    kind: "house",
    tone: "#d4c7b0",
  },
  {
    id: "house-mohsin",
    handle: "mohsin",
    nameAr: "محسن",
    nameEn: "Mohsin",
    bioAr: "باب الإحسان — زكاة وبيت ومعروف صغير.",
    bioEn: "The door of ihsan — zakat, home, and a small kindness.",
    kind: "house",
    tone: "#c4d0bc",
  },
  {
    id: "house-luma",
    handle: "luma",
    nameAr: "لُمعة",
    nameEn: "Luma",
    bioAr: "باب اللمعة — استراحة قصيرة ولعبة خفيفة.",
    bioEn: "The spark door — a short rest and a light game.",
    kind: "house",
    tone: "#d0c4b0",
  },
  {
    id: "house-tools",
    handle: "adawat",
    nameAr: "الأدوات",
    nameEn: "Tools",
    bioAr: "باب الأدوات — حساب وتحويل وطقس.",
    bioEn: "The tools door — calculate, convert, and check the weather.",
    kind: "house",
    tone: "#b8c8c0",
  },
];

/** Generic Arabic names — not public figures, not impersonation. */
export const SAMPLE_ACCOUNTS: SquareAccount[] = [
  { id: "sample-salem", handle: "salem", nameAr: "سالم", nameEn: "Salem", bioAr: "يحب الورد الهادئ.", bioEn: "Likes a quiet wird.", kind: "sample", tone: "#8d938c" },
  { id: "sample-noura", handle: "noura", nameAr: "نورة", nameEn: "Noura", bioAr: "قهوة بلا شاشة أحياناً.", bioEn: "Coffee without a screen, sometimes.", kind: "sample", tone: "#9a9084" },
  { id: "sample-fahd", handle: "fahd", nameAr: "فهد", nameEn: "Fahd", bioAr: "يحسب قبل أن يسافر.", bioEn: "Calculates before he travels.", kind: "sample", tone: "#84908c" },
  { id: "sample-hind", handle: "hind", nameAr: "هند", nameEn: "Hind", bioAr: "تعلّم الحروف في البيت.", bioEn: "Teaching letters at home.", kind: "sample", tone: "#90888c" },
  { id: "sample-yasir", handle: "yasir", nameAr: "ياسر", nameEn: "Yasir", bioAr: "ينام على دورات.", bioEn: "Sleeps in cycles.", kind: "sample", tone: "#889084" },
  { id: "sample-maryam", handle: "maryam", nameAr: "مريم", nameEn: "Maryam", bioAr: "تجمع الأمثال.", bioEn: "Collects sayings.", kind: "sample", tone: "#948c88" },
  { id: "sample-khalid", handle: "khalid", nameAr: "خالد", nameEn: "Khalid", bioAr: "يمشي بعد العصر.", bioEn: "Walks after Asr.", kind: "sample", tone: "#848c90" },
  { id: "sample-layla", handle: "layla", nameAr: "ليلى", nameEn: "Layla", bioAr: "تراقب الطقس قبل الخروج.", bioEn: "Checks the weather before going out.", kind: "sample", tone: "#908490" },
  { id: "sample-omar", handle: "omar", nameAr: "عمر", nameEn: "Omar", bioAr: "جلسة بلوت أسبوعية.", bioEn: "A weekly baloot sitting.", kind: "sample", tone: "#8c9084" },
  { id: "sample-sara", handle: "sara", nameAr: "سارة", nameEn: "Sara", bioAr: "ترتّب مال البيت.", bioEn: "Keeps the household money tidy.", kind: "sample", tone: "#908c84" },
  { id: "sample-badr", handle: "badr", nameAr: "بدر", nameEn: "Badr", bioAr: "يرثّب مكتبه كل خميس.", bioEn: "Tidies his desk every Thursday.", kind: "sample", tone: "#848890" },
  { id: "sample-amal", handle: "amal", nameAr: "أمل", nameEn: "Amal", bioAr: "تكتب القائمة قبل السوق.", bioEn: "Writes the list before the souq.", kind: "sample", tone: "#8c8488" },
  { id: "sample-talal", handle: "talal", nameAr: "طلال", nameEn: "Talal", bioAr: "يتنفّس قبل الاجتماع.", bioEn: "Breathes before a meeting.", kind: "sample", tone: "#889488" },
  { id: "sample-huda", handle: "huda", nameAr: "هدى", nameEn: "Huda", bioAr: "ختمة بطيئة.", bioEn: "A slow khatma.", kind: "sample", tone: "#948888" },
  { id: "sample-majed", handle: "majed", nameAr: "ماجد", nameEn: "Majed", bioAr: "يتابع أوراق السيارة.", bioEn: "Keeps the car papers in view.", kind: "sample", tone: "#849484" },
  { id: "sample-reem", handle: "reem", nameAr: "ريم", nameEn: "Reem", bioAr: "ألعاب قصيرة مع الصغار.", bioEn: "Short games with the little ones.", kind: "sample", tone: "#908490" },
  { id: "sample-walid", handle: "walid", nameAr: "وليد", nameEn: "Walid", bioAr: "يفقّط الفواتير.", bioEn: "Writes amounts in words.", kind: "sample", tone: "#888c90" },
  { id: "sample-jawaher", handle: "jawaher", nameAr: "جواهر", nameEn: "Jawaher", bioAr: "صباحها آية ثم عمل.", bioEn: "Her morning is an ayah, then work.", kind: "sample", tone: "#908884" },
  { id: "sample-anas", handle: "anas", nameAr: "أنس", nameEn: "Anas", bioAr: "يصحّح اتجاه الغرفة.", bioEn: "Corrects the room’s bearing.", kind: "sample", tone: "#84908c" },
  { id: "sample-lina", handle: "lina", nameAr: "لينا", nameEn: "Lina", bioAr: "تعلّق جملاً قصيرة.", bioEn: "Pins short sentences.", kind: "sample", tone: "#8c8890" },
];

export const YOU_ACCOUNT: SquareAccount = {
  id: "you",
  handle: "you",
  nameAr: "أنت",
  nameEn: "You",
  bioAr: "ضيف يكتب من هذا الجهاز.",
  bioEn: "A guest writing from this device.",
  kind: "you",
  tone: "#c5d0c4",
};

const BY_ID = new Map<string, SquareAccount>(
  [...HOUSE_ACCOUNTS, ...SAMPLE_ACCOUNTS, YOU_ACCOUNT].map((a) => [a.id, a]),
);

export function getAccount(id: string): SquareAccount {
  return BY_ID.get(id) ?? SAMPLE_ACCOUNTS[0]!;
}

export function allAccounts(): SquareAccount[] {
  return [...HOUSE_ACCOUNTS, ...SAMPLE_ACCOUNTS, YOU_ACCOUNT];
}
