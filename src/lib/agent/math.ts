import { hijriToGregorian, toHijri } from "../hijri.ts";
/** Platform-independent, bounded arithmetic parser. Never executes source text. */
export type MathResult = {
  text: string;
  steps: string[];
  value?: number;
  values?: number[];
  kind: string;
};
export function normalizeDigits(text: string): string {
  return text
    .replace(/[٠-٩۰-۹]/g, (c) =>
      String("٠١٢٣٤٥٦٧٨٩".includes(c) ? "٠١٢٣٤٥٦٧٨٩".indexOf(c) : "۰۱۲۳۴۵۶۷۸۹".indexOf(c)),
    )
    .replace(/٫/g, ".");
}
const fmt = (n: number) => {
  if (!Number.isFinite(n)) throw new Error("النتيجة خارج النطاق");
  return Number(n.toPrecision(12)).toString();
};
export function arithmetic(source: string): number {
  const s = normalizeDigits(source)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\s/g, "");
  if (s.length > 400 || !/^[\d.+\-*/^()%√]+$/.test(s)) throw new Error("تعبير غير مدعوم");
  let i = 0;
  function atom(): number {
    if (s[i] === "+") {
      i++;
      return atom();
    }
    if (s[i] === "-") {
      i++;
      return -power();
    }
    if (s[i] === "√") {
      i++;
      return Math.sqrt(atom());
    }
    if (s[i] === "(") {
      i++;
      const n = sum();
      if (s[i++] !== ")") throw new Error("أقواس غير مكتملة");
      return n;
    }
    const m = s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (!m) throw new Error("رقم متوقع");
    i += m[0].length;
    return Number(m[0]);
  }
  function power(): number {
    let n = atom();
    if (s[i] === "^") {
      i++;
      n **= power();
    }
    if (s[i] === "%") {
      i++;
      n /= 100;
    }
    return n;
  }
  function product(): number {
    let n = power();
    while (s[i] === "*" || s[i] === "/") {
      const op = s[i++];
      const b = power();
      n = op === "*" ? n * b : n / b;
    }
    return n;
  }
  function sum(): number {
    let n = product();
    while (s[i] === "+" || s[i] === "-") {
      const op = s[i++];
      n = op === "+" ? n + product() : n - product();
    }
    return n;
  }
  const result = sum();
  if (i !== s.length || !Number.isFinite(result)) throw new Error("تعبير غير صالح أو قسمة على صفر");
  return result;
}
function polynomial(side: string): number[] {
  const s = side.replace(/\s/g, "").replace(/س/g, "x").replace(/\*/g, "");
  const terms = s.match(/[+-]?[^+-]+/g) || [];
  const out = [0, 0, 0];
  if (!terms.length) throw new Error("معادلة غير صالحة");
  for (const term of terms) {
    const m = term.match(/^([+-]?(?:\d+(?:\.\d+)?)?)(x(?:\^([12]))?)?$/);
    if (!m || (!m[1] && !m[2])) throw new Error("المعادلة المحلية تدعم الدرجة الثانية فقط");
    const degree = m[2] ? Number(m[3] || 1) : 0;
    out[degree] += m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
  }
  return out;
}
export function solveMath(input: string, now = new Date()): MathResult {
  if (input.length > 1000) throw new Error("الطلب طويل جدًا");
  let s = normalizeDigits(input)
    .trim()
    .replace(/^(?:احسب|كم يساوي|كم|حل المعادلة|حل|حول|حوّل)\s*/, "")
    .replace(/[؟?]$/, "")
    .trim();
  const result = (value: number, kind: string, steps: string[] = []): MathResult => ({
    value,
    kind,
    steps,
    text: fmt(value),
  });
  let m = s.match(/^(?:خصم\s*)?(\d+(?:\.\d+)?)\s*[%٪]\s*(من|على)\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const p = Number(m[1]),
      n = Number(m[3]),
      discount = /خصم/.test(input);
    return result(
      discount ? n * (1 - p / 100) : (n * p) / 100,
      discount ? "discount" : "percentage",
      [
        `${fmt(n)} × ${fmt(p)} ÷ 100 = ${fmt((n * p) / 100)}`,
        ...(discount ? [`${n} − ${fmt((n * p) / 100)}`] : []),
      ],
    );
  }
  if (s.includes("=")) {
    const sides = s.split("=");
    if (sides.length !== 2) throw new Error("معادلة غير صالحة");
    const l = polynomial(sides[0]),
      r = polynomial(sides[1]);
    const [c, b, a] = l.map((n, i) => n - r[i]);
    if (a === 0) {
      if (b === 0)
        return {
          kind: "equation",
          text: c === 0 ? "عدد غير محدود من الحلول" : "لا يوجد حل",
          steps: [],
        };
      const x = -c / b;
      return { ...result(x, "linear", [`${b}س = ${-c}`, `س = ${fmt(x)}`]), text: `س = ${fmt(x)}` };
    }
    const d = b * b - 4 * a * c;
    if (d < 0) return { kind: "quadratic", text: "لا توجد حلول حقيقية", steps: [`المميز = ${d}`] };
    const values = [
      ...new Set([(-b + Math.sqrt(d)) / (2 * a), (-b - Math.sqrt(d)) / (2 * a)]),
    ].sort((x, y) => x - y);
    return {
      kind: "quadratic",
      values,
      text: `س = ${values.map(fmt).join(" أو ")}`,
      steps: [`المميز = ${b}² − 4 × ${a} × ${c} = ${d}`, "س = (−ب ± √المميز) ÷ (2أ)"],
    };
  }
  const calendar = s.match(
    /^(\d{3,4})[/-](\d{1,2})[/-](\d{1,2})\s*(هجري|ميلادي)\s*(?:إلى|الى)\s*(هجري|ميلادي)$/,
  );
  if (calendar) {
    const [, yearText, monthText, dayText, from, to] = calendar;
    const year = Number(yearText),
      month = Number(monthText),
      day = Number(dayText);
    if (
      year < 1 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > (from === "هجري" ? 30 : 31) ||
      from === to
    )
      throw new Error("تاريخ أو تحويل غير صالح");
    if (from === "ميلادي") {
      const date = new Date(year, month - 1, day, 12);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
        throw new Error("تاريخ غير صالح");
      const h = toHijri(date);
      return {
        kind: "calendar",
        text: `${h.hy}/${h.hm}/${h.hd} هجري`,
        steps: ["التحويل بالتقويم الهجري المحلي (أم القرى عند توفره)"],
      };
    }
    let date = hijriToGregorian(year, month, day);
    // The shared inverse has a narrow estimate window; widen it across the full year when necessary.
    if (!date) {
      const estimate = Math.round(year * 0.970224 + 621.57);
      let low = new Date(estimate - 1, 0, 1, 12).getTime();
      let high = new Date(estimate + 2, 0, 1, 12).getTime();
      for (let i = 0; i < 16 && low <= high; i++) {
        const candidate = new Date((low + high) / 2);
        const h = toHijri(candidate);
        const cmp = h.hy !== year ? h.hy - year : h.hm !== month ? h.hm - month : h.hd - day;
        if (!cmp) {
          date = candidate;
          break;
        }
        if (cmp < 0) low = candidate.getTime() + 43200000;
        else high = candidate.getTime() - 43200000;
      }
    }
    if (!date) throw new Error("تاريخ هجري غير صالح أو خارج النطاق");
    return {
      kind: "calendar",
      text: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ميلادي`,
      steps: ["التحويل بالتقويم الهجري المحلي (أم القرى عند توفره)"],
    };
  }
  const dates = s.match(/\d{4}-\d{2}-\d{2}/g);
  if (dates?.length && /عمر|فرق|بين|مواليد/.test(s)) {
    const parseDate = (text: string) => {
      const date = new Date(text + "T00:00:00");
      if (
        date.getFullYear() !== Number(text.slice(0, 4)) ||
        date.getMonth() + 1 !== Number(text.slice(5, 7)) ||
        date.getDate() !== Number(text.slice(8, 10))
      )
        throw new Error("تاريخ غير صالح");
      return date;
    };
    const first = parseDate(dates[0]);
    const second = dates[1] ? parseDate(dates[1]) : now;
    if (!Number.isFinite(first.getTime()) || !Number.isFinite(second.getTime()))
      throw new Error("تاريخ غير صالح");
    if (/عمر|مواليد/.test(s)) {
      let age = second.getFullYear() - first.getFullYear();
      if (
        second.getMonth() < first.getMonth() ||
        (second.getMonth() === first.getMonth() && second.getDate() < first.getDate())
      )
        age--;
      return { ...result(age, "age"), text: `${age} سنة` };
    }
    const days = Math.round(Math.abs(second.getTime() - first.getTime()) / 86400000);
    return { ...result(days, "date"), text: `${days} يوم` };
  }
  m = s.match(/^(-?\d+(?:\.\d+)?)\s*(.*?)\s+(?:إلى|الى|بـ|ب)\s*(.+)$/);
  if (m) {
    const v = Number(m[1]);
    const unit = (u: string) =>
      u
        .trim()
        .replace(/^(?:درجة|درجات)\s*/, "")
        .replace(/°/g, "");
    const from = unit(m[2]),
      to = unit(m[3]);
    const groups = [
      { units: ["كم", "كيلومتر", "كيلومترات", "ميل"], factors: [1, 1, 1, 1.609344] },
      { units: ["كجم", "كغ", "كيلو", "كيلوجرام", "رطل"], factors: [1, 1, 1, 1, 0.45359237] },
      { units: ["لتر", "لترات", "جالون", "غالون"], factors: [1, 1, 3.785411784, 3.785411784] },
    ];
    for (const group of groups) {
      const a = group.units.indexOf(from),
        b = group.units.indexOf(to);
      if (a >= 0 && b >= 0)
        return {
          ...result((v * group.factors[a]) / group.factors[b], "conversion"),
          text: `${fmt((v * group.factors[a]) / group.factors[b])} ${to}`,
        };
    }
    if (["م", "مئوية", "سيلسيوس"].includes(from) && ["ف", "فهرنهايت"].includes(to))
      return result((v * 9) / 5 + 32, "conversion");
    if (["ف", "فهرنهايت"].includes(from) && ["م", "مئوية", "سيلسيوس"].includes(to))
      return result(((v - 32) * 5) / 9, "conversion");
    throw new Error("تحويل غير مدعوم");
  }
  s = s
    .replace(/الجذر التربيعي (?:لـ?|ل)?\s*/g, "√")
    .replace(/جذر\s*/g, "√")
    .replace(/\s*(?:أس|اس)\s*/g, "^");
  return result(arithmetic(s), "arithmetic");
}
