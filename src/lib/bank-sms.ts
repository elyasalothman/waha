/**
 * Saudi bank SMS → transaction. Runs on the device only: no network, no raw text kept.
 *
 * Al Rajhi first (Arabic and English), then Alinma, SNB (الأهلي), Riyad, SAB and STC Bank
 * as best effort. Only the last 4 digits of a card or account are ever returned.
 */
import type { CategoryId } from "./mizaniya.ts";

export type BankId = "alrajhi" | "alinma" | "snb" | "riyad" | "sab" | "stcbank" | "unknown";

export type TxKind =
  | "purchase"
  | "online"
  | "atm"
  | "bill"
  | "transfer_out"
  | "transfer_in"
  | "salary"
  | "refund";

export type TxChannel = "apple_pay" | "mada" | "online" | "pos" | "card" | "wallet" | null;

export type TxSource = "sms" | "wallet" | "statement";

export type BankTx = {
  bank: BankId;
  kind: TxKind;
  direction: "expense" | "income";
  /** Amount in `currency` as written. */
  amount: number;
  currency: string;
  /** Amount in SAR: the same as amount for SAR, the SAR line for foreign purchases, else null. */
  sar: number | null;
  merchant: string;
  last4: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM when the message has one. */
  time: string | null;
  channel: TxChannel;
  categoryId: CategoryId;
  source: TxSource;
  /** Stable hash used to drop duplicates. */
  fingerprint: string;
  /** True when the amount is foreign with no SAR line, or the date was not in the text. */
  needsReview: boolean;
};

export type MerchantMap = Record<string, CategoryId>;

// ───────────────────────── text helpers ─────────────────────────

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Western digits, plain spaces, no bidi marks, Arabic decimal/thousand signs as . and , */
export function normalizeText(input: string): string {
  let out = "";
  for (const ch of input) {
    const a = ARABIC_DIGITS.indexOf(ch);
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (a >= 0) out += String(a);
    else if (p >= 0) out += String(p);
    else if (ch === "٫") out += ".";
    else if (ch === "٬") out += ",";
    else if (ch === "：") out += ":";
    else if (/[\u200e\u200f\u202a-\u202e\u2066-\u2069\u061c\ufeff]/.test(ch)) continue;
    else if (/[\u00a0\u2000-\u200b\u202f\u3000]/.test(ch)) out += " ";
    else out += ch;
  }
  return out
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/** cyrb53: short, stable, non-crypto hash for dedup keys. */
export function hashKey(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dayStamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ───────────────────────── bank ─────────────────────────

const BANKS: { id: BankId; re: RegExp }[] = [
  { id: "alrajhi", re: /al\s*-?\s*rajhi|alrajhi|الراجحي|rajhi\s*bank/i },
  { id: "alinma", re: /alinma|الإنماء|الانماء|مصرف الإنماء/i },
  { id: "snb", re: /\bsnb\b|alahli|al\s*ahli|الأهلي|الاهلي|البنك الأهلي السعودي/i },
  { id: "riyad", re: /riyad\s*bank|riyadbank|بنك الرياض/i },
  { id: "sab", re: /\bsabb?\b|البنك السعودي الأول|(?<![\p{L}])ساب(?![\p{L}])/iu },
  { id: "stcbank", re: /stc\s*bank|stcbank|stc\s*pay|اس تي سي بنك|إس تي سي بنك|stc بنك/i },
];

export function detectBank(text: string, sender?: string | null): BankId {
  for (const probe of [sender ?? "", text]) {
    if (!probe) continue;
    for (const bank of BANKS) if (bank.re.test(probe)) return bank.id;
  }
  return "unknown";
}

// ───────────────────────── kind ─────────────────────────

/** One-time codes, declined and failed attempts are not transactions. */
const NOT_A_TX =
  /احصل على|استمتع|اربح|سارع|عرض خاص|عروض|\boffer|\bpromo|\bwin\b|رمز التحقق|رمز التفعيل|رمز الدخول|كلمة المرور|الرقم السري المؤقت|\bOTP\b|verification code|one[- ]?time|passcode|لا تشارك|do not share|مرفوض|مرفوضة|رفض|لم تتم|غير ناجح|declined|rejected|unsuccessful|failed|insufficient|رصيد غير كاف|محاولة/i;

const KIND_RULES: { kind: TxKind; re: RegExp }[] = [
  { kind: "refund", re: /استرداد|استرجاع|مسترد|مرتجع|إرجاع مبلغ|ارجاع مبلغ|عكس عملية|عكس قيد|\brefund|reversal|reversed|\breturn(ed)?\b/i },
  { kind: "salary", re: /راتب|رواتب|\bsalary|payroll/i },
  { kind: "atm", re: /صراف|سحب نقدي|سحب نقد|سحب من|\bATM\b|cash\s*withdrawal/i },
  { kind: "bill", re: /سداد|\bSADAD\b|bill\s*payment|دفع فاتورة|فاتورة/i },
  {
    kind: "transfer_in",
    re: /حوالة واردة|حواله وارده|تحويل وارد|وارد(ة)? من|إيداع|ايداع|تم إيداع|تمت إضافة|تمت اضافة|أضيف|اضيف|استلام حوالة|incoming|received|credit(ed)?\s*transfer|deposit|credited|added to/i,
  },
  { kind: "transfer_out", re: /حوالة|حواله|تحويل|\btransfer|sent to|outgoing/i },
  { kind: "online", re: /عبر الإنترنت|عبر الانترنت|شراء إنترنت|شراء انترنت|شراء اونلاين|\bonline\b|e-?commerce|internet purchase/i },
  {
    kind: "purchase",
    re: /شراء|مشتريات|\bpurchase|\bPOS\b|نقاط البيع|نقاط بيع|نقطة بيع|apple\s*pay|ابل باي|أبل باي|آبل باي|\bspent\b|خصم|مخصوم|debited|\bpaid\b|used for|was used|استخدام بطاقة|استخدمت/i,
  },
];

function detectKind(text: string): TxKind | null {
  for (const rule of KIND_RULES) if (rule.re.test(text)) return rule.kind;
  return null;
}

function detectChannel(text: string, kind: TxKind): TxChannel {
  if (/apple\s*pay|ابل باي|أبل باي|آبل باي/i.test(text)) return "apple_pay";
  if (kind === "online") return "online";
  if (/مدى|\bmada\b/i.test(text)) return "mada";
  if (/\bPOS\b|نقاط البيع|نقاط بيع|نقطة بيع/i.test(text)) return "pos";
  if (/visa|فيزا|master\s*card|ماستر|ائتمان|credit card/i.test(text)) return "card";
  return null;
}

// ───────────────────────── amount ─────────────────────────

const CURRENCY_ALIASES: [RegExp, string][] = [
  [/^(SAR|SR|S\.R|ر\.?\s?س\.?|ريال|ريالا|ريالاً|رس)$/i, "SAR"],
  [/^(USD|US\$|\$|دولار)$/i, "USD"],
  [/^(EUR|€|يورو)$/i, "EUR"],
  [/^(GBP|£|جنيه استرليني)$/i, "GBP"],
  [/^(AED|درهم)$/i, "AED"],
  [/^(KWD|دينار كويتي)$/i, "KWD"],
  [/^(BHD)$/i, "BHD"],
  [/^(QAR)$/i, "QAR"],
  [/^(OMR)$/i, "OMR"],
  [/^(EGP|جنيه)$/i, "EGP"],
  [/^(JOD)$/i, "JOD"],
  [/^(TRY|ليرة)$/i, "TRY"],
  [/^(INR)$/i, "INR"],
];

const CUR = String.raw`SAR|SR|S\.R|ر\.?\s?س\.?|ريالاً|ريالا|ريال|USD|US\$|\$|EUR|€|GBP|£|AED|درهم|KWD|BHD|QAR|OMR|EGP|JOD|TRY|INR|دولار|يورو`;
const NUM = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d{1,3})?|\d+(?:\.\d{1,3})?`;
const AMOUNT_RE = new RegExp(String.raw`(?:(?<![A-Za-z])(${CUR})\s*:?\s*(${NUM})(?![\d/:-]))|(?:(?<![\d/:.-])(${NUM})\s*(${CUR})(?![A-Za-z]))`, "gi");
const LABELLED_BARE_RE = new RegExp(String.raw`(?:مبلغ|المبلغ|بمبلغ|بقيمة|قيمة|amount|amt)\s*:?\s*(${NUM})(?![\d/:-])`, "gi");

const LABEL_RE = /مبلغ|المبلغ|بمبلغ|بقيمة|قيمة العملية|amount|amt\b|\bof\b|\bfor\b|بـ/i;
const EXCLUDE_RE = /رصيد|الرصيد|balance|\bbal\b|avl|available|المتاح|متاح|رسوم|عمولة|\bfees?\b|charge|الحد|\blimit|ضريبة|\bvat\b|مستحق|\bdue\b|minimum|قطاف|qitaf|points/i;

function currencyCode(token: string): string {
  const clean = token.trim();
  for (const [re, code] of CURRENCY_ALIASES) if (re.test(clean)) return code;
  return clean.toUpperCase();
}

function toNumber(raw: string): number {
  return Math.round(Number(raw.replace(/,/g, "")) * 100) / 100;
}

type AmountHit = { value: number; currency: string; index: number; role: "label" | "exclude" | "plain" };

function contextRole(text: string, index: number): AmountHit["role"] {
  const lineStart = text.lastIndexOf("\n", index - 1) + 1;
  const before = text.slice(Math.max(lineStart, index - 32), index);
  // The keyword closest to the number wins.
  let best: { pos: number; role: AmountHit["role"] } = { pos: -1, role: "plain" };
  for (const [re, role] of [
    [LABEL_RE, "label"],
    [EXCLUDE_RE, "exclude"],
  ] as const) {
    const global = new RegExp(re.source, "gi");
    let match: RegExpExecArray | null;
    while ((match = global.exec(before))) {
      if (match.index >= best.pos) best = { pos: match.index, role };
      if (match[0] === "") global.lastIndex++;
    }
  }
  return best.role;
}

export function findAmounts(text: string): AmountHit[] {
  const hits: AmountHit[] = [];
  for (const match of text.matchAll(AMOUNT_RE)) {
    const cur = match[1] ?? match[4];
    const num = match[2] ?? match[3];
    if (!cur || !num) continue;
    const value = toNumber(num);
    if (!(value > 0) || value >= 1e9) continue;
    hits.push({ value, currency: currencyCode(cur), index: match.index ?? 0, role: contextRole(text, match.index ?? 0) });
  }
  if (!hits.some((hit) => hit.role !== "exclude")) {
    for (const match of text.matchAll(LABELLED_BARE_RE)) {
      const value = toNumber(match[1]);
      if (value > 0 && value < 1e9) hits.push({ value, currency: "SAR", index: match.index ?? 0, role: "label" });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

function pickAmount(text: string): { amount: number; currency: string; sar: number | null } | null {
  const hits = findAmounts(text).filter((hit) => hit.role !== "exclude");
  if (!hits.length) return null;
  const primary = hits.find((hit) => hit.role === "label") ?? hits[0];
  if (primary.currency === "SAR") return { amount: primary.value, currency: "SAR", sar: primary.value };
  const sarLine = hits.find((hit) => hit !== primary && hit.currency === "SAR");
  return { amount: primary.value, currency: primary.currency, sar: sarLine ? sarLine.value : null };
}

// ───────────────────────── card / account ─────────────────────────

export function extractLast4(text: string): string | null {
  const masked = text.match(/(?:\*+|[xX•#]{2,})\s?(\d{3,4})(?!\d)/);
  if (masked) return masked[1].padStart(4, "*").slice(-4);
  const ending = text.match(/(?:ending(?:\s+(?:in|with))?|ends?\s+with|المنتهية\s*(?:ب|بـ|برقم)?|تنتهي\s*(?:ب|بـ)?|منتهية\s*(?:ب|بـ)?|اخر\s*4|آخر\s*(?:4|أربعة)\s*(?:أرقام)?)\s*:?\s*(\d{4})(?!\d)/i);
  if (ending) return ending[1];
  const labelled = text.match(
    /(?:بطاقة|البطاقة|بطاقتك|card|مدى|mada|visa|فيزا|حساب|الحساب|حسابك|account|a\/c|acc|من|إلى|الى|to|from)\s*(?:رقم|no\.?|number)?\s*[:：]?\s*(\d{4})(?![\d/:.-])/i,
  );
  if (labelled) return labelled[1];
  return null;
}

// ───────────────────────── date ─────────────────────────

function validDate(y: number, m: number, d: number): Date | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 ? date : null;
}

/** Tries each reading and keeps the first one that is not in the future (allowing a day of clock drift). */
export function extractDate(text: string, now: Date): { date: string; time: string | null; found: boolean } {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const notFuture = (date: Date | null) => (date && date <= tomorrow ? date : null);
  let found: Date | null = null;
  const re = /(?<!\d)(\d{1,4})([-/.])(\d{1,2})\2(\d{2,4})(?!\d)/g;
  for (const match of text.matchAll(re)) {
    const [, a, sep, b, c] = match;
    const na = Number(a);
    const nb = Number(b);
    const nc = Number(c);
    const year = (n: number) => (n < 100 ? 2000 + n : n);
    const options: (Date | null)[] = [];
    if (a.length === 4) options.push(validDate(na, nb, nc));
    else if (c.length === 4) options.push(validDate(nc, nb, na), validDate(nc, na, nb));
    else if (sep === "-") options.push(validDate(year(na), nb, nc), validDate(year(nc), nb, na));
    else options.push(validDate(year(nc), nb, na), validDate(year(na), nb, nc));
    const usable = options.map(notFuture).filter((date): date is Date => Boolean(date && date.getFullYear() >= 2000));
    if (usable.length) {
      // A four-digit year fixes the order; two-digit years take the reading nearest today.
      found =
        a.length === 4 || c.length === 4
          ? usable[0]
          : usable.reduce((best, date) => (Math.abs(now.getTime() - date.getTime()) < Math.abs(now.getTime() - best.getTime()) ? date : best));
    }
    if (found) break;
  }
  const t = text.match(/(?<![\d.])([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?!\d)(\s*(?:AM|PM|ص|م)\b)?/i);
  let time: string | null = null;
  if (t) {
    let hour = Number(t[1]);
    const suffix = (t[3] ?? "").trim().toUpperCase();
    if ((suffix === "PM" || suffix === "م") && hour < 12) hour += 12;
    if ((suffix === "AM" || suffix === "ص") && hour === 12) hour = 0;
    time = `${pad(hour)}:${t[2]}`;
  }
  return { date: dayStamp(found ?? now), time, found: Boolean(found) };
}

// ───────────────────────── merchant ─────────────────────────

const STOP = new RegExp(
  [
    String.raw`\s*(?:\n|;|؛|،|\|`,
    String.raw`(?<![\p{L}])(?:بطاقة|البطاقة|بطاقتك|بتاريخ|التاريخ|الرصيد|رصيد|مبلغ|بمبلغ|بقيمة|من\s+(?:ال)?(?:حساب|بطاقة)|عبر|مدى|ابل باي|أبل باي|رقم العملية|المرجع|الساعة)(?![\p{L}])`,
    String.raw`(?<![\p{L}])في\s*[:：\d]`,
    String.raw`(?<![A-Za-z])(?:card|with|using|via|on|date|balance|bal|avl|amount|ref|mada|apple\s*pay)(?![A-Za-z])`,
    String.raw`\d{1,4}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}:\d{2}|$)`,
  ].join("|"),
  "iu",
);

function cleanName(raw: string): string {
  let name = raw.replace(STOP, "\u0000");
  const cut = name.indexOf("\u0000");
  if (cut >= 0) name = name.slice(0, cut);
  name = name
    .replace(/\d{6,}/g, "")
    .replace(/[*xX•#]{2,}\s*\d*/g, "")
    .replace(/^[\s:：\-–.,]+|[\s:：\-–.,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!/[\p{L}]/u.test(name)) return "";
  if (/^(?:SAR|SR|ريال|ر\.?س)$/i.test(name)) return "";
  return name.slice(0, 60);
}

const MERCHANT_LABELS: Record<"buy" | "in" | "out", RegExp[]> = {
  buy: [
    /(?:لدى|لـدى|عند|التاجر|المتجر|اسم التاجر|المفوتر|الجهة|\bmerchant|\bstore|\bbiller|\bat)\s*[:：]\s*([^\n]+)/i,
    /(?:لدى|لـدى|عند|التاجر|المتجر|المفوتر|\bmerchant)\s+([^\n]+)/i,
    /\bat\s+([^\n]+)/i,
    /(?:^|\s)(?:من|في)\s+([^\n]+)/,
    /(?:^|\s)(?:من|\bfrom)\s*[:：]\s*([^\n]+)/i,
  ],
  in: [
    /(?:من|المرسل|المحول|from|sender|by)\s*[:：]\s*([^\n]+)/i,
    /(?:من|from)\s+([^\n]+)/i,
  ],
  out: [
    /(?:إلى|الى|لـ|المستفيد|اسم المستفيد|to|beneficiary)\s*[:：]\s*([^\n]+)/i,
    /(?:إلى|الى|to)\s+([^\n]+)/i,
  ],
};

function extractMerchant(text: string, kind: TxKind): string {
  const group = kind === "transfer_in" || kind === "salary" ? "in" : kind === "transfer_out" ? "out" : "buy";
  for (const re of MERCHANT_LABELS[group]) {
    const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
    for (const match of text.matchAll(global)) {
      const name = cleanName(match[1]);
      if (name && !/^(حساب|حسابك|account|your|بطاقة|card)\b/i.test(name)) return name;
    }
  }
  return "";
}

// ───────────────────────── categories ─────────────────────────

/** Normalised key for a merchant: case, digits, branch and city noise removed. */
export function merchantKey(name: string): string {
  return normalizeText(name)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\b(riyadh|jeddah|dammam|khobar|makkah|madinah|ksa|sa|sau|branch|br|co|ltd|llc|est|company)\b/g, " ")
    .replace(/(الرياض|جدة|جده|الدمام|الخبر|مكة|المدينة|فرع|شركة|شركه|مؤسسة|مؤسسه)/g, " ")
    .replace(/[\d_*#.,:;'"()/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

const BUILT_IN: { categoryId: CategoryId; re: RegExp }[] = [
  {
    categoryId: "food",
    re: /hunger\s*station|هنقرستيشن|jahez|جاهز|mrsool|مرسول|keeta|كيتا|to\s*you|تو يو|ninja|نينجا|the\s*chefz|careem\s*food|kfc|mcdonald|ماكدونالدز|albaik|al\s*baik|البيك|burger|برجر|pizza|بيتزا|domino|shawarma|شاورما|herfy|هرفي|kudu|كودو|starbucks|ستاربكس|dunkin|tim\s*hortons|barn'?s|بارنز|half\s*million|كوفي|coffee|cafe|café|قهوة|كافيه|مقهى|restaurant|مطعم|مطاعم|bakery|مخبز|panda|بنده|بندة|hyper\s*panda|danube|الدانوب|othaim|العثيم|tamimi|التميمي|carrefour|كارفور|lulu|لولو|nesto|نستو|farm\s*superstore|المزرعة|bin\s*dawood|بن داود|supermarket|سوبرماركت|ماركت|بقالة|تموينات|nana|نعناع|sweets|حلويات|dates|تمور/i,
  },
  {
    categoryId: "transport",
    re: /uber|أوبر|اوبر|careem|كريم|bolt|بولت|jeeny|جيني|aldrees|الدريس|petromin|بترومين|sasco|ساسكو|naft|نفط|fuel|وقود|بنزين|petrol|gas\s*station|محطة|saptco|سابتكو|riyadh\s*bus|حافلات|metro|مترو|darb|parking|مواقف|سيارة|car\s*wash|مغسلة|تأجير سيارات|yelo|يلو|budget\s*rent|theeb|ذيب|flynas|طيران|saudia|السعودية للطيران|airline|haramain|قطار|sar\s*train|najm|نجم/i,
  },
  {
    categoryId: "home",
    re: /ikea|ايكيا|إيكيا|saco|ساكو|home\s*box|هوم بوكس|home\s*centre|هوم سنتر|abyat|أبيات|ابيات|ejar|إيجار|ايجار|rent\b|furniture|أثاث|اثاث|كهربائيات|extra|اكسترا|إكسترا|blink|بلينك|مفروشات/i,
  },
  {
    categoryId: "health",
    re: /nahdi|النهدي|aldawaa|al\s*dawaa|الدواء|whites|pharmac|صيدلية|صيدليه|hospital|مستشفى|مستشفي|clinic|عيادة|عياده|مجمع طبي|medical|طبي|dental|أسنان|اسنان|lab\b|مختبر|optic|بصريات|sehhaty|صحتي|gym|جيم|fitness|نادي|leejam|لياقة|fitness\s*time|وقت اللياقة/i,
  },
  {
    categoryId: "fun",
    re: /netflix|نتفلكس|shahid|شاهد|spotify|سبوتيفاي|anghami|أنغامي|انغامي|osn|starzplay|youtube|يوتيوب|disney|cinema|سينما|vox|ڤوكس|muvi|موفي|amc\b|playstation|بلايستيشن|xbox|steam|nintendo|riot|pubg|game|ألعاب|العاب|boulevard|بوليفارد|webook|ويبوك|ticket|تذاكر|موسم الرياض|riyadh\s*season|bowling|بولينج|park|ملاهي/i,
  },
  {
    categoryId: "bills",
    re: /\bstc\b|اس تي سي|إس تي سي|mobily|موبايلي|\bzain\b|زين|salam|سلام|virgin\s*mobile|lebara|ليبارا|\bsec\b|الكهرباء|كهرباء|electricity|المياه|مياه|\bnwc\b|water|sadad|سداد|absher|أبشر|ابشر|muqeem|مقيم|traffic|المرور|مخالفة|tamm|icloud|apple\.com|google\s*storage|microsoft|اشتراك|subscription|insurance|تأمين|tawuniya|التعاونية|bupa|بوبا/i,
  },
];

export function categorize(merchant: string, kind: TxKind, learned: MerchantMap = {}): CategoryId {
  if (kind === "salary" || kind === "transfer_in" || kind === "refund") return "income";
  const key = merchantKey(merchant);
  if (key && learned[key]) return learned[key];
  if (key) {
    // A learned entry also covers longer names that start with it ("panda 123" → "panda").
    for (const [known, categoryId] of Object.entries(learned)) {
      if (known.length >= 3 && (key.startsWith(`${known} `) || key === known)) return categoryId;
    }
  }
  if (kind === "bill") return "bills";
  if (kind === "atm" || kind === "transfer_out") return "other";
  for (const rule of BUILT_IN) if (rule.re.test(merchant)) return rule.categoryId;
  return "other";
}

export function learnMerchant(map: MerchantMap, merchant: string, categoryId: CategoryId): MerchantMap {
  const key = merchantKey(merchant);
  if (!key || categoryId === "income") return map;
  return { ...map, [key]: categoryId };
}

export function parseMerchantMap(raw: string | null, allowed: readonly string[]): MerchantMap {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const out: MerchantMap = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>).slice(0, 2000)) {
      if (typeof value === "string" && allowed.includes(value) && key.length <= 40) out[key] = value as CategoryId;
    }
    return out;
  } catch {
    return {};
  }
}

// ───────────────────────── main parser ─────────────────────────

export type ParseOptions = {
  sender?: string | null;
  now?: Date;
  learned?: MerchantMap;
  source?: TxSource;
};

/** The bank is left out on purpose: the same SMS pasted without its sender must still match. */
export function txFingerprint(tx: Pick<BankTx, "direction" | "amount" | "currency" | "date" | "time" | "last4" | "merchant">): string {
  return hashKey(
    [tx.direction, tx.amount.toFixed(2), tx.currency, tx.date, tx.time ?? "", tx.last4 ?? "", merchantKey(tx.merchant)].join("|"),
  );
}

export function parseBankSms(input: string, options: ParseOptions = {}): BankTx | null {
  const text = normalizeText(input ?? "").slice(0, 2000);
  if (text.length < 8 || NOT_A_TX.test(text)) return null;
  const kind = detectKind(text);
  if (!kind) return null;
  const money = pickAmount(text);
  if (!money) return null;
  const now = options.now ?? new Date();
  const when = extractDate(text, now);
  const merchant = extractMerchant(text, kind);
  const direction: BankTx["direction"] =
    kind === "salary" || kind === "transfer_in" || kind === "refund" ? "income" : "expense";
  const base = {
    bank: detectBank(text, options.sender),
    kind,
    direction,
    amount: money.amount,
    currency: money.currency,
    sar: money.sar,
    merchant,
    last4: extractLast4(text),
    date: when.date,
    time: when.time,
    channel: detectChannel(text, kind),
    categoryId: categorize(merchant, kind, options.learned),
    source: options.source ?? "sms",
    needsReview: money.sar === null || !when.found,
  } satisfies Omit<BankTx, "fingerprint">;
  return { ...base, fingerprint: txFingerprint(base) };
}

const HEADER =
  /^(?:شراء|مشتريات|purchase|pos|حوالة|حواله|تحويل|transfer|سحب|atm|cash|سداد|sadad|إيداع|ايداع|deposit|راتب|salary|استرداد|refund|reversal|تم\s|عملية|معاملة|dear|عزيزي|عميلنا)/i;

/** Splits a paste of many messages. Blank lines always split; a new header line splits after an amount. */
export function splitMessages(input: string): string[] {
  const text = normalizeText(input ?? "");
  const out: string[] = [];
  for (const block of text.split(/\n\s*\n+/)) {
    let current: string[] = [];
    let sawAmount = false;
    for (const line of block.split("\n")) {
      if (current.length && sawAmount && HEADER.test(line.trim())) {
        out.push(current.join("\n"));
        current = [];
        sawAmount = false;
      }
      current.push(line);
      if (findAmounts(line).length || /مبلغ|amount/i.test(line)) sawAmount = true;
    }
    if (current.length) out.push(current.join("\n"));
  }
  return out.map((item) => item.trim()).filter(Boolean);
}

export function parseManySms(input: string, options: ParseOptions = {}): { parsed: BankTx[]; skipped: number } {
  const parsed: BankTx[] = [];
  let skipped = 0;
  for (const message of splitMessages(input)) {
    const tx = parseBankSms(message, options);
    if (tx) parsed.push(tx);
    else skipped++;
  }
  return { parsed, skipped };
}

/** iOS Wallet "Transaction" automation hands over a merchant and an amount like "SAR 45.50" or "45.50 ر.س". */
export function parseWalletTx(
  fields: { merchant?: string | null; amount?: string | null; card?: string | null },
  options: ParseOptions = {},
): BankTx | null {
  const merchant = cleanName(normalizeText(fields.merchant ?? "")) || normalizeText(fields.merchant ?? "").slice(0, 60);
  const rawAmount = normalizeText(fields.amount ?? "");
  if (!rawAmount) return null;
  const hits = findAmounts(rawAmount);
  let amount: number;
  let currency = "SAR";
  if (hits.length) {
    amount = hits[0].value;
    currency = hits[0].currency;
  } else {
    const bare = rawAmount.replace(/[^\d.,-]/g, "");
    amount = toNumber(bare.includes(",") && !bare.includes(".") && /,\d{1,2}$/.test(bare) ? bare.replace(",", ".") : bare);
  }
  if (!(amount > 0) || amount >= 1e9) return null;
  const now = options.now ?? new Date();
  const card = normalizeText(fields.card ?? "");
  const base = {
    bank: detectBank(card, options.sender),
    kind: "purchase" as const,
    direction: "expense" as const,
    amount,
    currency,
    sar: currency === "SAR" ? amount : null,
    merchant,
    last4: extractLast4(card),
    date: dayStamp(now),
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    channel: "apple_pay" as const,
    categoryId: categorize(merchant, "purchase", options.learned),
    source: "wallet" as const,
    needsReview: currency !== "SAR",
  };
  return { ...base, fingerprint: txFingerprint(base) };
}
