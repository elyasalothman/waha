import { DEFAULT_CITY, type City } from "./cities.ts";
import { shadowDayNow, type DayContext, type DayWeather } from "./shadow-day.ts";

export type AskTrust = "مدعوم" | "جزئي" | "لا أعرف";

export type AskCitation = {
  title: string;
  url: string;
};

export type AskKind = "greeting" | "knowledge";

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

const DOC_MARKERS =
  /فاتورة|هوية وطنية|رقم الهوية|جواز سفر|آيبان|\biban\b|invoice|national id|بطاقة ائتمان|ائتمان|سرّي|password|وثيقت/i;

const SUPPORTED_ACTIONS = new Set(["من_المتن", "جلب_حي", "حساب_مباشر"]);
const SUPPORTED_VIA = new Set(["retrieve", "law", "live", "calc"]);
const UNKNOWN_ACTIONS = new Set(["لا_أعرف", "ارفض"]);
const UNKNOWN_VIA = new Set(["refuse", "search-miss", "paused"]);

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function isGreetingOnly(question: string): boolean {
  return GREETING_ONLY.test(question.trim());
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

function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (ch) => String(AR_DIGITS.indexOf(ch)));
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

function normalizeVia(via: string): string {
  if (via === "search") return "live";
  return via;
}

function isHardRefuse(fields: MohsenFields): boolean {
  const action = (fields.action ?? "").trim();
  const via = (fields.via ?? "").trim();
  const viaNorm = normalizeVia(via);
  const reply = (fields.reply ?? "").trim();
  if (UNKNOWN_VIA.has(via) || UNKNOWN_VIA.has(viaNorm)) return true;
  if (!UNKNOWN_ACTIONS.has(action)) return false;
  if (/^لا\s*\./.test(reply) || reply.includes("لا توصيات")) return true;
  if (reply.length < 48) return true;
  return false;
}

/** خريطة الشارة من جدول المواصفة §٣. via=search يُعامل كـ live (عقد محسن الحي). */
export function mapMohsenTrust(fields: MohsenFields): AskTrust {
  const action = (fields.action ?? "").trim();
  const via = (fields.via ?? "").trim();
  const viaNorm = normalizeVia(via);
  const sourced =
    Boolean(fields.source?.trim()) || safeCitations(fields.citations, fields.source).length > 0;

  if (isHardRefuse(fields)) {
    return "لا أعرف";
  }

  if (
    (SUPPORTED_ACTIONS.has(action) || (action === "ارفض" && viaNorm === "law" && (fields.reply ?? "").length > 80)) &&
    SUPPORTED_VIA.has(viaNorm)
  ) {
    return "مدعوم";
  }

  if (via === "open-model" || via === "clarify" || viaNorm === "clarify" || action.includes("توضيح")) {
    return "جزئي";
  }

  if (fields.searched && !sourced) {
    return "جزئي";
  }

  return "جزئي";
}

export function replyHasDayFact(reply: string, day: DayContext, question: string): boolean {
  const text = normalizeDigits(reply);
  if (PRAYER_RE.test(question)) {
    const time = normalizeDigits(day.nextPrayerAtAr);
    if (time && text.includes(time)) return true;
    if (day.nextPrayerAr && reply.includes(day.nextPrayerAr)) return true;
  }
  if (WEATHER_RE.test(question) && day.weather) {
    if (text.includes(String(day.weather.c))) return true;
  }
  return false;
}

export function composeMohsenMessage(day: DayContext, question: string): string {
  return `يوم المستخدم: ${day.lineAr}\n\nسؤال المستخدم: ${sanitizePublicQuestion(question)}`;
}

export function mohsenDownReply(lang: "ar" | "en"): string {
  return lang === "ar"
    ? "تعذّر الوصول إلى المعرفة الآن. لا أعرف، ولن أخمن."
    : "Knowledge is unreachable right now. I don’t know, and I will not guess.";
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

function resolveTrust(fields: MohsenFields, day: DayContext, question: string): AskTrust {
  const table = mapMohsenTrust(fields);
  const reply = (fields.reply ?? "").trim();
  const sourced =
    Boolean(fields.source?.trim()) || safeCitations(fields.citations, fields.source).length > 0;

  if (table === "لا أعرف") return "لا أعرف";
  if (replyHasDayFact(reply, day, question)) return "مدعوم";
  if (table === "مدعوم") return "مدعوم";
  if (!sourced && /^لا\s*أعرف/.test(reply)) return "لا أعرف";
  return table;
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
  const greeting = isGreetingOnly(question);

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

  const askMohsen = input.askMohsen ?? defaultAskMohsen;
  try {
    const mohsen = await askMohsen({
      message: composeMohsenMessage(day, question),
      mode: "live",
      messages: shortHistory(input.messages),
    });
    const citations = safeCitations(mohsen.citations, mohsen.source);
    const trust = resolveTrust(mohsen, day, question);
    const text = (mohsen.reply ?? "").trim() || mohsenDownReply(input.lang);
    const via = (mohsen.via ?? "").trim();
    const hideBadge = greeting || via === "greet";

    return {
      ok: true,
      text,
      trust,
      source:
        citations[0]?.url ||
        mohsen.source?.trim() ||
        (replyHasDayFact(text, day, question) ? "يوم واحة" : undefined),
      searched: Boolean(mohsen.searched) || citations.length > 0,
      usedDay: true,
      citations: citations.length ? citations : undefined,
      kind: hideBadge ? "greeting" : "knowledge",
    };
  } catch {
    return {
      ok: true,
      text: mohsenDownReply(input.lang),
      trust: "لا أعرف",
      searched: true,
      usedDay: true,
      kind: greeting ? "greeting" : "knowledge",
    };
  }
}

export const ASK_WAHA_MOHSEN_URL = MOHSEN_URL;
