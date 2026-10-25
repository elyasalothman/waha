import { SERVICES } from "../superapp.ts";
import { CATALOG } from "../catalog.ts";
import { validateCommand, type AgentCommand } from "./registry.ts";
export const normalize = (s: string) =>
  s
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[أإآ]/g, "ا")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .trim();
export function parseIntent(input: string): AgentCommand | null {
  if (!input.trim() || input.length > 1000) return null;
  const q = normalize(input),
    command = (tool: string, args: object = {}) => validateCommand({ tool, args });
  if (/^(تذكر ان|تذكر|احفظ عني)\s/.test(q))
    return command("remember", {
      text: input.replace(/^(تذكّر أن|تذكر أن|تذكر ان|تذكر|احفظ عني)\s*/, ""),
    });
  if (/^(مدينتي|اسمي)\s/.test(q)) return command("remember", { text: input });
  if (/وش تذكر عني|ماذا تتذكر عني|اعرض الذاكرة/.test(q)) return command("list_memory");
  if (/^(امسح الذاكرة|احذف الذاكرة)$/.test(q)) return command("clear_memory");
  if (/^(انس|انسى)\s/.test(q)) return command("forget", { text: input.replace(/^\S+\s+/, "") });
  if (/^(احذف ملاحظة|احذف تذكير)\s/.test(q))
    return command(q.includes("ملاحظة") ? "delete_note" : "delete_reminder", {
      id: q.split(/\s+/).slice(2).join(" "),
    });
  if (/^(اعرض ملاحظاتي|قائمة الملاحظات|وش ملاحظاتي)$/.test(q)) return command("list_notes");
  if (/^(اعرض تذكيراتي|قائمة التذكيرات|وش تذكيراتي)$/.test(q)) return command("list_reminders");
  if (/^(ذكرني|ذكرني)\s/.test(q)) {
    const body = input.replace(/^ذكرني\s*/, "");
    const when = q.match(
      /بعد ساعتين|بعد ساعة|بعد \d+ (?:دقيقة|دقائق|ساعات|ساعة)|(?:بكرة|غدا)(?: \d+(?:[:٫]\d+)?(?: (?:العصر|المساء|الصباح|الليل))?)?|الساعة \d+(?::\d+)?(?: (?:العصر|المساء|الصباح|الليل))?|يوم (?:الاحد|الاثنين|الثلاثاء|الاربعاء|الخميس|الجمعة|السبت)/,
    )?.[0];
    return command("add_reminder", { text: body, ...(when ? { when } : {}) });
  }
  if (/ابحث.*(?:الكتب|كتاب)|دور.*(?:الكتب|كتاب)/.test(q))
    return command("search_books", {
      q: input.replace(/^(ابحث|دور)\s*(في|عن)?\s*(الكتب|كتاب)?\s*(عن)?\s*/, "") || "الهجدة",
    });
  if (/pdf|بي دي اف|دمج ملفات|ضغط ملفات|تقسيم ملفات|تحويل صور/i.test(q))
    return command(
      "pdf",
      /دمج/.test(q)
        ? { action: "merge" }
        : /تقسيم/.test(q)
          ? { action: "split" }
          : /ضغط/.test(q)
            ? { action: "compress" }
            : /صور/.test(q)
              ? { action: "images" }
              : {},
    );
  if (/السيرة الذاتية|سيرتي|سيره ذاتيه/.test(q)) return command("cv");
  if (/سعر الصرف|اسعار الصرف|تحويل عملات/.test(q)) return command("exchange", { q: input });
  if (/^(كم الساعة|وش الوقت|الوقت الان)$/.test(q)) return command("time");
  if (/التاريخ الهجري|كم التاريخ/.test(q)) return command("hijri");
  if (/مواقيت الصلاة|وقت الصلاة/.test(q)) return command("prayer");
  if (/^(حل|حول|حوّل|خصم|جذر|عمري|فرق التاريخين)\s/.test(q) && !/لغة|عربي|انجليزي/.test(q))
    return command("math", { expr: q });
  const colloquial: Record<string, [string, object]> = {
    "ابي احسب": ["open_app", { id: "calc" }],
    "عطني الحاسبة": ["open_app", { id: "calc" }],
    "ودي العب بلوت": ["play_game", { id: "baloot" }],
    "خلنا نلعب بلوت": ["play_game", { id: "baloot" }],
    "ابي اقرا قران": ["open_app", { id: "quran" }],
    "ودني للمصحف": ["open_app", { id: "quran" }],
    "وين كتبي": ["open_app", { id: "midad" }],
    "ابي رف الكتب": ["open_app", { id: "midad" }],
    "ورني ملاحظاتي": ["open_app", { id: "notes" }],
    "وين الاعدادات": ["open_app", { id: "settings" }],
    "خل الشاشة غامقة": ["set_theme", { theme: "dark" }],
    "نور الشاشة": ["set_theme", { theme: "light" }],
    "خل المظهر على الجهاز": ["set_theme", { theme: "auto" }],
    "الخط صغير كبره": ["set_font_size", { size: "large" }],
    "الخط كبير صغره": ["set_font_size", { size: "small" }],
    "خلها بالعربي": ["set_language", { language: "ar" }],
    "خلها بالانجليزي": ["set_language", { language: "en" }],
    "وين وصلنا بالكتاب": ["continue_reading", {}],
    "وش صاير بالدنيا": ["news", {}],
    "سمعني الموجز": ["live", {}],
  };
  if (Object.hasOwn(colloquial, q)) {
    const [tool, args] = colloquial[q];
    return command(tool, args);
  }
  if (/^(احسب|كم|حساب)\s/.test(q))
    return command("calculate", { expr: q.replace(/^(احسب|كم|حساب)\s+/, "").replace(/[؟?]$/, "") });
  if (/^https:\/\//.test(q)) return command("open_url", { url: input.trim() });
  if (/^(افتح الرابط|افتح رابط)\s/.test(q)) {
    try {
      return command("open_url", { url: input.trim().split(/\s+/).slice(2).join(" ") });
    } catch {
      return null;
    }
  }
  if (/^(اضف ملاحظة|اكتب ملاحظة|سجل ملاحظة|ذكرني)/.test(q))
    return command(q.startsWith("ذكرني") ? "reminder" : "add_note", {
      text: input.replace(/^(أضف ملاحظة|اضف ملاحظة|اكتب ملاحظة|سجل ملاحظة|ذكرني)\s*/, ""),
    });
  if (/^(اسال محسن|اسال محسن عن)/.test(q))
    return command("ask_mohsen", { q: input.replace(/^[اأإ]س[اأ]ل محسن\s*(عن)?\s*/, "") });
  if (/^(ابحث|دور|بحث)\s/.test(q))
    return command("search", { q: input.replace(/^(ابحث|دور|بحث)\s*(عن)?\s*/, "") });
  if (/الوضع الليلي|الوضع الداكن|خليها داكن|مظهر داكن/.test(q))
    return command("set_theme", { theme: "dark" });
  if (/الوضع الفاتح|مظهر فاتح/.test(q)) return command("set_theme", { theme: "light" });
  if (/الوضع التلقائي/.test(q)) return command("set_theme", { theme: "auto" });
  if (/لغة.*انجليزي|حول.*انجليزي/.test(q)) return command("set_language", { language: "en" });
  if (/لغة.*عربي|حول.*عربي/.test(q)) return command("set_language", { language: "ar" });
  if (/كبر الخط|خط كبير/.test(q)) return command("set_font_size", { size: "large" });
  if (/صغر الخط|خط صغير/.test(q)) return command("set_font_size", { size: "small" });
  if (/كمل.*(كتاب|قراء)|تابع.*(كتاب|قراء)/.test(q)) return command("continue_reading");
  if (/طقس|وش الجو|كيف الجو|درجة الحرارة/.test(q)) {
    const city = q
      .replace(/^.*?(?:الطقس|طقس|وش الجو|كيف الجو|درجة الحرارة)\s*/, "")
      .replace(/^(في |ب|بال)/, "")
      .trim();
    return command("weather", city ? { city } : {});
  }
  if (/بث|المباشر/.test(q)) return command("live");
  if (/اخبار/.test(q)) {
    const topic = q.split("اخبار")[1]?.trim();
    return command("news", topic ? { topic } : {});
  }
  if (/سورة/.test(q)) {
    const match = q.match(/سورة\s+(\d+)(?:\s+(?:اية|الايه|الاية)\s+(\d+))?/);
    if (match) {
      try {
        return command("quran", { surah: Number(match[1]), ayah: Number(match[2] || 1) });
      } catch {
        return null;
      }
    }
    const names: Record<string, number> = {
      الفاتحة: 1,
      البقرة: 2,
      الكهف: 18,
      يس: 36,
      الملك: 67,
      الاخلاص: 112,
    };
    const name = Object.keys(names).find((n) => q.includes(n));
    if (name)
      return command("quran", {
        surah: names[name],
        ayah: Number(q.match(/(?:اية|الاية)\s+(\d+)/)?.[1] || 1),
      });
  }
  if (/افتح.*كتاب/.test(q))
    return command("open_book", { title: input.replace(/^.*?كتاب\s*/, "") || "الهجدة" });
  const name = q.replace(/^(افتح|شغل|ودني|وديني|خذني|العب)\s+(لـ?|الى\s+)?/, "");
  const aliases: Record<string, string> = {
    الحاسبة: "calc",
    حاسبة: "calc",
    البلوت: "baloot",
    بلوت: "baloot",
    القران: "quran",
    الكتب: "midad",
    المتجر: "store",
    الملاحظات: "notes",
    الدلة: "dallah",
    "لعبة الدلة": "dallah",
    الاعدادات: "settings",
  };
  if (name === "الاعدادات") return command("open_app", { id: "settings" });
  const found =
    aliases[name] ||
    SERVICES.find((s) => normalize(s.title.ar) === name || s.id === name)?.id ||
    CATALOG.find((s) => normalize(s.title.ar) === name || s.id === name)?.id;
  if (found) return command(/^العب/.test(q) ? "play_game" : "open_app", { id: found });
  return null;
}
