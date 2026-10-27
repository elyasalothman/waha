import test from "node:test";
import assert from "node:assert/strict";
import { parseIntent } from "./agent/intents.ts";
import { validateCommand } from "./agent/registry.ts";
import { directoryState, LEAP_SERVICES } from "./leap-services.ts";
import { readThreads, validateUpload, serviceError, safeSource, mmRequest } from "./mohsen-v4.ts";
const cases: [string, string, string?][] = [
  ["افتح الموسوعة", "open_section", "wiki"],
  ["ودني الموسوعة", "open_section", "wiki"],
  ["أبي الموسوعة", "open_section", "wiki"],
  ["ودني حصتي", "open_section", "hissati-explore"],
  ["افتح حصتي", "open_section", "hissati-explore"],
  ["مسارات قدرات", "open_section", "hissati-explore"],
  ["دروس حصتي", "open_section", "hissati-explore"],
  ["وش يقولون المحللين", "open_section", "analysts"],
  ["افتح المحللين", "open_section", "analysts"],
  ["آراء المحللين", "open_section", "analysts"],
  ["افتح السوق الأمريكي", "open_section", "market-us"],
  ["سوق أمريكا", "open_section", "market-us"],
  ["أسهم أمريكا", "open_section", "market-us"],
  ["روبوت التداول الوهمي", "open_section", "market-bot"],
  ["تداول افتراضي", "open_section", "market-bot"],
  ["بوت التداول", "open_section", "market-bot"],
  ["قارن جوالات", "open_section", "phones"],
  ["مقارنة الجوالات", "open_section", "phones"],
  ["قارن هواتف", "open_section", "phones"],
  ["افتح حياة", "open_section", "hayat-live"],
  ["ودني حياة", "open_section", "hayat-live"],
  ["العب حياة", "open_section", "hayat-live"],
  ["افتح ممالك", "open_section", "mamalik"],
  ["ودني ممالك", "open_section", "mamalik"],
  ["العب ممالك", "open_section", "mamalik"],
  ["افتح وظيفتي", "open_section", "wadhifati"],
  ["ودني وظيفتي", "open_section", "wadhifati"],
  ["افتح المهارات", "open_section", "skills"],
  ["مهارة في أسبوع", "open_section", "skills"],
  ["افتح الأبحاث", "open_section", "research"],
  ["مركز الأبحاث", "open_section", "research"],
  ["افتح المقالات", "open_section", "articles"],
  ["مقالات هدوء", "open_section", "articles"],
  ["افتح السوق السعودي", "open_section", "market-sa"],
  ["افتح المقياس", "open_section", "bench"],
  ["مقياس الهجدة", "open_section", "bench"],
  ["مقتنيات الهجدة", "open_section", "store-collect"],
  ["ارسم نخلة", "generate_image"],
  ["صمم صورة لواحة", "generate_image"],
  ["سو لي صورة جبل", "generate_image"],
  ["سو لي مقطع قصير", "make_clip"],
  ["حلل الملف", "analyze_file"],
  ["حلل الصورة", "analyze_file"],
  ["أرفق ملف", "analyze_file"],
  ["اقرأ الملف", "analyze_file"],
  ["سو لي سيرة", "haqqiq_cv"],
  ["حسن سيرتي", "haqqiq_cv"],
  ["جهز سيرتي", "haqqiq_cv"],
  ["دربني على مقابلة", "haqqiq_interview"],
  ["جهزني للمقابلة", "haqqiq_interview"],
  ["خطط لهدفي", "haqqiq_plan"],
  ["ساعدني أخطط", "haqqiq_plan"],
  ["اسأل الموسوعة عن نجد", "ask_wiki"],
];
for (const [phrase, tool, id] of cases)
  test(`واحة2: ${phrase}`, () => {
    const c = parseIntent(phrase);
    assert.equal(c?.tool, tool);
    if (id) assert.equal((c?.args as { id: string }).id, id);
    assert.deepEqual(validateCommand(c), c);
  });
test("كل الأقسام لها مخطط صارم بلا حقول إضافية", () => {
  for (const s of LEAP_SERVICES)
    assert.equal(
      validateCommand({ tool: "open_section", args: { id: s.id } }).tool,
      "open_section",
    );
  for (const raw of [
    { tool: "open_section", args: { id: "evil" } },
    { tool: "analyze_file", args: { url: "https://evil.test" } },
    { tool: "generate_image", args: { prompt: "" } },
    { tool: "math_solve", args: { expr: "1+1", extra: 1 } },
  ])
    assert.throws(() => validateCommand(raw));
});
test("الملفات: الحجم والنوع قبل إرسال أي طلب", () => {
  assert.throws(() => validateUpload({ name: "a.exe", size: 12 }));
  assert.throws(() => validateUpload({ name: "a.pdf", size: 10485761 }));
  assert.throws(() => validateUpload({ name: "a.txt", size: 0 }));
  for (const ext of ["png", "pdf", "docx", "xlsx", "txt", "csv"])
    assert.doesNotThrow(() => validateUpload({ name: `a.${ext}`, size: 30 }));
});
test("السجل التالف والمرفقات لا تعود إلى التخزين", () => {
  assert.deepEqual(readThreads("{"), []);
  const rows = readThreads(
    JSON.stringify([
      {
        id: "a",
        title: "x",
        messages: [
          {
            role: "assistant",
            content: "y",
            image: "blob:test",
            citations: [{ url: "javascript:alert(1)" }],
          },
        ],
      },
    ]),
  );
  assert.equal(rows[0].messages[0].image, undefined);
  assert.deepEqual(rows[0].messages[0].citations, []);
  assert.deepEqual(directoryState('{"favorites":["evil","wiki"],"recent":null}'), {
    favorites: ["wiki"],
    recent: [],
  });
});
test("رسائل الفشل والعناوين الآمنة", () => {
  for (const n of [403, 429, 500, 413, 415]) assert.ok(serviceError(n).length > 15);
  assert.equal(safeSource("javascript:alert(1)"), false);
  assert.equal(safeSource("https://user:pass@example.com"), false);
});
test("طلبات الوسائط مباشرة بلا معرّفات وبلا سجل", async () => {
  const saved = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "https://si.alhajda.com/api/mm/image");
      assert.equal(init?.credentials, "omit");
      assert.equal(init?.body, JSON.stringify({ prompt: "نخلة" }));
      return new Response("image");
    };
    await mmRequest("/api/mm/image", { prompt: "نخلة" });
  } finally {
    globalThis.fetch = saved;
  }
});
test("سعر مرجعي وحل مسألة يستخدمان الأدوات المتخصصة", () => {
  assert.deepEqual(parseIntent("سعر سهم 2222"), { tool: "market_quote", args: { symbol: "2222" } });
  assert.deepEqual(parseIntent("حل المسألة 2+2"), { tool: "math_solve", args: { expr: "2+2" } });
});
