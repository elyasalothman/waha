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

/** Official games on games.alhajda.com. Covers are screenshots of those pages. */
export const YARD_GAMES = [
  {
    id: "matam-alwaha",
    href: "https://games.alhajda.com/matam-alwaha/",
    cover: "/games/matam-alwaha.png",
    title: { ar: "مطعم الواحة", en: "Oasis restaurant" },
    blurb: { ar: "كشك الواحة على باحة الألعاب.", en: "The oasis kiosk on the games yard." },
  },
  {
    id: "mazraat-alwaha",
    href: "https://games.alhajda.com/mazraat-alwaha/",
    cover: "/games/mazraat-alwaha.png",
    title: { ar: "مزرعة الواحة", en: "Oasis farm" },
    blurb: { ar: "ازرع البذور على باحة الألعاب.", en: "Plant the seeds on the games yard." },
  },
  {
    id: "ghazw-alabraj",
    href: "https://games.alhajda.com/ghazw-alabraj/",
    cover: "/games/ghazw-alabraj.png",
    title: { ar: "غزو الأبراج", en: "Tower raid" },
    blurb: { ar: "حملة الأبراج على باحة الألعاب.", en: "The tower campaign on the games yard." },
  },
] as const;

export const GAME_COVERS: Record<string, string> = {
  kalima: "/games/covers/kalima.svg",
  memory: "/games/covers/memory.svg",
  snake: "/games/covers/snake.svg",
  xo: "/games/covers/xo.svg",
  merge2048: "/games/covers/merge2048.svg",
  reaction: "/games/covers/reaction.svg",
};

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
