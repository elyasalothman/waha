import { DEFAULT_CITY, type City } from "./cities.ts";
import { shadowDayNow, type DayContext, type DayWeather } from "./shadow-day.ts";

export type AskTrust = "مدعوم" | "جزئي" | "لا أعرف";

export type AskCitation = {
  title: string;
  url: string;
};

export type AskKind = "greeting" | "day" | "knowledge" | "mixed";

export type AskWahaResult = {
  ok: true;
  text: string;
  trust: AskTrust;
  source?: string;
  searched: boolean;
  usedDay: true;
  citations?: AskCitation[];
  kind: AskKind;
};

export type AskWahaFail = {
  ok: false;
  error: "unavailable" | "empty";
};

export type AskWahaResponse = AskWahaResult | AskWahaFail;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type MohsenFields = {
  reply?: string;
  action?: string;
  via?: string;
  source?: string;
  citations?: unknown;
  searched?: boolean;
};

export type MohsenCall = (input: {
  message: string;
  mode: "live";
  messages: ChatTurn[];
}) => Promise<MohsenFields>;

const MOHSEN_URL = "https://ai.alhajda.com/api/chat";
const BLOCKED_CITE_HOSTS = new Set(["api.x.ai"]);

const GREETING_ONLY =
  /^(مرحباً?|السلام عليكم ورحمة الله وبركاته|السلام عليكم|سلام عليكم|أهلاً?(?:\s+وسهلاً?)?|هلا|يا هلا|صباح الخير|مساء الخير|حيّاك الله|حياك الله|السلام|hi+|hello|hey)\s*[!.؟~]*$/i;

const PRAYER_RE =
  /صلاة|الصلو|الفجر|الظهر|العصر|المغرب|العشاء|الشروق|prayer|fajr|dhuhr|asr|maghrib|isha|next prayer/i;
const WEATHER_RE = /طقس|حرارة|درجة(?:\s+الحرارة)?|الجو|weather|temperature|°|كم\s+درجة/i;
const CLOCK_RE = /كم\s+الساعة|الساعة\s+كم|الوقت\s+الآن|الوقت\s+الحالي|what time|الساعة\s+الآن/i;
const HIJRI_RE = /هجر[يى]|الهجر/i;
const GREG_RE = /ميلاد[يى]|الغريغور|gregorian/i;
const CITY_RE = /مدينت[يى]|أي مدينة|وين أنا|في أي مدينة/i;

const DAY_STRIP =
  /متى\s+(?:الصلاة\s+)?(?:التالية|القادمة)|(?:الصلاة\s+)?(?:التالية|القادمة)|كم\s+(?:الحرارة|درجة(?:\s+الحرارة)?)|الطقس|الحرارة|الساعة(?:\s+الآن)?|التاريخ(?:\s*(?:الهجري|الميلادي))?|الهجري|الميلادي|مدينت[يى]|what time(?: is(?: the)? next prayer)?|next prayer|temperature|weather|hijri|gregorian/gi;

const DOC_MARKERS =
  /فاتورة|هوية وطنية|رقم الهوية|جواز سفر|آيبان|\biban\b|invoice|national id|بطاقة ائتمان|ائتمان|سرّي|password|وثيقت/i;

const SUPPORTED_ACTIONS = new Set(["من_المتن", "جلب_حي", "حساب_مباشر"]);
const SUPPORTED_VIA = new Set(["retrieve", "law", "live", "calc", "search"]);
const UNKNOWN_ACTIONS = new Set(["لا_أعرف", "ارفض"]);
const UNKNOWN_VIA = new Set(["refuse", "search-miss", "paused"]);
const PARTIAL_VIA = new Set(["open-model", "clarify"]);

export type DayTopic = "clock" | "prayer" | "weather" | "hijri" | "gregorian" | "city";

export function isGreetingOnly(question: string): boolean {
  return GREETING_ONLY.test(question.trim());
}

export function dayTopicsIn(question: string): DayTopic[] {
  const topics: DayTopic[] = [];
  if (PRAYER_RE.test(question)) topics.push("prayer");
  if (WEATHER_RE.test(question)) topics.push("weather");
  if (CLOCK_RE.test(question)) topics.push("clock");
  if (HIJRI_RE.test(question)) topics.push("hijri");
  if (GREG_RE.test(question)) topics.push("gregorian");
  if (CITY_RE.test(question)) topics.push("city");
  return topics;
}

export function leftoverKnowledge(question: string): boolean {
  const left = question
    .replace(DAY_STRIP, " ")
    .replace(GREETING_ONLY, " ")
    .replace(/[؟?!.،,]/g, " ")
    .replace(/\b(و|ثم|أيضاً?|also|and|ما|من|في|عن|أو|ال|هل)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return left.length >= 4;
}

export function classifyAsk(question: string): AskKind {
  if (isGreetingOnly(question)) return "greeting";
  const topics = dayTopicsIn(question);
  const knowledge = leftoverKnowledge(question);
  if (topics.length > 0 && knowledge) return "mixed";
  if (topics.length > 0) return "day";
  return "knowledge";
}

export function looksLikePrivateDocument(text: string): boolean {
  if (DOC_MARKERS.test(text) && text.length > 180) return true;
  if (text.length > 900 && /\d{6,}/.test(text) && DOC_MARKERS.test(text)) return true;
  return false;
}

export function sanitizePublicQuestion(text: string): string {
  const trimmed = text.trim();
  if (looksLikePrivateDocument(trimmed)) {
    return "سؤال يشير إلى وثيقة خاصة — لم تُرسل الوثيقة.";
  }
  return trimmed.slice(0, 500);
}

export function safeCitations(raw: unknown, source?: string): AskCitation[] {
  const out: AskCitation[] = [];
  const seen = new Set<string>();

  const push = (title: string, url: string) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
    if (BLOCKED_CITE_HOSTS.has(parsed.hostname.toLowerCase())) return;
    const href = parsed.toString();
    if (seen.has(href)) return;
    seen.add(href);
    out.push({ title: title.trim() || parsed.hostname, url: href });
  };

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const rec = item as { title?: unknown; url?: unknown; href?: unknown };
      const url = typeof rec.url === "string" ? rec.url : typeof rec.href === "string" ? rec.href : "";
      const title = typeof rec.title === "string" ? rec.title : "";
      if (url) push(title, url);
    }
  }

  if (typeof source === "string" && /^https?:\/\//i.test(source.trim())) {
    push("", source.trim());
  }

  return out;
}

export function mapMohsenTrust(fields: MohsenFields): AskTrust {
  const action = (fields.action ?? "").trim();
  const via = (fields.via ?? "").trim();
  const citations = safeCitations(fields.citations, fields.source);
  const sourced = citations.length > 0 || Boolean(fields.source?.trim());

  if (UNKNOWN_ACTIONS.has(action) || UNKNOWN_VIA.has(via)) return "لا أعرف";

  if (SUPPORTED_ACTIONS.has(action) && SUPPORTED_VIA.has(via)) {
    if (action === "من_المتن" || via === "law" || via === "calc" || sourced) return "مدعوم";
    return "لا أعرف";
  }

  if (PARTIAL_VIA.has(via) || action.includes("توضيح") || via === "open-model") {
    return sourced ? "جزئي" : "لا أعرف";
  }

  if (!sourced) return "لا أعرف";
  return "جزئي";
}

export function dayAnswer(topics: DayTopic[], day: DayContext, lang: "ar" | "en"): string {
  const lines: string[] = [];
  const city = lang === "ar" ? day.city.ar : day.city.en;

  for (const topic of topics) {
    if (topic === "prayer") {
      lines.push(
        lang === "ar"
          ? `الصلاة التالية في ${city}: ${day.nextPrayerAr}، الساعة ${day.nextPrayerAtAr}.`
          : `Next prayer in ${city}: ${day.nextPrayerEn} at ${day.nextPrayerAtEn}.`,
      );
    } else if (topic === "weather") {
      if (day.weather) {
        lines.push(
          lang === "ar"
            ? `الحرارة في ${city} الآن ${day.weather.c}°م (${day.weather.labelAr}).`
            : `Temperature in ${city} is ${day.weather.c}°C (${day.weather.labelEn}).`,
        );
      } else {
        lines.push(lang === "ar" ? "تعذّر قراءة الطقس الآن." : "Weather is unavailable right now.");
      }
    } else if (topic === "clock") {
      lines.push(lang === "ar" ? `الساعة الآن في ${city}: ${day.clockAr}.` : `The time in ${city} is ${day.clockEn}.`);
    } else if (topic === "hijri") {
      lines.push(lang === "ar" ? `التاريخ الهجري: ${day.hijriAr}.` : `Hijri date: ${day.hijriEn}.`);
    } else if (topic === "gregorian") {
      lines.push(lang === "ar" ? `التاريخ الميلادي: ${day.gregorianAr}.` : `Gregorian date: ${day.gregorianEn}.`);
    } else if (topic === "city") {
      lines.push(lang === "ar" ? `مدينتك الحالية: ${city}.` : `Your city is ${city}.`);
    }
  }

  return lines.join("\n");
}

export function greetingReply(lang: "ar" | "en"): string {
  return lang === "ar" ? "حياك الله. كيف أقدر أساعدك؟" : "Welcome. How can I help?";
}

export function unknownKnowledgeReply(lang: "ar" | "en"): string {
  return lang === "ar"
    ? "لا أعرف — بحثت ولم أجد مصدراً يُعتمد عليه، ولن أخترع جواباً."
    : "I don’t know — I searched and found no source I can stand behind.";
}

export function mohsenDownReply(lang: "ar" | "en"): string {
  return lang === "ar"
    ? "تعذّر الوصول إلى المعرفة الآن. لا أعرف، ولن أخمن."
    : "Knowledge is unreachable right now. I don’t know, and I will not guess.";
}

export function composeMohsenMessage(day: DayContext, question: string): string {
  return `يوم المستخدم: ${day.lineAr}\n\nسؤال المستخدم: ${sanitizePublicQuestion(question)}`;
}

export async function defaultAskMohsen(input: {
  message: string;
  mode: "live";
  messages: ChatTurn[];
}): Promise<MohsenFields> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(MOHSEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        message: input.message,
        mode: input.mode,
        messages: input.messages,
      }),
    });
    if (!res.ok) throw new Error(`mohsen-${res.status}`);
    return (await res.json()) as MohsenFields;
  } finally {
    clearTimeout(timer);
  }
}

function shortHistory(messages: ChatTurn[]): ChatTurn[] {
  return messages
    .filter((m) => !looksLikePrivateDocument(m.content))
    .map((m) => ({ role: m.role, content: sanitizePublicQuestion(m.content) }))
    .slice(-12);
}

export type RunAskWahaInput = {
  mode: "chat" | "translate" | "write";
  lang: "ar" | "en";
  messages: ChatTurn[];
  city?: City;
  now?: Date;
  weather?: DayWeather | null;
  loadDay?: (city: City, now: Date) => Promise<DayContext>;
  askMohsen?: MohsenCall;
};

export async function runAskWaha(input: RunAskWahaInput): Promise<AskWahaResponse> {
  if (input.mode === "translate" || input.mode === "write") {
    return { ok: false, error: "unavailable" };
  }

  const last = input.messages.at(-1);
  if (!last || last.role !== "user" || !last.content.trim()) {
    return { ok: false, error: "empty" };
  }

  const city = input.city ?? DEFAULT_CITY;
  const now = input.now ?? new Date();
  const day = input.loadDay
    ? await input.loadDay(city, now)
    : await shadowDayNow({ city, now, weather: input.weather });

  const question = last.content.trim();
  const kind = classifyAsk(question);
  const topics = dayTopicsIn(question);

  if (kind === "greeting") {
    return {
      ok: true,
      text: greetingReply(input.lang),
      trust: "مدعوم",
      searched: false,
      usedDay: true,
      kind: "greeting",
    };
  }

  if (kind === "day") {
    const text = dayAnswer(topics, day, input.lang);
    const weatherMiss = topics.includes("weather") && !day.weather && topics.length === 1;
    return {
      ok: true,
      text,
      trust: weatherMiss ? "لا أعرف" : "مدعوم",
      source: "يوم واحة",
      searched: false,
      usedDay: true,
      kind: "day",
    };
  }

  const askMohsen = input.askMohsen ?? defaultAskMohsen;
  let mohsen: MohsenFields | null = null;
  let mohsenFailed = false;

  if (looksLikePrivateDocument(question)) {
    return {
      ok: true,
      text:
        input.lang === "ar"
          ? "لن أرسل وثيقتك إلى طرف ثالث. اسأل سؤالاً قصيراً بدون نص الوثيقة."
          : "I will not send your document to a third party. Ask a short question without the document text.",
      trust: "لا أعرف",
      searched: false,
      usedDay: true,
      kind: "knowledge",
    };
  }

  try {
    mohsen = await askMohsen({
      message: composeMohsenMessage(day, question),
      mode: "live",
      messages: shortHistory(input.messages),
    });
  } catch {
    mohsenFailed = true;
  }

  if (kind === "mixed") {
    const local = dayAnswer(topics, day, input.lang);
    if (mohsenFailed || !mohsen) {
      return {
        ok: true,
        text: `${local}\n\n${mohsenDownReply(input.lang)}`,
        trust: "جزئي",
        source: "يوم واحة",
        searched: true,
        usedDay: true,
        kind: "mixed",
      };
    }

    const citations = safeCitations(mohsen.citations, mohsen.source);
    const knowledgeTrust = mapMohsenTrust(mohsen);
    const knowledgeText =
      knowledgeTrust === "لا أعرف"
        ? unknownKnowledgeReply(input.lang)
        : (mohsen.reply ?? "").trim() || unknownKnowledgeReply(input.lang);

    return {
      ok: true,
      text: `${local}\n\n${knowledgeText}`,
      trust: "جزئي",
      source: citations[0]?.url || mohsen.source?.trim() || "يوم واحة",
      searched: Boolean(mohsen.searched) || citations.length > 0,
      usedDay: true,
      citations: citations.length ? citations : undefined,
      kind: "mixed",
    };
  }

  if (mohsenFailed || !mohsen) {
    return {
      ok: true,
      text: mohsenDownReply(input.lang),
      trust: "لا أعرف",
      searched: true,
      usedDay: true,
      kind: "knowledge",
    };
  }

  const citations = safeCitations(mohsen.citations, mohsen.source);
  const trust = mapMohsenTrust(mohsen);
  const text =
    trust === "لا أعرف"
      ? (mohsen.reply?.includes("لا أعرف") ? mohsen.reply.trim() : unknownKnowledgeReply(input.lang))
      : (mohsen.reply ?? "").trim() || unknownKnowledgeReply(input.lang);

  return {
    ok: true,
    text,
    trust,
    source: citations[0]?.url ?? (mohsen.source?.trim() || undefined),
    searched: Boolean(mohsen.searched) || citations.length > 0,
    usedDay: true,
    citations: citations.length ? citations : undefined,
    kind: "knowledge",
  };
}

export const ASK_WAHA_MOHSEN_URL = MOHSEN_URL;
