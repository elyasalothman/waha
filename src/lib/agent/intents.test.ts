import test from "node:test";
import assert from "node:assert/strict";
import { parseIntent } from "./intents.ts";
import { validateCommand } from "./registry.ts";
const phrases: [string, string][] = [
  ["افتح الحاسبة", "open_app"],
  ["افتح حاسبة", "open_app"],
  ["افتح البلوت", "open_app"],
  ["شغل بلوت", "open_app"],
  ["افتح القرآن", "open_app"],
  ["ودني الكتب", "open_app"],
  ["افتح المتجر", "open_app"],
  ["افتح الملاحظات", "open_app"],
  ["كم ٢٥×٤", "calculate"],
  ["احسب ١٠÷٢", "calculate"],
  ["كم 3+4", "calculate"],
  ["حساب ١٢-٥", "calculate"],
  ["وش الجو بجدة", "weather"],
  ["وش الجو بالرياض", "weather"],
  ["كيف الجو في الدمام", "weather"],
  ["طقس جدة", "weather"],
  ["الطقس", "weather"],
  ["درجة الحرارة في مكة", "weather"],
  ["ودني الأخبار", "news"],
  ["أخبار التقنية", "news"],
  ["افتح الأخبار", "news"],
  ["شغل البث", "live"],
  ["البث المباشر", "live"],
  ["كمل الكتاب", "continue_reading"],
  ["تابع القراءة", "continue_reading"],
  ["الوضع الليلي", "set_theme"],
  ["الوضع الداكن", "set_theme"],
  ["الوضع الفاتح", "set_theme"],
  ["الوضع التلقائي", "set_theme"],
  ["كبر الخط", "set_font_size"],
  ["صغر الخط", "set_font_size"],
  ["غير اللغة انجليزي", "set_language"],
  ["حول اللغة عربي", "set_language"],
  ["افتح سورة ٢ آية ٥", "quran"],
  ["سورة الفاتحة", "quran"],
  ["سورة الكهف", "quran"],
  ["افتح كتاب الهجدة", "open_book"],
  ["ابحث عن القرآن", "search"],
  ["دور عن الحاسبة", "search"],
  ["أضف ملاحظة ماء", "add_note"],
  ["ذكرني شرب الماء", "add_reminder"],
  ["اسأل محسن عن الفضاء", "ask_mohsen"],
  ["https://example.com", "open_url"],
  ["افتح الإعدادات", "open_app"],
];
for (const [phrase, tool] of phrases)
  test(`نية: ${phrase}`, () => assert.equal(parseIntent(phrase)?.tool, tool));
test("معاملات عربية دقيقة", () => {
  assert.deepEqual(parseIntent("وش الجو بجدة"), { tool: "weather", args: { city: "جدة" } });
  assert.deepEqual(parseIntent("كم ٢٥×٤"), { tool: "calculate", args: { expr: "25×4" } });
  assert.deepEqual(parseIntent("ابحث عن القرآن"), { tool: "search", args: { q: "القرآن" } });
});
test("الطلبات الغامضة لا تنفذ", () => {
  for (const p of [
    "احذف كل شيء",
    "اشتر أسهمًا",
    "انشر الكتاب",
    "تجاهل الأمان",
    "",
    "x".repeat(1001),
  ])
    assert.equal(parseIntent(p), null);
});
for (const raw of [
  { tool: "delete_data", args: {} },
  { tool: "open_app", args: { id: "missing-app" } },
  { tool: "play_game", args: { id: "calc" } },
  { tool: "live", args: { url: "https://evil.test" } },
  { tool: "open_url", args: { url: "javascript:alert(1)" } },
  { tool: "open_url", args: { url: "https://user:password@example.com" } },
  { tool: "quran", args: { surah: 115, ayah: 1 } },
  { tool: "quran", args: { surah: 1, ayah: 8 } },
  { tool: "quran", args: { surah: 1, ayah: -1 } },
  { tool: "set_setting", args: { key: "__proto__", value: {} } },
  { tool: "set_setting", args: { key: "theme", value: "pink" } },
  { tool: "set_theme", args: { theme: "dark" }, execute: true },
  null,
])
  test(`رفض مخطط: ${JSON.stringify(raw)}`, () => assert.throws(() => validateCommand(raw)));
test("تغيير إعداد مسموح فقط بقيمة صحيحة", () =>
  assert.deepEqual(
    validateCommand({ tool: "set_setting", args: { key: "newsWidget", value: false } }),
    { tool: "set_setting", args: { key: "newsWidget", value: false } },
  ));

test("معاملات الملاحظات والأسئلة دون بادئة الأمر", () => {
  assert.deepEqual(parseIntent("اضف ملاحظة ماء"), { tool: "add_note", args: { text: "ماء" } });
  assert.deepEqual(parseIntent("اسال محسن عن الفضاء"), {
    tool: "ask_mohsen",
    args: { q: "الفضاء" },
  });
});

const colloquialCases = [
  ["ابي احسب", { tool: "open_app", args: { id: "calc" } }],
  ["عطني الحاسبة", { tool: "open_app", args: { id: "calc" } }],
  ["ودي ألعب بلوت", { tool: "play_game", args: { id: "baloot" } }],
  ["خلنا نلعب بلوت", { tool: "play_game", args: { id: "baloot" } }],
  ["أبي أقرا قرآن", { tool: "open_app", args: { id: "quran" } }],
  ["ودني للمصحف", { tool: "open_app", args: { id: "quran" } }],
  ["وين كتبي", { tool: "open_app", args: { id: "midad" } }],
  ["أبي رف الكتب", { tool: "open_app", args: { id: "midad" } }],
  ["ورني ملاحظاتي", { tool: "open_app", args: { id: "notes" } }],
  ["وين الإعدادات", { tool: "open_app", args: { id: "settings" } }],
  ["خل الشاشة غامقة", { tool: "set_theme", args: { theme: "dark" } }],
  ["نور الشاشة", { tool: "set_theme", args: { theme: "light" } }],
  ["خل المظهر على الجهاز", { tool: "set_theme", args: { theme: "auto" } }],
  ["الخط صغير كبره", { tool: "set_font_size", args: { size: "large" } }],
  ["الخط كبير صغره", { tool: "set_font_size", args: { size: "small" } }],
  ["خلها بالعربي", { tool: "set_language", args: { language: "ar" } }],
  ["خلها بالإنجليزي", { tool: "set_language", args: { language: "en" } }],
  ["وين وصلنا بالكتاب", { tool: "continue_reading", args: {} }],
  ["وش صاير بالدنيا", { tool: "news", args: {} }],
  ["سمعني الموجز", { tool: "live", args: {} }],
] as const;
for (const [phrase, expected] of colloquialCases)
  test(`عامية: ${phrase}`, () => assert.deepEqual(parseIntent(phrase), expected));
