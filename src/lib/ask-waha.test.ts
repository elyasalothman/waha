import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CITY } from "./cities.ts";
import { shadowDayNow } from "./shadow-day.ts";
import {
  ASK_WAHA_MOHSEN_TIMEOUT_MS,
  composeMohsenMessage,
  DAY_CITATIONS,
  dayContextFromSnap,
  HOUSE_CITATIONS,
  isDayQuestion,
  isGreetingOnly,
  looksLikePrivateDocument,
  mapMohsenTrust,
  resolveSupportedCitations,
  runAskWaha,
  safeCitations,
} from "./ask-waha.ts";

const NOW = new Date("2026-09-19T14:10:00+03:00");
const DAY = dayContextFromSnap(shadowDayNow(NOW, DEFAULT_CITY));

function loadDay() {
  return DAY;
}

describe("ask waha §5 smoke", () => {
  it("1. هوية/بيت → مدعوم (متن محسن)", async () => {
    let sent = "";
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من أنت؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async (input) => {
        sent = input.message;
        return {
          reply: "أنا محسن، مساعد عربي من بيت الهجدة.",
          action: "من_المتن",
          via: "law",
          source: "",
          citations: [],
          searched: false,
        };
      },
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "مدعوم");
    assert.equal(res.usedDay, true);
    assert.match(sent, /يوم المستخدم/);
    assert.match(sent, /من أنت؟/);
    assert.match(res.text, /محسن|الهجدة|واحة/);
    assert.ok(res.citations && res.citations.length >= 3 && res.citations.length <= 4);
    for (const c of res.citations ?? []) {
      assert.match(c.url, /^https:\/\//);
      assert.ok(HOUSE_CITATIONS.some((h) => h.url === c.url));
    }
  });

  it("2. صلاة تالية / طقس محلي <1ث من DayContext — مدعوم ورقم منطقي", async () => {
    let called = 0;
    const started = Date.now();
    const prayer = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "متى الصلاة التالية؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async () => {
        called += 1;
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        return {
          reply: "should-not-run",
          action: "حساب_مباشر",
          via: "calc",
          source: "",
          citations: [],
          searched: false,
        };
      },
    });
    const elapsed = Date.now() - started;
    assert.equal(prayer.ok, true);
    if (!prayer.ok) return;
    assert.equal(called, 0);
    assert.ok(elapsed < 1_000, `local prayer took ${elapsed}ms`);
    assert.equal(prayer.trust, "مدعوم");
    assert.equal(prayer.usedDay, true);
    assert.equal(prayer.text.split("\n")[0], DAY.lineAr);
    assert.match(prayer.text, new RegExp(DAY.prayerLabelAr));
    assert.match(prayer.text, /\d|٠|١|٢|٣|٤|٥|٦|٧|٨|٩/);
    assert.ok(prayer.citations && prayer.citations.length >= 3 && prayer.citations.length <= 4);
    for (const c of prayer.citations ?? []) {
      assert.match(c.url, /^https:\/\//);
      assert.ok(DAY_CITATIONS.some((d) => d.url === c.url));
    }

    const weatherC = String(Math.round(DAY.weatherC));
    const weatherStarted = Date.now();
    const weather = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "كم الحرارة؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async () => {
        called += 1;
        return {
          reply: `الحرارة في الرياض ${weatherC}°م.`,
          action: "من_النموذج_المفتوح",
          via: "open-model",
          source: "",
          citations: [],
          searched: false,
        };
      },
    });
    assert.ok(Date.now() - weatherStarted < 1_000);
    assert.equal(called, 0);
    assert.equal(weather.ok, true);
    if (!weather.ok) return;
    assert.equal(weather.trust, "مدعوم");
    assert.equal(weather.text.split("\n")[0], DAY.lineAr);
    assert.match(weather.text, new RegExp(weatherC));
    assert.ok(weather.citations && weather.citations.length >= 3 && weather.citations.length <= 4);
  });

  it("دخان يوم عام: وش صار اليوم / كيف اليوم → مدعوم من الظل بلا أسواق", async () => {
    for (const question of ["وش صار اليوم؟", "كيف اليوم؟"]) {
      let called = 0;
      const started = Date.now();
      const res = await runAskWaha({
        mode: "chat",
        lang: "ar",
        messages: [{ role: "user", content: question }],
        city: DEFAULT_CITY,
        now: NOW,
        loadDay,
        askMohsen: async () => {
          called += 1;
          return {
            reply: "لا.\n\nلا توصيات تداول من هذا البيت.",
            action: "ارفض",
            via: "law",
            source: "",
            citations: [],
            searched: false,
          };
        },
      });
      assert.equal(isDayQuestion(question), true, question);
      assert.equal(called, 0, question);
      assert.ok(Date.now() - started < 1_000, question);
      assert.equal(res.ok, true);
      if (!res.ok) return;
      assert.equal(res.trust, "مدعوم", question);
      assert.equal(res.text.split("\n")[0], DAY.lineAr);
      assert.match(res.text, new RegExp(DAY.prayerLabelAr));
      assert.match(res.text, new RegExp(DAY.hijri));
      assert.match(res.text, new RegExp(String(Math.round(DAY.weatherC))));
      assert.doesNotMatch(res.text, /لا أعرف|تداول|أسواق|سوق/);
      assert.ok(res.citations && res.citations.length >= 3 && res.citations.length <= 4);
      for (const c of res.citations ?? []) {
        assert.match(c.url, /^https:\/\//);
        assert.ok(DAY_CITATIONS.some((d) => d.url === c.url));
      }
    }
    assert.equal(isDayQuestion("ما لون التنين الذي يسكن قاع بئر زمزم سنة 3122؟"), false);
  });

  it("3. سؤال عبثي/بلا دليل بعد بحث → لا أعرف (لا اختلاق)", async () => {
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "ما لون التنين الذي يسكن قاع بئر زمزم سنة 3122؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async () => ({
        reply: "لا أعرف لون تنين في بئر زمزم.",
        action: "لا_أعرف",
        via: "search-miss",
        source: "",
        citations: [],
        searched: true,
      }),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "لا أعرف");
    assert.match(res.text, /لا أعرف/);
    assert.doesNotMatch(res.text, /أزرق|أخضر|أحمر/);

    const markets = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "ما لون التنين الذي يسكن قاع بئر زمزم سنة 3122؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async () => ({
        reply: "لا.\n\nلا توصيات تداول من هذا البيت.",
        action: "ارفض",
        via: "law",
        source: "",
        citations: [],
        searched: false,
      }),
    });
    assert.equal(markets.ok, true);
    if (!markets.ok) return;
    assert.equal(markets.trust, "لا أعرف");
    assert.match(markets.text, /لا أعرف/);
    assert.doesNotMatch(markets.text, /تداول|أسواق|سوق/);
  });

  it("4. بلا XAI_API_KEY يعمل الشات (لم يعد يعتمد عليه)", async () => {
    delete process.env.XAI_API_KEY;
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من أنت؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async () => ({
        reply: "أنا واحة عبر محسن.",
        action: "من_المتن",
        via: "law",
        source: "",
        citations: [],
        searched: false,
      }),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "مدعوم");
    const { readFileSync } = await import("node:fs");
    const ai = readFileSync(new URL("./ai.ts", import.meta.url), "utf8");
    const core = readFileSync(new URL("./ask-waha.ts", import.meta.url), "utf8");
    assert.doesNotMatch(ai, /XAI_API_KEY|grok-4|https:\/\/api\.x\.ai/);
    assert.doesNotMatch(core, /XAI_API_KEY|grok-4|https:\/\/api\.x\.ai/);
    assert.match(core, /ai\.alhajda\.com\/api\/chat/);
  });

  it("5. فشل محسن → عجز صادق + لا أعرف، بلا رجوع لـ Grok", async () => {
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من بنى الأهرامات؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async () => {
        throw new Error("network");
      },
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "لا أعرف");
    assert.match(res.text, /لا أعرف|تعذّر/);
    assert.doesNotMatch(res.text, /Grok|xAI|grok/i);
  });
});

describe("ask waha contracts", () => {
  it("translate/write stay unavailable with no market LLM fallback", async () => {
    const tr = await runAskWaha({
      mode: "translate",
      lang: "ar",
      messages: [{ role: "user", content: "ترجم مرحبا" }],
    });
    const wr = await runAskWaha({
      mode: "write",
      lang: "ar",
      messages: [{ role: "user", content: "اكتب رسالة" }],
    });
    assert.deepEqual(tr, { ok: false, error: "unavailable" });
    assert.deepEqual(wr, { ok: false, error: "unavailable" });
  });

  it("maps action/via per spec table", () => {
    assert.equal(mapMohsenTrust({ action: "من_المتن", via: "law" }), "مدعوم");
    assert.equal(mapMohsenTrust({ action: "جلب_حي", via: "live", source: "https://example.com" }), "مدعوم");
    assert.equal(mapMohsenTrust({ action: "جلب_حي", via: "search", source: "https://example.com" }), "مدعوم");
    assert.equal(mapMohsenTrust({ action: "حساب_مباشر", via: "calc" }), "مدعوم");
    assert.equal(mapMohsenTrust({ action: "من_النموذج_المفتوح", via: "open-model", searched: true }), "جزئي");
    assert.equal(mapMohsenTrust({ action: "توضيح", via: "clarify" }), "جزئي");
    assert.equal(mapMohsenTrust({ action: "من_المتن", via: "open-model", searched: true }), "جزئي");
    assert.equal(mapMohsenTrust({ action: "لا_أعرف", via: "search-miss" }), "لا أعرف");
    assert.equal(mapMohsenTrust({ action: "ارفض", via: "law", reply: "لا.\n\nلا توصيات تداول من هذا البيت." }), "لا أعرف");
    assert.equal(
      mapMohsenTrust({
        action: "ارفض",
        via: "law",
        reply: "أنا محسن، مساعد عربي من بيت الهجدة. أجاوب من مصادر مملوكة: فقه وأنظمة سعودية ومعرفة البيت.",
      }),
      "مدعوم",
    );
    assert.equal(mapMohsenTrust({ action: "من_المتن", via: "paused" }), "لا أعرف");
  });

  it("never fabricates citation URLs", () => {
    assert.deepEqual(safeCitations("not-an-array", "javascript:alert(1)"), []);
    assert.deepEqual(safeCitations([{ title: "x", url: "notaurl" }], undefined), []);
    assert.deepEqual(safeCitations([{ title: "Wiki", url: "https://ar.wikipedia.org/wiki/Oasis" }], undefined), [
      { title: "Wiki", url: "https://ar.wikipedia.org/wiki/Oasis" },
    ]);
  });

  it("does not ship private documents to mohsen", async () => {
    const doc =
      "فاتورة رقم 992211 وهوية وطنية 1234567890 وجواز سفر A1234567 وتفاصيل بنود طويلة ".repeat(8);
    assert.equal(looksLikePrivateDocument(doc), true);
    let sent = "";
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: doc }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async (input) => {
        sent = input.message;
        return { reply: "ok", action: "من_المتن", via: "law", source: "", citations: [], searched: false };
      },
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(sent, "");
    assert.match(res.text, /وثيق/);
  });

  it("hides a heavy badge on a simple greeting", async () => {
    assert.equal(isGreetingOnly("مرحبا"), true);
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "مرحبا" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async () => ({
        reply: "يا هلا وسهلا! كيف أقدر أساعدك؟",
        action: "من_المتن",
        via: "greet",
        source: "",
        citations: [],
        searched: false,
      }),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.kind, "greeting");
    assert.doesNotMatch(res.text, /مدعوم|جزئي/);
  });

  it("chat always posts day context to mohsen", async () => {
    const expected = composeMohsenMessage(DAY, "من أنت؟");
    let sent = "";
    await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من أنت؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async (input) => {
        sent = input.message;
        return { reply: "متن", action: "من_المتن", via: "law", source: "", citations: [], searched: false };
      },
    });
    assert.equal(sent, expected);
    assert.match(sent, /يوم المستخدم:/);
  });

  it("v0.2: مدعوم always carries 3–4 real URLs, never invented ones", () => {
    const live = resolveSupportedCitations(
      "مدعوم",
      [
        { title: "A", url: "https://example.com/a" },
        { title: "B", url: "https://example.com/b" },
        { title: "C", url: "https://example.com/c" },
        { title: "D", url: "https://example.com/d" },
        { title: "E", url: "https://example.com/e" },
      ],
      "live",
      false,
    );
    assert.equal(live.trust, "مدعوم");
    assert.equal(live.citations?.length, 4);

    const thinLive = resolveSupportedCitations(
      "مدعوم",
      [{ title: "A", url: "https://example.com/a" }],
      "live",
      false,
    );
    assert.equal(thinLive.trust, "جزئي");
    assert.equal(thinLive.citations?.length, 1);

    const house = resolveSupportedCitations("مدعوم", [], "law", false);
    assert.equal(house.trust, "مدعوم");
    assert.ok(house.citations && house.citations.length >= 3 && house.citations.length <= 4);
    assert.deepEqual(house.citations, HOUSE_CITATIONS.slice(0, house.citations.length));

    const day = resolveSupportedCitations("مدعوم", [], "calc", true);
    assert.equal(day.trust, "مدعوم");
    assert.deepEqual(day.citations, DAY_CITATIONS.slice(0, 4));
  });

  it("v0.2: Mohsen timeout ≤8s answers لا أعرف صادقاً", async () => {
    assert.equal(ASK_WAHA_MOHSEN_TIMEOUT_MS, 8_000);
    const { readFileSync } = await import("node:fs");
    const core = readFileSync(new URL("./ask-waha.ts", import.meta.url), "utf8");
    assert.match(core, /ASK_WAHA_MOHSEN_TIMEOUT_MS = 8_000/);
    assert.doesNotMatch(core, /12_000/);
    assert.doesNotMatch(core, /XAI_API_KEY|grok-4|https:\/\/api\.x\.ai/);

    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من بنى الأهرامات؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      loadDay,
      askMohsen: async () => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        throw err;
      },
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "لا أعرف");
    assert.match(res.text, /انتهت المهلة/);
    assert.match(res.text, /لا أعرف/);
    assert.doesNotMatch(res.text, /Grok|xAI|grok/i);
    assert.equal(res.citations, undefined);
  });
});
