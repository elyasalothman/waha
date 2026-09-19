import { PALETTE } from "../palette.ts";
import type { SquareAccount, SquareDoor, SquareDoorId } from "./types.ts";

/** Visible stamp on every sample voice — philosopher live lock. */
export const SAMPLE_STAMP_AR = "عيّنة للبداية";
export const SAMPLE_STAMP_EN = "Starter sample";

/** Locked house doors — live products, never /life, /app clones, or a Madar app. */
export const DOORS: Record<SquareDoorId, SquareDoor> = {
  tahajjud: {
    id: "tahajjud",
    href: "https://tahajjud.alhajda.com",
    ar: "تهجد",
    en: "Tahajjud",
    hintAr: "مواقيت وذكر",
    hintEn: "Prayer times and remembrance",
  },
  midad: {
    id: "midad",
    href: "https://midad.alhajda.com/library",
    ar: "مداد",
    en: "Midad",
    hintAr: "مكتبة متصلة",
    hintEn: "A connected library",
  },
  sites: {
    id: "sites",
    href: "https://alhajda.com/sites",
    ar: "مواقعنا",
    en: "Our sites",
    hintAr: "فهرس بيت الهجدة",
    hintEn: "Alhajda house index",
  },
};

export const HOUSE_ACCOUNTS: SquareAccount[] = [
  {
    id: "house-waha",
    handle: "@waha",
    nameAr: "واحة",
    nameEn: "Waha",
    bioAr: "صوت البيت — خدمات يومك في ساحة واحدة.",
    bioEn: "The house voice — your day’s services in one square.",
    kind: "house",
    tone: PALETTE.primary,
  },
  {
    id: "house-tahajjud",
    handle: "@tahajjud",
    nameAr: "تهجد",
    nameEn: "Tahajjud",
    bioAr: "باب الصلاة والذكر.",
    bioEn: "The door of prayer and dhikr.",
    kind: "house",
    tone: "#b8c4c8",
    href: DOORS.tahajjud.href,
  },
  {
    id: "house-midad",
    handle: "@midad",
    nameAr: "مداد",
    nameEn: "Midad",
    bioAr: "باب القراءة.",
    bioEn: "The reading door.",
    kind: "house",
    tone: "#d4c7b0",
    href: DOORS.midad.href,
  },
  {
    id: "house-mohsen",
    handle: "@mohsen",
    nameAr: "محسن",
    nameEn: "Mohsen",
    bioAr: "مساعد البيت للكتابة والسؤال.",
    bioEn: "The house assistant for writing and asking.",
    kind: "house",
    tone: "#c4d0bc",
  },
  {
    id: "house-luma",
    handle: "@luma",
    nameAr: "لُمعة",
    nameEn: "Luma",
    bioAr: "استراحة قصيرة ولعبة خفيفة.",
    bioEn: "A short rest and a light game.",
    kind: "house",
    tone: "#d0c4b0",
  },
  {
    id: "house-madar",
    handle: "@madar",
    nameAr: "مدار",
    nameEn: "Madar",
    bioAr: "باب مدار.",
    bioEn: "Madar’s door.",
    kind: "house",
    tone: "#b0c4c8",
  },
  {
    id: "house-tools",
    handle: "@adawat",
    nameAr: "الأدوات",
    nameEn: "Tools",
    bioAr: "حساب وتحويل ومرافق.",
    bioEn: "Calculate, convert, and keep tools close.",
    kind: "house",
    tone: "#b8c8c0",
  },
];

/** Marked sample voices from the king seed — not public figures. */
export const SAMPLE_ACCOUNTS: SquareAccount[] = [
  { id: "sample-sakina", handle: "@sample.sakina", nameAr: "سكينة", nameEn: "Sakina", bioAr: "عيّنة معلَّمة للسكينة.", bioEn: "A marked sample for sakina.", kind: "sample", tone: PALETTE.muted },
  { id: "sample-wanasa", handle: "@sample.wanasa", nameAr: "وناسة · عيّنة للبداية", nameEn: "Wanasa", bioAr: "عيّنة معلَّمة للمزاح اللائق.", bioEn: "A marked sample for gentle humour.", kind: "sample", tone: "#9a9084" },
  { id: "sample-hayah", handle: "@sample.hayah", nameAr: "حياة يومية · عيّنة للبداية", nameEn: "Hayah", bioAr: "عيّنة معلَّمة لبيت هادئ.", bioEn: "A marked sample for a quiet house.", kind: "sample", tone: "#84908c" },
  { id: "sample-alim", handle: "@sample.alim", nameAr: "عالم · عيّنة للبداية", nameEn: "Alim", bioAr: "عيّنة معلَّمة لفضول علمي.", bioEn: "A marked sample for light science.", kind: "sample", tone: "#90888c" },
  { id: "sample-faylasuf", handle: "@sample.faylasuf", nameAr: "فيلسوف · عيّنة للبداية", nameEn: "Faylasuf", bioAr: "عيّنة معلَّمة لسؤال عملي.", bioEn: "A marked sample for a practical question.", kind: "sample", tone: "#889084" },
  { id: "sample-muhandis", handle: "@sample.muhandis", nameAr: "مهندس · عيّنة للبداية", nameEn: "Muhandis", bioAr: "عيّنة معلَّمة لحرفة صغيرة.", bioEn: "A marked sample for a small craft.", kind: "sample", tone: "#948c88" },
];

export const YOU_ACCOUNT: SquareAccount = {
  id: "you",
  handle: "@you",
  nameAr: "أنت",
  nameEn: "You",
  bioAr: "ضيف يكتب من هذا الجهاز.",
  bioEn: "A guest writing from this device.",
  kind: "you",
  tone: PALETTE.primary,
};

function norm(handle: string) {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

const BY_HANDLE = new Map<string, SquareAccount>(
  [...HOUSE_ACCOUNTS, ...SAMPLE_ACCOUNTS, YOU_ACCOUNT].map((a) => [norm(a.handle), a]),
);

export function getAccount(handleOrId: string): SquareAccount {
  const byHandle = BY_HANDLE.get(norm(handleOrId));
  if (byHandle) return byHandle;
  const byId = [...HOUSE_ACCOUNTS, ...SAMPLE_ACCOUNTS, YOU_ACCOUNT].find((a) => a.id === handleOrId);
  return byId ?? SAMPLE_ACCOUNTS[0]!;
}

export function accountFromSeed(author: string, handle: string, badge: "بيت" | "عيّنة"): SquareAccount {
  const known = BY_HANDLE.get(norm(handle));
  if (known) {
    return { ...known, nameAr: author, nameEn: known.nameEn };
  }
  return {
    id: `seed-${norm(handle)}`,
    handle,
    nameAr: author,
    nameEn: author,
    bioAr: "",
    bioEn: "",
    kind: badge === "بيت" ? "house" : "sample",
    tone: PALETTE.muted,
  };
}

export function allAccounts(): SquareAccount[] {
  return [...HOUSE_ACCOUNTS, ...SAMPLE_ACCOUNTS, YOU_ACCOUNT];
}
