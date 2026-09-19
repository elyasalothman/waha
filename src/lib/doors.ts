/** Official Alhajda house index — not cloned inside Waha. */
export const ALHAJDA_SITES_INDEX = "https://alhajda.com/sites";

export type DoorId =
  | "tahajjud"
  | "midad"
  | "sites"
  | "mohsin"
  | "luma"
  | "alhajda-tools"
  | "agent"
  | "hissati";

export type Door = {
  id: DoorId;
  /** Real product URL. Empty only for the in-app مواقعنا list. */
  href: string;
  icon: string;
  title: { ar: string; en: string };
  blurb: { ar: string; en: string };
  category: "life";
  lane: "house";
  audience: Array<"personal" | "work">;
  /** Shown as a launcher card in the app grid. */
  launcher: boolean;
  /** Shown in the in-app مواقعنا short list. */
  directory: boolean;
};

const PERSONAL: Array<"personal" | "work"> = ["personal"];
const BOTH: Array<"personal" | "work"> = ["personal", "work"];

/**
 * Alhajda doors. Each href is the live product — Waha must not iframe
 * or reimplement Tahajjud / Midad / Mohsin.
 */
export const DOORS: readonly Door[] = [
  {
    id: "tahajjud",
    href: "https://tahajjud.alhajda.com",
    icon: "Moon",
    title: { ar: "تهجد", en: "Tahajjud" },
    blurb: { ar: "مواقيت وأذكار ومصحف", en: "Prayer times, athkar, and a mushaf" },
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: true,
    directory: true,
  },
  {
    id: "midad",
    href: "https://midad.alhajda.com",
    icon: "BookMarked",
    title: { ar: "مداد", en: "Midad" },
    blurb: { ar: "كتب عربية متصلة — مكتبة الهجدة", en: "Connected Arabic books — the house library" },
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: true,
    directory: true,
  },
  {
    id: "sites",
    href: "",
    icon: "PanelsTopLeft",
    title: { ar: "مواقعنا", en: "Our sites" },
    blurb: { ar: "فهرس مواقع بيت الهجدة", en: "Index of the Alhajda house sites" },
    category: "life",
    lane: "house",
    audience: BOTH,
    launcher: true,
    directory: false,
  },
  {
    id: "mohsin",
    href: "https://ai.alhajda.com",
    icon: "Sparkles",
    title: { ar: "محسن", en: "Mohsin" },
    blurb: { ar: "مساعد الهجدة للكتابة والسؤال", en: "The house assistant for writing and asking" },
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: true,
    directory: true,
  },
  {
    id: "luma",
    href: "https://games.alhajda.com",
    icon: "Gamepad2",
    title: { ar: "لُمعة", en: "Luma" },
    blurb: { ar: "ألعاب عربية من باحة الهجدة", en: "Arabic games from the Alhajda yard" },
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: true,
    directory: true,
  },
  {
    id: "alhajda-tools",
    href: "https://tools.alhajda.com",
    icon: "Wrench",
    title: { ar: "أدوات", en: "Tools" },
    blurb: { ar: "حاسبات ومرافق بيت الهجدة", en: "House calculators and utilities" },
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: true,
    directory: true,
  },
  {
    id: "agent",
    href: "https://agent.alhajda.com",
    icon: "Bot",
    title: { ar: "وكيل", en: "Agent" },
    blurb: { ar: "وكيل الهجدة للمهام المتصلة", en: "The house agent for connected tasks" },
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: true,
    directory: true,
  },
  {
    id: "hissati",
    href: "https://hissati.alhajda.com",
    icon: "GraduationCap",
    title: { ar: "حصتي", en: "Hissati" },
    blurb: { ar: "دفتر المعلم — حصص ومتابعة", en: "A teacher’s notebook for lessons" },
    category: "life",
    lane: "house",
    audience: PERSONAL,
    launcher: false,
    directory: true,
  },
] as const;

export const PRIMARY_LAUNCHER_IDS: readonly DoorId[] = ["tahajjud", "midad", "sites"];

export function getDoor(id: string): Door | undefined {
  return DOORS.find((d) => d.id === id);
}

export function launcherDoors(): Door[] {
  return DOORS.filter((d) => d.launcher);
}

export function directoryDoors(): Door[] {
  return DOORS.filter((d) => d.directory);
}

export function primaryLauncherDoors(): Door[] {
  return PRIMARY_LAUNCHER_IDS.map((id) => getDoor(id)).filter((d): d is Door => d != null);
}

export function isExternalDoor(door: Pick<Door, "href">): boolean {
  return door.href.startsWith("https://");
}

/** Same-tab target: real product URL, or the in-app مواقعنا list. */
export function doorHref(door: Pick<Door, "id" | "href">): string {
  if (isExternalDoor(door)) return door.href;
  return `/app/${door.id}`;
}

export function doorExternalHref(door: Pick<Door, "href">): string | undefined {
  return isExternalDoor(door) ? door.href : undefined;
}
