export type KalimaTone = "correct" | "present" | "absent";

export const KALIMA_AR = [
  "مدرسة",
  "حديقة",
  "رسالة",
  "نافذة",
  "سيارة",
  "مكتبة",
  "طبيعة",
  "مدينة",
  "صداقة",
  "عائلة",
  "حقيقة",
  "طريقة",
  "نتيجة",
  "سحابة",
  "طائرة",
  "خريطة",
  "جريدة",
  "بداية",
  "نهاية",
  "قائمة",
  "ذاكرة",
  "عبارة",
  "قراءة",
  "كتابة",
  "صناعة",
  "زراعة",
  "تجارة",
  "سفينة",
  "فاكهة",
  "واحات",
] as const;

export const KALIMA_EN = [
  "crane",
  "slate",
  "audio",
  "plant",
  "smile",
  "grape",
  "light",
  "night",
  "water",
  "earth",
  "stone",
  "bread",
  "table",
  "chair",
  "house",
  "heart",
  "music",
  "dream",
  "cloud",
  "river",
  "flame",
  "sugar",
  "lemon",
  "olive",
  "spice",
  "faith",
  "peace",
  "noble",
  "oasis",
  "grove",
] as const;

export const KALIMA_LEN = 5;

export function kalimaPool(mode: "ar" | "en"): readonly string[] {
  return (mode === "ar" ? KALIMA_AR : KALIMA_EN).filter((w) => [...w].length === KALIMA_LEN);
}

export function kalimaOk(mode: "ar" | "en"): Set<string> {
  return new Set(kalimaPool(mode));
}

export function scoreKalima(guess: string, answer: string): KalimaTone[] {
  const a = [...answer];
  const g = [...guess];
  const len = Math.max(a.length, g.length, KALIMA_LEN);
  const out: KalimaTone[] = Array(len).fill("absent");
  const used = Array(len).fill(false);
  for (let i = 0; i < len; i++) {
    if (g[i] && g[i] === a[i]) {
      out[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < len; i++) {
    if (out[i] === "correct") continue;
    const j = a.findIndex((ch, idx) => !used[idx] && ch === g[i]);
    if (j >= 0) {
      out[i] = "present";
      used[j] = true;
    }
  }
  return out.slice(0, KALIMA_LEN);
}

export function kalimaKeyTones(guesses: string[], answer: string): Record<string, KalimaTone> {
  const rank: Record<KalimaTone, number> = { absent: 0, present: 1, correct: 2 };
  const out: Record<string, KalimaTone> = {};
  for (const guess of guesses) {
    const tones = scoreKalima(guess, answer);
    const letters = [...guess];
    letters.forEach((ch, i) => {
      const tone = tones[i] ?? "absent";
      if (!out[ch] || rank[tone] > rank[out[ch]!]) out[ch] = tone;
    });
  }
  return out;
}

export function pickKalima(mode: "ar" | "en", rand = Math.random): string {
  const pool = kalimaPool(mode);
  return pool[Math.floor(rand() * pool.length)] ?? pool[0]!;
}
