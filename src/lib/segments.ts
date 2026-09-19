import { copy, loc, type Copy, type Lang } from "@/lib/locale";
import type { Audience, CatalogItem, Category } from "@/lib/catalog";

export const SEGMENTS = ["all", "child", "student", "family", "work", "elder", "traveler"] as const;
export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_META: Record<
  Segment,
  { title: Copy; blurb: Copy; audience: Audience; hideMoney: boolean; fontScale: "md" | "lg" }
> = {
  all: {
    title: copy("للكل", "Everyone", "所有人", "Todos", "Tous", "सभी"),
    blurb: copy("كل الآبار", "Every well", "全部水井", "Todos los pozos", "Tous les puits", "सभी कुएँ"),
    audience: "personal",
    hideMoney: false,
    fontScale: "md",
  },
  child: {
    title: copy("طفل", "Child", "儿童", "Niño", "Enfant", "बच्चा"),
    blurb: copy("ألعاب وفسحة، بلا مال", "Play and pause — no money", "游戏与休息，无金钱", "Juegos, sin dinero", "Jeux, sans argent", "खेल, बिना धन"),
    audience: "personal",
    hideMoney: true,
    fontScale: "lg",
  },
  student: {
    title: copy("طالب", "Student", "学生", "Estudiante", "Étudiant", "विद्यार्थी"),
    blurb: copy("معرفة ومهام", "Knowledge and tasks", "知识与任务", "Saber y tareas", "Savoir et tâches", "ज्ञान और कार्य"),
    audience: "personal",
    hideMoney: false,
    fontScale: "md",
  },
  family: {
    title: copy("أسرة", "Family", "家庭", "Familia", "Famille", "परिवार"),
    blurb: copy("بيت ومصروف", "Home and spend", "家与开销", "Hogar y gasto", "Maison et dépenses", "घर और खर्च"),
    audience: "personal",
    hideMoney: false,
    fontScale: "md",
  },
  work: {
    title: copy("عمل", "Work", "工作", "Trabajo", "Travail", "काम"),
    blurb: copy("أخبار ومهام ومال", "News, tasks, money", "新闻、任务、金钱", "Noticias, tareas, dinero", "Actu, tâches, argent", "समाचार, कार्य, धन"),
    audience: "work",
    hideMoney: false,
    fontScale: "md",
  },
  elder: {
    title: copy("كبير السن", "Elder", "长者", "Mayor", "Aîné", "वरिष्ठ"),
    blurb: copy("صلاة وصحة وحروف أوضح", "Prayer, health, larger type", "礼拜、健康、大字", "Oración, salud, letra grande", "Prière, santé, grands caractères", "नमाज़, स्वास्थ्य, बड़े अक्षर"),
    audience: "personal",
    hideMoney: false,
    fontScale: "lg",
  },
  traveler: {
    title: copy("مسافر", "Traveler", "旅客", "Viajero", "Voyageur", "यात्री"),
    blurb: copy("طقس وعملة وساعات", "Weather, currency, clocks", "天气、汇率、时钟", "Clima, divisa, relojes", "Météo, change, horloges", "मौसम, मुद्रा, घड़ियाँ"),
    audience: "personal",
    hideMoney: false,
    fontScale: "md",
  },
};

export function segmentTitle(lang: Lang, id: Segment) {
  return loc(lang, SEGMENT_META[id].title);
}

export function parseSegment(v: unknown): Segment {
  return typeof v === "string" && (SEGMENTS as readonly string[]).includes(v) ? (v as Segment) : "all";
}

export function audienceFor(segment: Segment): Audience {
  return SEGMENT_META[segment].audience;
}

const CHILD_OK = new Set([
  "salah",
  "athkar",
  "asma",
  "tasbih",
  "letters",
  "tables",
  "weather",
  "games",
  "kalima",
  "memory",
  "snake",
  "merge2048",
  "xo",
  "connect4",
  "tetris",
  "trivia",
  "type",
  "reaction",
  "proverbs",
  "names",
  "greet",
  "qibla",
  "hijri",
]);

const ELDER_FIRST = new Set([
  "salah",
  "salahlog",
  "athkar",
  "asma",
  "dua",
  "tasbih",
  "qibla",
  "meds",
  "water",
  "breathe",
  "emergency",
  "papers",
  "bills",
  "weather",
  "clocks",
  "chat",
]);

const TRAVELER_FIRST = new Set([
  "salah",
  "qibla",
  "weather",
  "clocks",
  "currency",
  "umrah",
  "emergency",
  "units",
  "vat",
  "iban",
]);

export function itemFitsSegment(item: CatalogItem, segment: Segment): boolean {
  const meta = SEGMENT_META[segment];
  if (!item.audience.includes(meta.audience) && segment !== "all") {
    if (segment === "work") return item.audience.includes("work");
  }
  if (meta.hideMoney && (item.category === "money" || item.lane === "money")) return false;
  if (segment === "child") return CHILD_OK.has(item.id) || item.category === "games";
  if (segment === "elder") return ELDER_FIRST.has(item.id) || item.lane === "worship" || item.lane === "health";
  if (segment === "traveler") return TRAVELER_FIRST.has(item.id) || item.lane === "worship";
  if (segment === "student") {
    return item.category !== "games" || item.id === "kalima" || item.id === "trivia" || item.id === "type";
  }
  if (segment === "work") return item.audience.includes("work");
  return item.audience.includes("personal") || item.audience.includes("work");
}

export type WellId = "faith" | "news" | "desk" | "health" | "know" | "play" | "money" | "house";

export const WELL_META: Record<WellId, { title: Copy; href: string; category?: Category }> = {
  faith: { title: copy("إيمان", "Faith", "信仰", "Fe", "Foi", "आस्था"), href: "/life" },
  news: { title: copy("أخبار", "News", "新闻", "Noticias", "Actu", "समाचार"), href: "/house" },
  desk: { title: copy("عمل", "Desk", "工作", "Mesa", "Bureau", "कार्य"), href: "/workspace" },
  health: { title: copy("صحة", "Health", "健康", "Salud", "Santé", "स्वास्थ्य"), href: "/life" },
  know: { title: copy("معرفة", "Knowledge", "知识", "Saber", "Savoir", "ज्ञान"), href: "/tools" },
  play: { title: copy("فسحة", "Play", "游戏", "Juego", "Jeux", "खेल"), href: "/games" },
  money: { title: copy("مال", "Money", "金钱", "Dinero", "Argent", "धन"), href: "/money" },
  house: { title: copy("الهجدة", "Alhajda", "家园", "Alhajda", "Alhajda", "अलहजदा"), href: "/house" },
};

const WELLS_BY_SEGMENT: Record<Segment, WellId[]> = {
  all: ["faith", "house", "desk", "health", "know", "play"],
  child: ["play", "know", "faith", "house"],
  student: ["know", "desk", "faith", "play"],
  family: ["faith", "money", "health", "house", "play"],
  work: ["desk", "money", "know", "house"],
  elder: ["faith", "health", "house", "know"],
  traveler: ["faith", "know", "money", "house"],
};

export function wellsFor(segment: Segment): WellId[] {
  return WELLS_BY_SEGMENT[segment];
}
