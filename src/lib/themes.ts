import { copy, loc, type Copy, type Lang } from "@/lib/locale";

export const THEMES = ["oasis", "sand", "sea", "rose", "garden", "contrast"] as const;
export type ThemeId = (typeof THEMES)[number];
export type Mode = "dark" | "light";
export type FontScale = "md" | "lg";

export const THEME_META: Record<ThemeId, { title: Copy }> = {
  oasis: { title: copy("واحة", "Oasis", "绿洲", "Oasis", "Oasis", "नखलिस्तान") },
  sand: { title: copy("رمل", "Sand", "沙", "Arena", "Sable", "रेत") },
  sea: { title: copy("بحر", "Sea", "海", "Mar", "Mer", "सागर") },
  rose: { title: copy("ورد", "Rose", "玫瑰", "Rosa", "Rose", "गुलाब") },
  garden: { title: copy("بستان", "Garden", "园", "Jardín", "Jardin", "बाग") },
  contrast: { title: copy("تباين", "Contrast", "高对比", "Contraste", "Contraste", "कंट्रास्ट") },
};

export function themeTitle(lang: Lang, id: ThemeId) {
  return loc(lang, THEME_META[id].title);
}

export function parseTheme(v: unknown): ThemeId {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v) ? (v as ThemeId) : "oasis";
}

export function parseMode(v: unknown): Mode {
  return v === "light" ? "light" : "dark";
}

export function applyChrome(opts: { lang: string; theme: ThemeId; mode: Mode; scale: FontScale; reduceMotion: boolean }) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = opts.theme;
  root.dataset.mode = opts.mode;
  root.dataset.scale = opts.scale;
  root.dataset.motion = opts.reduceMotion ? "reduce" : "ok";
  root.lang = opts.lang === "ar" ? "ar" : opts.lang;
  root.dir = opts.lang === "ar" ? "rtl" : "ltr";
}

export const LABS = ["voice", "focus", "qibla", "chime", "ramadan"] as const;
export type LabId = (typeof LABS)[number];

export const LAB_META: Record<LabId, { title: Copy; blurb: Copy }> = {
  voice: {
    title: copy("اسأل بصوتك", "Ask by voice", "语音提问", "Preguntar por voz", "Demander à voix", "आवाज़ से पूछें"),
    blurb: copy("ميكروفون في اسأل واحة", "Microphone on Ask Waha", "在提问页使用麦克风", "Micrófono en Preguntar", "Micro sur Demander", "पूछें पर माइक्रोफ़ोन"),
  },
  focus: {
    title: copy("تركيز", "Focus", "专注", "Enfoque", "Focus", "फोकस"),
    blurb: copy("يخفي العناوين من الرئيسية", "Hides headlines on home", "首页隐藏标题", "Oculta titulares", "Masque les titres", "मुखपृष्ठ से शीर्षक छुपाएँ"),
  },
  qibla: {
    title: copy("قبلة في الظل", "Qibla in the shadow", "日影中的朝向", "Qibla en la sombra", "Qibla dans l’ombre", "छाया में क़िबला"),
    blurb: copy("بوصلة صغيرة في ظل اليوم", "A small compass on today’s shadow", "今日日影上的小罗盘", "Brújula en la sombra", "Boussole dans l’ombre", "आज की छाया पर कम्पास"),
  },
  chime: {
    title: copy("نغمة الانتقال", "Prayer chime", "礼拜铃声", "Campana de oración", "Carillon", "नमाज़ की घंटी"),
    blurb: copy("رنين عند الفجر والمغرب والعشاء", "Chimes at Fajr, Maghrib, and Isha", "晨礼、昏礼、宵礼鸣响", "Suena en fajr, maghrib e isha", "Sonne à fajr, maghrib et isha", "फज्र, मग़रिब, इशा पर"),
  },
  ramadan: {
    title: copy("صيام رمضان", "Ramadan fast", "斋月", "Ayuno de Ramadán", "Jeûne du ramadan", "रमज़ान रोज़ा"),
    blurb: copy("يُعلَّم تلقائياً في رمضان", "Marked automatically in Ramadan", "斋月自动标记", "Se marca en ramadán", "Marqué en ramadan", "रमज़ान में स्वतः"),
  },
};

export function parseLabs(v: unknown): LabId[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is LabId => typeof x === "string" && (LABS as readonly string[]).includes(x));
}
