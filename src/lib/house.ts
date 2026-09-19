import { copy, loc, type Copy, type Lang } from "@/lib/locale";

export type HouseDoor = {
  id: "tahajjud" | "muhsin" | "luma" | "bayt";
  href: string;
  title: Copy;
  blurb: Copy;
};

export const HOUSE_DOORS: HouseDoor[] = [
  {
    id: "tahajjud",
    href: "https://tahajjud.alhajda.com",
    title: copy("تهجد", "Tahajjud", "夜祷", "Tahajjud", "Tahajjud", "तहज्जुद"),
    blurb: copy(
      "مواقيت وأذكار ومصحف — على جهازك",
      "Prayer, athkar, and a mushaf — on-device",
      "礼拜、记念与古兰经",
      "Oración, athkar y musḥaf",
      "Prières, athkar et mushaf",
      "नमाज़, अज़कार और मुसhaf",
    ),
  },
  {
    id: "muhsin",
    href: "https://ai.alhajda.com",
    title: copy("محسن", "Muhsin", "穆赫辛", "Muhsin", "Muhsin", "मुहसिन"),
    blurb: copy(
      "اسأل بصدق: مدعوم / جزئي / لا أعرف",
      "Ask honestly: supported / partial / I don’t know",
      "诚实作答：有据 / 部分 / 不知",
      "Responde con honestidad",
      "Répond avec honnêteté",
      "ईमानदारी से उत्तर",
    ),
  },
  {
    id: "luma",
    href: "https://games.alhajda.com",
    title: copy("لُمعة", "Luma", "卢玛", "Luma", "Luma", "लुमा"),
    blurb: copy(
      "ألعاب البيت — بلا تسجيل",
      "House games — no account",
      "家中游戏，无需账号",
      "Juegos de la casa",
      "Jeux de la maison",
      "घर के खेल",
    ),
  },
  {
    id: "bayt",
    href: "https://alhajda.com",
    title: copy("البيت", "The house", "家园", "La casa", "La maison", "घर"),
    blurb: copy(
      "الهجدة — حيث تُبنى الأشياء في هدوء الليل",
      "Alhajda — where things are built in the quiet of night",
      "夜静时建造之所",
      "Donde se construye en la calma de la noche",
      "Là où l’on construit dans le calme de la nuit",
      "रात की शांति में जहाँ चीज़ें बनती हैं",
    ),
  },
];

export function doorTitle(lang: Lang, door: HouseDoor) {
  return loc(lang, door.title);
}

export function doorBlurb(lang: Lang, door: HouseDoor) {
  return loc(lang, door.blurb);
}
