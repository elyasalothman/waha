export const SIGNATURE_IDS = ["kalima", "abiar", "majra", "kutl", "memory"] as const;
export type SignatureId = (typeof SIGNATURE_IDS)[number];

export const CLASSIC_IDS = [
  "merge2048",
  "tetris",
  "snake",
  "connect4",
  "baloot",
  "sudoku",
  "xo",
  "breakout",
  "mines",
  "trivia",
  "type",
  "reaction",
] as const;

export const GAME_DOORS = [
  {
    id: "luma",
    href: "https://luma.alhajda.com",
    title: { ar: "لُمعة", en: "Luma" },
    blurb: { ar: "بيت سَمَر — لعبة عربية أصلية هادئة", en: "Samar house — one quiet Arabic game" },
  },
  {
    id: "luma-yard",
    href: "https://games.alhajda.com",
    title: { ar: "باحة لُمعة", en: "Luma yard" },
    blurb: { ar: "ساحة الألعاب الأوسع إن أردت جولة أطول", en: "The wider yard when you want a longer round" },
  },
] as const;
